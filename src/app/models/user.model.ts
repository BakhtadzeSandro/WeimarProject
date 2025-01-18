export interface User {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}

export interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  photoUrl: string;
  bogAccountNumber: string | null;
  tbcAccountNumber: string | null;
  personalNumber: number | null;
}
