import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Image as ImageIcon, Loader2, Video as VideoIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { GalleryImageCard, VideoCard } from '@/components/Cards';
import { Layout } from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryStorage } from '@/lib/categoryStorage';
import { imageStorage } from '@/lib/imageStorage';
import { type GalleryCategory, type GalleryImage, type Video } from '@/lib/index';
import { videoStorage } from '@/lib/videoStorage';

export default function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const selectedCategoryId = searchParams.get('category') || '';

  useEffect(() => {
    void Promise.all([loadVideos(), loadCategories(), loadImages()]);
  }, []);

  const loadVideos = async () => {
    try {
      setLoadingVideos(true);
      setVideoError(null);
      setVideos(await videoStorage.getVideos());
    } catch (err) {
      console.error('Failed to load videos:', err);
      setVideoError('동영상을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoryError(null);
      setCategories(await categoryStorage.getCategories());
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategoryError('카테고리를 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadImages = async () => {
    try {
      setLoadingImages(true);
      setImageError(null);
      setImages(await imageStorage.getImages());
    } catch (err) {
      console.error('Failed to load gallery images:', err);
      setImageError('이미지를 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoadingImages(false);
    }
  };

  const visibleVideos = useMemo(() => videos.filter((video) => video.visible !== false), [videos]);
  const visibleCategories = useMemo(
    () => categories.filter((category) => category.visible !== false),
    [categories],
  );
  const visibleImages = useMemo(() => images.filter((image) => image.visible !== false), [images]);
  const selectedCategory = useMemo(
    () => visibleCategories.find((category) => category.id === selectedCategoryId) || null,
    [selectedCategoryId, visibleCategories],
  );
  const selectedImages = useMemo(
    () => visibleImages.filter((image) => image.categoryId === selectedCategoryId),
    [selectedCategoryId, visibleImages],
  );

  const getCategoryCount = (categoryId: string) =>
    visibleImages.filter((image) => image.categoryId === categoryId).length;

  const getCategoryCover = (categoryId: string) =>
    visibleCategories.find((category) => category.id === categoryId)?.image ||
    visibleImages.find((image) => image.categoryId === categoryId)?.url ||
    '';

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background py-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              네일아트 갤러리
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              동영상과 이미지를 둘러보고, 원하는 스타일을 카테고리별로 빠르게 확인해보세요.
            </p>
          </motion.div>

          <Tabs defaultValue="videos" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="h-auto rounded-2xl p-1">
                <TabsTrigger value="videos" className="rounded-xl px-5 py-2.5">
                  <VideoIcon className="mr-2 h-4 w-4" />
                  동영상
                </TabsTrigger>
                <TabsTrigger value="images" className="rounded-xl px-5 py-2.5">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  이미지
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="videos" className="space-y-6">
              {loadingVideos && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}

              {videoError && (
                <Alert variant="destructive" className="mx-auto max-w-xl">
                  <AlertDescription>{videoError}</AlertDescription>
                </Alert>
              )}

              {!loadingVideos && !videoError && visibleVideos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto max-w-md rounded-2xl border border-border bg-muted/30 p-12 text-center"
                >
                  <p className="text-lg text-muted-foreground">아직 등록된 동영상이 없습니다.</p>
                </motion.div>
              )}

              {!loadingVideos && !videoError && visibleVideos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
                >
                  {visibleVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                      <VideoCard video={video} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              {(loadingImages || loadingCategories) && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}

              {categoryError && (
                <Alert variant="destructive" className="mx-auto max-w-xl">
                  <AlertDescription>{categoryError}</AlertDescription>
                </Alert>
              )}

              {imageError && (
                <Alert variant="destructive" className="mx-auto max-w-xl">
                  <AlertDescription>{imageError}</AlertDescription>
                </Alert>
              )}

              {!loadingImages && !loadingCategories && !imageError && !categoryError && visibleCategories.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto max-w-md rounded-2xl border border-border bg-muted/30 p-12 text-center"
                >
                  <p className="text-lg text-muted-foreground">등록된 카테고리가 없습니다.</p>
                </motion.div>
              )}

              {!loadingImages && !loadingCategories && !imageError && !categoryError && visibleCategories.length > 0 && !selectedCategory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {visibleCategories.map((category, index) => {
                    const cover = getCategoryCover(category.id);
                    const count = getCategoryCount(category.id);

                    return (
                      <motion.button
                        key={category.id}
                        type="button"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.5 }}
                        className="text-left"
                        onClick={() => setSearchParams({ category: category.id })}
                      >
                        <Card className="overflow-hidden border-border/50 shadow-lg transition-shadow hover:shadow-xl">
                          <div className="relative aspect-[4/3] bg-muted">
                            {cover ? (
                              <img src={cover} alt={category.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                                <ImageIcon className="h-14 w-14 text-primary/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <Badge className="mb-3 bg-white/90 text-foreground hover:bg-white">{count}장</Badge>
                              <h3 className="text-2xl font-semibold text-white">{category.name}</h3>
                            </div>
                          </div>
                          <CardContent className="p-5">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {category.description || '카테고리를 눌러 등록된 이미지를 확인해보세요.'}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {!loadingImages && !loadingCategories && !imageError && !categoryError && selectedCategory && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <Badge variant="secondary">{selectedImages.length}장</Badge>
                        <span className="text-sm text-muted-foreground">선택된 카테고리</span>
                      </div>
                      <h2 className="text-3xl font-bold text-foreground">{selectedCategory.name}</h2>
                      <p className="mt-2 text-muted-foreground">
                        {selectedCategory.description || '등록된 이미지를 확인해보세요.'}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setSearchParams({})}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      카테고리 목록으로
                    </Button>
                  </div>

                  {selectedImages.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-muted/30 p-12 text-center">
                      <p className="text-lg text-muted-foreground">이 카테고리에 등록된 이미지가 없습니다.</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {selectedImages.map((image, index) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08, duration: 0.5 }}
                        >
                          <GalleryImageCard image={image} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
