import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class DecksService {
  private readonly logger = new Logger(DecksService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly flashcardsService: FlashcardsService,
  ) {}

  private collection(uid: string) {
    return this.firebaseService.db.collection(`users/${uid}/decks`);
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

  async create(uid: string, dto: CreateDeckDto) {
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

  async update(uid: string, id: string, dto: UpdateDeckDto) {
    const docRef = this.collection(uid).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Deck ${id} not found`);
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
      throw new NotFoundException(`Deck ${id} not found`);
    }

    // Delete all flashcards belonging to this deck
    await this.flashcardsService.deleteByDeckId(uid, id);

    await docRef.delete();
    this.logger.log(`Deleted deck ${id} and its flashcards`);
    return { id, deleted: true };
  }
}
