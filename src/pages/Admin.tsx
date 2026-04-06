import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BriefcaseBusiness,
  CircleDollarSign,
  CalendarClock,
  FolderPlus,
  ExternalLink,
  Globe,
  ImagePlus,
  Loader2,
  Lock,
  MapPinned,
  Megaphone,
  Music4,
  Pencil,
  Search,
  Settings,
  Trash2,
  Upload,
  Video as VideoIcon,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { GalleryImageCard, VideoCard } from '@/components/Cards';
import { priceItems as fallbackPrices, services as fallbackServices } from '@/data/index';
import {
  DEFAULT_SITE_SETTINGS,
  type EventItem,
  type GalleryCategory,
  type GalleryImage,
  type PriceItem,
  type Reservation,
  type Service,
  type SiteSettings,
  type TimeRange,
  type Video,
  type Weekday,
} from '@/lib/index';
import { categoryStorage } from '@/lib/categoryStorage';
import { imageStorage } from '@/lib/imageStorage';
import { eventStorage } from '@/lib/eventStorage';
import { priceStorage } from '@/lib/priceStorage';
import { reservationStorage } from '@/lib/reservationStorage';
import { serviceStorage } from '@/lib/serviceStorage';
import { settingsStorage } from '@/lib/settingsStorage';
import { videoStorage } from '@/lib/videoStorage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const INSTAGRAM_HOME_URL = 'https://www.instagram.com/';
const TIKTOK_HOME_URL = 'https://www.tiktok.com/';
const FACEBOOK_HOME_URL = 'https://www.facebook.com/';
const X_HOME_URL = 'https://x.com/';
const WEEKDAYS: Weekday[] = ['월', '화', '수', '목', '금', '토', '일'];
const SERVICES_PER_PAGE = 10;
const RESERVATIONS_PER_PAGE = 10;

type ReservationEditState = {
  originalDate: string;
  originalTime: string;
  date: string;
  time: string;
  name: string;
  phone: string;
};

type SettlementEditState = {
  date: string;
  time: string;
  customerName: string;
  serviceName: string;
  settlementAmount: string;
  settlementMemo: string;
};

type ServiceImageMode = 'url' | 'file';
type EventImageMode = 'url' | 'file';
type CategoryImageMode = 'url' | 'file';
type GalleryImageMode = 'url' | 'file';

type ServiceEditState = {
  id: string;
  title: string;
  description: string;
  features: string;
  image: string;
  originalImage: string;
  imageMode: ServiceImageMode;
  visible: boolean;
};

type PriceEditState = {
  id: string;
  category: string;
  name: string;
  price: string;
  duration: string;
  description: string;
  visible: boolean;
};

type EventEditState = {
  id: string;
  title: string;
  content: string;
  image: string;
  originalImage: string;
  imageMode: EventImageMode;
  startDate: string;
  endDate: string;
  visible: boolean;
};

type VideoEditState = {
  id: string;
  title: string;
  description: string;
  url: string;
  visible: boolean;
};

type ImageEditState = {
  id: string;
  title: string;
  description: string;
  url: string;
  originalUrl: string;
  imageMode: GalleryImageMode;
  categoryId: string;
  visible: boolean;
};

type CategoryEditState = {
  id: string;
  name: string;
  description: string;
  image: string;
  originalImage: string;
  imageMode: CategoryImageMode;
  visible: boolean;
};

const initialReservationEditState: ReservationEditState = {
  originalDate: '',
  originalTime: '',
  date: '',
  time: '',
  name: '',
  phone: '',
};

const initialSettlementEditState: SettlementEditState = {
  date: '',
  time: '',
  customerName: '',
  serviceName: '',
  settlementAmount: '',
  settlementMemo: '',
};

const initialServiceEditState: ServiceEditState = {
  id: '',
  title: '',
  description: '',
  features: '',
  image: '',
  originalImage: '',
  imageMode: 'url',
  visible: true,
};

const initialPriceEditState: PriceEditState = {
  id: '',
  category: '',
  name: '',
  price: '',
  duration: '',
  description: '',
  visible: true,
};

const initialEventEditState: EventEditState = {
  id: '',
  title: '',
  content: '첫 방문 시 무료, 두 번째 방문 시 50프로 할인.',
  image: '',
  originalImage: '',
  imageMode: 'url',
  startDate: '',
  endDate: '',
  visible: true,
};

const initialVideoEditState: VideoEditState = {
  id: '',
  title: '',
  description: '',
  url: '',
  visible: true,
};

const initialImageEditState: ImageEditState = {
  id: '',
  title: '',
  description: '',
  url: '',
  originalUrl: '',
  imageMode: 'url',
  categoryId: '',
  visible: true,
};

const initialCategoryEditState: CategoryEditState = {
  id: '',
  name: '',
  description: '',
  image: '',
  originalImage: '',
  imageMode: 'url',
  visible: true,
};

const getMapEmbedUrl = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

const parseSettlementAmount = (value?: string) => {
  if (!value) {
    return 0;
  }

  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
};

