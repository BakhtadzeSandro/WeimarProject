import { Injectable, inject } from '@angular/core';
import { Auth, signOut, user } from '@angular/fire/auth';
import { from } from 'rxjs';
import {
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { Router } from '@angular/router';
import { getFirestore, doc, setDoc } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { firebaseConfig } from '../../../environment';

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

        await setDoc(doc(this.db, 'users', result.user.uid), {
          id: result.user.uid,
          name: result.user.displayName,
          email: result.user.email,
          photoUrl: result.user.photoURL,
          accountNumber: 0,
        });

        // const token = credential?.accessToken;
        // const user = result.user;
        this.router.navigate(['order/' + result.user.uid]);
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
