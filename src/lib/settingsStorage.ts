import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { DEFAULT_SITE_SETTINGS, type SiteSettings, type TimeRange, type Weekday } from './index';

const SETTINGS_COLLECTION = 'settings';
const SITE_SETTINGS_DOC = 'site';
const VALID_WEEKDAYS: Weekday[] = ['월', '화', '수', '목', '금', '토', '일'];

const getSettingsDocRef = () => doc(db, SETTINGS_COLLECTION, SITE_SETTINGS_DOC);

const normalizeTimeRange = (value: Partial<TimeRange> | undefined, fallback: TimeRange): TimeRange => ({
  startHour: value?.startHour || fallback.startHour,
  startMinute: value?.startMinute || fallback.startMinute,
  endHour: value?.endHour || fallback.endHour,
  endMinute: value?.endMinute || fallback.endMinute,
});

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
  instagramUrl: value?.instagramUrl || DEFAULT_SITE_SETTINGS.instagramUrl,
  facebookUrl: value?.facebookUrl || DEFAULT_SITE_SETTINGS.facebookUrl,
  kakaoOpenChatUrl: value?.kakaoOpenChatUrl || DEFAULT_SITE_SETTINGS.kakaoOpenChatUrl,
  xUrl: value?.xUrl || DEFAULT_SITE_SETTINGS.xUrl,
});

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
};
