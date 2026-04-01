import { useEffect, useMemo, useState } from 'react';
import { addDays, format, getDay, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarDays, Check, Clock3, UserRound } from 'lucide-react';
import { type Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { type Reservation, type SiteSettings, type Weekday } from '@/lib/index';
import { reservationStorage } from '@/lib/reservationStorage';
import { cn } from '@/lib/utils';

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteSettings: SiteSettings;
}

const STEP_LABELS = ['날짜 선택', '시간 선택', '예약 확인'] as const;
const KOREAN_WEEKDAYS: Weekday[] = ['일', '월', '화', '수', '목', '금', '토'];
const SLOT_MINUTES = 60;

const pad = (value: number) => value.toString().padStart(2, '0');
const toDateKey = (value: Date) => format(value, 'yyyy-MM-dd');
const toTimeLabel = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const getTimeRangeByDate = (date: Date, siteSettings: SiteSettings) => {
  const day = getDay(date);
  return day === 0 || day === 6 ? siteSettings.weekendHours : siteSettings.weekdayHours;
};

const getSlotsForDate = (date: Date, siteSettings: SiteSettings) => {
  const range = getTimeRangeByDate(date, siteSettings);
  const startMinutes = Number(range.startHour) * 60 + Number(range.startMinute);
  const endMinutes = Number(range.endHour) * 60 + Number(range.endMinute);
  const slots: string[] = [];

  for (let current = startMinutes; current + SLOT_MINUTES <= endMinutes; current += SLOT_MINUTES) {
    slots.push(toTimeLabel(current));
  }

  return slots;
};

const isClosedDay = (date: Date, closedDays: Weekday[]) =>
  closedDays.includes(KOREAN_WEEKDAYS[getDay(date)]);

const isPastSlotToday = (date: Date, time: string) => {
  const now = new Date();
  if (toDateKey(now) !== toDateKey(date)) {
    return false;
  }

  return timeToMinutes(time) <= now.getHours() * 60 + now.getMinutes();
};

