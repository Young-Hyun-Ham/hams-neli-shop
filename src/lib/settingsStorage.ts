import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { DEFAULT_SITE_SETTINGS, type SiteSettings, type TimeRange, type Weekday } from './index';

const SETTINGS_COLLECTION = 'settings';
const SITE_SETTINGS_DOC = 'site';
const ADMIN_SETTINGS_DOC = 'admin';
const VALID_WEEKDAYS: Weekday[] = ['월', '화', '수', '목', '금', '토', '일'];
const DEFAULT_ADMIN_PASSWORD = 'admin1234';

const getSettingsDocRef = () => doc(db, SETTINGS_COLLECTION, SITE_SETTINGS_DOC);
const getAdminDocRef = () => doc(db, SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC);

const normalizeTimeRange = (value: Partial<TimeRange> | undefined, fallback: TimeRange): TimeRange => ({
  startHour: value?.startHour || fallback.startHour,
  startMinute: value?.startMinute || fallback.startMinute,
  endHour: value?.endHour || fallback.endHour,
  endMinute: value?.endMinute || fallback.endMinute,
});

const normalizeOptionalString = (value: string | null | undefined, fallback: string) =>
  value ?? fallback;

const normalizeSettings = (value?: Partial<SiteSettings> | null): SiteSettings => ({
  addressLine1: value?.addressLine1 || DEFAULT_SITE_SETTINGS.addressLine1,
  addressLine2: value?.addressLine2 || DEFAULT_SITE_SETTINGS.addressLine2,
  mapQuery: value?.mapQuery || value?.addressLine1 || DEFAULT_SITE_SETTINGS.mapQuery,
  phone: value?.phone || DEFAULT_SITE_SETTINGS.phone,
  email: value?.email || DEFAULT_SITE_SETTINGS.email,
  weekdayHours: normalizeTimeRange(value?.weekdayHours, DEFAULT_SITE_SETTINGS.weekdayHours),
  weekendHours: normalizeTimeRange(value?.weekendHours, DEFAULT_SITE_SETTINGS.weekendHours),
  closedDays:
    value?.closedDays?.filter((item): item is Weekday => VALID_WEEKDAYS.includes(item as Weekday)) ||
    DEFAULT_SITE_SETTINGS.closedDays,
  instagramUrl: normalizeOptionalString(value?.instagramUrl, DEFAULT_SITE_SETTINGS.instagramUrl),
  tiktokUrl: normalizeOptionalString(value?.tiktokUrl, DEFAULT_SITE_SETTINGS.tiktokUrl),
  facebookUrl: normalizeOptionalString(value?.facebookUrl, DEFAULT_SITE_SETTINGS.facebookUrl),
  kakaoOpenChatUrl: normalizeOptionalString(
    value?.kakaoOpenChatUrl,
    DEFAULT_SITE_SETTINGS.kakaoOpenChatUrl,
  ),
  xUrl: normalizeOptionalString(value?.xUrl, DEFAULT_SITE_SETTINGS.xUrl),
});

const hashPassword = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const settingsStorage = {
  async getSettings(): Promise<SiteSettings> {
    if (!isFirebaseConfigured) {
      return DEFAULT_SITE_SETTINGS;
    }

    const snapshot = await getDoc(getSettingsDocRef());
    if (!snapshot.exists()) {
      return DEFAULT_SITE_SETTINGS;
    }

    return normalizeSettings(snapshot.data() as Partial<SiteSettings>);
  },

  subscribeSettings(
    onData: (settings: SiteSettings) => void,
    onError?: (error: Error) => void,
  ) {
    if (!isFirebaseConfigured) {
      onData(DEFAULT_SITE_SETTINGS);
      return () => {};
    }

    return onSnapshot(
      getSettingsDocRef(),
      (snapshot) => {
        if (!snapshot.exists()) {
          onData(DEFAULT_SITE_SETTINGS);
          return;
        }

        onData(normalizeSettings(snapshot.data() as Partial<SiteSettings>));
      },
      (error) => {
        onError?.(error);
      },
    );
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    if (!isFirebaseConfigured) {
      return;
    }

    await setDoc(getSettingsDocRef(), normalizeSettings(settings), { merge: true });
  },

  async getAdminPasswordHash(): Promise<string> {
    const fallbackHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);

    if (!isFirebaseConfigured) {
      return fallbackHash;
    }

    const snapshot = await getDoc(getAdminDocRef());
    if (!snapshot.exists()) {
      return fallbackHash;
    }

    const value = snapshot.data() as { pwd?: string };
    return value.pwd || fallbackHash;
  },

  async verifyAdminPassword(password: string): Promise<boolean> {
    const [inputHash, savedHash] = await Promise.all([
      hashPassword(password),
      this.getAdminPasswordHash(),
    ]);

    return inputHash === savedHash;
  },

  async updateAdminPassword(password: string): Promise<void> {
    const pwd = await hashPassword(password);

    if (!isFirebaseConfigured) {
      return;
    }

    await setDoc(
      getAdminDocRef(),
      {
        pwd,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  },
};
