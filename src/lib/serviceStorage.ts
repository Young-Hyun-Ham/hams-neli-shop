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
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { Service } from './index';
import { db, isFirebaseConfigured, storage } from './firebase';

const SERVICES_COLLECTION = 'services';

type CreateServiceInput = Omit<Service, 'id'>;
type UpdateServiceInput = Omit<Service, 'id'> & {
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
    console.error('Failed to delete service image file:', error);
  }
};

export const serviceStorage = {
  createServicesQuery() {
    assertFirebaseConfigured();

    return query(collection(db, SERVICES_COLLECTION), orderBy('title', 'asc'));
  },

  async getServices(): Promise<Service[]> {
    const servicesQuery = this.createServicesQuery();
    const snapshot = await getDocs(servicesQuery);

    return snapshot.docs.map((snapshotDoc) => ({
      ...(snapshotDoc.data() as Omit<Service, 'id'>),
      id: snapshotDoc.id,
      visible: (snapshotDoc.data() as Omit<Service, 'id'>).visible ?? true,
    }));
  },

  subscribeServices(onData: (items: Service[]) => void, onError?: (error: Error) => void) {
    const servicesQuery = this.createServicesQuery();

    return onSnapshot(
      servicesQuery,
      (snapshot: any) => {
        const items = snapshot.docs.map((snapshotDoc: any) => ({
          ...(snapshotDoc.data() as Omit<Service, 'id'>),
          id: snapshotDoc.id,
          visible: (snapshotDoc.data() as Omit<Service, 'id'>).visible ?? true,
        }));

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
    const path = `services/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, {
      contentType: file.type || `image/${extension}`,
    });

    return getDownloadURL(storageRef);
  },

  async addService(service: CreateServiceInput): Promise<Service> {
    assertFirebaseConfigured();

    const payload = { ...service, visible: service.visible ?? true };
    const docRef = await addDoc(collection(db, SERVICES_COLLECTION), payload);

    return {
      id: docRef.id,
      ...payload,
    };
  },

  async syncServices(items: Service[]): Promise<void> {
    assertFirebaseConfigured();

    await Promise.all(
      items.map(({ id, ...service }) =>
        setDoc(doc(db, SERVICES_COLLECTION, id), { ...service, visible: service.visible ?? true }, { merge: true }),
      ),
    );
  },

  async updateService(id: string, updates: UpdateServiceInput): Promise<void> {
    assertFirebaseConfigured();

    const { previousImage, ...payload } = updates;

    if (previousImage && previousImage !== payload.image) {
      await deleteStoredImage(previousImage);
    }

    await updateDoc(doc(db, SERVICES_COLLECTION, id), { ...payload, visible: payload.visible ?? true });
  },

  async deleteService(service: Service): Promise<void> {
    assertFirebaseConfigured();

    await deleteStoredImage(service.image);
    await deleteDoc(doc(db, SERVICES_COLLECTION, service.id));
  },
};
