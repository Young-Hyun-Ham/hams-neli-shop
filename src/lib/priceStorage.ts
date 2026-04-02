import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { PriceItem } from './index';
import { db, isFirebaseConfigured } from './firebase';

const PRICE_COLLECTION = 'priceItems';

type CreatePriceInput = Omit<PriceItem, 'id'>;
type UpdatePriceInput = Omit<PriceItem, 'id'>;

const assertFirebaseConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Check your VITE_FIREBASE_* environment variables.');
  }
};

export const priceStorage = {
  createPricesQuery() {
    assertFirebaseConfigured();
    return query(collection(db, PRICE_COLLECTION), orderBy('category', 'asc'), orderBy('name', 'asc'));
  },

  async getPrices(): Promise<PriceItem[]> {
    const pricesQuery = this.createPricesQuery();
    const snapshot = await getDocs(pricesQuery);

    return snapshot.docs.map((snapshotDoc) => ({
      ...(snapshotDoc.data() as Omit<PriceItem, 'id'>),
      id: snapshotDoc.id,
      visible: (snapshotDoc.data() as Omit<PriceItem, 'id'>).visible ?? true,
    }));
  },

  subscribePrices(onData: (items: PriceItem[]) => void, onError?: (error: Error) => void) {
    const pricesQuery = this.createPricesQuery();

    return onSnapshot(
      pricesQuery,
      (snapshot: any) => {
        const items = snapshot.docs.map((snapshotDoc: any) => ({
          ...(snapshotDoc.data() as Omit<PriceItem, 'id'>),
          id: snapshotDoc.id,
          visible: (snapshotDoc.data() as Omit<PriceItem, 'id'>).visible ?? true,
        }));

        onData(items);
      },
      (error) => {
        onError?.(error);
      },
    );
  },

  async addPrice(item: CreatePriceInput): Promise<PriceItem> {
    assertFirebaseConfigured();
    const payload = { ...item, visible: item.visible ?? true };
    const docRef = await addDoc(collection(db, PRICE_COLLECTION), payload);

    return {
      id: docRef.id,
      ...payload,
    };
  },

  async syncPrices(items: PriceItem[]): Promise<void> {
    assertFirebaseConfigured();

    await Promise.all(
      items.map(({ id, ...item }) => setDoc(doc(db, PRICE_COLLECTION, id), { ...item, visible: item.visible ?? true }, { merge: true })),
    );
  },

  async updatePrice(id: string, updates: UpdatePriceInput): Promise<void> {
    assertFirebaseConfigured();
    await updateDoc(doc(db, PRICE_COLLECTION, id), { ...updates, visible: updates.visible ?? true });
  },

  async deletePrice(id: string): Promise<void> {
    assertFirebaseConfigured();
    await deleteDoc(doc(db, PRICE_COLLECTION, id));
  },
};
