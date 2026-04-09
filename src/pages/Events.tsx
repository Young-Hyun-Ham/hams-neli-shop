import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { ReservationDialog } from '@/components/ReservationDialog';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_SITE_SETTINGS, type EventItem, type SiteSettings } from '@/lib/index';
import { DEFAULT_EVENT_ITEMS, eventStorage, isEventActive } from '@/lib/eventStorage';
import { settingsStorage } from '@/lib/settingsStorage';

import { useAuthStore } from '@/lib/auth-store';

const getStatusLabel = (event: EventItem) => {
  const today = new Date();
  const date = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;

  if (event.visible === false) {
    return { label: '숨김', className: 'bg-slate-100 text-slate-700' };
  }

  if (event.startDate > date) {
    return { label: '예정', className: 'bg-blue-100 text-blue-700' };
  }

  if (event.endDate < date) {
    return { label: '종료', className: 'bg-zinc-100 text-zinc-700' };
  }

  return { label: '진행중', className: 'bg-rose-100 text-rose-700' };
};

export default function Events() {
  const viewer = useAuthStore((state) => state.viewer);
  // console.log("event login data ==========>", viewer)
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENT_ITEMS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [reservationOpen, setReservationOpen] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = eventStorage.subscribeEvents(
        (items) => {
          setEvents(items.length > 0 ? items : DEFAULT_EVENT_ITEMS);
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

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = settingsStorage.subscribeSettings(
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

    return () => unsubscribe();
  }, []);

  const visibleEvents = useMemo(
    () => events.filter((event) => event.visible !== false),
    [events],
  );

  return (
    <Layout>
      <section className="min-h-screen bg-gradient-to-b from-background via-rose-50/40 to-background py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Event Board</p>
            <h1 className="mt-4 text-4xl font-bold text-foreground md:text-5xl">현재 진행 중인 이벤트를 확인해보세요</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              방문 혜택과 기간 한정 프로모션을 게시판 형태로 한눈에 볼 수 있습니다.
            </p>
          </motion.div>

          <div className="mx-auto mt-14 max-w-6xl space-y-6">
            {visibleEvents.map((event, index) => {
              const status = getStatusLabel(event);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                >
                  <Card className="overflow-hidden border-border/60 shadow-lg">
                    <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                      <div className="relative min-h-64 overflow-hidden">
                        <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        {isEventActive(event) && (
                          <Button
                            type="button"
                            className="absolute bottom-4 left-4 rounded-full bg-white/90 px-5 text-sm font-semibold text-rose-600 shadow-sm hover:bg-white"
                            onClick={() => setReservationOpen(true)}
                          >
                            지금 바로 혜택 받기
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <CardHeader className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className={status.className}>{status.label}</Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              <span>
                                {event.startDate} ~ {event.endDate}
                              </span>
                            </div>
                          </div>
                          <CardTitle className="text-2xl text-foreground md:text-3xl">{event.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="rounded-3xl bg-muted/40 p-6 text-base leading-8 text-foreground">
                            {event.content}
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <ReservationDialog
        open={reservationOpen}
        onOpenChange={setReservationOpen}
        siteSettings={siteSettings}
      />
    </Layout>
  );
}
