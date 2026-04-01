import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { type Reservation } from './index';

const RESERVATIONS_COLLECTION = 'reservations';
const LOCAL_STORAGE_KEY = 'nail-shop-reservations';

const getReservationsCollectionRef = () => collection(db, RESERVATIONS_COLLECTION);
const getReservationSlotId = (date: string, time: string) => `${date}_${time.replace(':', '-')}`;
const getReservationDocRef = (date: string, time: string) =>
  doc(db, RESERVATIONS_COLLECTION, getReservationSlotId(date, time));

const normalizeReservation = (
  id: string,
  value: Partial<Reservation> & { createdAt?: string | Timestamp | null },
): Reservation => ({
  id,
  date: value.date || '',
  time: value.time || '',
  name: value.name || '',
  phone: value.phone || '',
  status: 'confirmed',
  createdAt:
    value.createdAt instanceof Timestamp
      ? value.createdAt.toDate().toISOString()
      : typeof value.createdAt === 'string'
        ? value.createdAt
        : new Date().toISOString(),
});

const sortReservations = (items: Reservation[]) =>
  [...items].sort((a, b) => {
    const left = `${a.date}T${a.time}:00`;
    const right = `${b.date}T${b.time}:00`;
    return left.localeCompare(right);
  });

const readLocalReservations = (): Reservation[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<Partial<Reservation>>;
    return sortReservations(parsed.map((item, index) => normalizeReservation(item.id || `local-${index}`, item)));
  } catch (error) {
    console.error('Failed to read local reservations:', error);
    return [];
  }
};

const writeLocalReservations = (items: Reservation[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
};

export const reservationStorage = {
  subscribeReservations(
    onData: (reservations: Reservation[]) => void,
    onError?: (error: Error) => void,
  ) {
    if (!isFirebaseConfigured) {
      onData(readLocalReservations());
      return () => {};
    }

    return onSnapshot(
      query(getReservationsCollectionRef(), orderBy('date', 'asc'), orderBy('time', 'asc')),
      (snapshot) => {
        onData(
          snapshot.docs.map((item) =>
            normalizeReservation(
              item.id,
              item.data() as Partial<Reservation> & { createdAt?: string | Timestamp | null },
            ),
          ),
        );
      },
      (error) => {
        onError?.(error);
      },
    );
  },

  async createReservation(date: string, time: string, name: string, phone: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const existingReservation = readLocalReservations().find(
        (item) => item.date === date && item.time === time,
      );

      if (existingReservation) {
        throw new Error('RESERVATION_ALREADY_EXISTS');
      }

      const nextReservation = normalizeReservation(`local-${crypto.randomUUID()}`, {
        date,
        time,
        name,
        phone,
        createdAt: new Date().toISOString(),
      });

      writeLocalReservations(sortReservations([...readLocalReservations(), nextReservation]));
      return;
    }

    const reservationDocRef = getReservationDocRef(date, time);
    const existingReservation = await getDoc(reservationDocRef);

    if (existingReservation.exists()) {
      throw new Error('RESERVATION_ALREADY_EXISTS');
    }

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reservationDocRef);

      if (snapshot.exists()) {
        throw new Error('RESERVATION_ALREADY_EXISTS');
      }

      transaction.set(reservationDocRef, {
        date,
        time,
        name,
        phone,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });
    });
  },

  async updateReservation(
    currentDate: string,
    currentTime: string,
    nextReservation: Pick<Reservation, 'date' | 'time' | 'name' | 'phone'>,
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const reservations = readLocalReservations();
      const currentIndex = reservations.findIndex(
        (item) => item.date === currentDate && item.time === currentTime,
      );

      if (currentIndex === -1) {
        throw new Error('RESERVATION_NOT_FOUND');
      }

      const duplicateIndex = reservations.findIndex(
        (item) =>
          item.date === nextReservation.date &&
          item.time === nextReservation.time &&
          !(item.date === currentDate && item.time === currentTime),
      );

      if (duplicateIndex >= 0) {
        throw new Error('RESERVATION_ALREADY_EXISTS');
      }

      reservations[currentIndex] = {
        ...reservations[currentIndex],
        ...nextReservation,
      };

      writeLocalReservations(sortReservations(reservations));
      return;
    }

    const currentDocRef = getReservationDocRef(currentDate, currentTime);
    const nextDocRef = getReservationDocRef(nextReservation.date, nextReservation.time);

    await runTransaction(db, async (transaction) => {
      const currentSnapshot = await transaction.get(currentDocRef);
      if (!currentSnapshot.exists()) {
        throw new Error('RESERVATION_NOT_FOUND');
      }

      const isSameSlot = currentDate === nextReservation.date && currentTime === nextReservation.time;

      if (!isSameSlot) {
        const nextSnapshot = await transaction.get(nextDocRef);
        if (nextSnapshot.exists()) {
          throw new Error('RESERVATION_ALREADY_EXISTS');
        }

        transaction.set(nextDocRef, {
          ...currentSnapshot.data(),
          ...nextReservation,
        });
        transaction.delete(currentDocRef);
        return;
      }

      transaction.update(currentDocRef, {
        ...nextReservation,
      });
    });
  },

  async deleteReservation(date: string, time: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const reservations = readLocalReservations().filter(
        (item) => !(item.date === date && item.time === time),
      );
      writeLocalReservations(sortReservations(reservations));
      return;
    }

    await deleteDoc(getReservationDocRef(date, time));
  },
};
