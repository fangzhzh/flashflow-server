import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private collection(uid: string) {
    return this.firebaseService.db.collection(`users/${uid}/tasks`);
  }

  private formatDoc(doc: FirebaseFirestore.DocumentSnapshot) {
    if (!doc.exists) return null;
    const data = doc.data()!;
    
    const timeInfo = data.timeInfo ? {
      ...data.timeInfo,
      startDate: data.timeInfo.startDate instanceof Timestamp 
        ? data.timeInfo.startDate.toDate().toISOString() 
        : data.timeInfo.startDate,
      endDate: data.timeInfo.endDate instanceof Timestamp 
        ? data.timeInfo.endDate.toDate().toISOString() 
        : data.timeInfo.endDate,
    } : undefined;

    return {
      id: doc.id,
      ...data,
      timeInfo,
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

  async findByOverviewId(uid: string, overviewId: string) {
    const snapshot = await this.collection(uid)
      .where('overviewId', '==', overviewId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => this.formatDoc(doc));
  }

  async create(uid: string, dto: CreateTaskDto) {
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

  async update(uid: string, id: string, dto: UpdateTaskDto) {
    const docRef = this.collection(uid).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Task ${id} not found`);
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
      throw new NotFoundException(`Task ${id} not found`);
    }

    await docRef.delete();
    return { id, deleted: true };
  }

  async checkin(uid: string, id: string) {
    const docRef = this.collection(uid).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    const data = doc.data()!;
    const checkinInfo = data.checkinInfo || {};
    const currentCheckins = (checkinInfo.currentCheckins || 0) + 1;
    const history = checkinInfo.history || [];
    history.push(new Date().toISOString());

    const requiredCheckins = checkinInfo.requiredCheckins || 0;
    const isComplete = requiredCheckins > 0 && currentCheckins >= requiredCheckins;

    const updatedCheckinInfo = {
      ...checkinInfo,
      currentCheckins,
      history,
    };

    const updateData: Record<string, any> = {
      checkinInfo: updatedCheckinInfo,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isComplete) {
      updateData.status = 'completed';
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    return this.formatDoc(updated);
  }
}
