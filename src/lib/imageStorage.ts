import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { GalleryImage } from './index';
import { db, isFirebaseConfigured, storage } from './firebase';

const IMAGES_COLLECTION = 'galleryImages';

type CreateGalleryImageInput = Omit<GalleryImage, 'id' | 'created_at' | 'url'> & {
  file: File;
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

const uploadImageFile = async (file: File) => {
  assertFirebaseConfigured();

  const extension = getFileExtension(file);
  const path = `gallery/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type || `image/${extension}`,
  });

  return getDownloadURL(storageRef);
};

export const imageStorage = {
  async getImages(): Promise<GalleryImage[]> {
    assertFirebaseConfigured();

    const imagesQuery = query(
      collection(db, IMAGES_COLLECTION),
      orderBy('created_at', 'desc'),
    );
    const snapshot = await getDocs(imagesQuery);

    return snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...(snapshotDoc.data() as Omit<GalleryImage, 'id'>),
    }));
  },

  async addImage({ file, title, description }: CreateGalleryImageInput): Promise<GalleryImage> {
    assertFirebaseConfigured();

    const url = await uploadImageFile(file);
    const created_at = new Date().toISOString();
    const docRef = await addDoc(collection(db, IMAGES_COLLECTION), {
      title,
      description,
      url,
      created_at,
    });

    return {
      id: docRef.id,
      title,
      description,
      url,
      created_at,
    };
  },

  async deleteImage(image: GalleryImage): Promise<void> {
    assertFirebaseConfigured();

    try {
      await deleteObject(ref(storage, image.url));
    } catch (error) {
      console.error('Failed to delete gallery image file:', error);
    }

    await deleteDoc(doc(db, IMAGES_COLLECTION, image.id));
  },
};
