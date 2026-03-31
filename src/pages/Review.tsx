import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { testimonialStorage } from '@/lib/testimonialStorage';

const MAX_IMAGE_COUNT = 5;
const LOCAL_STORAGE_KEY = 'pending-testimonial-images';
const EDIT_DRAFT_STORAGE_KEY = 'testimonial-edit-draft';

type PendingImage = {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  remoteUrl?: string;
};

type EditDraft = {
  id: string;
  name: string;
  password: string;
  rating: number;
  comment: string;
  images?: string[];
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const dataUrlToFile = (item: PendingImage) => {
  const [header, base64] = item.dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || item.type || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], item.name, { type: mime });
};

const clearDraftStorage = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  sessionStorage.removeItem(EDIT_DRAFT_STORAGE_KEY);
};

export default function Review() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PendingImage | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const rawDraft = sessionStorage.getItem(EDIT_DRAFT_STORAGE_KEY);

    if (rawDraft) {
      try {
        const parsedDraft = JSON.parse(rawDraft) as EditDraft;
        setEditDraft(parsedDraft);
        setName(parsedDraft.name || '');
        setPassword(parsedDraft.password || '');
        setRating(parsedDraft.rating || 5);
        setComment(parsedDraft.comment || '');
        setPendingImages(
          (parsedDraft.images ?? []).slice(0, MAX_IMAGE_COUNT).map((imageUrl, index) => ({
            id: `remote-${index}-${imageUrl}`,
            name: `existing-image-${index + 1}`,
            type: 'image/*',
            dataUrl: imageUrl,
            remoteUrl: imageUrl,
          })),
        );
        return;
      } catch (draftError) {
        console.error('Failed to parse testimonial edit draft:', draftError);
        clearDraftStorage();
      }
    }

    setName('');
    setPassword('');
    setRating(5);
    setComment('');
    setPendingImages([]);

    const rawImages = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!rawImages) {
      return;
    }

    try {
      const parsedImages = JSON.parse(rawImages) as PendingImage[];
      if (Array.isArray(parsedImages)) {
        setPendingImages(parsedImages.slice(0, MAX_IMAGE_COUNT));
      }
    } catch (storageError) {
      console.error('Failed to parse pending testimonial images:', storageError);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (editDraft) {
      return;
    }

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(pendingImages.filter((item) => !item.remoteUrl)),
    );
  }, [editDraft, pendingImages]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_IMAGE_COUNT - pendingImages.length;
    if (remainingSlots <= 0) {
      setError(`사진은 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있습니다.`);
      event.target.value = '';
      return;
    }

    const acceptedFiles = selectedFiles.slice(0, remainingSlots);

    try {
      const appendedImages = await Promise.all(
        acceptedFiles.map(async (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          dataUrl: await readFileAsDataUrl(file),
        })),
      );

      setPendingImages((prev) => [...prev, ...appendedImages].slice(0, MAX_IMAGE_COUNT));

      if (selectedFiles.length > remainingSlots) {
        setError(`사진은 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있습니다.`);
      } else {
        setError('');
      }
    } catch (readError) {
      console.error('Failed to read selected images:', readError);
      setError('이미지 미리보기를 준비하는 중 오류가 발생했습니다.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setPendingImages((prev) => prev.filter((item) => item.id !== id));
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  };

  const resetForm = () => {
    setName('');
    setPassword('');
    setRating(5);
    setComment('');
    setPendingImages([]);
    setSelectedImage(null);
    setEditDraft(null);
    setError('');
    clearDraftStorage();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !comment.trim() || !password.trim()) {
      setError('이름, 비밀번호, 후기를 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editDraft) {
        const existingImages = pendingImages
          .filter((item) => item.remoteUrl)
          .map((item) => item.remoteUrl as string);
        const newFiles = pendingImages.filter((item) => !item.remoteUrl).map(dataUrlToFile);
        const uploadedImages = newFiles.length > 0 ? await testimonialStorage.uploadImages(newFiles) : [];
        const finalImages = [...existingImages, ...uploadedImages];
        const removedImages = (editDraft.images ?? []).filter((url) => !existingImages.includes(url));
        const coverImage = finalImages[0] || '';

        await testimonialStorage.updateTestimonial(editDraft.id, {
          name: name.trim(),
          rating,
          comment: comment.trim(),
          image: coverImage,
          images: finalImages,
          avatar: coverImage,
          removedImages,
        });

        setSuccess('후기를 수정했습니다.');
        resetForm();
        return;
      }

      const files = pendingImages.map(dataUrlToFile);
      const images = files.length > 0 ? await testimonialStorage.uploadImages(files) : [];
      const coverImage = images[0] || '';

      await testimonialStorage.addTestimonial({
        name: name.trim(),
        password: password.trim(),
        rating,
        comment: comment.trim(),
        image: coverImage,
        images,
        avatar: coverImage,
      });

      setSuccess('후기가 등록되었습니다.');
      resetForm();
    } catch (submitError) {
      console.error('Failed to submit testimonial:', submitError);
      setError(editDraft ? '후기 수정 중 오류가 발생했습니다.' : '후기 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-primary/10 px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">
              {editDraft ? '후기 수정' : '후기 작성'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {editDraft
                ? '기존 후기와 이미지 구성을 수정한 뒤 저장할 수 있습니다.'
                : '후기와 사진을 남겨주시면 고객후기 페이지에 바로 반영됩니다.'}
            </p>
          </motion.div>

          <Card className="overflow-hidden border-border/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-secondary/10">
              <CardTitle className="text-3xl">{editDraft ? '고객후기 수정' : '고객후기 작성'}</CardTitle>
              <CardDescription>
                사진은 최대 5장까지 누적 등록할 수 있고, 실제 업로드는 저장 시점에만 진행됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                <div className="space-y-2">
                  <Label htmlFor="reviewer-name">이름</Label>
                  <Input
                    id="reviewer-name"
                    name="review_display_name"
                    autoComplete="off"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="이름을 입력해 주세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-password">비밀번호</Label>
                  <Input
                    id="review-password"
                    name="review_secret"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="후기 수정/삭제에 사용할 비밀번호"
                    required
                    readOnly={!!editDraft}
                  />
                </div>

                <div className="space-y-3">
                  <Label>별점</Label>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className="cursor-pointer rounded-full p-1 transition-transform hover:scale-110"
                          aria-label={`${value}점 선택`}
                        >
                          <Star
                            className={`h-7 w-7 ${
                              value <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-sm text-muted-foreground">{rating} / 5</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-comment">후기 내용</Label>
                  <Textarea
                    id="review-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="시술 만족도, 분위기, 추천 포인트를 자유롭게 적어 주세요."
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="review-image">사진 등록</Label>
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <ImagePlus className="h-4 w-4" />
                      첫 번째 사진이 고객후기 목록 썸네일로 사용됩니다.
                    </div>
                    <Input
                      id="review-image"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />
                    <p className="mt-3 text-sm text-muted-foreground">
                      선택된 파일: {pendingImages.length} / {MAX_IMAGE_COUNT}
                    </p>
                  </div>

                  {pendingImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {pendingImages.map((item) => (
                        <div key={item.id} className="relative overflow-hidden rounded-2xl border border-border/50 bg-background">
                          <button
                            type="button"
                            onClick={() => setSelectedImage(item)}
                            className="block h-24 w-full cursor-pointer"
                          >
                            <img src={item.dataUrl} alt={item.name} className="h-full w-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(item.id)}
                            className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                            aria-label={`${item.name} 삭제`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : editDraft ? (
                    '후기 수정 저장'
                  ) : (
                    '후기 등록하기'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedImage.name}</DialogTitle>
              </DialogHeader>
              <div className="overflow-hidden rounded-2xl border border-border/50">
                <img src={selectedImage.dataUrl} alt={selectedImage.name} className="max-h-[75vh] w-full object-contain" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
