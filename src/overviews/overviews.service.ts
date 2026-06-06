import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { TasksService } from '../tasks/tasks.service';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { CreateOverviewDto } from './dto/create-overview.dto';
import { UpdateOverviewDto } from './dto/update-overview.dto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class OverviewsService {
  private readonly logger = new Logger(OverviewsService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly tasksService: TasksService,
    private readonly flashcardsService: FlashcardsService,
  ) {}

  private collection(uid: string) {
    return this.firebaseService.db.collection(`users/${uid}/overviews`);
  }

  private formatDoc(doc: FirebaseFirestore.DocumentSnapshot) {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
  }

  async findAll(uid: string) {
    const snapshot = await this.collection(uid)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => this.formatDoc(doc));
  }

  async findOne(uid: string, id: string) {
    const docRef = this.collection(uid).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Overview ${id} not found`);
    }

    const overview = this.formatDoc(doc);

    // Fetch related tasks (where overviewId matches this overview's id)
    const tasks = await this.tasksService.findByOverviewId(uid, id);

    // Fetch related flashcards (where deckId matches this overview's id)
    const flashcards = await this.flashcardsService.findByDeckId(uid, id);

    return {
      ...overview,
      tasks,
      flashcards,
    };
  }

  async create(uid: string, dto: CreateOverviewDto) {
    const docRef = this.collection(uid).doc();
    const data = {
      ...dto,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(data);

    const created = await docRef.get();
    return this.formatDoc(created);
  }

  async update(uid: string, id: string, dto: UpdateOverviewDto) {
    const docRef = this.collection(uid).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Overview ${id} not found`);
    }

    await docRef.update({
      ...dto,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await docRef.get();
    return this.formatDoc(updated);
  }

  async delete(uid: string, id: string) {
    const docRef = this.collection(uid).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Overview ${id} not found`);
    }

    await docRef.delete();
    return { id, deleted: true };
  }
}
