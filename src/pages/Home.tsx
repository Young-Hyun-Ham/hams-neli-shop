import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { SiFacebook, SiInstagram, SiKakao, SiTiktok, SiX } from 'react-icons/si';
import { IMAGES } from '@/assets/images';
import { PriceCard, ServiceCard, TestimonialCard } from '@/components/Cards';
import { TestimonialDetailDialog } from '@/components/TestimonialDetailDialog';
import { ReservationDialog } from '@/components/ReservationDialog';
import { HOME_LOGO_TITLE, Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { priceItems as fallbackPrices, services as fallbackServices, testimonials } from '@/data/index';
import {
  DEFAULT_SITE_SETTINGS,
  ROUTE_PATHS,
  type EventItem,
  type SiteSettings,
  type Testimonial,
} from '@/lib/index';
import { DEFAULT_EVENT_ITEMS, eventStorage, isEventActive } from '@/lib/eventStorage';
import type { PriceItem, Service } from '@/lib/index';
import { priceStorage } from '@/lib/priceStorage';
import { serviceStorage } from '@/lib/serviceStorage';
import { settingsStorage } from '@/lib/settingsStorage';
import { testimonialStorage } from '@/lib/testimonialStorage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useAuthStore } from '@/lib/auth-store';

const PENDING_SCROLL_KEY = 'pending-home-scroll-target';
const SERVICES_CACHE_KEY = 'home-services-cache';
const PRICES_CACHE_KEY = 'home-prices-cache';
const EVENT_MODAL_DISMISS_PREFIX = 'dismissed-home-event-until:';
const EVENT_MODAL_DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;
const hasVisibleSocialLink = (value: string) => value.trim().length > 0;

const getMapEmbedUrl = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

const formatTimeRange = (
  label: string,
  startHour: string,
  startMinute: string,
  endHour: string,
  endMinute: string,
) => `${label} ${startHour}:${startMinute} - ${endHour}:${endMinute}`;

const readCachedServices = (): Service[] => {
  if (typeof window === 'undefined') {
    return fallbackServices;
  }

  try {
    const raw = window.localStorage.getItem(SERVICES_CACHE_KEY);
    if (!raw) {
      return fallbackServices;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return fallbackServices;
    }

    const items = parsed.filter(
      (item): item is Service =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.description === 'string' &&
        typeof item.image === 'string' &&
        Array.isArray(item.features),
    );

    return items.length > 0 ? items : fallbackServices;
  } catch {
    return fallbackServices;
  }
};

const persistServices = (items: Service[]) => {
  if (typeof window === 'undefined' || items.length === 0) {
    return;
  }

  window.localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(items));
};

const readCachedPrices = (): PriceItem[] => {
  if (typeof window === 'undefined') {
    return fallbackPrices;
  }

  try {
    const raw = window.localStorage.getItem(PRICES_CACHE_KEY);
    if (!raw) {
      return fallbackPrices;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return fallbackPrices;
    }

    const items = parsed.filter(
      (item): item is PriceItem =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.category === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'string',
    );

    return items.length > 0 ? items : fallbackPrices;
  } catch {
    return fallbackPrices;
  }
};

const persistPrices = (items: PriceItem[]) => {
  if (typeof window === 'undefined' || items.length === 0) {
    return;
  }

  window.localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify(items));
};

