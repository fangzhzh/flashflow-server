import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DECOMPOSE_SYSTEM_PROMPT = `You are a learning assistant that converts study material into quiz questions.

You will receive items that are either:
1. Flashcards: front = question/topic, back = answer (possibly with multiple steps/methods)
2. Knowledge overviews: front = title, back = a structured knowledge note with sections

For each item, generate sub-questions that test understanding of each distinct point.

Rules:
- Generate 2-8 sub-questions depending on content richness
- Each sub-question targets ONE specific concept, method, or named item
- Write questions in the SAME language as the input (Chinese if Chinese)
- Sub-question front should be a COMPLETE QUESTION that names the specific thing being asked about

IMPORTANT - Never use ordinal numbers (要点1/要点2/step1/step2) in questions.
  Each bullet point in a list is a NAMED item, not a numbered step.
  Identify the name/label of each item and ask about it by name.

  Example card: front="方案: 简单｜复杂｜全面｜优雅｜临时", back="• A thorough solution... • Comprehensive solution... • Elegant solution..."
  BAD:  { "front": "「方案」的要点1是什么？", "back": "A thorough solution..." }
  GOOD: { "front": "「方案」中，什么是简单(Simple)方案？", "back": "A thorough solution: completeness, emphasize depth and details" }
  GOOD: { "front": "「方案」中，什么是优雅(Elegant)方案？", "back": "Elegant solution" }

  Example card: front="降低杏仁核激活的方法", back="• 正念冥想 • 腹式呼吸 • 认知重评"
  BAD:  { "front": "第2个方法是什么？", "back": "腹式呼吸" }
  GOOD: { "front": "「降低杏仁核激活」中，腹式呼吸如何帮助调节情绪？", "back": "腹式呼吸激活副交感神经，降低皮质醇水平，从而平息杏仁核的应激反应" }

CRITICAL: Sub-question back MUST contain the actual answer content, NOT just a section header.
  BAD  (wrong): { "front": "权衡是什么？", "back": "权衡 (Trade-offs):" }
  GOOD (right):  { "front": "权衡是什么？", "back": "延迟 vs 一致性：异步更新降低延迟但价格短暂不一致" }
  If the content under a header is missing or truncated in the input, skip that sub-card entirely.

- If the whole card is too simple (one short answer), return it unchanged as a single sub-card
- Return ONLY valid JSON, no explanation, no markdown fences

Output format (JSON array, one entry per input item):
[
  {
    "id": "<original id>",
    "subCards": [
      { "front": "specific named question", "back": "actual answer content" }
    ]
  }
]`;

const REPO_OWNER = 'fangzhzh';
const REPO_NAME = 'leetcode';

interface CommitSummary {
  date: string;
  message: string;
  files: string[];
}

const GITHUB_REVIEW_PROMPT = (variation: number) =>
  `You are a coding interview coach analyzing a developer's recent study activity.
Based on the GitHub commits below, generate exactly 30 quiz questions to help them review and strengthen their understanding.

${
  variation > 1
    ? `IMPORTANT: This is ROUND ${variation}. Generate DIFFERENT questions from previous rounds.
Focus on different aspects, edge cases, alternative approaches, or deeper follow-up questions.
`
    : ''
}Cover a mix of these areas based on what appears in the commits:
- Algorithm patterns: backtracking, binary search, two pointers, sliding window, heap, graph DFS/BFS
- Data structures: linked list, stack, queue, priority queue, tree
- Complexity: time/space analysis of the specific algorithms studied
- System design coding: multi-threaded components like EventLogger, rate limiters, blocking queues
  (these appear as system design coding interview problems with Java concurrency)
- Key insights: "when to use X vs Y", edge cases, first-principles derivation
- Implementation details: Java-specific patterns (Comparable, Comparator, generics)

Question style mix:
- "What is the time complexity of [algorithm] and why?"
- "When should you use [pattern A] vs [pattern B]?"
- "How does [algorithm/data structure] work step by step?"
- "What is the key insight for solving [problem type]?"
- "In a multi-threaded [component], what synchronization mechanism is needed?"

Rules:
- Write in English (this is a technical interview prep context)
- Each answer (back) should be 1-4 sentences, specific and correct
- Focus on concepts from the actual commits, not generic questions
- Vary difficulty across the 30 questions

Return ONLY a JSON array (no markdown fences):
[{"front": "question", "back": "answer"}, ...]`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private getModel() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('GOOGLE_GENAI_API_KEY not configured');
    }
    const ai = new GoogleGenerativeAI(apiKey);
    return ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async decompose(cards: { id: string; front: string; back: string }[]) {
    if (!cards?.length) {
      return { results: [] };
    }

    const model = this.getModel();

    const cardList = cards
      .map((c) => `ID: ${c.id}\nFront: ${c.front}\nBack: ${c.back}`)
      .join('\n\n---\n\n');

    const result = await model.generateContent([
      DECOMPOSE_SYSTEM_PROMPT,
      `Cards to process:\n\n${cardList}`,
    ]);

    const text = result.response.text().trim();
    const clean = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    const parsed = JSON.parse(clean) as {
      id: string;
      subCards: { front: string; back: string }[];
    }[];

    return { results: parsed };
  }

  private async fetchCommitSummaries(): Promise<CommitSummary[]> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'flashcard-game/1.0',
    };

    // 1. Fetch list of recent commits
    const listRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=15`,
      { headers },
    );
    if (!listRes.ok) throw new Error(`GitHub list: ${listRes.status}`);
    const list = (await listRes.json()) as {
      sha: string;
      commit: { message: string; author: { date: string } };
    }[];

    // 2. Fetch file details for the 6 most recent commits only (to avoid rate limit)
    const detailed = await Promise.all(
      list.slice(0, 6).map(async (c): Promise<CommitSummary> => {
        try {
          const detailRes = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${c.sha}`,
            { headers },
          );
          if (!detailRes.ok) throw new Error('detail fail');
          const detail = (await detailRes.json()) as {
            files?: { filename: string }[];
          };
          return {
            date: c.commit.author.date.slice(0, 10),
            message: c.commit.message.split('\n')[0],
            files: (detail.files ?? []).map((f) => f.filename).slice(0, 8),
          };
        } catch {
          return {
            date: c.commit.author.date.slice(0, 10),
            message: c.commit.message.split('\n')[0],
            files: [],
          };
        }
      }),
    );

    // 3. For remaining commits, just use message
    const rest: CommitSummary[] = list.slice(6).map((c) => ({
      date: c.commit.author.date.slice(0, 10),
      message: c.commit.message.split('\n')[0],
      files: [],
    }));

    return [...detailed, ...rest];
  }

  async githubReview(variation: number = 1) {
    const commits = await this.fetchCommitSummaries();

    const commitText = commits
      .map((c) => {
        const fileList = c.files.length
          ? `\n  Files: ${c.files.join(', ')}`
          : '';
        return `[${c.date}] ${c.message}${fileList}`;
      })
      .join('\n\n');

    const model = this.getModel();

    const result = await model.generateContent([
      GITHUB_REVIEW_PROMPT(variation),
      `Recent commits:\n\n${commitText}`,
    ]);

    const text = result.response
      .text()
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    const questions = JSON.parse(text) as { front: string; back: string }[];

    return {
      questions,
      commitCount: commits.length,
      generatedAt: new Date().toISOString(),
    };
  }
}
