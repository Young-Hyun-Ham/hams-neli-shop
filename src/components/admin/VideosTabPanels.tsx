
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
import { Service, Video } from '@/lib';
import { serviceStorage } from '@/lib/serviceStorage';
import { videoStorage } from '@/lib/videoStorage';
import { VideoCard } from '@/components/Cards';
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

const INSTAGRAM_HOME_URL = 'https://www.instagram.com/';
const TIKTOK_HOME_URL = 'https://www.tiktok.com/';
const FACEBOOK_HOME_URL = 'https://www.facebook.com/';
const X_HOME_URL = 'https://x.com/';

type VideoEditState = {
  id: string;
  title: string;
  description: string;
  url: string;
  visible: boolean;
};

const initialVideoEditState: VideoEditState = {
  id: '',
  title: '',
  description: '',
  url: '',
  visible: true,
};

const rowVisibilityClassName = (visible?: boolean) => (visible === false ? 'line-through opacity-60' : '');

export const getVideoUrlValidationError = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    if (!isSupportedVideoUrl(value)) {
      return '인스타그램, 틱톡, 페이스북, X 주소만 등록할 수 있습니다.';
    }

    if ((hostname.includes('facebook.com') || hostname.includes('fb.watch')) && !isEmbeddableFacebookUrl(parsed)) {
      return 'Facebook은 임베드 가능한 게시물 URL만 등록할 수 있습니다.';
    }

    return null;
  } catch {
    return '올바른 동영상 주소를 입력해 주세요.';
  }
};

export const isSupportedVideoUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    return (
      hostname.includes('instagram.com') ||
      hostname.includes('tiktok.com') ||
      hostname.includes('facebook.com') ||
      hostname.includes('fb.watch') ||
      hostname.includes('x.com') ||
      hostname.includes('twitter.com')
    );
  } catch {
    return false;
  }
};

export const isEmbeddableFacebookUrl = (parsed: URL) => {
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (hostname.includes('fb.watch')) {
    return false;
  }

  return (
    pathname.includes('/posts/') ||
    pathname.includes('/videos/') ||
    pathname === '/permalink.php' ||
    pathname.startsWith('/watch') ||
    pathname === '/plugins/post.php'
  );
};

export function VideosTabPanels({
  props,
  setServices,
  setLoadingServices,
  setServiceError,
  setEditVideoOpen,
  setEditVideo,
}: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoVisible, setVideoVisible] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  // const [editVideo, setEditVideo] = useState<VideoEditState>(initialVideoEditState);
  // const [services, setServices] = useState<Service[]>([]);
  // const [loadingServices, setLoadingServices] = useState(false);
  // const [serviceError, setServiceError] = useState('');
  
  useEffect(() => {
    void loadVideos();
    const unsubscribeServices = subscribeServices();

    return () => {
      unsubscribeServices();
    };
  }, []);
  
  const subscribeServices = () => {
    setLoadingServices(true);
    return serviceStorage.subscribeServices(
      (items) => {
        setServices(items);
        setLoadingServices(false);
      },
      (subscriptionError) => {
        console.error('Failed to subscribe services:', subscriptionError);
        setServiceError('서비스 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
        setLoadingServices(false);
      },
    );
  };

  const openEditVideoDialog = (video: Video) => {
    setEditVideo({
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.url,
      visible: video.visible !== false,
    });
    setError('');
    setSuccess('');
    setEditVideoOpen(true);
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await videoStorage.deleteVideo(id);
      setSuccess('동영상을 삭제했습니다.');
      await loadVideos();
    } catch (deleteError) {
      console.error('Failed to delete video:', deleteError);
      setError('삭제 중 오류가 발생했습니다.');
    }
  };
  
  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = videoUrl.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setError('제목과 동영상 주소를 모두 입력해 주세요.');
      return;
    }

    const validationError = getVideoUrlValidationError(trimmedUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await videoStorage.addVideo({ title: trimmedTitle, description: description.trim(), url: trimmedUrl, visible: videoVisible });
      setSuccess('동영상 주소를 등록했습니다.');
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setVideoVisible(true);
      await loadVideos();
    } catch (saveError) {
      console.error('Failed to save video URL:', saveError);
      setError('등록 중 오류가 발생했습니다. Firestore 설정을 확인해 주세요.');
    } finally {
      setUploading(false);
    }
  };

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      setVideos(await videoStorage.getVideos());
    } catch (loadError) {
      console.error('Failed to load videos:', loadError);
      setError('동영상 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoadingVideos(false);
    }
  };
  
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">동영상 등록</CardTitle>
            <CardDescription>인스타그램, 틱톡, 페이스북, X 게시물 주소를 등록합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2"><Label htmlFor="title">제목</Label><Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="동영상 제목" required /></div>
              <div className="space-y-2"><Label htmlFor="description">설명</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="동영상 설명" rows={4} /></div>
              <div className="space-y-2">
                <Label htmlFor="video-url">동영상 주소</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={INSTAGRAM_HOME_URL} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" />인스타 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                  <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={TIKTOK_HOME_URL} target="_blank" rel="noreferrer"><Music4 className="mr-2 h-4 w-4" />틱톡 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                  <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={FACEBOOK_HOME_URL} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" />페이스북 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                  <Button type="button" variant="outline" size="sm" className="w-full" asChild><a href={X_HOME_URL} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" />X 열기<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                </div>
                <Input id="video-url" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://www.instagram.com/reel/..." required />
              </div>
              <div className="space-y-3">
                <Label>노출여부</Label>
                <div className="inline-flex rounded-xl border border-border/60 p-1">
                  <Button type="button" variant={videoVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setVideoVisible(true)}>O</Button>
                  <Button type="button" variant={!videoVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => setVideoVisible(false)}>X</Button>
                </div>
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}
              <Button type="submit" disabled={uploading} className="w-full">{uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />등록</>}</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-2xl">등록된 동영상</CardTitle><CardDescription>현재 등록된 동영상 목록을 확인하고 삭제할 수 있습니다.</CardDescription></CardHeader>
          <CardContent>
            {loadingVideos ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : videos.length === 0 ? <div className="py-12 text-center text-muted-foreground">등록된 동영상이 없습니다.</div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{videos.map((video) => <div key={video.id} className={rowVisibilityClassName(video.visible)}><VideoCard video={video} onDelete={handleDeleteVideo} isAdmin /><div className="mt-3 flex gap-2"><Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => openEditVideoDialog(video)}><Pencil className="mr-1 h-4 w-4" />수정</Button></div></div>)}</div>}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}