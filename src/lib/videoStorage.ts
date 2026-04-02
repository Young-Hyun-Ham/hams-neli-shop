import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import type { Video } from './index';
import { db, isFirebaseConfigured } from './firebase';

const VIDEOS_COLLECTION = 'videos';

type CreateVideoInput = Omit<Video, 'id' | 'created_at'>;
type UpdateVideoInput = Omit<Video, 'id' | 'created_at'>;

const assertFirebaseConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Check your VITE_FIREBASE_* environment variables.');
  }
};

export const videoStorage = {
  async getVideos(): Promise<Video[]> {
    assertFirebaseConfigured();

    const videosQuery = query(
      collection(db, VIDEOS_COLLECTION),
      orderBy('created_at', 'desc'),
    );
    const snapshot = await getDocs(videosQuery);

    return snapshot.docs.map((snapshotDoc) => ({
      ...(snapshotDoc.data() as Omit<Video, 'id'>),
      id: snapshotDoc.id,
      visible: (snapshotDoc.data() as Omit<Video, 'id'>).visible ?? true,
    }));
  },

  async addVideo(video: CreateVideoInput): Promise<Video> {
    assertFirebaseConfigured();

    const created_at = new Date().toISOString();
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
      ...video,
      created_at,
      visible: video.visible ?? true,
    });

    return {
      id: docRef.id,
      ...video,
      created_at,
      visible: video.visible ?? true,
    };
  },

  async updateVideo(id: string, updates: UpdateVideoInput): Promise<void> {
    assertFirebaseConfigured();
    await updateDoc(doc(db, VIDEOS_COLLECTION, id), { ...updates, visible: updates.visible ?? true });
  },

  async deleteVideo(id: string): Promise<void> {
    assertFirebaseConfigured();

    await deleteDoc(doc(db, VIDEOS_COLLECTION, id));
  },
};