export default function Home() {
  const viewer = useAuthStore((state) => state.viewer);
  console.log("home login data ==========>", viewer)
  const [serviceItems, setServiceItems] = useState<Service[]>(readCachedServices);
  const [priceList, setPriceList] = useState<PriceItem[]>(readCachedPrices);
  const [testimonialItems, setTestimonialItems] = useState<Testimonial[]>(testimonials);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENT_ITEMS);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const visibleTestimonials = testimonialItems.slice(0, 9);
  const mapEmbedUrl = useMemo(() => getMapEmbedUrl(siteSettings.mapQuery), [siteSettings.mapQuery]);
  const activeEvent = useMemo(
    () => events.find((event) => isEventActive(event)),
    [events],
  );

  const businessHoursLines = useMemo(
    () => [
      formatTimeRange(
        '평일',
        siteSettings.weekdayHours.startHour,
        siteSettings.weekdayHours.startMinute,
        siteSettings.weekdayHours.endHour,
        siteSettings.weekdayHours.endMinute,
      ),
      formatTimeRange(
        '주말',
        siteSettings.weekendHours.startHour,
        siteSettings.weekendHours.startMinute,
        siteSettings.weekendHours.endHour,
        siteSettings.weekendHours.endMinute,
      ),
      `휴무일 ${siteSettings.closedDays.join(', ') || '없음'}`,
    ],
    [siteSettings],
  );

  const socialLinks = useMemo(
    () =>
      [
        { href: siteSettings.facebookUrl, label: '페이스북', icon: SiFacebook },
        { href: siteSettings.instagramUrl, label: '인스타그램', icon: SiInstagram },
        { href: siteSettings.tiktokUrl, label: '틱톡', icon: SiTiktok },
        { href: siteSettings.xUrl, label: 'X', icon: SiX },
        { href: siteSettings.kakaoOpenChatUrl, label: '카카오톡 오픈방', icon: SiKakao },
      ].filter(({ href }) => hasVisibleSocialLink(href)),
    [siteSettings],
  );

  const syncServices = async (cancelledRef?: { current: boolean }) => {
    try {
      const data = await serviceStorage.getServices();
      if (!cancelledRef?.current) {
        const nextItems = data.length > 0 ? data : readCachedServices();
        persistServices(nextItems);
        setServiceItems(nextItems);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      if (!cancelledRef?.current) {
        setServiceItems(readCachedServices());
      }
    }
  };

  const syncPrices = async (cancelledRef?: { current: boolean }) => {
    try {
      const data = await priceStorage.getPrices();
      if (!cancelledRef?.current) {
        const nextItems = data.length > 0 ? data : readCachedPrices();
        persistPrices(nextItems);
        setPriceList(nextItems);
      }
    } catch (error) {
      console.error('Failed to load prices:', error);
      if (!cancelledRef?.current) {
        setPriceList(readCachedPrices());
      }
    }
  };

  useEffect(() => {
    const targetId = sessionStorage.getItem(PENDING_SCROLL_KEY);
    if (!targetId) {
      return;
    }

    sessionStorage.removeItem(PENDING_SCROLL_KEY);

    let attempts = 0;

    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      attempts += 1;
      if (attempts < 8) {
        window.setTimeout(scrollToTarget, 80);
      }
    };

    window.setTimeout(scrollToTarget, 120);
  }, []);

  useEffect(() => {
    let unsubscribeServices = () => {};
    let unsubscribePrices = () => {};
    let unsubscribeTestimonials = () => {};
    let unsubscribeSettings = () => {};
    let unsubscribeEvents = () => {};
    const cancelledRef = { current: false };

    void syncServices(cancelledRef);
    void syncPrices(cancelledRef);

    try {
      unsubscribeServices = serviceStorage.subscribeServices(
        (data) => {
          if (!cancelledRef.current) {
            const nextItems = data.length > 0 ? data : readCachedServices();
            persistServices(nextItems);
            setServiceItems(nextItems);
          }
        },
        (error) => {
          console.error('Failed to subscribe services:', error);
          if (!cancelledRef.current) {
            setServiceItems(readCachedServices());
          }
        },
      );
    } catch (error) {
      console.error('Failed to initialize service subscription:', error);
      if (!cancelledRef.current) {
        setServiceItems(readCachedServices());
      }
    }

    try {
      unsubscribePrices = priceStorage.subscribePrices(
        (data) => {
          if (!cancelledRef.current) {
            const nextItems = data.length > 0 ? data : readCachedPrices();
            persistPrices(nextItems);
            setPriceList(nextItems);
          }
        },
        (error) => {
          console.error('Failed to subscribe prices:', error);
          if (!cancelledRef.current) {
            setPriceList(readCachedPrices());
          }
        },
      );
    } catch (error) {
      console.error('Failed to initialize price subscription:', error);
      if (!cancelledRef.current) {
        setPriceList(readCachedPrices());
      }
    }

    try {
      unsubscribeTestimonials = testimonialStorage.subscribeTestimonials(
        (data) => {
          setTestimonialItems(data.length > 0 ? data : testimonials);
        },
        (error) => {
          console.error('Failed to subscribe testimonials:', error);
          setTestimonialItems(testimonials);
        },
      );
    } catch (error) {
      console.error('Failed to initialize testimonial subscription:', error);
      setTestimonialItems(testimonials);
    }

    try {
      unsubscribeEvents = eventStorage.subscribeEvents(
        (data) => {
          setEvents(data.length > 0 ? data : DEFAULT_EVENT_ITEMS);
        },
        (error) => {
          console.error('Failed to subscribe events:', error);
          setEvents(DEFAULT_EVENT_ITEMS);
        },
      );
    } catch (error) {
      console.error('Failed to initialize event subscription:', error);
      setEvents(DEFAULT_EVENT_ITEMS);
    }

    try {
      unsubscribeSettings = settingsStorage.subscribeSettings(
        (settings) => {
          setSiteSettings(settings);
        },
        (error) => {
          console.error('Failed to subscribe settings:', error);
          setSiteSettings(DEFAULT_SITE_SETTINGS);
        },
      );
    } catch (error) {
      console.error('Failed to initialize settings subscription:', error);
      setSiteSettings(DEFAULT_SITE_SETTINGS);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncServices(cancelledRef);
        void syncPrices(cancelledRef);
      }
    };

    const handleWindowFocus = () => {
      void syncServices(cancelledRef);
      void syncPrices(cancelledRef);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      cancelledRef.current = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      unsubscribeServices();
      unsubscribePrices();
      unsubscribeTestimonials();
      unsubscribeEvents();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    if (!activeEvent || typeof window === 'undefined') {
      setEventModalOpen(false);
      return;
    }

    const dismissedKey = `${EVENT_MODAL_DISMISS_PREFIX}${activeEvent.id}`;
    const dismissedUntil = Number(window.localStorage.getItem(dismissedKey) || '0');

    if (dismissedUntil > Date.now()) {
      setEventModalOpen(false);
      return;
    }

    window.localStorage.removeItem(dismissedKey);
    setEventModalOpen(true);
  }, [activeEvent]);

  const handleDismissEventForOneDay = () => {
    if (!activeEvent || typeof window === 'undefined') {
      setEventModalOpen(false);
      return;
    }

    window.localStorage.setItem(
      `${EVENT_MODAL_DISMISS_PREFIX}${activeEvent.id}`,
      String(Date.now() + EVENT_MODAL_DISMISS_DURATION_MS),
    );
    setEventModalOpen(false);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 35 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <Layout>
      <section id="hero" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.GALLERY_1}
            alt="네일아트 배경"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 40 }}
          >
            <h1 className="mb-6 bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              손끝과 분위기까지
              <br />
              디테일로 완성하다
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-xl text-muted-foreground md:text-2xl">
              감각적인 컬러와 섬세한 디자인으로 완성하는 프리미엄 네일 케어
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="rounded-2xl px-8 py-6 text-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                onClick={() => setReservationOpen(true)}
              >
                예약하기
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl border-2 px-8 py-6 text-lg transition-all duration-200 hover:scale-105 hover:bg-accent/10"
                asChild
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <a href="#services">서비스 보기</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="services" className="bg-gradient-to-b from-background to-muted/20 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">{HOME_LOGO_TITLE} 서비스</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              전문 케어와 감각적인 디자인으로 완성하는 맞춤 네일 케어
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {serviceItems.filter((service) => service.visible !== false).map((service) => (
              <motion.div key={service.id} variants={fadeInUp}>
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {priceList.filter((item) => item.visible !== false).length > 0 && (
      <section id="pricing" className="bg-gradient-to-b from-muted/20 to-background py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">가격 안내</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              합리적인 가격으로 만나는 프리미엄 네일 서비스
            </p>
          </motion.div>

          <motion.div
            className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {priceList.filter((item) => item.visible !== false).map((item) => (
              <motion.div key={item.id} variants={fadeInUp}>
                <PriceCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      )}

      {visibleTestimonials.length > 0 && (
      <section id="testimonials" className="bg-gradient-to-b from-background to-muted/20 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">고객 후기</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              실제 고객님의 생생한 후기를 먼저 만나보세요.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {visibleTestimonials.map((testimonial) => (
              <motion.div key={testimonial.id} variants={fadeInUp} className="h-full">
                <TestimonialCard testimonial={testimonial} onClick={setSelectedTestimonial} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link to={ROUTE_PATHS.TESTIMONIALS}>더보기</Link>
            </Button>
          </div>
        </div>
      </section>
      )}

      <section id="contact" className="bg-gradient-to-b from-muted/20 to-background py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">오시는 길</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              편안한 공간에서 디테일한 케어를 경험해보세요.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2">
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            >
              <Card className="flex h-full flex-col rounded-3xl p-8 shadow-lg transition-all duration-200 hover:shadow-xl">
                <h3 className="mb-6 text-2xl font-semibold text-foreground">연락처 정보</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="mb-1 font-medium text-foreground">주소</p>
                      <p className="text-muted-foreground">
                        {siteSettings.addressLine1}
                        {siteSettings.addressLine2 ? (
                          <>
                            <br />
                            {siteSettings.addressLine2}
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="mb-1 font-medium text-foreground">전화번호</p>
                      <p className="text-muted-foreground">{siteSettings.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="mb-1 font-medium text-foreground">이메일</p>
                      <p className="text-muted-foreground">{siteSettings.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="mb-1 font-medium text-foreground">영업시간</p>
                      <p className="text-muted-foreground">
                        {businessHoursLines.map((line, index) => (
                          <span key={`${line}-${index}`}>
                            {line}
                            {index < businessHoursLines.length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>

                  {socialLinks.length > 0 && (
                    <div className="border-t border-border pt-6">
                      <p className="mb-4 font-medium text-foreground">소셜 미디어</p>
                      <div className="flex flex-wrap gap-4">
                        {socialLinks.map(({ href, label, icon: Icon }) => (
                          <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-200 hover:scale-110 hover:bg-primary/20"
                          >
                            <Icon className="h-6 w-6 text-primary" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            >
              <Card className="flex h-full flex-col overflow-hidden rounded-3xl p-0 shadow-lg transition-all duration-200 hover:shadow-xl">
                <div className="border-b px-8 py-6">
                  <h3 className="text-2xl font-semibold text-foreground">지도</h3>
                </div>
                <div className="flex-1">
                  <iframe
                    title={`${HOME_LOGO_TITLE} 위치`}
                    src={mapEmbedUrl}
                    className="h-full min-h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <TestimonialDetailDialog
        testimonial={selectedTestimonial}
        open={!!selectedTestimonial}
        onOpenChange={(open) => !open && setSelectedTestimonial(null)}
        showActions={false}
      />
      <ReservationDialog
        open={reservationOpen}
        onOpenChange={setReservationOpen}
        siteSettings={siteSettings}
      />
      {activeEvent ? (
        <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
          <DialogContent className="overflow-hidden border-0 p-0 sm:max-w-xl">
            <div className="relative">
              <img src={activeEvent.image || IMAGES.GALLERY_10} alt={activeEvent.title} className="h-64 w-full object-cover sm:h-72" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">Special Event</p>
                <h2 className="text-3xl font-bold">{activeEvent.title}</h2>
                <p className="mt-2 text-sm text-white/85">
                  {activeEvent.startDate} ~ {activeEvent.endDate}
                </p>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <DialogHeader className="space-y-3 text-left">
                <DialogTitle className="text-2xl">첫 방문 혜택 안내</DialogTitle>
                <DialogDescription className="text-base leading-7 text-muted-foreground">
                  {activeEvent.content}
                </DialogDescription>
              </DialogHeader>
              <Button asChild className="w-full rounded-2xl py-6 text-base">
                <Link to={ROUTE_PATHS.EVENTS}>이벤트 자세히 보기</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDismissEventForOneDay}
                className="w-full rounded-xl border-primary/30 bg-background text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              >
                하루동안열지않기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </Layout>
  );
}