export function ReservationDialog({ open, onOpenChange, siteSettings }: ReservationDialogProps) {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = reservationStorage.subscribeReservations(
      (items) => {
        setReservations(items);
      },
      (subscriptionError) => {
        console.error('Failed to subscribe reservations:', subscriptionError);
        setError('예약 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setCustomerName('');
      setCustomerPhone('');
      setSubmitting(false);
      setError('');
      setSuccess('');
    }
  }, [open]);

  const reservationsByDate = useMemo(() => {
    return reservations.reduce<Record<string, Set<string>>>((accumulator, reservation) => {
      if (!accumulator[reservation.date]) {
        accumulator[reservation.date] = new Set();
      }

      accumulator[reservation.date].add(reservation.time);
      return accumulator;
    }, {});
  }, [reservations]);

  const disabledDates = useMemo<Matcher[]>(() => {
    const tomorrow = addDays(startOfDay(new Date()), 1);

    return [
      { before: tomorrow },
      (date: Date) => {
        if (isClosedDay(date, siteSettings.closedDays)) {
          return true;
        }

        const dateKey = toDateKey(date);
        const slots = getSlotsForDate(date, siteSettings);
        const reservedSlots = reservationsByDate[dateKey];

        if (!reservedSlots) {
          return false;
        }

        return slots.length > 0 && slots.every((slot) => reservedSlots.has(slot));
      },
    ];
  }, [reservationsByDate, siteSettings]);

  const availableTimes = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    const dateKey = toDateKey(selectedDate);
    const reservedSlots = reservationsByDate[dateKey] || new Set<string>();

    return getSlotsForDate(selectedDate, siteSettings).map((time) => ({
      time,
      disabled: reservedSlots.has(time) || isPastSlotToday(selectedDate, time),
    }));
  }, [reservationsByDate, selectedDate, siteSettings]);

  const selectedDateLabel = selectedDate
    ? format(selectedDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
    : '';

  const canGoNext =
    (step === 0 && Boolean(selectedDate)) ||
    (step === 1 && Boolean(selectedTime)) ||
    (step === 2 && customerName.trim().length > 0 && customerPhone.trim().length > 0);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setError('');
    setSuccess('');
  };

  const handleNext = () => {
    if (!canGoNext) {
      return;
    }

    setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
    setError('');
    setSuccess('');
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 0));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('이름과 연락처를 모두 입력해 주세요.');
      return;
    }

    const dateKey = toDateKey(selectedDate);
    const reservedSlots = reservationsByDate[dateKey];
    if (reservedSlots?.has(selectedTime)) {
      setError('방금 다른 예약이 접수되어 이 시간은 선택할 수 없습니다. 다시 선택해 주세요.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await reservationStorage.createReservation(
        dateKey,
        selectedTime,
        customerName.trim(),
        customerPhone.trim(),
      );
      setSuccess('예약이 완료되었습니다.');
    } catch (submissionError) {
      console.error('Failed to create reservation:', submissionError);

      if (submissionError instanceof Error && submissionError.message === 'RESERVATION_ALREADY_EXISTS') {
        setError('이미 다른 사용자가 예약한 시간입니다. 다른 시간을 선택해 주세요.');
        setStep(1);
        return;
      }

      setError('예약 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            오늘 이후 날짜만 선택할 수 있습니다. 휴무일과 예약이 모두 마감된 날짜는 비활성화됩니다.
          </div>
          <div className="flex justify-center rounded-3xl border border-border/60 bg-background">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              locale={ko}
              className="p-4"
            />
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {selectedDateLabel}의 예약 가능 시간을 선택해 주세요. 예약은 1시간 단위로 진행됩니다.
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {availableTimes.map(({ time, disabled }) => (
              <Button
                key={time}
                type="button"
                variant={selectedTime === time ? 'default' : 'outline'}
                className="h-12 rounded-2xl"
                disabled={disabled}
                onClick={() => {
                  setSelectedTime(time);
                  setError('');
                  setSuccess('');
                }}
              >
                {time}
              </Button>
            ))}
          </div>
          {availableTimes.length === 0 && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              선택한 날짜에는 예약 가능한 시간이 없습니다.
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/60 bg-muted/20 p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">예약 날짜</p>
                <p className="font-medium text-foreground">{selectedDateLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Clock3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">예약 시간</p>
                <p className="font-medium text-foreground">{selectedTime}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reservation-name">
              이름
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reservation-name"
                value={customerName}
                onChange={(event) => {
                  setCustomerName(event.target.value);
                  setError('');
                }}
                className="pl-10"
                placeholder="예약자 이름"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reservation-phone">
              연락처
            </label>
            <Input
              id="reservation-phone"
              value={customerPhone}
              onChange={(event) => {
                setCustomerPhone(event.target.value);
                setError('');
              }}
              placeholder="010-1234-5678"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          이름과 연락처를 입력해야 예약이 완료됩니다. 취소를 누르면 저장되지 않습니다.
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl rounded-[2rem] border-border/60 p-0">
        <div className="border-b border-border/60 px-6 py-5 sm:px-8">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-2xl">예약하기</DialogTitle>
            <DialogDescription>날짜, 시간, 확인 순서대로 예약을 진행합니다.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {STEP_LABELS.map((label, index) => {
              const active = index === step;
              const completed = index < step || (success && index === STEP_LABELS.length - 1);

              return (
                <div
                  key={label}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-left transition-colors',
                    active && 'border-primary bg-primary/10',
                    !active && 'border-border/60 bg-muted/20',
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold',
                        active && 'border-primary bg-primary text-primary-foreground',
                        !active && 'border-border/60 text-muted-foreground',
                      )}
                    >
                      {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className={cn(active ? 'text-foreground' : 'text-muted-foreground')}>
                      Step {index + 1}
                    </span>
                  </div>
                  <p className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 px-6 py-6 sm:px-8">
          {renderStepContent()}

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-700">
              {success}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-5 sm:px-8">
          {success ? (
            <div className="flex w-full justify-end">
              <Button type="button" onClick={() => onOpenChange(false)}>
                닫기
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    이전
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  취소
                </Button>
                {step < STEP_LABELS.length - 1 ? (
                  <Button type="button" onClick={handleNext} disabled={!canGoNext}>
                    다음
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedDate || !selectedTime || !customerName.trim() || !customerPhone.trim()}
                  >
                    {submitting ? '예약 중...' : '예약'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
