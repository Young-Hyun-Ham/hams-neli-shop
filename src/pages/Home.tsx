import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { SiFacebook, SiInstagram, SiKakao, SiTiktok, SiX } from 'react-icons/si';
import { IMAGES } from '@/assets/images';
import { PriceCard, ServiceCard, TestimonialCard } from '@/components/Cards';
import { TestimonialDetailDialog } from '@/components/TestimonialDetailDialog';
import { ReservationDialog } from '@/components/ReservationDialog';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { priceItems, services, testimonials } from '@/data/index';
import { DEFAULT_SITE_SETTINGS, ROUTE_PATHS, type SiteSettings, type Testimonial } from '@/lib/index';
import { settingsStorage } from '@/lib/settingsStorage';
import { testimonialStorage } from '@/lib/testimonialStorage';

const PENDING_SCROLL_KEY = 'pending-home-scroll-target';
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

export default function Home() {
  const [testimonialItems, setTestimonialItems] = useState<Testimonial[]>(testimonials);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [reservationOpen, setReservationOpen] = useState(false);

  const visibleTestimonials = testimonialItems.slice(0, 9);
  const mapEmbedUrl = useMemo(() => getMapEmbedUrl(siteSettings.mapQuery), [siteSettings.mapQuery]);

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
    let unsubscribeTestimonials = () => {};
    let unsubscribeSettings = () => {};

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

    return () => {
      unsubscribeTestimonials();
      unsubscribeSettings();
    };
  }, []);

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
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">프리미엄 서비스</h2>
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
            {services.map((service) => (
              <motion.div key={service.id} variants={fadeInUp}>
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

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
            {priceItems.map((item) => (
              <motion.div key={item.id} variants={fadeInUp}>
                <PriceCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

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
                    title="네일아트 스튜디오 위치"
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
    </Layout>
  );
}
