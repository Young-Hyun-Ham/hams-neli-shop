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
import type { Testimonial } from './index';
import { db, isFirebaseConfigured, storage } from './firebase';

const TESTIMONIALS_COLLECTION = 'testimonials';

type CreateTestimonialInput = Omit<Testimonial, 'id' | 'date' | 'created_at'> & {
  password: string;
};

type UpdateTestimonialInput = Pick<Testimonial, 'name' | 'rating' | 'comment'> & {
  image?: string;
  images?: string[];
  avatar?: string;
  removedImages?: string[];
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

const normalizeTestimonial = (
  snapshotDoc: { id: string; data: () => Omit<Testimonial, 'id'> },
): Testimonial => {
  const data = snapshotDoc.data();
  const images = Array.isArray(data.images)
    ? data.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : data.image
      ? [data.image]
      : [];
  const coverImage = images[0] || data.image || '';

  return {
    id: snapshotDoc.id,
    ...data,
    image: coverImage,
    images,
    avatar: data.avatar || coverImage,
  };
};

const deleteStoredImages = async (urls: string[]) => {
  await Promise.all(
    urls.map(async (url) => {
      try {
        await deleteObject(ref(storage, url));
      } catch (error) {
        console.error('Failed to delete testimonial image:', error);
      }
    }),
  );
};

export const testimonialStorage = {
  createTestimonialsQuery() {
    assertFirebaseConfigured();

    return query(collection(db, TESTIMONIALS_COLLECTION), orderBy('created_at', 'desc'));
  },

  async getTestimonials(): Promise<Testimonial[]> {
    const testimonialsQuery = this.createTestimonialsQuery();
    const snapshot = await getDocs(testimonialsQuery);

    return snapshot.docs.map((snapshotDoc) =>
      normalizeTestimonial({
        id: snapshotDoc.id,
        data: () => snapshotDoc.data() as Omit<Testimonial, 'id'>,
      }),
    );
  },

  subscribeTestimonials(
    onData: (items: Testimonial[]) => void,
    onError?: (error: Error) => void,
  ) {
    const testimonialsQuery = this.createTestimonialsQuery();

    return onSnapshot(
      testimonialsQuery,
      (snapshot: any) => {
        const items = snapshot.docs.map((snapshotDoc: any) =>
          normalizeTestimonial({
            id: snapshotDoc.id,
            data: () => snapshotDoc.data() as Omit<Testimonial, 'id'>,
          }),
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
    const path = `testimonials/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, {
      contentType: file.type || `image/${extension}`,
    });

    return getDownloadURL(storageRef);
  },

  async uploadImages(files: File[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadImage(file)));
  },

  async addTestimonial(testimonial: CreateTestimonialInput): Promise<Testimonial> {
    assertFirebaseConfigured();

    const created_at = new Date().toISOString();
    const date = new Date(created_at).toISOString().slice(0, 10);
    const images = testimonial.images?.filter(Boolean) ?? (testimonial.image ? [testimonial.image] : []);
    const image = images[0] || '';
    const avatar = testimonial.avatar || image;

    const payload = {
      ...testimonial,
      image,
      images,
      avatar,
      date,
      created_at,
    };

    const docRef = await addDoc(collection(db, TESTIMONIALS_COLLECTION), payload);

    return {
      id: docRef.id,
      ...payload,
    };
  },

  async updateTestimonial(id: string, updates: UpdateTestimonialInput): Promise<void> {
    assertFirebaseConfigured();

    if (updates.removedImages?.length) {
      await deleteStoredImages(updates.removedImages);
    }

    const { removedImages, ...payload } = updates;

    await updateDoc(doc(db, TESTIMONIALS_COLLECTION, id), {
      ...payload,
    });
  },

  async deleteTestimonial(testimonial: Testimonial): Promise<void> {
    assertFirebaseConfigured();

    const imageUrls = testimonial.images?.length ? testimonial.images : testimonial.image ? [testimonial.image] : [];
    await deleteStoredImages(imageUrls);
    await deleteDoc(doc(db, TESTIMONIALS_COLLECTION, testimonial.id));
  },
};
