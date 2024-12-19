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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  private router = inject(Router);

  currentUser: User | null | undefined;

  constructor() {}

  signInWithGoodle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.firebaseAuth, provider, browserPopupRedirectResolver)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;
        this.router.navigate(['order']);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
  }

  logout() {
    return from(signOut(this.firebaseAuth));
  }

  getCurrentUser() {
    return user(this.firebaseAuth);
  }
}
