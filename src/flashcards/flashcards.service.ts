import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private collection(uid: string) {
    return this.firebaseService.db.collection(`users/${uid}/flashcards`);
  }

  private formatDoc(doc: FirebaseFirestore.DocumentSnapshot) {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      lastReviewed: data.lastReviewed instanceof Timestamp ? data.lastReviewed.toDate().toISOString() : data.lastReviewed,
      nextReviewDate: data.nextReviewDate instanceof Timestamp ? data.nextReviewDate.toDate().toISOString() : data.nextReviewDate,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
  }

  async findAll(uid: string, deckId?: string) {
    let query: FirebaseFirestore.Query = this.collection(uid).orderBy('createdAt', 'desc');

    if (deckId) {
      query = query.where('deckId', '==', deckId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => this.formatDoc(doc));
  }

  async create(uid: string, dto: CreateFlashcardDto) {
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

  async createBatch(uid: string, dtos: CreateFlashcardDto[]) {
    const batch = this.firebaseService.db.batch();
    const refs: FirebaseFirestore.DocumentReference[] = [];

    for (const dto of dtos) {
      const docRef = this.collection(uid).doc();
      refs.push(docRef);
      batch.set(docRef, {
        ...dto,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    const results = await Promise.all(refs.map((ref) => ref.get()));
    return results.map((doc) => this.formatDoc(doc));
  }

  async update(uid: string, id: string, dto: UpdateFlashcardDto) {
    const docRef = this.collection(uid).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Flashcard ${id} not found`);
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
      throw new NotFoundException(`Flashcard ${id} not found`);
    }

    await docRef.delete();
    return { id, deleted: true };
  }

  async deleteByDeckId(uid: string, deckId: string) {
    const snapshot = await this.collection(uid)
      .where('deckId', '==', deckId)
      .get();

    if (snapshot.empty) return;

    const batch = this.firebaseService.db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    this.logger.log(`Deleted ${snapshot.size} flashcards for deck ${deckId}`);
  }

  async findByDeckId(uid: string, deckId: string) {
    const snapshot = await this.collection(uid)
      .where('deckId', '==', deckId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => this.formatDoc(doc));
  }
}
