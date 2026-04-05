import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { IMAGES } from '@/assets/images';
import type { EventItem } from './index';
import { db, isFirebaseConfigured, storage } from './firebase';

const EVENTS_COLLECTION = 'events';

type CreateEventInput = Omit<EventItem, 'id' | 'createdAt'> & {
  createdAt?: string;
};
type UpdateEventInput = Omit<EventItem, 'id' | 'createdAt'> & {
  previousImage?: string;
};

const assertFirebaseConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Check your VITE_FIREBASE_* environment variables.');
  }
};

const getFileExtension = (file: File) => {
  const parts = file.name.split('.');
  return (parts[parts.length - 1] || 'jpg').toLowerCase();
};

const deleteStoredImage = async (url?: string) => {
  if (!url) {
    return;
  }

  try {
    await deleteObject(ref(storage, url));
  } catch (error) {
    console.error('Failed to delete event image file:', error);
  }
};

const sortEvents = (items: EventItem[]) =>
  [...items].sort((a, b) => {
    if (a.startDate === b.startDate) {
      return b.createdAt.localeCompare(a.createdAt);
    }

    return b.startDate.localeCompare(a.startDate);
  });

const withDefaults = (item: Omit<EventItem, 'id'>, id: string): EventItem => ({
  ...item,
  id,
  image: item.image || IMAGES.GALLERY_10,
  visible: item.visible ?? true,
});

export const DEFAULT_EVENT_ITEMS: EventItem[] = [
  // {
  //   id: 'welcome-event',
  //   title: '방문 감사 이벤트',
  //   content: '첫 방문 시 무료, 두 번째 방문 시 50프로 할인.',
  //   image: IMAGES.GALLERY_10,
  //   startDate: '2026-04-01',
  //   endDate: '2026-12-31',
  //   createdAt: '2026-04-01T00:00:00.000Z',
  //   visible: true,
  // },
];

export const isEventActive = (event: EventItem, today = new Date()) => {
  const date = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;
  return event.visible !== false && event.startDate <= date && event.endDate >= date;
};

export const eventStorage = {
  createEventsQuery() {
    assertFirebaseConfigured();
    return query(collection(db, EVENTS_COLLECTION), orderBy('startDate', 'desc'));
  },

  async getEvents(): Promise<EventItem[]> {
    const eventsQuery = this.createEventsQuery();
    const snapshot = await getDocs(eventsQuery);

    return sortEvents(
      snapshot.docs.map((snapshotDoc) =>
        withDefaults(snapshotDoc.data() as Omit<EventItem, 'id'>, snapshotDoc.id),
      ),
    );
  },

  subscribeEvents(onData: (items: EventItem[]) => void, onError?: (error: Error) => void) {
    const eventsQuery = this.createEventsQuery();

    return onSnapshot(
      eventsQuery,
      (snapshot: any) => {
        const items = sortEvents(
          snapshot.docs.map((snapshotDoc: any) =>
            withDefaults(snapshotDoc.data() as Omit<EventItem, 'id'>, snapshotDoc.id),
          ),
        );

        onData(items);
      },
      (error) => {
        onError?.(error);
      },
    );
  },

  async uploadImage(file: File): Promise<string> {
    assertFirebaseConfigured();

    const extension = getFileExtension(file);
    const path = `events/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, {
      contentType: file.type || `image/${extension}`,
    });

    return getDownloadURL(storageRef);
  },

  async addEvent(item: CreateEventInput): Promise<EventItem> {
    assertFirebaseConfigured();

    const payload = {
      ...item,
      image: item.image || IMAGES.GALLERY_10,
      createdAt: item.createdAt ?? new Date().toISOString(),
      visible: item.visible ?? true,
    };
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), payload);

    return {
      id: docRef.id,
      ...payload,
    };
  },

  async updateEvent(id: string, updates: UpdateEventInput): Promise<void> {
    assertFirebaseConfigured();

    const { previousImage, ...payload } = updates;

    if (previousImage && previousImage !== payload.image) {
      await deleteStoredImage(previousImage);
    }

    await updateDoc(doc(db, EVENTS_COLLECTION, id), {
      ...payload,
      image: payload.image || IMAGES.GALLERY_10,
      visible: payload.visible ?? true,
    });
  },

  async deleteEvent(item: EventItem): Promise<void> {
    assertFirebaseConfigured();

    await deleteStoredImage(item.image);
    await deleteDoc(doc(db, EVENTS_COLLECTION, item.id));
  },
};
