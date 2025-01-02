export interface User {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}

export interface FirestoreUser {
  email: string;
  displayName: string;
  photoURL: string;
  accountNumber: number;
}
