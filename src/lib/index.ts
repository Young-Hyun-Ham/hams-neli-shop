export const ROUTE_PATHS = {
  HOME: '/',
  GALLERY: '/gallery',
  TESTIMONIALS: '/testimonials',
  REVIEW: '/review',
  ADMIN: '/admin',
} as const;

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  description: string;
  url: string;
  created_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  features: string[];
}

export interface PriceItem {
  id: string;
  category: string;
  name: string;
  price: string;
  duration?: string;
  description?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
  image?: string;
  images?: string[];
  password?: string;
  created_at?: string;
}

export type Weekday = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export interface TimeRange {
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
}

export interface SiteSettings {
  addressLine1: string;
  addressLine2: string;
  mapQuery: string;
  phone: string;
  email: string;
  weekdayHours: TimeRange;
  weekendHours: TimeRange;
  closedDays: Weekday[];
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  kakaoOpenChatUrl: string;
  xUrl: string;
}

export interface Reservation {
  id: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  status: 'confirmed';
  createdAt: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  addressLine1: '서울 강남구 테헤란로 123',
  addressLine2: '네일아트 빌딩 2층',
  mapQuery: '서울 강남구 테헤란로 123',
  phone: '02-1234-5678',
  email: 'contact@nailart.com',
  weekdayHours: {
    startHour: '10',
    startMinute: '00',
    endHour: '20',
    endMinute: '00',
  },
  weekendHours: {
    startHour: '10',
    startMinute: '00',
    endHour: '18',
    endMinute: '00',
  },
  closedDays: ['월'],
  instagramUrl: 'https://instagram.com',
  tiktokUrl: 'https://www.tiktok.com/',
  facebookUrl: 'https://facebook.com',
  kakaoOpenChatUrl: 'https://open.kakao.com/',
  xUrl: 'https://x.com',
};

export const ADMIN_PASSWORD = '1234';
