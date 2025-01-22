import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { doc, getDoc, getFirestore, updateDoc } from '@angular/fire/firestore';
import { DocumentData, DocumentReference } from 'firebase/firestore';
import { firebaseConfig } from '../../../environment';
import { FirestoreUser } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private db: any;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  async getUserWithId(userId: string): Promise<FirestoreUser | null> {
    const docRef = doc(this.db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as FirestoreUser;
    } else {
      return null;
    }
  }

  getUserRef(userId: string): DocumentReference<FirestoreUser> {
    return doc<FirestoreUser, DocumentData>(this.db, 'users', userId);
  }

  updateUser(userId: string, data: Partial<FirestoreUser>) {
    const docRef = doc(this.db, 'users', userId);

    return updateDoc(docRef, data);
  }

  async canCreateOrder(userId: string): Promise<boolean> {
    const user = await this.getUserWithId(userId);

    if (
      user?.bogAccountNumber ||
      user?.tbcAccountNumber ||
      user?.personalNumber ||
      user?.bogAccountNumber === '' ||
      user?.tbcAccountNumber === '' ||
      user?.personalNumber === 0
    ) {
      return true;
    }

    return false;
  }
}
