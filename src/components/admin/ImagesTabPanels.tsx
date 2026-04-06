
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Globe,
  Loader2,
  Music4,
  Pencil,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GalleryImage, Service, Video } from '@/lib';
import { serviceStorage } from '@/lib/serviceStorage';
import { imageStorage } from '@/lib/imageStorage';
import { GalleryImageCard } from '@/components/Cards';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

const rowVisibilityClassName = (visible?: boolean) => (visible === false ? 'line-through opacity-60' : '');

export function ImagesTabPanels({
  props,
  setEditImageOpen,
  setEditImage,
}: any) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [imageTitle, setImageTitle] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [imageError, setImageError] = useState('');
  const [imageVisible, setImageVisible] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageSuccess, setImageSuccess] = useState('');
  const [loadingImages, setLoadingImages] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  useEffect(() => {
    void loadImages();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setImageFile(nextFile);
    setImageError('');
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

  const handleImageUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = imageTitle.trim();
    if (!trimmedTitle || !imageFile) {
      setImageError('제목과 이미지를 모두 입력해 주세요.');
      return;
    }

    setImageUploading(true);
    setImageError('');
    setImageSuccess('');

    try {
      await imageStorage.addImage({
        file: imageFile,
        title: trimmedTitle,
        description: imageDescription.trim(),
        visible: imageVisible,
      });
      setImageSuccess('이미지를 등록했습니다.');
      setImageTitle('');
      setImageDescription('');
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
      visible: image.visible !== false,
    });
    setImageError('');
    setImageSuccess('');
    setEditImageOpen(true);
  };
  
  return (
    <>
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
                <Label htmlFor="image-file">이미지 파일</Label>
                <Input
                  key={imageInputKey}
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  required
                />
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
    </>
  );
}