const getSettlementBreakdown = (value?: string) => {
  const total = parseSettlementAmount(value);
  const vat = total > 0 ? Math.round(total / 11) : 0;
  const supply = total - vat;

  return {
    total,
    supply,
    vat,
  };
};

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('ko-KR').format(value)}원`;

const isSupportedVideoUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    return (
      hostname.includes('instagram.com') ||
      hostname.includes('tiktok.com') ||
      hostname.includes('facebook.com') ||
      hostname.includes('fb.watch') ||
      hostname.includes('x.com') ||
      hostname.includes('twitter.com')
    );
  } catch {
    return false;
  }
};

const isEmbeddableFacebookUrl = (parsed: URL) => {
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (hostname.includes('fb.watch')) {
    return false;
  }

  return (
    pathname.includes('/posts/') ||
    pathname.includes('/videos/') ||
    pathname === '/permalink.php' ||
    pathname.startsWith('/watch') ||
    pathname === '/plugins/post.php'
  );
};

const getVideoUrlValidationError = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    if (!isSupportedVideoUrl(value)) {
      return '인스타그램, 틱톡, 페이스북, X 주소만 등록할 수 있습니다.';
    }

    if ((hostname.includes('facebook.com') || hostname.includes('fb.watch')) && !isEmbeddableFacebookUrl(parsed)) {
      return 'Facebook은 임베드 가능한 게시물 URL만 등록할 수 있습니다.';
    }

    return null;
  } catch {
    return '올바른 동영상 주소를 입력해 주세요.';
  }
};

const updateTimeRange = (range: TimeRange, field: keyof TimeRange, value: string): TimeRange => ({
  ...range,
  [field]: value,
});

const formatDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDate = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonthsToDate = (value: Date, months: number) => {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
};

const addYearsToDate = (value: Date, years: number) => {
  const next = new Date(value);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

const parseServiceFeatures = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const formatServiceFeatures = (features: string[]) => features.join('\n');

const isValidImageUrl = (value: string) => {
  const trimmed = value.trim();

  if (trimmed.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const rowVisibilityClassName = (visible?: boolean) => (visible === false ? 'line-through opacity-60' : '');

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [nextAdminPassword, setNextAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [imageMode, setImageMode] = useState<GalleryImageMode>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCategoryId, setImageCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imageInputKey, setImageInputKey] = useState(0);
  const [videoVisible, setVideoVisible] = useState(true);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceFeatures, setServiceFeatures] = useState('');
  const [serviceImageMode, setServiceImageMode] = useState<ServiceImageMode>('url');
  const [serviceImageUrl, setServiceImageUrl] = useState('');
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
  const [serviceImagePreviewUrl, setServiceImagePreviewUrl] = useState('');
  const [serviceImageInputKey, setServiceImageInputKey] = useState(0);
  const [serviceVisible, setServiceVisible] = useState(true);
  const [eventTitle, setEventTitle] = useState('');
  const [eventContent, setEventContent] = useState('첫 방문 시 무료, 두 번째 방문 시 50프로 할인.');
  const [eventImageMode, setEventImageMode] = useState<EventImageMode>('url');
  const [eventImage, setEventImage] = useState('');
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreviewUrl, setEventImagePreviewUrl] = useState('');
  const [eventImageInputKey, setEventImageInputKey] = useState(0);
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventVisible, setEventVisible] = useState(true);
  const [priceCategory, setPriceCategory] = useState('');
  const [priceName, setPriceName] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [priceDuration, setPriceDuration] = useState('');
  const [priceDescription, setPriceDescription] = useState('');
  const [priceVisible, setPriceVisible] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryImageMode, setCategoryImageMode] = useState<CategoryImageMode>('url');
  const [categoryImage, setCategoryImage] = useState('');
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreviewUrl, setCategoryImagePreviewUrl] = useState('');
  const [categoryImageInputKey, setCategoryImageInputKey] = useState(0);
  const [categoryVisible, setCategoryVisible] = useState(true);
  const [imageVisible, setImageVisible] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [serviceUploading, setServiceUploading] = useState(false);
  const [priceUploading, setPriceUploading] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [priceError, setPriceError] = useState('');
  const [priceSuccess, setPriceSuccess] = useState('');
  const [reservationError, setReservationError] = useState('');
  const [reservationMessage, setReservationMessage] = useState('');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(DEFAULT_SITE_SETTINGS.mapQuery);
  const [editReservationOpen, setEditReservationOpen] = useState(false);
  const [reservationSaving, setReservationSaving] = useState(false);
  const [reservationDeletingKey, setReservationDeletingKey] = useState('');
  const [reservationDetailOpen, setReservationDetailOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editSettlementOpen, setEditSettlementOpen] = useState(false);
  const [editSettlement, setEditSettlement] = useState<SettlementEditState>(initialSettlementEditState);
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [editServiceOpen, setEditServiceOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceEditState>(initialServiceEditState);
  const [editServiceFile, setEditServiceFile] = useState<File | null>(null);
  const [editServicePreviewUrl, setEditServicePreviewUrl] = useState('');
  const [editServiceInputKey, setEditServiceInputKey] = useState(0);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceDeletingId, setServiceDeletingId] = useState('');
  const [serviceImporting, setServiceImporting] = useState(false);
  const [servicesPage, setServicesPage] = useState(1);
  const [editVideoOpen, setEditVideoOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoEditState>(initialVideoEditState);
  const [videoSaving, setVideoSaving] = useState(false);
  const [editImageOpen, setEditImageOpen] = useState(false);
  const [editImage, setEditImage] = useState<ImageEditState>(initialImageEditState);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState('');
  const [editImageInputKey, setEditImageInputKey] = useState(0);
  const [imageSaving, setImageSaving] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryEditState>(initialCategoryEditState);
  const [editCategoryFile, setEditCategoryFile] = useState<File | null>(null);
  const [editCategoryPreviewUrl, setEditCategoryPreviewUrl] = useState('');
  const [editCategoryInputKey, setEditCategoryInputKey] = useState(0);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState('');
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventEditState>(initialEventEditState);
  const [editEventFile, setEditEventFile] = useState<File | null>(null);
  const [editEventPreviewUrl, setEditEventPreviewUrl] = useState('');
  const [editEventInputKey, setEditEventInputKey] = useState(0);
  const [eventUploading, setEventUploading] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventDeletingId, setEventDeletingId] = useState('');
  const [editPriceOpen, setEditPriceOpen] = useState(false);
  const [editPrice, setEditPrice] = useState<PriceEditState>(initialPriceEditState);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceDeletingId, setPriceDeletingId] = useState('');
  const [priceImporting, setPriceImporting] = useState(false);
  const [editReservation, setEditReservation] = useState<ReservationEditState>(initialReservationEditState);
  const [reservationSearchStartDate, setReservationSearchStartDate] = useState('');
  const [reservationSearchEndDate, setReservationSearchEndDate] = useState('');
  const [reservationPage, setReservationPage] = useState(1);
  const [settlementSearchStartDate, setSettlementSearchStartDate] = useState('');
  const [settlementSearchEndDate, setSettlementSearchEndDate] = useState('');
  const [settlementSearchName, setSettlementSearchName] = useState('');
  const [settlementSearchPhone, setSettlementSearchPhone] = useState('');

  const previewMapUrl = useMemo(
    () => getMapEmbedUrl(searchKeyword || settings.mapQuery || settings.addressLine1),
    [searchKeyword, settings.addressLine1, settings.mapQuery],
  );
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      if (reservationSearchStartDate && reservation.date < reservationSearchStartDate) {
        return false;
      }

      if (reservationSearchEndDate && reservation.date > reservationSearchEndDate) {
        return false;
      }

      return true;
    });
  }, [reservationSearchEndDate, reservationSearchStartDate, reservations]);
  const filteredSettlementReservations = useMemo(() => {
    const trimmedName = settlementSearchName.trim();
    const trimmedPhone = settlementSearchPhone.trim();

    return reservations.filter((reservation) => {
      if (settlementSearchStartDate && reservation.date < settlementSearchStartDate) {
        return false;
      }

      if (settlementSearchEndDate && reservation.date > settlementSearchEndDate) {
        return false;
      }

      if (trimmedName && !reservation.name.trim().includes(trimmedName)) {
        return false;
      }

      if (trimmedPhone) {
        const reservationPhone = reservation.phone.replace(/[^\d]/g, '').trim();
        if (!reservationPhone.includes(trimmedPhone)) {
          return false;
        }
      }

      return true;
    });
  }, [reservations, settlementSearchEndDate, settlementSearchName, settlementSearchPhone, settlementSearchStartDate]);
  const settlementDateRangeLabel = useMemo(() => {
    if (settlementSearchStartDate && settlementSearchEndDate) {
      return `${settlementSearchStartDate} ~ ${settlementSearchEndDate}`;
    }

    if (settlementSearchStartDate) {
      return `${settlementSearchStartDate} 이후`;
    }

    if (settlementSearchEndDate) {
      return `${settlementSearchEndDate} 이전`;
    }

    return '전체 기간';
  }, [settlementSearchEndDate, settlementSearchStartDate]);
  const settlementSummary = useMemo(() => {
    const byDate = new Map<string, number>();
    const byService = new Map<string, number>();
    let totalSettledAmount = 0;
    let totalSettledSupplyAmount = 0;
    let totalSettledVatAmount = 0;
    let settledReservations = 0;

    for (const reservation of filteredSettlementReservations) {
      byDate.set(reservation.date, (byDate.get(reservation.date) ?? 0) + 1);

      const serviceName = reservation.serviceName?.trim() || '미지정';
      byService.set(serviceName, (byService.get(serviceName) ?? 0) + 1);

      const amount = parseSettlementAmount(reservation.settlementAmount);
      if (amount > 0) {
        const breakdown = getSettlementBreakdown(reservation.settlementAmount);
        totalSettledAmount += amount;
        totalSettledSupplyAmount += breakdown.supply;
        totalSettledVatAmount += breakdown.vat;
        settledReservations += 1;
      }
    }

    const dailyItems = [...byDate.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((left, right) => right.date.localeCompare(left.date));
    const serviceItems = [...byService.entries()]
      .map(([serviceName, count]) => ({ serviceName, count }))
      .sort((left, right) => right.count - left.count || left.serviceName.localeCompare(right.serviceName));
    const totalReservations = filteredSettlementReservations.length;
    const activeDays = dailyItems.length;
    const averageReservationsPerDay = activeDays > 0 ? totalReservations / activeDays : 0;

    return {
      totalReservations,
      activeDays,
      averageReservationsPerDay,
      totalSettledAmount,
      totalSettledSupplyAmount,
      totalSettledVatAmount,
      settledReservations,
      latestReservationDate: dailyItems[0]?.date ?? '-',
      topServiceName: serviceItems[0]?.serviceName ?? '-',
      dailyItems,
      serviceItems,
    };
  }, [filteredSettlementReservations]);
  const editSettlementBreakdown = useMemo(
    () => getSettlementBreakdown(editSettlement.settlementAmount),
    [editSettlement.settlementAmount],
  );
  const reservationTotalPages = Math.max(1, Math.ceil(filteredReservations.length / RESERVATIONS_PER_PAGE));
  const servicesTotalPages = Math.max(1, Math.ceil(services.length / SERVICES_PER_PAGE));
  const paginatedServices = useMemo(() => {
    const startIndex = (servicesPage - 1) * SERVICES_PER_PAGE;
    return services.slice(startIndex, startIndex + SERVICES_PER_PAGE);
  }, [services, servicesPage]);
  const paginatedReservations = useMemo(() => {
    const startIndex = (reservationPage - 1) * RESERVATIONS_PER_PAGE;
    return filteredReservations.slice(startIndex, startIndex + RESERVATIONS_PER_PAGE);
  }, [filteredReservations, reservationPage]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void loadVideos();
    void loadImages();
    void loadSettings();
    const unsubscribeCategories = subscribeCategories();
    const unsubscribeEvents = subscribeEvents();
    const unsubscribeServices = subscribeServices();
    const unsubscribePrices = subscribePrices();
    const unsubscribeReservations = subscribeReservations();

    return () => {
      unsubscribeCategories();
      unsubscribeEvents();
      unsubscribeServices();
      unsubscribePrices();
      unsubscribeReservations();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (eventStartDate && eventEndDate) {
      return;
    }

    setEventStartDate((current) => current || formatDateInputValue(new Date()));
    setEventEndDate((current) => current || formatDateInputValue(addMonthsToDate(new Date(), 1)));
  }, [eventEndDate, eventStartDate]);

  useEffect(() => {
    if (imageMode !== 'file' || !imageFile) {
      setImagePreviewUrl(imageMode === 'url' ? imageUrl.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, imageMode, imageUrl]);

  useEffect(() => {
    if (serviceImageMode !== 'file' || !serviceImageFile) {
      setServiceImagePreviewUrl(serviceImageMode === 'url' ? serviceImageUrl.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(serviceImageFile);
    setServiceImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [serviceImageFile, serviceImageMode, serviceImageUrl]);

  useEffect(() => {
    if (eventImageMode !== 'file' || !eventImageFile) {
      setEventImagePreviewUrl(eventImageMode === 'url' ? eventImage.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(eventImageFile);
    setEventImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [eventImage, eventImageFile, eventImageMode]);

  useEffect(() => {
    if (categoryImageMode !== 'file' || !categoryImageFile) {
      setCategoryImagePreviewUrl(categoryImageMode === 'url' ? categoryImage.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(categoryImageFile);
    setCategoryImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [categoryImage, categoryImageFile, categoryImageMode]);

  useEffect(() => {
    if (editService.imageMode !== 'file' || !editServiceFile) {
      setEditServicePreviewUrl(editService.imageMode === 'url' ? editService.image.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(editServiceFile);
    setEditServicePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editService.image, editService.imageMode, editServiceFile]);

  useEffect(() => {
    if (editEvent.imageMode !== 'file' || !editEventFile) {
      setEditEventPreviewUrl(editEvent.imageMode === 'url' ? editEvent.image.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(editEventFile);
    setEditEventPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editEvent.image, editEvent.imageMode, editEventFile]);

  useEffect(() => {
    if (editCategory.imageMode !== 'file' || !editCategoryFile) {
      setEditCategoryPreviewUrl(editCategory.imageMode === 'url' ? editCategory.image.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(editCategoryFile);
    setEditCategoryPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editCategory.image, editCategory.imageMode, editCategoryFile]);

  useEffect(() => {
    if (editImage.imageMode !== 'file' || !editImageFile) {
      setEditImagePreviewUrl(editImage.imageMode === 'url' ? editImage.url.trim() : '');
      return;
    }

    const objectUrl = URL.createObjectURL(editImageFile);
    setEditImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editImage.url, editImage.imageMode, editImageFile]);

  useEffect(() => {
    setServicesPage(1);
  }, [services.length]);

  useEffect(() => {
    if (servicesPage > servicesTotalPages) {
      setServicesPage(servicesTotalPages);
    }
  }, [servicesPage, servicesTotalPages]);

  useEffect(() => {
    setReservationPage(1);
  }, [reservationSearchEndDate, reservationSearchStartDate]);

  useEffect(() => {
    if (reservationPage > reservationTotalPages) {
      setReservationPage(reservationTotalPages);
    }
  }, [reservationPage, reservationTotalPages]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      setVideos(await videoStorage.getVideos());
    } catch (loadError) {
      console.error('Failed to load videos:', loadError);
      setError('동영상 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadImages = async () => {
    setLoadingImages(true);
    setImageError('');
    try {
      setImages(await imageStorage.getImages());
    } catch (loadError) {
      console.error('Failed to load gallery images:', loadError);
      setImageError('이미지 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoadingImages(false);
    }
  };

  const subscribeCategories = () => {
    setLoadingCategories(true);
    return categoryStorage.subscribeCategories(
      (items) => {
        setCategories(items);
        setLoadingCategories(false);
      },
      (subscriptionError) => {
        console.error('Failed to subscribe categories:', subscriptionError);
        setCategoryError('카테고리 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
        setLoadingCategories(false);
      },
    );
  };

  const subscribeEvents = () => {
    setLoadingEvents(true);
    return eventStorage.subscribeEvents(
      (items) => {
        setEvents(items);
        setLoadingEvents(false);
      },
      (subscriptionError) => {
        console.error('Failed to subscribe events:', subscriptionError);
        setEvents([]);
        setEventError('이벤트 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
        setLoadingEvents(false);
      },
    );
  };

  const subscribeServices = () => {
    setLoadingServices(true);
    return serviceStorage.subscribeServices(
      (items) => {
        setServices(items);
        setLoadingServices(false);
      },
      (subscriptionError) => {
        console.error('Failed to subscribe services:', subscriptionError);
        setServiceError('서비스 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
        setLoadingServices(false);
      },
    );
  };

  const subscribePrices = () => {
    setLoadingPrices(true);
    return priceStorage.subscribePrices(
      (items) => {
        setPrices(items);
        setLoadingPrices(false);
      },
      (subscriptionError) => {
        console.error('Failed to subscribe prices:', subscriptionError);
        setPriceError('가격표 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
        setLoadingPrices(false);
      },
    );
  };

  const loadSettings = async () => {
    try {
      const data = await settingsStorage.getSettings();
      setSettings(data);
      setSearchKeyword(data.mapQuery);
    } catch (loadError) {
      console.error('Failed to load site settings:', loadError);
      setSettings(DEFAULT_SITE_SETTINGS);
      setSearchKeyword(DEFAULT_SITE_SETTINGS.mapQuery);
    }
  };

  const subscribeReservations = () => {
    setLoadingReservations(true);
    return reservationStorage.subscribeReservations(
      (items) => {
        setReservations(items);
        setLoadingReservations(false);
      },
      (subscriptionError) => {
        console.error('Failed to subscribe reservations:', subscriptionError);
        setReservationError('예약 현황을 불러오지 못했습니다. Firebase 규칙을 확인해 주세요.');
        setLoadingReservations(false);
      },
    );
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const isValid = await settingsStorage.verifyAdminPassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        setError('');
        return;
      }
      setError('비밀번호가 올바르지 않습니다.');
    } catch (loginError) {
      console.error('Failed to verify admin password:', loginError);
      setError('관리자 비밀번호를 확인하지 못했습니다. Firebase 설정을 확인해 주세요.');
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = videoUrl.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setError('제목과 동영상 주소를 모두 입력해 주세요.');
      return;
    }

    const validationError = getVideoUrlValidationError(trimmedUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await videoStorage.addVideo({ title: trimmedTitle, description: description.trim(), url: trimmedUrl, visible: videoVisible });
      setSuccess('동영상 주소를 등록했습니다.');
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setVideoVisible(true);
      await loadVideos();
    } catch (saveError) {
      console.error('Failed to save video URL:', saveError);
      setError('등록 중 오류가 발생했습니다. Firestore 설정을 확인해 주세요.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await videoStorage.deleteVideo(id);
      setSuccess('동영상을 삭제했습니다.');
      await loadVideos();
    } catch (deleteError) {
      console.error('Failed to delete video:', deleteError);
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditVideoDialog = (video: Video) => {
    setEditVideo({
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.url,
      visible: video.visible !== false,
    });
    setError('');
    setSuccess('');
    setEditVideoOpen(true);
  };

  const handleUpdateVideo = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = editVideo.title.trim();
    const trimmedUrl = editVideo.url.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setError('제목과 동영상 주소를 모두 입력해 주세요.');
      return;
    }

    const validationError = getVideoUrlValidationError(trimmedUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    setVideoSaving(true);
    setError('');
    setSuccess('');

    try {
      await videoStorage.updateVideo(editVideo.id, {
        title: trimmedTitle,
        description: editVideo.description.trim(),
        url: trimmedUrl,
        thumbnail: undefined,
        visible: editVideo.visible,
      });
      setSuccess('동영상을 수정했습니다.');
      setEditVideoOpen(false);
      await loadVideos();
    } catch (updateError) {
      console.error('Failed to update video:', updateError);
      setError('동영상 수정 중 오류가 발생했습니다.');
    } finally {
      setVideoSaving(false);
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setImageFile(nextFile);
    setImageError('');
  };

  const handleEditImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setEditImageFile(nextFile);
    setImageError('');
  };

  const handleImageUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = imageTitle.trim();
    const trimmedImageUrl = imageUrl.trim();
    const category = categories.find((item) => item.id === imageCategoryId);
    if (!trimmedTitle || !category) {
      setImageError('제목, 카테고리, 이미지를 모두 입력해 주세요.');
      return;
    }

    if (imageMode === 'url' && !isValidImageUrl(trimmedImageUrl)) {
      setImageError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (imageMode === 'file' && !imageFile) {
      setImageError('업로드할 이미지 파일을 선택해 주세요.');
      return;
    }

    setImageUploading(true);
    setImageError('');
    setImageSuccess('');

    try {
      await imageStorage.addImage({
        file: imageMode === 'file' ? imageFile ?? undefined : undefined,
        url: imageMode === 'url' ? trimmedImageUrl : undefined,
        title: trimmedTitle,
        description: imageDescription.trim(),
        categoryId: category.id,
        categoryName: category.name,
        visible: imageVisible,
      });
      setImageSuccess('이미지를 등록했습니다.');
      setImageTitle('');
      setImageDescription('');
      setImageMode('file');
      setImageUrl('');
      setImageCategoryId('');
      setImageFile(null);
      setImageVisible(true);
      setImageInputKey((prev) => prev + 1);
      await loadImages();
    } catch (saveError) {
      console.error('Failed to save gallery image:', saveError);
      setImageError('이미지 등록 중 오류가 발생했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteImage = async (image: GalleryImage) => {
    try {
      await imageStorage.deleteImage(image);
      setImageSuccess('이미지를 삭제했습니다.');
      await loadImages();
    } catch (deleteError) {
      console.error('Failed to delete gallery image:', deleteError);
      setImageError('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditImageDialog = (image: GalleryImage) => {
    setEditImage({
      id: image.id,
      title: image.title,
      description: image.description,
      url: image.url,
      originalUrl: image.url,
      imageMode: 'url',
      categoryId: image.categoryId || '',
      visible: image.visible !== false,
    });
    setEditImageFile(null);
    setEditImageInputKey((prev) => prev + 1);
    setImageError('');
    setImageSuccess('');
    setEditImageOpen(true);
  };

  const handleUpdateImage = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedImageUrl = editImage.url.trim();
    const category = categories.find((item) => item.id === editImage.categoryId);
    if (!editImage.title.trim() || !category) {
      setImageError('제목과 카테고리를 입력해 주세요.');
      return;
    }

    if (editImage.imageMode === 'url' && !isValidImageUrl(trimmedImageUrl)) {
      setImageError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (editImage.imageMode === 'file' && !editImageFile) {
      setImageError('교체할 이미지 파일을 선택해 주세요.');
      return;
    }

    setImageSaving(true);
    setImageError('');
    setImageSuccess('');

    try {
      const nextUrl =
        editImage.imageMode === 'file' && editImageFile
          ? await imageStorage.uploadImage(editImageFile)
          : trimmedImageUrl;

      await imageStorage.updateImage(editImage.id, {
        title: editImage.title.trim(),
        description: editImage.description.trim(),
        url: nextUrl,
        previousUrl: editImage.originalUrl,
        categoryId: category.id,
        categoryName: category.name,
        visible: editImage.visible,
      });
      setImageSuccess('이미지를 수정했습니다.');
      setEditImageOpen(false);
      await loadImages();
    } catch (updateError) {
      console.error('Failed to update image:', updateError);
      setImageError('이미지 수정 중 오류가 발생했습니다.');
    } finally {
      setImageSaving(false);
    }
  };

  const handleServiceImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setServiceImageFile(nextFile);
    setServiceError('');
  };

  const handleEditServiceImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setEditServiceFile(nextFile);
    setServiceError('');
  };

  const handleEventImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setEventImageFile(nextFile);
    setEventError('');
  };

  const handleEditEventImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setEditEventFile(nextFile);
    setEventError('');
  };

  const handleCategoryImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setCategoryImageFile(nextFile);
    setCategoryError('');
  };

  const handleEditCategoryImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setEditCategoryFile(nextFile);
    setCategoryError('');
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryDescription('');
    setCategoryImageMode('url');
    setCategoryImage('');
    setCategoryImageFile(null);
    setCategoryImageInputKey((prev) => prev + 1);
    setCategoryVisible(true);
  };

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!categoryName.trim()) {
      setCategoryError('카테고리명을 입력해 주세요.');
      return;
    }

    if (categoryImageMode === 'url' && categoryImage.trim() && !isValidImageUrl(categoryImage.trim())) {
      setCategoryError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (categoryImageMode === 'file' && !categoryImageFile) {
      setCategoryError('업로드할 이미지 파일을 선택해 주세요.');
      return;
    }

    setCategorySaving(true);
    setCategoryError('');
    setCategorySuccess('');

    try {
      const image =
        categoryImageMode === 'file' && categoryImageFile
          ? await categoryStorage.uploadImage(categoryImageFile)
          : categoryImage.trim();

      await categoryStorage.addCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim(),
        image,
        visible: categoryVisible,
      });
      setCategorySuccess('카테고리를 등록했습니다.');
      resetCategoryForm();
    } catch (saveError) {
      console.error('Failed to save category:', saveError);
      setCategoryError('카테고리 등록 중 오류가 발생했습니다.');
    } finally {
      setCategorySaving(false);
    }
  };

  const openEditCategoryDialog = (category: GalleryCategory) => {
    setEditCategory({
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      originalImage: category.image || '',
      imageMode: 'url',
      visible: category.visible !== false,
    });
    setEditCategoryFile(null);
    setEditCategoryInputKey((prev) => prev + 1);
    setCategoryError('');
    setCategorySuccess('');
    setEditCategoryOpen(true);
  };

  const handleUpdateCategory = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editCategory.name.trim()) {
      setCategoryError('카테고리명을 입력해 주세요.');
      return;
    }

    if (editCategory.imageMode === 'url' && editCategory.image.trim() && !isValidImageUrl(editCategory.image.trim())) {
      setCategoryError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (editCategory.imageMode === 'file' && !editCategoryFile) {
      setCategoryError('교체할 이미지 파일을 선택해 주세요.');
      return;
    }

    setCategorySaving(true);
    setCategoryError('');
    setCategorySuccess('');

    try {
      const image =
        editCategory.imageMode === 'file' && editCategoryFile
          ? await categoryStorage.uploadImage(editCategoryFile)
          : editCategory.image.trim();

      await categoryStorage.updateCategory(editCategory.id, {
        name: editCategory.name.trim(),
        description: editCategory.description.trim(),
        image,
        previousImage: editCategory.originalImage,
        visible: editCategory.visible,
      });
      setCategorySuccess('카테고리를 수정했습니다.');
      setEditCategoryOpen(false);
    } catch (updateError) {
      console.error('Failed to update category:', updateError);
      setCategoryError('카테고리 수정 중 오류가 발생했습니다.');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (category: GalleryCategory) => {
    const linkedImages = images.filter((image) => image.categoryId === category.id);

    if (linkedImages.length > 0) {
      setCategoryError('해당 카테고리에 연결된 이미지가 있어 삭제할 수 없습니다. 먼저 이미지를 이동하거나 삭제해 주세요.');
      return;
    }

    const flag = await window.confirm(`카테고리를 삭제하시겠습니까?\n\n카테고리명: ${category.name}`);
    if (!flag) return;

    setCategoryDeletingId(category.id);
    setCategoryError('');
    setCategorySuccess('');

    try {
      await categoryStorage.deleteCategory(category);
      setCategorySuccess('카테고리를 삭제했습니다.');
    } catch (deleteError) {
      console.error('Failed to delete category:', deleteError);
      setCategoryError('카테고리 삭제 중 오류가 발생했습니다.');
    } finally {
      setCategoryDeletingId('');
    }
  };

  const resetServiceForm = () => {
    setServiceTitle('');
    setServiceDescription('');
    setServiceFeatures('');
    setServiceImageMode('url');
    setServiceImageUrl('');
    setServiceImageFile(null);
    setServiceVisible(true);
    setServiceImageInputKey((prev) => prev + 1);
  };

  const handleServiceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = serviceTitle.trim();
    const trimmedDescription = serviceDescription.trim();
    const features = parseServiceFeatures(serviceFeatures);
    const trimmedImageUrl = serviceImageUrl.trim();

    if (!trimmedTitle || !trimmedDescription || features.length === 0) {
      setServiceError('제목, 설명, 특징을 모두 입력해 주세요.');
      return;
    }

    if (serviceImageMode === 'url' && !isValidImageUrl(trimmedImageUrl)) {
      setServiceError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (serviceImageMode === 'file' && !serviceImageFile) {
      setServiceError('업로드할 이미지 파일을 선택해 주세요.');
      return;
    }

    setServiceUploading(true);
    setServiceError('');
    setServiceSuccess('');

    try {
      const image =
        serviceImageMode === 'file' && serviceImageFile
          ? await serviceStorage.uploadImage(serviceImageFile)
          : trimmedImageUrl;

      await serviceStorage.addService({
        title: trimmedTitle,
        description: trimmedDescription,
        image,
        features,
        visible: serviceVisible,
      });

      setServiceSuccess('서비스를 등록했습니다.');
      resetServiceForm();
    } catch (saveError) {
      console.error('Failed to save service:', saveError);
      setServiceError('서비스 등록 중 오류가 발생했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setServiceUploading(false);
    }
  };

  const openEditServiceDialog = (service: Service) => {
    setEditService({
      id: service.id,
      title: service.title,
      description: service.description,
      features: formatServiceFeatures(service.features),
      image: service.image,
      originalImage: service.image,
      imageMode: 'url',
      visible: service.visible !== false,
    });
    setEditServiceFile(null);
    setEditServiceInputKey((prev) => prev + 1);
    setServiceError('');
    setServiceSuccess('');
    setEditServiceOpen(true);
  };

  const handleUpdateService = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = editService.title.trim();
    const trimmedDescription = editService.description.trim();
    const features = parseServiceFeatures(editService.features);
    const trimmedImageUrl = editService.image.trim();

    if (!trimmedTitle || !trimmedDescription || features.length === 0) {
      setServiceError('제목, 설명, 특징을 모두 입력해 주세요.');
      return;
    }

    if (editService.imageMode === 'url' && !isValidImageUrl(trimmedImageUrl)) {
      setServiceError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (editService.imageMode === 'file' && !editServiceFile) {
      setServiceError('교체할 이미지 파일을 선택해 주세요.');
      return;
    }

    setServiceSaving(true);
    setServiceError('');
    setServiceSuccess('');

    try {
      const image =
        editService.imageMode === 'file' && editServiceFile
          ? await serviceStorage.uploadImage(editServiceFile)
          : trimmedImageUrl;

      await serviceStorage.updateService(editService.id, {
        title: trimmedTitle,
        description: trimmedDescription,
        image,
        features,
        previousImage: editService.originalImage,
        visible: editService.visible,
      });

      setServiceSuccess('서비스를 수정했습니다.');
      setEditServiceOpen(false);
    } catch (updateError) {
      console.error('Failed to update service:', updateError);
      setServiceError('서비스 수정 중 오류가 발생했습니다.');
    } finally {
      setServiceSaving(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    const flag = await window.confirm(`서비스를 삭제하시겠습니까?\n\n제목: ${service.title}`);
    if (!flag) return;

    setServiceDeletingId(service.id);
    setServiceError('');
    setServiceSuccess('');

    try {
      await serviceStorage.deleteService(service);
      setServiceSuccess('서비스를 삭제했습니다.');
    } catch (deleteError) {
      console.error('Failed to delete service:', deleteError);
      setServiceError('서비스 삭제 중 오류가 발생했습니다.');
    } finally {
      setServiceDeletingId('');
    }
  };

  const handleImportDefaultServices = async () => {
    setServiceImporting(true);
    setServiceError('');
    setServiceSuccess('');

    try {
      await serviceStorage.syncServices(fallbackServices);
      setServiceSuccess('src/data/index.ts의 services 데이터를 Firebase에 반영했습니다.');
    } catch (importError) {
      console.error('Failed to import default services:', importError);
      setServiceError('기본 services 데이터를 Firebase에 반영하지 못했습니다.');
    } finally {
      setServiceImporting(false);
    }
  };

  const resetEventForm = () => {
    setEventTitle('');
    setEventContent('첫 방문 시 무료, 두 번째 방문 시 50프로 할인.');
    setEventImageMode('url');
    setEventImage('');
    setEventImageFile(null);
    setEventImageInputKey((prev) => prev + 1);
    setEventStartDate(formatDateInputValue(new Date()));
    setEventEndDate(formatDateInputValue(addMonthsToDate(new Date(), 1)));
    setEventVisible(true);
  };

  const handleEventSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!eventTitle.trim() || !eventContent.trim() || !eventStartDate || !eventEndDate) {
      setEventError('제목, 내용, 시작일자, 종료일자를 모두 입력해 주세요.');
      return;
    }

    if (eventImageMode === 'url' && eventImage.trim() && !isValidImageUrl(eventImage.trim())) {
      setEventError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (eventImageMode === 'file' && !eventImageFile) {
      setEventError('업로드할 이미지 파일을 선택해 주세요.');
      return;
    }

    if (eventStartDate > eventEndDate) {
      setEventError('종료일자는 시작일자보다 빠를 수 없습니다.');
      return;
    }

    setEventUploading(true);
    setEventError('');
    setEventSuccess('');

    try {
      const image =
        eventImageMode === 'file' && eventImageFile
          ? await eventStorage.uploadImage(eventImageFile)
          : eventImage.trim();

      await eventStorage.addEvent({
        title: eventTitle.trim(),
        content: eventContent.trim(),
        image,
        startDate: eventStartDate,
        endDate: eventEndDate,
        visible: eventVisible,
      });
      setEventSuccess('이벤트를 등록했습니다.');
      resetEventForm();
    } catch (saveError) {
      console.error('Failed to save event:', saveError);
      setEventError('이벤트 등록 중 오류가 발생했습니다.');
    } finally {
      setEventUploading(false);
    }
  };

  const openEditEventDialog = (item: EventItem) => {
    setEditEvent({
      id: item.id,
      title: item.title,
      content: item.content,
      image: item.image,
      originalImage: item.image,
      imageMode: 'url',
      startDate: item.startDate,
      endDate: item.endDate,
      visible: item.visible !== false,
    });
    setEditEventFile(null);
    setEditEventInputKey((prev) => prev + 1);
    setEventError('');
    setEventSuccess('');
    setEditEventOpen(true);
  };

  const handleUpdateEvent = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editEvent.title.trim() || !editEvent.content.trim() || !editEvent.startDate || !editEvent.endDate) {
      setEventError('제목, 내용, 시작일자, 종료일자를 모두 입력해 주세요.');
      return;
    }

    if (editEvent.imageMode === 'url' && editEvent.image.trim() && !isValidImageUrl(editEvent.image.trim())) {
      setEventError('올바른 이미지 주소를 입력해 주세요.');
      return;
    }

    if (editEvent.imageMode === 'file' && !editEventFile) {
      setEventError('교체할 이미지 파일을 선택해 주세요.');
      return;
    }

    if (editEvent.startDate > editEvent.endDate) {
      setEventError('종료일자는 시작일자보다 빠를 수 없습니다.');
      return;
    }

    setEventSaving(true);
    setEventError('');
    setEventSuccess('');

    try {
      const image =
        editEvent.imageMode === 'file' && editEventFile
          ? await eventStorage.uploadImage(editEventFile)
          : editEvent.image.trim();

      await eventStorage.updateEvent(editEvent.id, {
        title: editEvent.title.trim(),
        content: editEvent.content.trim(),
        image,
        previousImage: editEvent.originalImage,
        startDate: editEvent.startDate,
        endDate: editEvent.endDate,
        visible: editEvent.visible,
      });
      setEventSuccess('이벤트를 수정했습니다.');
      setEditEventOpen(false);
    } catch (updateError) {
      console.error('Failed to update event:', updateError);
      setEventError('이벤트 수정 중 오류가 발생했습니다.');
    } finally {
      setEventSaving(false);
    }
  };

  const handleDeleteEvent = async (item: EventItem) => {
    const flag = await window.confirm(`이벤트를 삭제하시겠습니까?\n\n제목: ${item.title}`);
    if (!flag) return;

    setEventDeletingId(item.id);
    setEventError('');
    setEventSuccess('');

    try {
      await eventStorage.deleteEvent(item);
      setEventSuccess('이벤트를 삭제했습니다.');
    } catch (deleteError) {
      console.error('Failed to delete event:', deleteError);
      setEventError('이벤트 삭제 중 오류가 발생했습니다.');
    } finally {
      setEventDeletingId('');
    }
  };

  const resetPriceForm = () => {
    setPriceCategory('');
    setPriceName('');
    setPriceValue('');
    setPriceDuration('');
    setPriceDescription('');
    setPriceVisible(true);
  };

  const handlePriceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!priceCategory.trim() || !priceName.trim() || !priceValue.trim()) {
      setPriceError('카테고리, 항목명, 가격을 입력해 주세요.');
      return;
    }

    setPriceUploading(true);
    setPriceError('');
    setPriceSuccess('');

    try {
      await priceStorage.addPrice({
        category: priceCategory.trim(),
        name: priceName.trim(),
        price: priceValue.trim(),
        duration: priceDuration.trim(),
        description: priceDescription.trim(),
        visible: priceVisible,
      });
      setPriceSuccess('가격표 항목을 등록했습니다.');
      resetPriceForm();
    } catch (saveError) {
      console.error('Failed to save price:', saveError);
      setPriceError('가격표 등록 중 오류가 발생했습니다.');
    } finally {
      setPriceUploading(false);
    }
  };

  const handleImportDefaultPrices = async () => {
    setPriceImporting(true);
    setPriceError('');
    setPriceSuccess('');

    try {
      await priceStorage.syncPrices(fallbackPrices);
      setPriceSuccess('src/data/index.ts의 priceItems 데이터를 Firebase에 반영했습니다.');
    } catch (importError) {
      console.error('Failed to import default prices:', importError);
      setPriceError('기본 priceItems 데이터를 Firebase에 반영하지 못했습니다.');
    } finally {
      setPriceImporting(false);
    }
  };

  const openEditPriceDialog = (item: PriceItem) => {
    setEditPrice({
      id: item.id,
      category: item.category,
      name: item.name,
      price: item.price,
      duration: item.duration || '',
      description: item.description || '',
      visible: item.visible !== false,
    });
    setPriceError('');
    setPriceSuccess('');
    setEditPriceOpen(true);
  };

  const handleUpdatePrice = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editPrice.category.trim() || !editPrice.name.trim() || !editPrice.price.trim()) {
      setPriceError('카테고리, 항목명, 가격을 입력해 주세요.');
      return;
    }

    setPriceSaving(true);
    setPriceError('');
    setPriceSuccess('');

    try {
      await priceStorage.updatePrice(editPrice.id, {
        category: editPrice.category.trim(),
        name: editPrice.name.trim(),
        price: editPrice.price.trim(),
        duration: editPrice.duration.trim(),
        description: editPrice.description.trim(),
        visible: editPrice.visible,
      });
      setPriceSuccess('가격표 항목을 수정했습니다.');
      setEditPriceOpen(false);
    } catch (updateError) {
      console.error('Failed to update price:', updateError);
      setPriceError('가격표 수정 중 오류가 발생했습니다.');
    } finally {
      setPriceSaving(false);
    }
  };

  const handleDeletePrice = async (item: PriceItem) => {
    const flag = await window.confirm(`가격표 항목을 삭제하시겠습니까?\n\n항목명: ${item.name}`);
    if (!flag) return;

    setPriceDeletingId(item.id);
    setPriceError('');
    setPriceSuccess('');

    try {
      await priceStorage.deletePrice(item.id);
      setPriceSuccess('가격표 항목을 삭제했습니다.');
    } catch (deleteError) {
      console.error('Failed to delete price:', deleteError);
      setPriceError('가격표 삭제 중 오류가 발생했습니다.');
    } finally {
      setPriceDeletingId('');
    }
  };

  const handleToggleClosedDay = (day: Weekday) => {
    setSettings((prev) => ({
      ...prev,
      closedDays: prev.closedDays.includes(day)
        ? prev.closedDays.filter((item) => item !== day)
        : [...prev.closedDays, day],
    }));
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!settings.addressLine1.trim()) {
      setSettingsError('주소를 입력해 주세요.');
      return;
    }

    if (!settings.phone.trim() || !settings.email.trim()) {
      setSettingsError('전화번호와 이메일을 입력해 주세요.');
      return;
    }

    const payload: SiteSettings = {
      ...settings,
      addressLine1: settings.addressLine1.trim(),
      addressLine2: settings.addressLine2.trim(),
      mapQuery: (settings.mapQuery || settings.addressLine1).trim(),
      phone: settings.phone.trim(),
      email: settings.email.trim(),
      instagramUrl: settings.instagramUrl.trim(),
      tiktokUrl: settings.tiktokUrl.trim(),
      facebookUrl: settings.facebookUrl.trim(),
      kakaoOpenChatUrl: settings.kakaoOpenChatUrl.trim(),
      xUrl: settings.xUrl.trim(),
    };

    setSettingsSaving(true);
    setSettingsError('');
    setSettingsMessage('');

    try {
      await settingsStorage.saveSettings(payload);
      setSettings(payload);
      setSearchKeyword(payload.mapQuery);
      setSettingsMessage('영업시간과 사이트 설정을 저장했습니다.');
    } catch (saveError) {
      console.error('Failed to save site settings:', saveError);
      setSettingsError('설정 저장 중 오류가 발생했습니다. Firestore 규칙을 확인해 주세요.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleUpdateAdminPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentAdminPassword.trim() || !nextAdminPassword.trim() || !confirmAdminPassword.trim()) {
      setPasswordError('현재 비밀번호, 새 비밀번호, 새 비밀번호 확인을 모두 입력해 주세요.');
      setPasswordMessage('');
      return;
    }

    if (nextAdminPassword !== confirmAdminPassword) {
      setPasswordError('새 비밀번호와 확인 값이 일치하지 않습니다.');
      setPasswordMessage('');
      return;
    }

    if (nextAdminPassword.trim().length < 4) {
      setPasswordError('새 비밀번호는 4자 이상으로 입력해 주세요.');
      setPasswordMessage('');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      const isValid = await settingsStorage.verifyAdminPassword(currentAdminPassword);
      if (!isValid) {
        setPasswordError('현재 비밀번호가 올바르지 않습니다.');
        return;
      }

      await settingsStorage.updateAdminPassword(nextAdminPassword.trim());
      setCurrentAdminPassword('');
      setNextAdminPassword('');
      setConfirmAdminPassword('');
      setPasswordMessage('관리자 비밀번호를 변경했습니다.');
    } catch (updateError) {
      console.error('Failed to update admin password:', updateError);
      setPasswordError('관리자 비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const applySearchAddress = () => {
    const trimmed = searchKeyword.trim();
    if (!trimmed) {
      setSettingsError('검색할 주소를 입력해 주세요.');
      return;
    }

    setSettings((prev) => ({ ...prev, addressLine1: trimmed, mapQuery: trimmed }));
    setSettingsError('');
    setAddressSearchOpen(false);
  };

  const applyReservationRange = (mode: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date();
    const startDate = formatDateInputValue(today);

    let endDate = startDate;
    if (mode === 'week') {
      endDate = formatDateInputValue(addDaysToDate(today, 7));
    } else if (mode === 'month') {
      endDate = formatDateInputValue(addMonthsToDate(today, 1));
    } else if (mode === 'year') {
      endDate = formatDateInputValue(addYearsToDate(today, 1));
    }

    setReservationSearchStartDate(startDate);
    setReservationSearchEndDate(endDate);
  };

  const applySettlementRange = (mode: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date();
    const startDate = formatDateInputValue(today);

    let endDate = startDate;
    if (mode === 'week') {
      endDate = formatDateInputValue(addDaysToDate(today, 7));
    } else if (mode === 'month') {
      endDate = formatDateInputValue(addMonthsToDate(today, 1));
    } else if (mode === 'year') {
      endDate = formatDateInputValue(addYearsToDate(today, 1));
    }

    setSettlementSearchStartDate(startDate);
    setSettlementSearchEndDate(endDate);
  };

  const openEditReservationDialog = (reservation: Reservation) => {
    setEditReservation({
      originalDate: reservation.date,
      originalTime: reservation.time,
      date: reservation.date,
      time: reservation.time,
      name: reservation.name,
      phone: reservation.phone,
    });
    setReservationError('');
    setReservationMessage('');
    setEditReservationOpen(true);
  };

  const openReservationDetailDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setReservationDetailOpen(true);
  };

  const openEditSettlementDialog = (reservation: Reservation) => {
    setEditSettlement({
      date: reservation.date,
      time: reservation.time,
      customerName: reservation.name,
      serviceName: reservation.serviceName?.trim() || '미지정',
      settlementAmount: reservation.settlementAmount?.trim() || '',
      settlementMemo: reservation.settlementMemo?.trim() || '',
    });
    setReservationError('');
    setReservationMessage('');
    setEditSettlementOpen(true);
  };

  const handleUpdateReservation = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editReservation.date.trim() || !editReservation.time.trim() || !editReservation.name.trim() || !editReservation.phone.trim()) {
      setReservationError('날짜, 시간, 이름, 연락처를 모두 입력해 주세요.');
      return;
    }

    setReservationSaving(true);
    setReservationError('');
    setReservationMessage('');

    try {
      await reservationStorage.updateReservation(editReservation.originalDate, editReservation.originalTime, {
        date: editReservation.date.trim(),
        time: editReservation.time.trim(),
        name: editReservation.name.trim(),
        phone: editReservation.phone.trim(),
      });
      setReservationMessage('예약 정보를 수정했습니다.');
      setEditReservationOpen(false);
    } catch (updateError) {
      console.error('Failed to update reservation:', updateError);
      if (updateError instanceof Error && updateError.message === 'RESERVATION_ALREADY_EXISTS') {
        setReservationError('같은 날짜와 시간에 이미 다른 예약이 있습니다.');
      } else {
        setReservationError('예약 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setReservationSaving(false);
    }
  };

  const handleDeleteReservation = async (reservation: Reservation) => {
    const flag = await window.confirm(`예약을 삭제하시겠습니까?\n\n날짜: ${reservation.date}\n시간: ${reservation.time}\n이름: ${reservation.name}\n연락처: ${reservation.phone}`);
    if (!flag) return;

    const reservationKey = `${reservation.date}_${reservation.time}`;
    setReservationDeletingKey(reservationKey);
    setReservationError('');
    setReservationMessage('');

    try {
      await reservationStorage.deleteReservation(reservation.date, reservation.time);
      setReservationMessage('예약을 삭제했습니다.');
    } catch (deleteError) {
      console.error('Failed to delete reservation:', deleteError);
      setReservationError('예약 삭제 중 오류가 발생했습니다.');
    } finally {
      setReservationDeletingKey('');
    }
  };

  const handleUpdateReservationSettlement = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editSettlement.settlementAmount.trim()) {
      setReservationError('정산 금액을 입력해 주세요.');
      return;
    }

    setSettlementSaving(true);
    setReservationError('');
    setReservationMessage('');

    try {
      await reservationStorage.updateReservationSettlement(editSettlement.date, editSettlement.time, {
        settlementAmount: editSettlement.settlementAmount.replace(/[^\d]/g, ''),
        settlementMemo: editSettlement.settlementMemo.trim(),
      });
      setReservationMessage('예약 정산 정보를 저장했습니다.');
      setEditSettlementOpen(false);
    } catch (updateError) {
      console.error('Failed to update reservation settlement:', updateError);
      setReservationError('정산 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setSettlementSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-full max-w-md shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">관리자 로그인</CardTitle>
                <CardDescription>비밀번호를 입력해 관리자 페이지에 접속해 주세요.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호를 입력해 주세요." autoComplete="current-password" />
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <Button type="submit" className="w-full">로그인</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-6">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="videos" className="space-y-6">
            <div className="flex justify-center sm:justify-start">
              <TabsList className="h-auto rounded-2xl p-1">
                <TabsTrigger value="videos" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <VideoIcon className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">동영상 등록</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <FolderPlus className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">카테고리 등록</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <ImagePlus className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">이미지 등록</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <Megaphone className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">이벤트 관리</span>
                </TabsTrigger>
                <TabsTrigger value="services" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <BriefcaseBusiness className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">서비스 등록</span>
                </TabsTrigger>
                <TabsTrigger value="prices" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <CircleDollarSign className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">가격표 설정</span>
                </TabsTrigger>
                <TabsTrigger value="reservations" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <CalendarClock className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">예약 현황</span>
                </TabsTrigger>
                <TabsTrigger value="settlements" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <CircleDollarSign className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">정산 관리</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="cursor-pointer rounded-xl px-3 py-2.5 sm:px-5">
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">설정</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="videos" className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">동영상 등록</CardTitle>
                    <CardDescription>인스타그램, 틱톡, 페이스북, X 게시물 주소를 등록합니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpload} className="space-y-6">
                      <div className="space-y-2"><Label htmlFor="title">제목</Label><Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="동영상 제목" required /></div>
                      <div className="space-y-2"><Label htmlFor="description">설명</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="동영상 설명" rows={4} /></div>
                      <div className="space-y-2">
                        <Label htmlFor="video-url">동영상 주소</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={INSTAGRAM_HOME_URL} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" />인스타 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={TIKTOK_HOME_URL} target="_blank" rel="noreferrer"><Music4 className="mr-2 h-4 w-4" />틱톡 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={FACEBOOK_HOME_URL} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" />페이스북 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={X_HOME_URL} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" />X 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                        </div>
                        <Input id="video-url" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://www.instagram.com/reel/..." required />
                      </div>
                      <div className="space-y-3">
                        <Label>노출여부</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button type="button" variant={videoVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setVideoVisible(true)}>O</Button>
                          <Button type="button" variant={!videoVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setVideoVisible(false)}>X</Button>
                        </div>
                      </div>
                      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                      {success && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}
                      <Button type="submit" disabled={uploading} className="w-full">{uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />등록</>}</Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Card className="shadow-lg">
                  <CardHeader><CardTitle className="text-2xl">등록된 동영상</CardTitle><CardDescription>현재 등록된 동영상 목록을 확인하고 삭제할 수 있습니다.</CardDescription></CardHeader>
                  <CardContent>
                    {loadingVideos ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : videos.length === 0 ? <div className="py-12 text-center text-muted-foreground">등록된 동영상이 없습니다.</div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{videos.map((video) => <div key={video.id} className={rowVisibilityClassName(video.visible)}><VideoCard video={video} onDelete={handleDeleteVideo} isAdmin /><div className="mt-3 flex gap-2"><Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditVideoDialog(video)}><Pencil className="mr-1 h-4 w-4" />수정</Button></div></div>)}</div>}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="images" className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">이미지 등록</CardTitle>
                    <CardDescription>갤러리 이미지 파일을 업로드하고 제목과 설명을 함께 등록합니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleImageUpload} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="image-title">제목</Label>
                        <Input
                          id="image-title"
                          value={imageTitle}
                          onChange={(event) => setImageTitle(event.target.value)}
                          placeholder="이미지 제목"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image-description">설명</Label>
                        <Textarea
                          id="image-description"
                          value={imageDescription}
                          onChange={(event) => setImageDescription(event.target.value)}
                          placeholder="이미지 설명"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>카테고리 선택</Label>
                        <Select value={imageCategoryId} onValueChange={setImageCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리를 선택해 주세요." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter((category) => category.visible !== false).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label>이미지 입력 방식</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button
                            type="button"
                            variant={imageMode === 'url' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => {
                              setImageMode('url');
                              setImageFile(null);
                              setImageInputKey((prev) => prev + 1);
                            }}
                          >
                            주소 입력
                          </Button>
                          <Button
                            type="button"
                            variant={imageMode === 'file' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setImageMode('file')}
                          >
                            파일 첨부
                          </Button>
                        </div>
                        {imageMode === 'url' ? (
                          <div className="space-y-2">
                            <Label htmlFor="image-url">이미지 주소</Label>
                            <Input
                              id="image-url"
                              value={imageUrl}
                              onChange={(event) => setImageUrl(event.target.value)}
                              placeholder="https://example.com/gallery.jpg"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="image-file">이미지 파일</Label>
                            <Input
                              key={imageInputKey}
                              id="image-file"
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                            />
                          </div>
                        )}
                        {imagePreviewUrl && (
                          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                              <img src={imagePreviewUrl} alt="업로드 미리보기" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Label>노출여부</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button type="button" variant={imageVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setImageVisible(true)}>O</Button>
                          <Button type="button" variant={!imageVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setImageVisible(false)}>X</Button>
                        </div>
                      </div>
                      {imageError && <Alert variant="destructive"><AlertDescription>{imageError}</AlertDescription></Alert>}
                      {imageSuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{imageSuccess}</AlertDescription></Alert>}
                      <Button type="submit" disabled={imageUploading} className="w-full">
                        {imageUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />이미지 등록</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">등록된 이미지</CardTitle>
                    <CardDescription>현재 갤러리 이미지 목록을 확인하고 삭제할 수 있습니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingImages ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : images.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">등록된 이미지가 없습니다.</div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {images.map((image) => (
                          <div key={image.id} className={rowVisibilityClassName(image.visible)}>
                            <GalleryImageCard image={image} onDelete={handleDeleteImage} isAdmin />
                            <div className="mt-3 flex gap-2">
                              <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditImageDialog(image)}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">카테고리 등록</CardTitle>
                    <CardDescription>갤러리 이미지에 연결할 카테고리를 등록합니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCategorySubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">카테고리명</Label>
                        <Input id="category-name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="예: 웨딩 네일" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-description">설명</Label>
                        <Textarea id="category-description" value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="카테고리 설명" rows={4} />
                      </div>
                      <div className="space-y-3">
                        <Label>이미지 입력 방식</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button
                            type="button"
                            variant={categoryImageMode === 'url' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => {
                              setCategoryImageMode('url');
                              setCategoryImageFile(null);
                              setCategoryImageInputKey((prev) => prev + 1);
                            }}
                          >
                            주소 입력
                          </Button>
                          <Button
                            type="button"
                            variant={categoryImageMode === 'file' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setCategoryImageMode('file')}
                          >
                            파일 첨부
                          </Button>
                        </div>
                        {categoryImageMode === 'url' ? (
                          <div className="space-y-2">
                            <Label htmlFor="category-image-url">대표 이미지 주소</Label>
                            <Input
                              id="category-image-url"
                              value={categoryImage}
                              onChange={(event) => setCategoryImage(event.target.value)}
                              placeholder="https://example.com/category.jpg"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="category-image-file">대표 이미지 파일</Label>
                            <Input
                              key={categoryImageInputKey}
                              id="category-image-file"
                              type="file"
                              accept="image/*"
                              onChange={handleCategoryImageFileChange}
                            />
                          </div>
                        )}
                        {categoryImagePreviewUrl && (
                          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                              <img src={categoryImagePreviewUrl} alt="카테고리 미리보기" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Label>노출여부</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button type="button" variant={categoryVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setCategoryVisible(true)}>O</Button>
                          <Button type="button" variant={!categoryVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setCategoryVisible(false)}>X</Button>
                        </div>
                      </div>
                      {categoryError && <Alert variant="destructive"><AlertDescription>{categoryError}</AlertDescription></Alert>}
                      {categorySuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{categorySuccess}</AlertDescription></Alert>}
                      <Button type="submit" disabled={categorySaving} className="w-full">
                        {categorySaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />카테고리 등록</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">등록된 카테고리</CardTitle>
                    <CardDescription>카테고리를 수정하거나 삭제할 수 있습니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingCategories ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : categories.length === 0 ? <div className="py-12 text-center text-muted-foreground">등록된 카테고리가 없습니다.</div> : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>카테고리명</TableHead>
                              <TableHead className="hidden lg:table-cell">설명</TableHead>
                              <TableHead>노출</TableHead>
                              <TableHead className="w-[180px]">관리</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categories.map((category) => (
                              <TableRow key={category.id} className={rowVisibilityClassName(category.visible)}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="hidden max-w-md whitespace-pre-line text-sm text-muted-foreground lg:table-cell">{category.description || '-'}</TableCell>
                                <TableCell>{category.visible !== false ? 'O' : 'X'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditCategoryDialog(category)}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                                    <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={categoryDeletingId === category.id} onClick={() => void handleDeleteCategory(category)}>
                                      {categoryDeletingId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="events" className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">이벤트 등록</CardTitle>
                    <CardDescription>홈 모달과 이벤트 게시판에 노출할 프로모션을 등록합니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEventSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="event-title">이벤트 제목</Label>
                        <Input
                          id="event-title"
                          value={eventTitle}
                          onChange={(event) => setEventTitle(event.target.value)}
                          placeholder="방문 감사 이벤트"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-content">이벤트 내용</Label>
                        <Textarea
                          id="event-content"
                          value={eventContent}
                          onChange={(event) => setEventContent(event.target.value)}
                          rows={4}
                          placeholder="첫 방문 시 무료, 두 번째 방문 시 50프로 할인."
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>이미지 입력 방식</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button
                            type="button"
                            variant={eventImageMode === 'url' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => {
                              setEventImageMode('url');
                              setEventImageFile(null);
                              setEventImageInputKey((prev) => prev + 1);
                            }}
                          >
                            주소 입력
                          </Button>
                          <Button
                            type="button"
                            variant={eventImageMode === 'file' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setEventImageMode('file')}
                          >
                            파일 첨부
                          </Button>
                        </div>
                        {eventImageMode === 'url' ? (
                          <div className="space-y-2">
                            <Label htmlFor="event-image">배경 이미지 주소</Label>
                            <Input
                              id="event-image"
                              value={eventImage}
                              onChange={(event) => setEventImage(event.target.value)}
                              placeholder="비워두면 기본 이미지를 사용합니다."
                            />
                            <p className="text-sm text-muted-foreground">비워두면 메인 팝업에 어울리는 기본 배경 이미지가 적용됩니다.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="event-image-file">이미지 파일</Label>
                            <Input
                              key={eventImageInputKey}
                              id="event-image-file"
                              type="file"
                              accept="image/*"
                              onChange={handleEventImageFileChange}
                            />
                          </div>
                        )}
                        {eventImagePreviewUrl && (
                          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                              <img src={eventImagePreviewUrl} alt="이벤트 미리보기" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="event-start-date">시작일자</Label>
                          <Input
                            id="event-start-date"
                            type="date"
                            value={eventStartDate}
                            onChange={(event) => setEventStartDate(event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-end-date">종료일자</Label>
                          <Input
                            id="event-end-date"
                            type="date"
                            value={eventEndDate}
                            onChange={(event) => setEventEndDate(event.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label>노출여부</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button type="button" variant={eventVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEventVisible(true)}>O</Button>
                          <Button type="button" variant={!eventVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEventVisible(false)}>X</Button>
                        </div>
                      </div>
                      {eventError && <Alert variant="destructive"><AlertDescription>{eventError}</AlertDescription></Alert>}
                      {eventSuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{eventSuccess}</AlertDescription></Alert>}
                      <Button type="submit" disabled={eventUploading} className="w-full">
                        {eventUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />이벤트 등록</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">등록된 이벤트</CardTitle>
                    <CardDescription>이벤트를 수정, 삭제하고 기간과 노출 상태를 관리할 수 있습니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingEvents ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : events.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">등록된 이벤트가 없습니다.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>제목</TableHead>
                              <TableHead>기간</TableHead>
                              <TableHead className="hidden lg:table-cell">내용</TableHead>
                              <TableHead>노출</TableHead>
                              <TableHead className="w-[180px]">관리</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {events.map((item) => (
                              <TableRow key={item.id} className={rowVisibilityClassName(item.visible)}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>{item.startDate} ~ {item.endDate}</TableCell>
                                <TableCell className="hidden max-w-md whitespace-pre-line text-sm text-muted-foreground lg:table-cell">{item.content}</TableCell>
                                <TableCell>{item.visible !== false ? 'O' : 'X'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditEventDialog(item)}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                                    <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={eventDeletingId === item.id} onClick={() => void handleDeleteEvent(item)}>
                                      {eventDeletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="services" className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">서비스 등록</CardTitle>
                    <CardDescription>메인 서비스 섹션에 노출할 서비스 정보를 등록합니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">기본 services 데이터 가져오기</p>
                          <p className="text-sm text-muted-foreground">
                            `src/data/index.ts`의 `services` 배열을 같은 `id`로 Firebase `services` 컬렉션에 저장합니다.
                          </p>
                        </div>
                        <Button type="button" variant="outline" disabled={serviceImporting} onClick={() => void handleImportDefaultServices()}>
                          {serviceImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가져오는 중...</> : 'data/index.ts 가져오기'}
                        </Button>
                      </div>
                    </div>
                    <form onSubmit={handleServiceSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="service-title">제목</Label>
                        <Input
                          id="service-title"
                          value={serviceTitle}
                          onChange={(event) => setServiceTitle(event.target.value)}
                          placeholder="서비스 제목"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-description">설명</Label>
                        <Textarea
                          id="service-description"
                          value={serviceDescription}
                          onChange={(event) => setServiceDescription(event.target.value)}
                          placeholder="서비스 설명"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-features">특징</Label>
                        <Textarea
                          id="service-features"
                          value={serviceFeatures}
                          onChange={(event) => setServiceFeatures(event.target.value)}
                          placeholder={'줄바꿈으로 특징을 구분해 주세요.\n예) 유지력 우수'}
                          rows={5}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>이미지 입력 방식</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button
                            type="button"
                            variant={serviceImageMode === 'url' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => {
                              setServiceImageMode('url');
                              setServiceImageFile(null);
                              setServiceImageInputKey((prev) => prev + 1);
                            }}
                          >
                            주소 입력
                          </Button>
                          <Button
                            type="button"
                            variant={serviceImageMode === 'file' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setServiceImageMode('file')}
                          >
                            파일 첨부
                          </Button>
                        </div>
                        {serviceImageMode === 'url' ? (
                          <div className="space-y-2">
                            <Label htmlFor="service-image-url">이미지 주소</Label>
                            <Input
                              id="service-image-url"
                              type="url"
                              value={serviceImageUrl}
                              onChange={(event) => setServiceImageUrl(event.target.value)}
                              placeholder="https://example.com/service.jpg"
                              required
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="service-image-file">이미지 파일</Label>
                            <Input
                              key={serviceImageInputKey}
                              id="service-image-file"
                              type="file"
                              accept="image/*"
                              onChange={handleServiceImageFileChange}
                              required
                            />
                          </div>
                        )}
                        {serviceImagePreviewUrl && (
                          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                              <img src={serviceImagePreviewUrl} alt="서비스 미리보기" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Label>노출여부</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button type="button" variant={serviceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setServiceVisible(true)}>O</Button>
                          <Button type="button" variant={!serviceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setServiceVisible(false)}>X</Button>
                        </div>
                      </div>
                      {serviceError && <Alert variant="destructive"><AlertDescription>{serviceError}</AlertDescription></Alert>}
                      {serviceSuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{serviceSuccess}</AlertDescription></Alert>}
                      <Button type="submit" disabled={serviceUploading} className="w-full">
                        {serviceUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />서비스 등록</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">등록된 서비스</CardTitle>
                    <CardDescription>서비스를 수정하거나 삭제할 수 있습니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingServices ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : services.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">등록된 서비스가 없습니다.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>이미지</TableHead>
                              <TableHead>제목</TableHead>
                              <TableHead className="hidden md:table-cell">설명</TableHead>
                              <TableHead className="hidden md:table-cell">특징</TableHead>
                              <TableHead className="w-[180px]">관리</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedServices.map((service) => (
                              <TableRow key={service.id} className={rowVisibilityClassName(service.visible)}>
                                <TableCell>
                                  <div className="h-16 w-20 overflow-hidden rounded-lg border border-border/60">
                                    <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{service.title}</TableCell>
                                <TableCell className="hidden max-w-xs whitespace-pre-line text-sm text-muted-foreground md:table-cell">{service.description}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    {service.features.map((feature) => (
                                      <li key={`${service.id}-${feature}`}>• {feature}</li>
                                    ))}
                                  </ul>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditServiceDialog(service)}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                                    <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={serviceDeletingId === service.id} onClick={() => void handleDeleteService(service)}>
                                      {serviceDeletingId === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {!loadingServices && services.length > 0 && (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          총 {services.length}건 중 {(servicesPage - 1) * SERVICES_PER_PAGE + 1}-
                          {Math.min(servicesPage * SERVICES_PER_PAGE, services.length)}건 표시
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={servicesPage === 1}
                            onClick={() => setServicesPage((prev) => Math.max(1, prev - 1))}
                          >
                            이전
                          </Button>
                          <span className="min-w-20 text-center text-sm text-muted-foreground">
                            {servicesPage} / {servicesTotalPages}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={servicesPage === servicesTotalPages}
                            onClick={() => setServicesPage((prev) => Math.min(servicesTotalPages, prev + 1))}
                          >
                            다음
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="prices" className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">가격표 설정</CardTitle>
                    <CardDescription>홈 가격 안내 섹션에 노출할 항목을 등록합니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">기본 priceItems 데이터 가져오기</p>
                          <p className="text-sm text-muted-foreground">`src/data/index.ts`의 `priceItems` 배열을 같은 `id`로 Firebase `priceItems` 컬렉션에 저장합니다.</p>
                        </div>
                        <Button type="button" variant="outline" disabled={priceImporting} onClick={() => void handleImportDefaultPrices()}>
                          {priceImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가져오는 중...</> : 'data/index.ts 가져오기'}
                        </Button>
                      </div>
                    </div>
                    <form onSubmit={handlePriceSubmit} className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="price-category">카테고리</Label><Input id="price-category" value={priceCategory} onChange={(event) => setPriceCategory(event.target.value)} placeholder="기본 케어" required /></div>
                        <div className="space-y-2"><Label htmlFor="price-name">항목명</Label><Input id="price-name" value={priceName} onChange={(event) => setPriceName(event.target.value)} placeholder="베이직 매니큐어" required /></div>
                        <div className="space-y-2"><Label htmlFor="price-value">가격</Label><Input id="price-value" value={priceValue} onChange={(event) => setPriceValue(event.target.value)} placeholder="30,000원" required /></div>
                        <div className="space-y-2"><Label htmlFor="price-duration">소요시간</Label><Input id="price-duration" value={priceDuration} onChange={(event) => setPriceDuration(event.target.value)} placeholder="40분" /></div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="price-description">설명</Label><Textarea id="price-description" value={priceDescription} onChange={(event) => setPriceDescription(event.target.value)} placeholder="서비스 설명" rows={4} /></div>
                      <div className="space-y-3">
                        <Label>노출여부</Label>
                        <div className="inline-flex rounded-xl border border-border/60 p-1">
                          <Button type="button" variant={priceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setPriceVisible(true)}>O</Button>
                          <Button type="button" variant={!priceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setPriceVisible(false)}>X</Button>
                        </div>
                      </div>
                      {priceError && <Alert variant="destructive"><AlertDescription>{priceError}</AlertDescription></Alert>}
                      {priceSuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{priceSuccess}</AlertDescription></Alert>}
                      <Button type="submit" disabled={priceUploading} className="w-full">{priceUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />가격표 등록</>}</Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">등록된 가격표</CardTitle>
                    <CardDescription>가격표를 수정하거나 삭제할 수 있습니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPrices ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : prices.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">등록된 가격표가 없습니다.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>카테고리</TableHead>
                              <TableHead>항목명</TableHead>
                              <TableHead className="hidden md:table-cell">가격</TableHead>
                              <TableHead className="hidden md:table-cell">소요시간</TableHead>
                              <TableHead className="hidden lg:table-cell">설명</TableHead>
                              <TableHead className="w-[180px]">관리</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {prices.map((item) => (
                              <TableRow key={item.id} className={rowVisibilityClassName(item.visible)}>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="hidden md:table-cell">{item.price}</TableCell>
                                <TableCell className="hidden md:table-cell">{item.duration || '-'}</TableCell>
                                <TableCell className="hidden max-w-xs whitespace-pre-line text-sm text-muted-foreground lg:table-cell">{item.description || '-'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditPriceDialog(item)}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                                    <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={priceDeletingId === item.id} onClick={() => void handleDeletePrice(item)}>
                                      {priceDeletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="reservations">
              <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-2xl">예약 현황</CardTitle><CardDescription>예약 내역을 확인하고 수정하거나 삭제할 수 있습니다.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                      <div className="space-y-2">
                        <Label htmlFor="reservation-search-start-date">검색 시작일자</Label>
                        <Input
                          id="reservation-search-start-date"
                          type="date"
                          value={reservationSearchStartDate}
                          onChange={(event) => setReservationSearchStartDate(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reservation-search-end-date">검색 종료일자</Label>
                        <Input
                          id="reservation-search-end-date"
                          type="date"
                          value={reservationSearchEndDate}
                          onChange={(event) => setReservationSearchEndDate(event.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setReservationSearchStartDate('');
                            setReservationSearchEndDate('');
                          }}
                        >
                          초기화
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => applyReservationRange('today')}>
                        당일
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyReservationRange('week')}>
                        1주일
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyReservationRange('month')}>
                        1달
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyReservationRange('year')}>
                        1년
                      </Button>
                    </div>
                  </div>

                  {reservationError && <Alert variant="destructive"><AlertDescription>{reservationError}</AlertDescription></Alert>}
                  {reservationMessage && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{reservationMessage}</AlertDescription></Alert>}
                  {loadingReservations ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filteredReservations.length === 0 ? <div className="py-12 text-center text-muted-foreground">검색 조건에 맞는 예약이 없습니다.</div> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>날짜</TableHead>
                          <TableHead>시간</TableHead>
                          <TableHead className="hidden md:table-cell">이름</TableHead>
                          <TableHead className="hidden md:table-cell">연락처</TableHead>
                          <TableHead className="w-[180px]">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReservations.map((reservation) => {
                          const reservationKey = `${reservation.date}_${reservation.time}`;
                          return (
                            <TableRow key={reservation.id} className="cursor-pointer" onClick={() => openReservationDetailDialog(reservation)}>
                              <TableCell>{reservation.date}</TableCell>
                              <TableCell>{reservation.time}</TableCell>
                              <TableCell className="hidden md:table-cell">{reservation.name}</TableCell>
                              <TableCell className="hidden md:table-cell">{reservation.phone}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={(event) => { event.stopPropagation(); openEditReservationDialog(reservation); }}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                                  <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={reservationDeletingKey === reservationKey} onClick={(event) => { event.stopPropagation(); void handleDeleteReservation(reservation); }}>{reservationDeletingKey === reservationKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                  {!loadingReservations && filteredReservations.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        총 {filteredReservations.length}건 중 {(reservationPage - 1) * RESERVATIONS_PER_PAGE + 1}-
                        {Math.min(reservationPage * RESERVATIONS_PER_PAGE, filteredReservations.length)}건 표시
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={reservationPage === 1}
                          onClick={() => setReservationPage((prev) => Math.max(1, prev - 1))}
                        >
                          이전
                        </Button>
                        <span className="min-w-20 text-center text-sm text-muted-foreground">
                          {reservationPage} / {reservationTotalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={reservationPage === reservationTotalPages}
                          onClick={() => setReservationPage((prev) => Math.min(reservationTotalPages, prev + 1))}
                        >
                          다음
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settlements" className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">정산 관리</CardTitle>
                  <CardDescription>예약별 정산 금액과 메모를 입력하고, 기간별 정산 현황을 함께 확인할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-2xl border border-border/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                      <div className="space-y-2">
                        <Label htmlFor="settlement-search-start-date">정산 시작일자</Label>
                        <Input
                          id="settlement-search-start-date"
                          type="date"
                          value={settlementSearchStartDate}
                          onChange={(event) => setSettlementSearchStartDate(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settlement-search-end-date">정산 종료일자</Label>
                        <Input
                          id="settlement-search-end-date"
                          type="date"
                          value={settlementSearchEndDate}
                          onChange={(event) => setSettlementSearchEndDate(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settlement-search-name">이름</Label>
                        <Input
                          id="settlement-search-name"
                          value={settlementSearchName}
                          onChange={(event) => setSettlementSearchName(event.target.value)}
                          placeholder="이름 검색"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settlement-search-phone">전화번호</Label>
                        <Input
                          id="settlement-search-phone"
                          value={settlementSearchPhone}
                          onChange={(event) => setSettlementSearchPhone(event.target.value.replace(/[^\d]/g, ''))}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="숫자만 입력"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSettlementSearchStartDate('');
                            setSettlementSearchEndDate('');
                            setSettlementSearchName('');
                            setSettlementSearchPhone('');
                          }}
                        >
                          초기화
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => applySettlementRange('today')}>
                        당일
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applySettlementRange('week')}>
                        1주일
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applySettlementRange('month')}>
                        1달
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applySettlementRange('year')}>
                        1년
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5">
                      <p className="text-sm text-muted-foreground">정산 기간</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{settlementDateRangeLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5">
                      <p className="text-sm text-muted-foreground">정산 완료 금액</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(settlementSummary.totalSettledAmount)}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        원가 {formatCurrency(settlementSummary.totalSettledSupplyAmount)} + 부가세 {formatCurrency(settlementSummary.totalSettledVatAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5">
                      <p className="text-sm text-muted-foreground">정산 완료 건수</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{settlementSummary.settledReservations}건</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5">
                      <p className="text-sm text-muted-foreground">총 예약 건수</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{settlementSummary.totalReservations}건</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5">
                      <p className="text-sm text-muted-foreground">일평균 예약</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{settlementSummary.averageReservationsPerDay.toFixed(1)}건</p>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-border/60 shadow-none">
                      <CardHeader>
                        <CardTitle className="text-xl">날짜별 정산 현황</CardTitle>
                        <CardDescription>선택한 기간 안에서 날짜별 예약 건수를 집계합니다.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingReservations ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : settlementSummary.dailyItems.length === 0 ? (
                          <div className="py-12 text-center text-muted-foreground">정산할 예약 데이터가 없습니다.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>날짜</TableHead>
                                <TableHead className="text-right">예약 건수</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {settlementSummary.dailyItems.map((item) => (
                                <TableRow key={item.date}>
                                  <TableCell>{item.date}</TableCell>
                                  <TableCell className="text-right font-medium">{item.count}건</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <Card className="border-border/60 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-xl">서비스별 비중</CardTitle>
                          <CardDescription>예약 시 선택한 서비스명을 기준으로 집계합니다.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {loadingReservations ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : settlementSummary.serviceItems.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">표시할 서비스 집계가 없습니다.</div>
                          ) : (
                            <div className="space-y-3">
                              {settlementSummary.serviceItems.map((item) => {
                                const ratio = settlementSummary.totalReservations > 0
                                  ? (item.count / settlementSummary.totalReservations) * 100
                                  : 0;

                                return (
                                  <div key={item.serviceName} className="space-y-2 rounded-2xl border border-border/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="font-medium text-foreground">{item.serviceName}</p>
                                      <p className="text-sm text-muted-foreground">{item.count}건</p>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(ratio, 4)}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{ratio.toFixed(1)}%</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-border/60 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-xl">정산 메모</CardTitle>
                          <CardDescription>현재 예약 데이터에 저장된 범위 기준으로 안내합니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          <p>최근 예약일: <span className="font-medium text-foreground">{settlementSummary.latestReservationDate}</span></p>
                          <p>가장 많은 서비스: <span className="font-medium text-foreground">{settlementSummary.topServiceName}</span></p>
                          <p>정산 완료 금액은 원가와 부가세를 합친 총액 기준으로 표시됩니다.</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Card className="border-border/60 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-xl">정산 입력 대상 예약 목록</CardTitle>
                      <CardDescription>각 예약 건에서 정산 입력 버튼을 눌러 금액과 메모를 저장합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {reservationError && <Alert variant="destructive"><AlertDescription>{reservationError}</AlertDescription></Alert>}
                      {reservationMessage && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{reservationMessage}</AlertDescription></Alert>}
                      {loadingReservations ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : filteredSettlementReservations.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">선택한 기간에 해당하는 예약이 없습니다.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>날짜</TableHead>
                              <TableHead>시간</TableHead>
                              <TableHead className="hidden md:table-cell">예약자</TableHead>
                              <TableHead className="hidden md:table-cell">서비스</TableHead>
                              <TableHead className="hidden md:table-cell">정산금액</TableHead>
                              <TableHead className="hidden lg:table-cell">정산메모</TableHead>
                              <TableHead className="hidden md:table-cell">연락처</TableHead>
                              <TableHead className="w-[140px]">관리</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSettlementReservations.map((reservation) => (
                              <TableRow key={reservation.id}>
                                <TableCell>{reservation.date}</TableCell>
                                <TableCell>{reservation.time}</TableCell>
                                <TableCell className="hidden md:table-cell">{reservation.name}</TableCell>
                                <TableCell className="hidden md:table-cell">{reservation.serviceName?.trim() || '미지정'}</TableCell>
                                <TableCell className="hidden md:table-cell">{reservation.settlementAmount?.trim() || '-'}</TableCell>
                                <TableCell className="hidden max-w-xs whitespace-pre-line text-sm text-muted-foreground lg:table-cell">{reservation.settlementMemo?.trim() || '-'}</TableCell>
                                <TableCell className="hidden md:table-cell">{reservation.phone}</TableCell>
                                <TableCell>
                                  <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditSettlementDialog(reservation)}>
                                    <Pencil className="mr-1 h-4 w-4" />
                                    정산 입력
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-2xl">사이트 정보 및 영업시간 설정</CardTitle><CardDescription>영업시간, 휴무일, 주소와 연락처 정보를 관리합니다.</CardDescription></CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3"><Label htmlFor="address-line-1">주소</Label><Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => setAddressSearchOpen(true)}><Search className="mr-2 h-4 w-4" />주소 검색</Button></div>
                      <Input id="address-line-1" value={settings.addressLine1} onChange={(event) => setSettings((prev) => ({ ...prev, addressLine1: event.target.value }))} placeholder="서울 강남구 테헤란로 123" />
                    </div>
                    <div className="space-y-2"><Label htmlFor="address-line-2">상세주소</Label><Input id="address-line-2" value={settings.addressLine2} onChange={(event) => setSettings((prev) => ({ ...prev, addressLine2: event.target.value }))} placeholder="네일아트 빌딩 2층" /></div>
                    <div className="space-y-2"><Label htmlFor="map-query">지도 검색어</Label><Input id="map-query" value={settings.mapQuery} onChange={(event) => setSettings((prev) => ({ ...prev, mapQuery: event.target.value }))} placeholder="지도에 표시할 검색어" /></div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="phone">전화번호</Label><Input id="phone" value={settings.phone} onChange={(event) => setSettings((prev) => ({ ...prev, phone: event.target.value }))} placeholder="02-1234-5678" /></div>
                      <div className="space-y-2"><Label htmlFor="email">이메일</Label><Input id="email" type="email" value={settings.email} onChange={(event) => setSettings((prev) => ({ ...prev, email: event.target.value }))} placeholder="contact@nailart.com" /></div>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-3 rounded-2xl border border-border/60 p-4"><Label>평일 영업시간</Label><div className="grid grid-cols-2 gap-3"><Input value={settings.weekdayHours.startHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'startHour', event.target.value) }))} placeholder="시작 시" /><Input value={settings.weekdayHours.startMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'startMinute', event.target.value) }))} placeholder="시작 분" /><Input value={settings.weekdayHours.endHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'endHour', event.target.value) }))} placeholder="종료 시" /><Input value={settings.weekdayHours.endMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'endMinute', event.target.value) }))} placeholder="종료 분" /></div></div>
                      <div className="space-y-3 rounded-2xl border border-border/60 p-4"><Label>주말 영업시간</Label><div className="grid grid-cols-2 gap-3"><Input value={settings.weekendHours.startHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'startHour', event.target.value) }))} placeholder="시작 시" /><Input value={settings.weekendHours.startMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'startMinute', event.target.value) }))} placeholder="시작 분" /><Input value={settings.weekendHours.endHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'endHour', event.target.value) }))} placeholder="종료 시" /><Input value={settings.weekendHours.endMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'endMinute', event.target.value) }))} placeholder="종료 분" /></div></div>
                    </div>
                    <div className="space-y-3"><Label>휴무일</Label><div className="flex flex-wrap gap-2">{WEEKDAYS.map((day) => { const active = settings.closedDays.includes(day); return <Button key={day} type="button" variant={active ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleToggleClosedDay(day)}>{day}</Button>; })}</div></div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="instagram-url">인스타그램 주소</Label><Input id="instagram-url" value={settings.instagramUrl} onChange={(event) => setSettings((prev) => ({ ...prev, instagramUrl: event.target.value }))} placeholder="https://instagram.com/..." /></div>
                      <div className="space-y-2"><Label htmlFor="tiktok-url">틱톡 주소</Label><Input id="tiktok-url" value={settings.tiktokUrl} onChange={(event) => setSettings((prev) => ({ ...prev, tiktokUrl: event.target.value }))} placeholder="https://www.tiktok.com/..." /></div>
                      <div className="space-y-2"><Label htmlFor="facebook-url">페이스북 주소</Label><Input id="facebook-url" value={settings.facebookUrl} onChange={(event) => setSettings((prev) => ({ ...prev, facebookUrl: event.target.value }))} placeholder="https://facebook.com/..." /></div>
                      <div className="space-y-2"><Label htmlFor="kakao-open-chat-url">카카오톡 오픈채팅방 주소</Label><Input id="kakao-open-chat-url" value={settings.kakaoOpenChatUrl} onChange={(event) => setSettings((prev) => ({ ...prev, kakaoOpenChatUrl: event.target.value }))} placeholder="https://open.kakao.com/..." /></div>
                      <div className="space-y-2"><Label htmlFor="x-url">X 주소</Label><Input id="x-url" value={settings.xUrl} onChange={(event) => setSettings((prev) => ({ ...prev, xUrl: event.target.value }))} placeholder="https://x.com/..." /></div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-border/50"><div className="border-b px-4 py-3 text-sm font-medium text-foreground">지도 미리보기</div><iframe title="주소 미리보기" src={getMapEmbedUrl(settings.mapQuery || settings.addressLine1)} className="h-80 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
                    {settingsError && <Alert variant="destructive"><AlertDescription>{settingsError}</AlertDescription></Alert>}
                    {settingsMessage && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{settingsMessage}</AlertDescription></Alert>}
                    <Button type="submit" disabled={settingsSaving} className="w-full sm:w-auto">{settingsSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : <><MapPinned className="mr-2 h-4 w-4" />설정 저장</>}</Button>
                  </form>

                  <div className="mt-8 border-t border-border/60 pt-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground">관리자 비밀번호 변경</h3>
                      <p className="text-sm text-muted-foreground">비밀번호는 해시 처리되어 `settings/admin` 문서의 `pwd` 필드에 저장됩니다.</p>
                    </div>
                    <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="current-admin-password">현재 비밀번호</Label>
                          <Input id="current-admin-password" type="password" value={currentAdminPassword} onChange={(event) => setCurrentAdminPassword(event.target.value)} autoComplete="current-password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="next-admin-password">새 비밀번호</Label>
                          <Input id="next-admin-password" type="password" value={nextAdminPassword} onChange={(event) => setNextAdminPassword(event.target.value)} autoComplete="new-password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-admin-password">새 비밀번호 확인</Label>
                          <Input id="confirm-admin-password" type="password" value={confirmAdminPassword} onChange={(event) => setConfirmAdminPassword(event.target.value)} autoComplete="new-password" />
                        </div>
                      </div>
                      {passwordError && <Alert variant="destructive"><AlertDescription>{passwordError}</AlertDescription></Alert>}
                      {passwordMessage && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{passwordMessage}</AlertDescription></Alert>}
                      <Button type="submit" disabled={passwordSaving} className="w-full sm:w-auto">
                        {passwordSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />변경 중...</> : '비밀번호 변경'}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={addressSearchOpen} onOpenChange={setAddressSearchOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl">
          <DialogHeader><DialogTitle>주소 검색</DialogTitle><DialogDescription>주소 또는 장소명을 입력한 뒤 지도를 확인하고 적용할 수 있습니다.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="address-search">검색어</Label><Input id="address-search" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="서울 강남구 테헤란로 123" /></div>
            <div className="overflow-hidden rounded-2xl border border-border/50"><iframe title="주소 검색 미리보기" src={previewMapUrl} className="h-[420px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" className="cursor-pointer" onClick={() => setAddressSearchOpen(false)}>취소</Button><Button type="button" className="cursor-pointer" onClick={applySearchAddress}>이 주소 사용</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editVideoOpen} onOpenChange={setEditVideoOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-xl sm:w-[calc(100vw-3rem)]">
          <DialogHeader><DialogTitle>동영상 수정</DialogTitle><DialogDescription>동영상 정보와 노출여부를 수정할 수 있습니다.</DialogDescription></DialogHeader>
          <form onSubmit={handleUpdateVideo} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="edit-video-title">제목</Label><Input id="edit-video-title" value={editVideo.title} onChange={(event) => setEditVideo((prev) => ({ ...prev, title: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="edit-video-description">설명</Label><Textarea id="edit-video-description" value={editVideo.description} onChange={(event) => setEditVideo((prev) => ({ ...prev, description: event.target.value }))} rows={4} /></div>
            <div className="space-y-2"><Label htmlFor="edit-video-url">동영상 주소</Label><Input id="edit-video-url" type="url" value={editVideo.url} onChange={(event) => setEditVideo((prev) => ({ ...prev, url: event.target.value }))} /></div>
            <div className="space-y-3">
              <Label>노출여부</Label>
              <div className="inline-flex rounded-xl border border-border/60 p-1">
                <Button type="button" variant={editVideo.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditVideo((prev) => ({ ...prev, visible: true }))}>O</Button>
                <Button type="button" variant={!editVideo.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditVideo((prev) => ({ ...prev, visible: false }))}>X</Button>
              </div>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditVideoOpen(false)}>취소</Button><Button type="submit" disabled={videoSaving}>{videoSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editImageOpen} onOpenChange={setEditImageOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
          <div className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader><DialogTitle>이미지 수정</DialogTitle><DialogDescription>이미지 정보와 노출여부를 수정할 수 있습니다.</DialogDescription></DialogHeader>
          </div>
          <form onSubmit={handleUpdateImage} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-2"><Label htmlFor="edit-image-title">제목</Label><Input id="edit-image-title" value={editImage.title} onChange={(event) => setEditImage((prev) => ({ ...prev, title: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="edit-image-description">설명</Label><Textarea id="edit-image-description" value={editImage.description} onChange={(event) => setEditImage((prev) => ({ ...prev, description: event.target.value }))} rows={4} /></div>
              <div className="space-y-2">
                <Label>카테고리 선택</Label>
                <Select value={editImage.categoryId} onValueChange={(value) => setEditImage((prev) => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택해 주세요." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((category) => category.visible !== false).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>이미지 입력 방식</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button
                    type="button"
                    variant={editImage.imageMode === 'url' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      setEditImage((prev) => ({ ...prev, imageMode: 'url' }));
                      setEditImageFile(null);
                      setEditImageInputKey((prev) => prev + 1);
                    }}
                  >
                    주소 입력
                  </Button>
                  <Button
                    type="button"
                    variant={editImage.imageMode === 'file' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setEditImage((prev) => ({ ...prev, imageMode: 'file' }))}
                  >
                    파일 첨부
                  </Button>
                </div>
                {editImage.imageMode === 'url' ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-image-url">이미지 주소</Label>
                    <Input
                      id="edit-image-url"
                      value={editImage.url}
                      onChange={(event) => setEditImage((prev) => ({ ...prev, url: event.target.value }))}
                      placeholder="https://example.com/gallery.jpg"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-image-file">이미지 파일</Label>
                    <Input
                      key={editImageInputKey}
                      id="edit-image-file"
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageFileChange}
                    />
                    <p className="text-sm text-muted-foreground">파일 첨부 모드에서는 새 이미지를 선택해야 합니다.</p>
                  </div>
                )}
                {editImagePreviewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                      <img src={editImagePreviewUrl} alt="이미지 수정 미리보기" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label>노출여부</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button type="button" variant={editImage.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditImage((prev) => ({ ...prev, visible: true }))}>O</Button>
                  <Button type="button" variant={!editImage.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditImage((prev) => ({ ...prev, visible: false }))}>X</Button>
                </div>
              </div>
              {imageError && <Alert variant="destructive"><AlertDescription>{imageError}</AlertDescription></Alert>}
            </div>
            <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditImageOpen(false)}>취소</Button>
                <Button type="submit" disabled={imageSaving}>{imageSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
          <div className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader><DialogTitle>이벤트 수정</DialogTitle><DialogDescription>이벤트 내용, 기간, 배경 이미지를 수정할 수 있습니다.</DialogDescription></DialogHeader>
          </div>
          <form onSubmit={handleUpdateEvent} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-2"><Label htmlFor="edit-event-title">이벤트 제목</Label><Input id="edit-event-title" value={editEvent.title} onChange={(event) => setEditEvent((prev) => ({ ...prev, title: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="edit-event-content">이벤트 내용</Label><Textarea id="edit-event-content" value={editEvent.content} onChange={(event) => setEditEvent((prev) => ({ ...prev, content: event.target.value }))} rows={5} /></div>
              <div className="space-y-3">
                <Label>이미지 입력 방식</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button
                    type="button"
                    variant={editEvent.imageMode === 'url' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      setEditEvent((prev) => ({ ...prev, imageMode: 'url' }));
                      setEditEventFile(null);
                      setEditEventInputKey((prev) => prev + 1);
                    }}
                  >
                    주소 입력
                  </Button>
                  <Button
                    type="button"
                    variant={editEvent.imageMode === 'file' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setEditEvent((prev) => ({ ...prev, imageMode: 'file' }))}
                  >
                    파일 첨부
                  </Button>
                </div>
                {editEvent.imageMode === 'url' ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-event-image">배경 이미지 주소</Label>
                    <Input id="edit-event-image" value={editEvent.image} onChange={(event) => setEditEvent((prev) => ({ ...prev, image: event.target.value }))} placeholder="비워두면 기본 이미지를 사용합니다." />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-event-image-file">이미지 파일</Label>
                    <Input
                      key={editEventInputKey}
                      id="edit-event-image-file"
                      type="file"
                      accept="image/*"
                      onChange={handleEditEventImageFileChange}
                    />
                    <p className="text-sm text-muted-foreground">파일 첨부 모드에서는 새 이미지를 선택해야 합니다.</p>
                  </div>
                )}
                {editEventPreviewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                      <img src={editEventPreviewUrl} alt="이벤트 수정 미리보기" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="edit-event-start-date">시작일자</Label><Input id="edit-event-start-date" type="date" value={editEvent.startDate} onChange={(event) => setEditEvent((prev) => ({ ...prev, startDate: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="edit-event-end-date">종료일자</Label><Input id="edit-event-end-date" type="date" value={editEvent.endDate} onChange={(event) => setEditEvent((prev) => ({ ...prev, endDate: event.target.value }))} /></div>
              </div>
              <div className="space-y-3">
                <Label>노출여부</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button type="button" variant={editEvent.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditEvent((prev) => ({ ...prev, visible: true }))}>O</Button>
                  <Button type="button" variant={!editEvent.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditEvent((prev) => ({ ...prev, visible: false }))}>X</Button>
                </div>
              </div>
              {eventError && <Alert variant="destructive"><AlertDescription>{eventError}</AlertDescription></Alert>}
            </div>
            <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditEventOpen(false)}>취소</Button>
                <Button type="submit" disabled={eventSaving}>{eventSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
          <div className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader><DialogTitle>카테고리 수정</DialogTitle><DialogDescription>카테고리명과 설명, 노출여부를 수정할 수 있습니다.</DialogDescription></DialogHeader>
          </div>
          <form onSubmit={handleUpdateCategory} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-2"><Label htmlFor="edit-category-name">카테고리명</Label><Input id="edit-category-name" value={editCategory.name} onChange={(event) => setEditCategory((prev) => ({ ...prev, name: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="edit-category-description">설명</Label><Textarea id="edit-category-description" value={editCategory.description} onChange={(event) => setEditCategory((prev) => ({ ...prev, description: event.target.value }))} rows={4} /></div>
              <div className="space-y-3">
                <Label>이미지 입력 방식</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button
                    type="button"
                    variant={editCategory.imageMode === 'url' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      setEditCategory((prev) => ({ ...prev, imageMode: 'url' }));
                      setEditCategoryFile(null);
                      setEditCategoryInputKey((prev) => prev + 1);
                    }}
                  >
                    주소 입력
                  </Button>
                  <Button
                    type="button"
                    variant={editCategory.imageMode === 'file' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setEditCategory((prev) => ({ ...prev, imageMode: 'file' }))}
                  >
                    파일 첨부
                  </Button>
                </div>
                {editCategory.imageMode === 'url' ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-category-image">대표 이미지 주소</Label>
                    <Input id="edit-category-image" value={editCategory.image} onChange={(event) => setEditCategory((prev) => ({ ...prev, image: event.target.value }))} placeholder="https://example.com/category.jpg" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-category-image-file">대표 이미지 파일</Label>
                    <Input
                      key={editCategoryInputKey}
                      id="edit-category-image-file"
                      type="file"
                      accept="image/*"
                      onChange={handleEditCategoryImageFileChange}
                    />
                    <p className="text-sm text-muted-foreground">파일 첨부 모드에서는 새 이미지를 선택해야 합니다.</p>
                  </div>
                )}
                {editCategoryPreviewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                      <img src={editCategoryPreviewUrl} alt="카테고리 수정 미리보기" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label>노출여부</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button type="button" variant={editCategory.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditCategory((prev) => ({ ...prev, visible: true }))}>O</Button>
                  <Button type="button" variant={!editCategory.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditCategory((prev) => ({ ...prev, visible: false }))}>X</Button>
                </div>
              </div>
              {categoryError && <Alert variant="destructive"><AlertDescription>{categoryError}</AlertDescription></Alert>}
            </div>
            <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditCategoryOpen(false)}>취소</Button>
                <Button type="submit" disabled={categorySaving}>{categorySaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editServiceOpen} onOpenChange={setEditServiceOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
          <div className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader><DialogTitle>서비스 수정</DialogTitle><DialogDescription>서비스 정보와 이미지를 수정할 수 있습니다.</DialogDescription></DialogHeader>
          </div>
          <form onSubmit={handleUpdateService} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="edit-service-title">제목</Label>
                <Input id="edit-service-title" value={editService.title} onChange={(event) => setEditService((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-service-description">설명</Label>
                <Textarea id="edit-service-description" value={editService.description} onChange={(event) => setEditService((prev) => ({ ...prev, description: event.target.value }))} rows={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-service-features">특징</Label>
                <Textarea id="edit-service-features" value={editService.features} onChange={(event) => setEditService((prev) => ({ ...prev, features: event.target.value }))} rows={6} />
              </div>
              <div className="space-y-3">
                <Label>이미지 입력 방식</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button
                    type="button"
                    variant={editService.imageMode === 'url' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      setEditService((prev) => ({ ...prev, imageMode: 'url' }));
                      setEditServiceFile(null);
                      setEditServiceInputKey((prev) => prev + 1);
                    }}
                  >
                    주소 입력
                  </Button>
                  <Button
                    type="button"
                    variant={editService.imageMode === 'file' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setEditService((prev) => ({ ...prev, imageMode: 'file' }))}
                  >
                    파일 첨부
                  </Button>
                </div>
                {editService.imageMode === 'url' ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-service-image-url">이미지 주소</Label>
                    <Input
                      id="edit-service-image-url"
                      type="text"
                      value={editService.image}
                      onChange={(event) => setEditService((prev) => ({ ...prev, image: event.target.value }))}
                      placeholder="https://example.com/service.jpg"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-service-image-file">이미지 파일</Label>
                    <Input
                      key={editServiceInputKey}
                      id="edit-service-image-file"
                      type="file"
                      accept="image/*"
                      onChange={handleEditServiceImageFileChange}
                    />
                    <p className="text-sm text-muted-foreground">파일 첨부 모드에서는 새 이미지를 선택해야 합니다.</p>
                  </div>
                )}
                {editServicePreviewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                      <img src={editServicePreviewUrl} alt="서비스 수정 미리보기" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label>노출여부</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button type="button" variant={editService.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditService((prev) => ({ ...prev, visible: true }))}>O</Button>
                  <Button type="button" variant={!editService.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditService((prev) => ({ ...prev, visible: false }))}>X</Button>
                </div>
              </div>
              {serviceError && <Alert variant="destructive"><AlertDescription>{serviceError}</AlertDescription></Alert>}
            </div>
            <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditServiceOpen(false)}>취소</Button>
                <Button type="submit" disabled={serviceSaving}>{serviceSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editPriceOpen} onOpenChange={setEditPriceOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
          <div className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader><DialogTitle>가격표 수정</DialogTitle><DialogDescription>가격표 항목 정보를 수정할 수 있습니다.</DialogDescription></DialogHeader>
          </div>
          <form onSubmit={handleUpdatePrice} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="edit-price-category">카테고리</Label><Input id="edit-price-category" value={editPrice.category} onChange={(event) => setEditPrice((prev) => ({ ...prev, category: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="edit-price-name">항목명</Label><Input id="edit-price-name" value={editPrice.name} onChange={(event) => setEditPrice((prev) => ({ ...prev, name: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="edit-price-value">가격</Label><Input id="edit-price-value" value={editPrice.price} onChange={(event) => setEditPrice((prev) => ({ ...prev, price: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="edit-price-duration">소요시간</Label><Input id="edit-price-duration" value={editPrice.duration} onChange={(event) => setEditPrice((prev) => ({ ...prev, duration: event.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="edit-price-description">설명</Label><Textarea id="edit-price-description" value={editPrice.description} onChange={(event) => setEditPrice((prev) => ({ ...prev, description: event.target.value }))} rows={5} /></div>
              <div className="space-y-3">
                <Label>노출여부</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button type="button" variant={editPrice.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditPrice((prev) => ({ ...prev, visible: true }))}>O</Button>
                  <Button type="button" variant={!editPrice.visible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setEditPrice((prev) => ({ ...prev, visible: false }))}>X</Button>
                </div>
              </div>
              {priceError && <Alert variant="destructive"><AlertDescription>{priceError}</AlertDescription></Alert>}
            </div>
            <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditPriceOpen(false)}>취소</Button>
                <Button type="submit" disabled={priceSaving}>{priceSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reservationDetailOpen} onOpenChange={setReservationDetailOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
          <DialogHeader className="shrink-0 px-4 pb-4 pt-6 sm:px-6">
            <DialogTitle>예약 상세</DialogTitle>
            <DialogDescription>선택한 예약의 상세 정보를 확인할 수 있습니다.</DialogDescription>
          </DialogHeader>
          {selectedReservation ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-sm text-muted-foreground">날짜</p>
                      <p className="mt-1 font-medium text-foreground">{selectedReservation.date}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-sm text-muted-foreground">시간</p>
                      <p className="mt-1 font-medium text-foreground">{selectedReservation.time}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-sm text-muted-foreground">이름</p>
                      <p className="mt-1 font-medium text-foreground">{selectedReservation.name}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-sm text-muted-foreground">연락처</p>
                      <p className="mt-1 font-medium text-foreground">{selectedReservation.phone}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 p-4">
                    <p className="text-sm text-muted-foreground">상태</p>
                    <p className="mt-1 font-medium text-foreground">확정</p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => { setReservationDetailOpen(false); openEditReservationDialog(selectedReservation); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                  <Button type="button" onClick={() => setReservationDetailOpen(false)}>
                    닫기
                  </Button>
                </div>
              </div>
            </>
            
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editReservationOpen} onOpenChange={setEditReservationOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg">
          <DialogHeader><DialogTitle>예약 수정</DialogTitle><DialogDescription>날짜, 시간, 이름, 연락처를 수정할 수 있습니다.</DialogDescription></DialogHeader>
          <form onSubmit={handleUpdateReservation} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="edit-reservation-date">날짜</Label><Input id="edit-reservation-date" type="date" value={editReservation.date} onChange={(event) => setEditReservation((prev) => ({ ...prev, date: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="edit-reservation-time">시간</Label><Input id="edit-reservation-time" type="time" value={editReservation.time} onChange={(event) => setEditReservation((prev) => ({ ...prev, time: event.target.value }))} step={3600} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="edit-reservation-name">이름</Label><Input id="edit-reservation-name" value={editReservation.name} onChange={(event) => setEditReservation((prev) => ({ ...prev, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="edit-reservation-phone">연락처</Label><Input id="edit-reservation-phone" value={editReservation.phone} onChange={(event) => setEditReservation((prev) => ({ ...prev, phone: event.target.value }))} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditReservationOpen(false)}>취소</Button><Button type="submit" disabled={reservationSaving}>{reservationSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editSettlementOpen} onOpenChange={setEditSettlementOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
          <div className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader>
              <DialogTitle>정산 입력</DialogTitle>
              <DialogDescription>예약별 정산 금액과 메모를 저장할 수 있습니다.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleUpdateReservationSettlement} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settlement-date">날짜</Label>
                  <Input id="settlement-date" value={editSettlement.date} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settlement-time">시간</Label>
                  <Input id="settlement-time" value={editSettlement.time} disabled />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settlement-customer-name">예약자</Label>
                  <Input id="settlement-customer-name" value={editSettlement.customerName} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settlement-service-name">서비스</Label>
                  <Input id="settlement-service-name" value={editSettlement.serviceName} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settlement-amount">정산 금액</Label>
                <Input
                  id="settlement-amount"
                  value={editSettlement.settlementAmount}
                  onChange={(event) => setEditSettlement((prev) => ({ ...prev, settlementAmount: event.target.value.replace(/[^\d]/g, '') }))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="예: 50000"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">입력 금액</p>
                  <p className="mt-2 font-semibold text-foreground">{formatCurrency(editSettlementBreakdown.total)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">원가</p>
                  <p className="mt-2 font-semibold text-foreground">{formatCurrency(editSettlementBreakdown.supply)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">부가세</p>
                  <p className="mt-2 font-semibold text-foreground">{formatCurrency(editSettlementBreakdown.vat)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settlement-memo">정산 메모</Label>
                <Textarea
                  id="settlement-memo"
                  value={editSettlement.settlementMemo}
                  onChange={(event) => setEditSettlement((prev) => ({ ...prev, settlementMemo: event.target.value }))}
                  rows={4}
                  placeholder="결제수단, 추가 메모 등을 입력해 주세요."
                />
              </div>
            </div>
            <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditSettlementOpen(false)}>취소</Button>
                <Button type="submit" disabled={settlementSaving}>
                  {settlementSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
