import { inject, Injectable } from '@angular/core';
import {
  arrayUnion,
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  query,
  DocumentData,
  DocumentSnapshot,
  limit,
  orderBy,
  startAfter,
  Timestamp,
  deleteField,
} from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { Router } from '@angular/router';
import { firebaseConfig } from '../../../environment';
import {
  Ingredient,
  IngredientAdjustment,
  Order,
  productInfo,
} from '../models/index';
import { formatDateToDocName } from '../utils/date.utils';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private router = inject(Router);
  private firestore: Firestore;
  private db: any;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.firestore = getFirestore(app);
  }

  async getIngredientsData(): Promise<Ingredient[]> {
    const querySnapshot = await getDocs(
      collection(this.firestore, 'ingredientRestrictions')
    );
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return data as Ingredient[];
  }

  async getProductSizesAndPrices(): Promise<productInfo[]> {
    const querySnapshot = await getDocs(
      collection(this.firestore, 'productSizes')
    );

    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return data as productInfo[];
  }

  async getIngredientAdjustmentsData(): Promise<IngredientAdjustment[]> {
    const querySnapshot = await getDocs(
      collection(this.firestore, 'ingredientAdjustments')
    );
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return data as IngredientAdjustment[];
  }

  async createNewGroup(creatorId: string) {
    const docRef = doc(this.db, 'orders', formatDateToDocName());

    try {
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        if (docSnapshot.data()[creatorId]) {
          alert(
            'You already have a group today and cannot create another. But you can still order from other groups.'
          );
          return;
        }
        await updateDoc(docRef, {
          [creatorId]: [],
        });
      } else {
        await setDoc(docRef, {
          [creatorId]: [],
          createdAt: Timestamp.fromDate(new Date()),
        });
      }

      this.router.navigate(['order/' + creatorId]);
    } catch (error) {
      console.error('Error creating new group:', error);
    }
  }

  async submitOrder(order: Order, creatorId: string) {
    const docRef = doc(this.db, 'orders', formatDateToDocName());

    try {
      const docSnapshot = await getDoc(docRef);

      const orders = docSnapshot.data() ? docSnapshot.data()![creatorId] : [];
      let finalOrders: Order[] = [];
      let newOrder: boolean = false;

      if (orders.length > 0) {
        finalOrders = orders.map((o: Order) => {
          if (o.orderedBy === order.orderedBy) {
            newOrder = true;
            return order;
          }
          return o;
        });
      }

      if (docSnapshot.exists()) {
        await updateDoc(docRef, {
          [creatorId]: newOrder ? finalOrders : arrayUnion(order),
        });
      } else {
        await setDoc(docRef, {
          [creatorId]: [order],
        });
      }

      this.router.navigate([`order/${creatorId}/summary`]);
    } catch (error) {
      console.error('Error submitting order:', error);
    }
  }

  listenToOrderUpdates(
    date: string,
    callback: (doc: DocumentSnapshot<DocumentData>) => void
  ) {
    return onSnapshot(doc(this.db, 'orders', date), callback);
  }

  async retrieveOrdersPerUser(date: string, creatorId: string) {
    const docRef = doc(this.db, 'orders', date);

    try {
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();

        return data[creatorId] as Order[];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error retrieving orders:', error);
      throw error;
    }
  }

  async retrieveOrders(date: string) {
    const docRef = doc(this.db, 'orders', date);

    try {
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        return data as {
          [key: string]: Order[];
        };
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error retrieving orders:', error);
      throw error;
    }
  }

  async retrieveOrdersForPagination(lastDocId: string | null = null) {
    let q = query(
      collection(this.firestore, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    if (lastDocId) {
      const lastDocRef = doc(this.firestore, 'orders', lastDocId);
      const lastDocSnapshot = await getDoc(lastDocRef);
      q = query(q, startAfter(lastDocSnapshot));
    }

    const querySnapshot = await getDocs(q);

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    return { docs: querySnapshot.docs, lastDocId: lastDoc?.id || null };
  }

  leaveGroup(
    creatorId: string,
    updatedOrders: Order[],
    isOrderCreator: boolean = false
  ) {
    return updateDoc(doc(this.db, 'orders', formatDateToDocName()), {
      [creatorId]: isOrderCreator ? deleteField() : updatedOrders,
    });
  }
}
