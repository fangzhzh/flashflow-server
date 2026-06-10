import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CHALLENGES } from './challenges-data';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FieldValue } from 'firebase-admin/firestore';

export interface ConcurrencyBug {
  description: string;
  lineSnippet: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  fixSuggestion: string;
}

export interface ConcurrencyReviewResult {
  passed: boolean;
  score: number;
  bugs: ConcurrencyBug[];
  summary: string;
  optimizations: string[];
}

const CONCURRENCY_AUDITOR_PROMPT = `You are a Senior JVM Concurrency Expert and Code Auditor. Your task is to review the user's submitted Java concurrency code for a specific challenge level.

You must evaluate the code based on:
1. Correctness: Does it solve the specified requirements?
2. Concurrency Safety: Check for race conditions, thread-safety, memory visibility (happens-before, volatile), deadlocks (lock ordering), livelocks, and starvation.
3. Performance & Contention: Is it optimized? Check for lock contention, wake-up storms (notifyAll vs signal), and busy spinning.
4. JMM Semantics: Verify correct usage of synchronized, ReentrantLock, volatile, CAS (compareAndSet), atomic primitives, and thread-safe collections.

Rules for evaluation:
- The result must be marked as "passed": true only if there are NO 'HIGH' severity concurrency bugs (e.g. data races, visibility bugs, deadlock risks, or failing to meet core requirements).
- Provide detailed feedback in 'summary' using Markdown. Explain their locks, potential problems, and praise correct implementations.
- List all found bugs in 'bugs'. Each bug must specify the severity, the exact line/snippet context, and a clear explanation of how to fix it.
- Suggest optimization tips in 'optimizations'.

You must respond in the same language as the challenge description (Chinese if the prompt/description is Chinese).
Return ONLY valid JSON matching the schema. No markdown fences, no explanations outside the JSON.`;

@Injectable()
export class ConcurrencyService {
  private readonly logger = new Logger(ConcurrencyService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private getModel() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('GOOGLE_GENAI_API_KEY not configured');
    }
    const ai = new GoogleGenerativeAI(apiKey);
    return ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async getChallenges(uid: string) {
    const progressRef = this.firebaseService.db
      .collection(`users/${uid}/concurrencyProgress`);
    
    const progressSnapshot = await progressRef.get();
    const progressMap: Record<string, Record<string, boolean>> = {};

    progressSnapshot.forEach((doc) => {
      progressMap[doc.id] = doc.data() as Record<string, boolean>;
    });

    return CHALLENGES.map((challenge) => {
      const challengeProgress = progressMap[challenge.id] || {};
      return {
        ...challenge,
        levels: challenge.levels.map((level) => ({
          ...level,
          completed: !!challengeProgress[level.id],
        })),
      };
    });
  }

  async verifyCode(
    uid: string,
    challengeId: string,
    levelId: string,
    code: string,
  ): Promise<ConcurrencyReviewResult> {
    const challenge = CHALLENGES.find((c) => c.id === challengeId);
    if (!challenge) {
      throw new InternalServerErrorException(`Challenge ${challengeId} not found`);
    }

    const level = challenge.levels.find((l) => l.id === levelId);
    if (!level) {
      throw new InternalServerErrorException(`Level ${levelId} not found for challenge ${challengeId}`);
    }

    const model = this.getModel();

    const prompt = `Challenge ID: ${challengeId} (${challenge.title})
Level ID: ${levelId} (${level.title})
Concepts to master: ${level.concepts.join(', ')}
Requirements:
${level.requirements}

User Code:
\`\`\`java
${code}
\`\`\``;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        passed: { type: 'BOOLEAN', description: 'True if code is correct and free of HIGH severity concurrency bugs.' },
        score: { type: 'INTEGER', description: 'Overall code quality score from 0 to 100.' },
        bugs: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              description: { type: 'STRING', description: 'Brief description of the concurrency bug.' },
              lineSnippet: { type: 'STRING', description: 'The code line or snippet containing the bug.' },
              severity: { type: 'STRING', enum: ['HIGH', 'MEDIUM', 'LOW'], description: 'How critical the bug is.' },
              fixSuggestion: { type: 'STRING', description: 'Instructions on how to resolve the issue.' }
            },
            required: ['description', 'lineSnippet', 'severity', 'fixSuggestion']
          }
        },
        summary: { type: 'STRING', description: 'Markdown-formatted code review summary.' },
        optimizations: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'List of concurrency performance optimization suggestions.'
        }
      },
      required: ['passed', 'score', 'bugs', 'summary', 'optimizations']
    };

    try {
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${CONCURRENCY_AUDITOR_PROMPT}\n\nInput:\n${prompt}` }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any
        }
      });

      const text = result.response.text().trim();
      const reviewResult = JSON.parse(text) as ConcurrencyReviewResult;

      // If passed, update Firestore progress
      if (reviewResult.passed) {
        const progressDocRef = this.firebaseService.db
          .collection(`users/${uid}/concurrencyProgress`)
          .doc(challengeId);

        await progressDocRef.set(
          {
            [levelId]: true,
            [`${levelId}_completedAt`]: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      return reviewResult;
    } catch (error) {
      this.logger.error('[concurrency-verification-failed]', error);
      throw new InternalServerErrorException(`AI Code review failed: ${error.message}`);
    }
  }
}
