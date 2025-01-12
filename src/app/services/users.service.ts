import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { doc, getDoc, getFirestore } from '@angular/fire/firestore';
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
}
