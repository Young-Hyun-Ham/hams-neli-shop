import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { VideoCard } from '@/components/Cards';
import { Video } from '@/lib/index';
import { videoStorage } from '@/lib/videoStorage';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Gallery() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await videoStorage.getVideos();
      setVideos(data);
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError('동영상을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              네일아트 갤러리
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              다양한 네일아트 작업과 시술 과정을 영상으로 확인해 보세요.
            </p>
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center"
            >
              <p className="font-medium text-destructive">{error}</p>
            </motion.div>
          )}

          {!loading && !error && videos.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-border bg-muted/30 p-12 text-center"
            >
              <p className="text-lg text-muted-foreground">
                아직 등록된 동영상이 없습니다.
              </p>
            </motion.div>
          )}

          {!loading && !error && videos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {videos.map((video, index) => (
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
        </div>
      </div>
    </Layout>
  );
}
