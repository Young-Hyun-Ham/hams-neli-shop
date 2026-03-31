import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Play, Star, Trash2 } from 'lucide-react';
import { FacebookEmbed } from 'react-social-media-embed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PriceItem, Service, Testimonial, Video } from '@/lib/index';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const hoverLift = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4 },
};

const getPlayableEmbedUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes('instagram.com')) {
      const segments = parsed.pathname.split('/').filter(Boolean);
      const [kind, id] = segments;

      if (id && ['reel', 'p', 'tv'].includes(kind)) {
        return `https://www.instagram.com/${kind}/${id}/embed/captioned/`;
      }
    }

    if (hostname.includes('tiktok.com')) {
      const match = parsed.pathname.match(/\/video\/(\d+)/);
      const videoId = match?.[1];

      if (videoId) {
        return `https://www.tiktok.com/player/v1/${videoId}?description=1&music_info=1`;
      }
    }

    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(parsed.pathname)) {
      return value;
    }
  } catch {
    return null;
  }

  return null;
};

const isDirectVideoFile = (value: string) => /\.(mp4|webm|ogg)(\?|#|$)/i.test(value);

const getVideoPlatform = (value: string) => {
  try {
    const hostname = new URL(value).hostname.toLowerCase();

    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) return 'facebook';
    if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x';
  } catch {
    return 'unknown';
  }

  return 'unknown';
};

const getOpenLinkLabel = (platform: ReturnType<typeof getVideoPlatform>) => {
  switch (platform) {
    case 'facebook':
      return '페이스북 새창 열기';
    case 'x':
      return 'X 새창 열기';
    default:
      return '원본 새창 열기';
  }
};

export function ServiceCard({ service }: { service: Service }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <motion.div
        variants={hoverLift}
        initial="rest"
        whileHover="hover"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Card className="h-full overflow-hidden border-border/50 shadow-lg transition-shadow hover:shadow-xl">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={service.image}
              alt={service.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">{service.title}</CardTitle>
            <CardDescription className="text-muted-foreground">{service.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 text-primary">•</span>
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function PriceCard({ item }: { item: PriceItem }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <motion.div
        variants={hoverLift}
        initial="rest"
        whileHover="hover"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Card className="h-full border-border/50 bg-gradient-to-br from-card to-card/50 shadow-md transition-shadow hover:shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">
                  {item.category}
                </Badge>
                <CardTitle className="text-xl font-semibold text-foreground">{item.name}</CardTitle>
                {item.description && (
                  <CardDescription className="mt-2 text-muted-foreground">{item.description}</CardDescription>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{item.price}</div>
                {item.duration && <div className="mt-1 text-sm text-muted-foreground">{item.duration}</div>}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function TestimonialCard({
  testimonial,
  onClick,
}: {
  testimonial: Testimonial;
  onClick?: (testimonial: Testimonial) => void;
}) {
  const thumbnail = testimonial.images?.[0] || testimonial.image;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <motion.div
        variants={hoverLift}
        initial="rest"
        whileHover="hover"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Card
          className={`h-full border-border/50 bg-gradient-to-br from-card via-card/80 to-card/50 shadow-md transition-shadow hover:shadow-lg ${
            onClick ? 'cursor-pointer' : ''
          }`}
          onClick={() => onClick?.(testimonial)}
        >
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {(testimonial.avatar || thumbnail) && <AvatarImage src={testimonial.avatar || thumbnail} />}
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {testimonial.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground">{testimonial.name}</CardTitle>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < testimonial.rating ? 'fill-primary text-primary' : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(testimonial.date).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {thumbnail && (
              <div className="mb-4 overflow-hidden rounded-2xl border border-border/50">
                <img src={thumbnail} alt={`${testimonial.name} 후기 썸네일`} className="h-56 w-full object-cover" />
              </div>
            )}
            <p className="leading-relaxed text-foreground/80">{testimonial.comment}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function VideoCard({
  video,
  onDelete,
  isAdmin = false,
}: {
  video: Video;
  onDelete?: (id: string) => void | Promise<void>;
  isAdmin?: boolean;
}) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const playableUrl = useMemo(() => getPlayableEmbedUrl(video.url), [video.url]);
  const directVideo = useMemo(() => isDirectVideoFile(video.url), [video.url]);
  const platform = useMemo(() => getVideoPlatform(video.url), [video.url]);
  const openLinkLabel = useMemo(() => getOpenLinkLabel(platform), [platform]);
  const isFacebook = platform === 'facebook';

  return (
    <>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      >
        <motion.div
          variants={hoverLift}
          initial="rest"
          whileHover="hover"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <Card className="h-full overflow-hidden border-border/50 shadow-lg transition-shadow hover:shadow-xl">
            <div className="relative aspect-video bg-muted">
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                  <Play className="h-16 w-16 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100">
                <Button size="lg" className="h-16 w-16 rounded-full p-0" onClick={() => setIsPlayerOpen(true)}>
                  <Play className="h-8 w-8" />
                </Button>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2 text-lg font-semibold text-foreground">{video.title}</CardTitle>
              <CardDescription className="line-clamp-2 text-muted-foreground">{video.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {new Date(video.created_at).toLocaleDateString('ko-KR')}
              </span>
              <div className="flex items-center gap-2">
                {!playableUrl && !isFacebook && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={video.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {openLinkLabel}
                    </a>
                  </Button>
                )}
                {isAdmin && onDelete && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(video.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className={`flex h-[92dvh] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden border-none p-0 sm:h-[88dvh] sm:w-[calc(100vw-3rem)] sm:rounded-xl ${isFacebook ? 'bg-white' : 'bg-black'}`}>
          <DialogTitle className="sr-only">{video.title}</DialogTitle>
          <DialogDescription className="sr-only">
              {video.description || '등록된 영상 주소를 모달에서 재생합니다.'}
            </DialogDescription>
          <div className={`flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4 ${isFacebook ? 'overflow-y-auto bg-neutral-100' : 'bg-black'}`}>
            <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl ${isFacebook ? 'bg-neutral-100' : 'bg-black'}`}>
              {isFacebook ? (
                <div className="flex w-full justify-center py-4">
                  <FacebookEmbed url={video.url} width={550} />
                </div>
              ) : playableUrl ? (
                directVideo ? (
                  <video
                    src={playableUrl}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full bg-black object-contain"
                  />
                ) : (
                  <iframe
                    title={`${video.title} player`}
                    src={playableUrl}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="h-full w-full bg-black"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm leading-6 text-white/80">
                  이 주소는 모달 재생 형식으로 변환할 수 없습니다.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
