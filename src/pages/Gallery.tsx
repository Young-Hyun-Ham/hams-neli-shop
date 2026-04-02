import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Loader2, Video as VideoIcon } from 'lucide-react';
import { GalleryImageCard, VideoCard } from '@/components/Cards';
import { Layout } from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type GalleryImage, type Video } from '@/lib/index';
import { imageStorage } from '@/lib/imageStorage';
import { videoStorage } from '@/lib/videoStorage';

export default function Gallery() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([loadVideos(), loadImages()]);
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
              동영상과 이미지를 나눠서 보고, 원하는 작업 스타일을 빠르게 확인해 보세요.
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

              {!loadingVideos && !videoError && videos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto max-w-md rounded-2xl border border-border bg-muted/30 p-12 text-center"
                >
                  <p className="text-lg text-muted-foreground">아직 등록된 동영상이 없습니다.</p>
                </motion.div>
              )}

              {!loadingVideos && !videoError && videos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
                >
                  {videos.filter((video) => video.visible !== false).map((video, index) => (
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
              {loadingImages && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}

              {imageError && (
                <Alert variant="destructive" className="mx-auto max-w-xl">
                  <AlertDescription>{imageError}</AlertDescription>
                </Alert>
              )}

              {!loadingImages && !imageError && images.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto max-w-md rounded-2xl border border-border bg-muted/30 p-12 text-center"
                >
                  <p className="text-lg text-muted-foreground">아직 등록된 이미지가 없습니다.</p>
                </motion.div>
              )}

              {!loadingImages && !imageError && images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {images.filter((image) => image.visible !== false).map((image, index) => (
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
