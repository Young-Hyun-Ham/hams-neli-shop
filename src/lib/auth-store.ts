import { create } from 'zustand';

import {
  fetchServiceViewer,
  hasServiceSessionHint,
  type ServiceViewer,
} from '@/lib/sso';

type AuthStoreState = {
  viewer: ServiceViewer | null;
  authLoading: boolean;
  logoutPending: boolean;
  hydrateSession: () => Promise<void>;
  clearSession: () => void;
  setLogoutPending: (pending: boolean) => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  viewer: null,
  authLoading: true,
  logoutPending: false,
  hydrateSession: async () => {
    if (!hasServiceSessionHint()) {
      set({
        viewer: null,
        authLoading: false,
      });
      return;
    }

    set({ authLoading: true });

    try {
      const viewer = await fetchServiceViewer();

      set({
        viewer,
        authLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch service viewer:', error);
      set({
        viewer: null,
        authLoading: false,
      });
    }
  },
  clearSession: () =>
    set({
      viewer: null,
      authLoading: false,
      logoutPending: false,
    }),
  setLogoutPending: (pending) =>
    set({
      logoutPending: pending,
    }),
}));
