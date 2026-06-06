import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UpdatePomodoroDto } from './dto/update-pomodoro.dto';
import { Timestamp } from 'firebase-admin/firestore';

const DEFAULT_POMODORO_STATE = {
  mode: 'work',
  timeLeft: 25 * 60,
  isRunning: false,
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
  completedSessions: 0,
  currentTaskId: null,
  currentTaskTitle: null,
  sessionLog: [],
  startedAt: null,
  pausedAt: null,
};

@Injectable()
export class PomodoroService {
  private readonly logger = new Logger(PomodoroService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private docRef(uid: string) {
    return this.firebaseService.db.doc(`users/${uid}/pomodoro/state`);
  }

  private formatData(data: Record<string, any>) {
    const formatted = { ...data };
    for (const key of Object.keys(formatted)) {
      if (formatted[key] instanceof Timestamp) {
        formatted[key] = formatted[key].toDate().toISOString();
      }
    }
    return formatted;
  }

  async getState(uid: string) {
    const doc = await this.docRef(uid).get();

    if (!doc.exists) {
      // Create default state
      await this.docRef(uid).set(DEFAULT_POMODORO_STATE);
      return { ...DEFAULT_POMODORO_STATE };
    }

    return this.formatData(doc.data()!);
  }

  async updateState(uid: string, dto: UpdatePomodoroDto) {
    const doc = await this.docRef(uid).get();

    if (!doc.exists) {
      // Create with defaults merged with provided data
      const data = { ...DEFAULT_POMODORO_STATE, ...dto };
      await this.docRef(uid).set(data);
      return data;
    }

    await this.docRef(uid).set(dto, { merge: true });

    const updated = await this.docRef(uid).get();
    return this.formatData(updated.data()!);
  }
}
