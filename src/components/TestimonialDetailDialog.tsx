import { useEffect, useMemo, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Testimonial } from '@/lib/index';
import { ROUTE_PATHS } from '@/lib/index';
import { testimonialStorage } from '@/lib/testimonialStorage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TestimonialDetailDialogProps {
  testimonial: Testimonial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActions?: boolean;
}

const EDIT_DRAFT_STORAGE_KEY = 'testimonial-edit-draft';

export function TestimonialDetailDialog({
  testimonial,
  open,
  onOpenChange,
  showActions = true,
}: TestimonialDetailDialogProps) {
  const navigate = useNavigate();
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const images = useMemo(() => {
    if (!testimonial) {
      return [];
    }

    return testimonial.images?.length ? testimonial.images : testimonial.image ? [testimonial.image] : [];
  }, [testimonial]);

  useEffect(() => {
    setPasswordInput('');
    setError('');
  }, [testimonial]);

  const verifyPassword = () => {
    if (!testimonial?.password) {
      setError('이 후기는 비밀번호 정보가 없어 수정 또는 삭제할 수 없습니다.');
      return false;
    }

    if (passwordInput !== testimonial.password) {
      setError('비밀번호가 올바르지 않습니다.');
      return false;
    }

    setError('');
    return true;
  };

  const handleEdit = () => {
    if (!testimonial || !verifyPassword()) {
      return;
    }

    const confirmed = window.confirm('수정 페이지로 이동 하시겠습니까?');
    if (!confirmed) {
      return;
    }

    sessionStorage.setItem(
      EDIT_DRAFT_STORAGE_KEY,
      JSON.stringify({
        id: testimonial.id,
        name: testimonial.name,
        password: passwordInput,
        rating: testimonial.rating,
        comment: testimonial.comment,
        images,
      }),
    );

    onOpenChange(false);
    navigate(ROUTE_PATHS.REVIEW);
  };

  const handleDelete = async () => {
    if (!testimonial || !verifyPassword()) {
      return;
    }

    const confirmed = window.confirm('삭제 하시겠습니까?');
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await testimonialStorage.deleteTestimonial(testimonial);
      onOpenChange(false);
    } catch (deleteError) {
      console.error('Failed to delete testimonial:', deleteError);
      setError('후기 삭제 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl">
        {testimonial && (
          <>
            <DialogHeader>
              <DialogTitle>{testimonial.name}님의 후기</DialogTitle>
              <DialogDescription>
                {new Date(testimonial.date).toLocaleDateString('ko-KR')} · 별점 {testimonial.rating} / 5
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {images.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((image, index) => (
                    <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-border/50">
                      <img
                        src={image}
                        alt={`${testimonial.name} 후기 이미지 ${index + 1}`}
                        className="h-60 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-border/50 p-4">
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-5 w-5 ${
                        index < testimonial.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="whitespace-pre-wrap leading-7 text-foreground/85">{testimonial.comment}</p>
              </div>

              {showActions && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="detail-password">비밀번호</Label>
                    <Input
                      id="detail-password"
                      type="password"
                      value={passwordInput}
                      onChange={(event) => setPasswordInput(event.target.value)}
                      placeholder="작성 시 입력한 비밀번호"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={handleEdit} className="cursor-pointer">
                      수정
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting} className="cursor-pointer">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
