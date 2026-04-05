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
import type { GalleryCategory } from './index';
import { db, isFirebaseConfigured, storage } from './firebase';

const CATEGORIES_COLLECTION = 'galleryCategories';

type CreateCategoryInput = Omit<GalleryCategory, 'id' | 'created_at'>;
type UpdateCategoryInput = Omit<GalleryCategory, 'id' | 'created_at'> & {
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
    console.error('Failed to delete category image file:', error);
  }
};

const withDefaults = (item: Omit<GalleryCategory, 'id'>, id: string): GalleryCategory => ({
  ...item,
  id,
  visible: item.visible ?? true,
});

export const categoryStorage = {
  createCategoriesQuery() {
    assertFirebaseConfigured();
    return query(collection(db, CATEGORIES_COLLECTION), orderBy('name', 'asc'));
  },

  async getCategories(): Promise<GalleryCategory[]> {
    const categoriesQuery = this.createCategoriesQuery();
    const snapshot = await getDocs(categoriesQuery);

    return snapshot.docs.map((snapshotDoc) =>
      withDefaults(snapshotDoc.data() as Omit<GalleryCategory, 'id'>, snapshotDoc.id),
    );
  },

  subscribeCategories(
    onData: (items: GalleryCategory[]) => void,
    onError?: (error: Error) => void,
  ) {
    const categoriesQuery = this.createCategoriesQuery();

    return onSnapshot(
      categoriesQuery,
      (snapshot: any) => {
        const items = snapshot.docs.map((snapshotDoc: any) =>
          withDefaults(snapshotDoc.data() as Omit<GalleryCategory, 'id'>, snapshotDoc.id),
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
    const path = `categories/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, {
      contentType: file.type || `image/${extension}`,
    });

    return getDownloadURL(storageRef);
  },

  async addCategory(input: CreateCategoryInput): Promise<GalleryCategory> {
    assertFirebaseConfigured();

    const payload = {
      ...input,
      created_at: new Date().toISOString(),
      visible: input.visible ?? true,
    };
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), payload);

    return {
      id: docRef.id,
      ...payload,
    };
  },

  async updateCategory(id: string, updates: UpdateCategoryInput): Promise<void> {
    assertFirebaseConfigured();

    const { previousImage, ...payload } = updates;

    if (previousImage && previousImage !== payload.image) {
      await deleteStoredImage(previousImage);
    }

    await updateDoc(doc(db, CATEGORIES_COLLECTION, id), { ...payload, visible: payload.visible ?? true });
  },

  async deleteCategory(category: GalleryCategory): Promise<void> {
    assertFirebaseConfigured();
    await deleteStoredImage(category.image);
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, category.id));
  },
};
