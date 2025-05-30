import { inject, Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { Auth, signOut, user } from '@angular/fire/auth';
import { doc, getDoc, getFirestore, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import {
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { from } from 'rxjs';
import { firebaseConfig } from '../../../environment';
import { FirestoreUser } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  private router = inject(Router);
  private db: any;

  currentUser: User | null | undefined;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  signInWithGoodle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.firebaseAuth, provider, browserPopupRedirectResolver)
      .then(async (result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);

        const docRef = doc(this.db, 'users', result.user.uid);

        const docSnapshot = await getDoc(docRef);

        if (!docSnapshot.exists()) {
          await setDoc(docRef, {
            id: result.user.uid,
            name: result.user.displayName,
            email: result.user.email,
            photoUrl: result.user.photoURL,
            bogAccountNumber: null,
            tbcAccountNumber: null,
            personalNumber: null,
          } as FirestoreUser);
        }

        // const token = credential?.accessToken;
        // const user = result.user;
        this.router.navigate(['all-orders']);
      })
      .catch((error) => {
        console.log(error);
        // const errorCode = error.code;
        // const errorMessage = error.message;
        // const email = error.customData.email;
        // const credential = GoogleAuthProvider.credentialFromError(error);
      });
  }

  logout() {
    return from(signOut(this.firebaseAuth));
  }

  getCurrentUser() {
    return user(this.firebaseAuth);
  }
}
