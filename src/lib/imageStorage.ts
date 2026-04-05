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
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { GalleryImage } from './index';
import { db, isFirebaseConfigured, storage } from './firebase';

const IMAGES_COLLECTION = 'galleryImages';

type CreateGalleryImageInput = Omit<GalleryImage, 'id' | 'created_at' | 'url'> & {
  file?: File;
  url?: string;
};
type UpdateGalleryImageInput = Pick<GalleryImage, 'title' | 'description' | 'url' | 'categoryId' | 'categoryName' | 'visible'> & {
  previousUrl?: string;
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

const deleteStoredImage = async (url?: string) => {
  if (!url) {
    return;
  }

  try {
    await deleteObject(ref(storage, url));
  } catch (error) {
    console.error('Failed to delete gallery image file:', error);
  }
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
      ...(snapshotDoc.data() as Omit<GalleryImage, 'id'>),
      id: snapshotDoc.id,
      visible: (snapshotDoc.data() as Omit<GalleryImage, 'id'>).visible ?? true,
    }));
  },

  async uploadImage(file: File): Promise<string> {
    return uploadImageFile(file);
  },

  async addImage({ file, url, title, description, categoryId, categoryName, visible }: CreateGalleryImageInput): Promise<GalleryImage> {
    assertFirebaseConfigured();

    const nextUrl = file ? await uploadImageFile(file) : url || '';
    const created_at = new Date().toISOString();
    const docRef = await addDoc(collection(db, IMAGES_COLLECTION), {
      title,
      description,
      url: nextUrl,
      categoryId: categoryId || '',
      categoryName: categoryName || '',
      created_at,
      visible: visible ?? true,
    });

    return {
      id: docRef.id,
      title,
      description,
      url: nextUrl,
      categoryId: categoryId || '',
      categoryName: categoryName || '',
      created_at,
      visible: visible ?? true,
    };
  },

  async updateImage(id: string, updates: UpdateGalleryImageInput): Promise<void> {
    assertFirebaseConfigured();

    const { previousUrl, ...payload } = updates;

    if (previousUrl && previousUrl !== payload.url) {
      await deleteStoredImage(previousUrl);
    }

    await updateDoc(doc(db, IMAGES_COLLECTION, id), { ...payload, visible: payload.visible ?? true });
  },

  async deleteImage(image: GalleryImage): Promise<void> {
    assertFirebaseConfigured();

    await deleteStoredImage(image.url);

    await deleteDoc(doc(db, IMAGES_COLLECTION, image.id));
  },
};
