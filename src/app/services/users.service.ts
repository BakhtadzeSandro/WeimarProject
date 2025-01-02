import { Injectable } from '@angular/core';
import { getFirestore, doc, getDoc } from '@angular/fire/firestore';
import { FirestoreUser } from '../models/user.model';
import { initializeApp } from '@angular/fire/app';
import { firebaseConfig } from '../../../environment';

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
}
