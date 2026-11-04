import { inject, Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import {
  collection,
  deleteField,
  doc,
  DocumentData,
  DocumentSnapshot,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  runTransaction,
  setDoc,
  startAfter,
  Timestamp,
  Unsubscribe,
  updateDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { ConfirmationService } from 'primeng/api';
import { firebaseConfig } from '../../../environment';
import {
  BankOptions,
  Ingredient,
  IngredientAdjustment,
  Order,
  productInfo,
} from '../models/index';
import { formatDateToDocName } from '../utils/date.utils';
import { isOwnOrder, personName } from '../utils/order.utils';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private firestore: Firestore;
  private db: any;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.firestore = getFirestore(app);
  }

  private menu = new Map<string, Promise<unknown[]>>();

  // Menu collections rarely change, so each is read once per session and shared between pages.
  private getMenuCollection<T>(name: string, withId = true): Promise<T[]> {
    if (!this.menu.has(name)) {
      this.menu.set(
        name,
        getDocs(collection(this.firestore, name))
          .then((snapshot) =>
            snapshot.docs.map((doc) =>
              withId ? { id: doc.id, ...doc.data() } : doc.data()
            )
          )
          .catch((error) => {
            this.menu.delete(name);
            throw error;
          })
      );
    }
    return this.menu.get(name) as Promise<T[]>;
  }

  getIngredientsData(): Promise<Ingredient[]> {
    return this.getMenuCollection('ingredientRestrictions');
  }

  getProductSizesAndPrices(): Promise<productInfo[]> {
    return this.getMenuCollection('productSizes');
  }

  getIngredientAdjustmentsData(): Promise<IngredientAdjustment[]> {
    return this.getMenuCollection('ingredientAdjustments');
  }

  getBankOptions(): Promise<BankOptions[]> {
    return this.getMenuCollection('bankOptions', false);
  }

  async createNewGroup(creatorId: string): Promise<void> {
    const docRef = doc(this.db, 'orders', formatDateToDocName());

    try {
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        // One group per person per day: take them to the one they already have.
        if (docSnapshot.data()[creatorId]) {
          this.router.navigate([`order/${creatorId}/summary`]);
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

  // Read-modify-write a group in a transaction so concurrent edits don't overwrite each other.
  // Resolves false if the group no longer exists, or is already ordered (unless evenIfOrdered).
  private updateGroupOrders(
    creatorId: string,
    update: (orders: Order[]) => Order[],
    { date = formatDateToDocName(), evenIfOrdered = false } = {}
  ): Promise<boolean> {
    const docRef = doc(this.db, 'orders', date);

    return runTransaction(this.db, async (transaction) => {
      const data = (await transaction.get(docRef)).data();
      const orders = data?.[creatorId];
      if (!orders) return false;
      if (data['orderedGroups']?.[creatorId] && !evenIfOrdered) return false;
      transaction.update(docRef, { [creatorId]: update(orders) });
      return true;
    });
  }

  private confirm(header: string, message: string, acceptLabel: string) {
    return new Promise<boolean>((resolve) =>
      this.confirmationService.confirm({
        header,
        message,
        acceptLabel,
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-text p-button-secondary',
        accept: () => resolve(true),
        reject: () => resolve(false),
      })
    );
  }

  async submitOrder(order: Order, creatorId: string): Promise<boolean> {
    try {
      const added = await this.updateGroupOrders(creatorId, (orders) => [
        ...orders,
        order,
      ]);

      if (added) this.router.navigate([`order/${creatorId}/summary`]);
      return added;
    } catch (error) {
      console.error('Error submitting order:', error);
      return false;
    }
  }

  removeOrderItem(creatorId: string, itemId: string): Promise<boolean> {
    return this.updateGroupOrders(creatorId, (orders) =>
      orders.filter((order) => order.id !== itemId)
    );
  }

  setPaid(date: string, creatorId: string, person: string, paid: boolean) {
    return this.updateGroupOrders(
      creatorId,
      (orders) =>
        orders.map((order) =>
          personName(order) === person ? { ...order, paid } : order
        ),
      { date, evenIfOrdered: true }
    );
  }

  // Closes the group once the creator has called the restaurant; reopening clears it.
  setOrdered(creatorId: string, ordered: boolean) {
    return updateDoc(doc(this.db, 'orders', formatDateToDocName()), {
      [`orderedGroups.${creatorId}`]: ordered
        ? Timestamp.fromDate(new Date())
        : deleteField(),
    });
  }

  listenToOrderUpdates(
    date: string,
    callback: (doc: DocumentSnapshot<DocumentData>) => void
  ): Unsubscribe {
    return onSnapshot(doc(this.db, 'orders', date), callback);
  }

  async retrieveOrdersPerUser(
    date: string,
    creatorId: string
  ): Promise<Order[]> {
    const docRef = doc(this.db, 'orders', date);

    try {
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();

        return (data[creatorId] ?? []) as Order[];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error retrieving orders:', error);
      throw error;
    }
  }

  async retrieveOrders(date: string): Promise<
    | never[]
    | {
        [key: string]: Order[];
      }
  > {
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

  async retrieveOrdersForPagination(lastDocId: string | null = null): Promise<{
    docs: QueryDocumentSnapshot<DocumentData, DocumentData>[];
    lastDocId: string | null;
  }> {
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

  // The creator leaving deletes the whole group; anyone else only removes the items they added.
  async leaveGroup(creatorId: string, user: User | null): Promise<boolean> {
    if (!user) return false;

    if (user.uid === creatorId) {
      const confirmed = await this.confirm(
        'Delete your group?',
        "Everyone's orders in this group will be removed. This can't be undone.",
        'Delete group'
      );
      if (!confirmed) return false;

      await updateDoc(doc(this.db, 'orders', formatDateToDocName()), {
        [creatorId]: deleteField(),
        [`orderedGroups.${creatorId}`]: deleteField(),
      });
      return true;
    }

    const confirmed = await this.confirm(
      'Leave this group?',
      'All items you added, including ones for other people, will be removed.',
      'Leave group'
    );
    if (!confirmed) return false;

    return this.updateGroupOrders(creatorId, (orders) =>
      orders.filter((order) => !isOwnOrder(order, user))
    );
  }

  async isUserInOrderGroup(
    dateDocName: string,
    orderCreatorId: string,
    user: User
  ): Promise<boolean> {
    const orders = await this.retrieveOrdersPerUser(
      dateDocName,
      orderCreatorId
    );

    return orders.some((order) => isOwnOrder(order, user));
  }
}
