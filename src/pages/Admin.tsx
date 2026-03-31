import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  MapPinned,
  Music4,
  Search,
  Settings,
  Upload,
  Video as VideoIcon,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { VideoCard } from '@/components/Cards';
import {
  ADMIN_PASSWORD,
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  type TimeRange,
  type Video,
  type Weekday,
} from '@/lib/index';
import { settingsStorage } from '@/lib/settingsStorage';
import { videoStorage } from '@/lib/videoStorage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const INSTAGRAM_HOME_URL = 'https://www.instagram.com/';
const TIKTOK_HOME_URL = 'https://www.tiktok.com/';
const FACEBOOK_HOME_URL = 'https://www.facebook.com/';
const X_HOME_URL = 'https://x.com/';
const WEEKDAYS: Weekday[] = ['월', '화', '수', '목', '금', '토', '일'];

const getMapEmbedUrl = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

const isSupportedVideoUrl = (value: string) => {
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

const isEmbeddableFacebookUrl = (parsed: URL) => {
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

const getVideoUrlValidationError = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    if (!isSupportedVideoUrl(value)) {
      return '인스타그램, 틱톡, 페이스북, X 주소만 등록할 수 있습니다.';
    }

    if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      if (!isEmbeddableFacebookUrl(parsed)) {
        return 'Facebook은 임베드 가능한 게시물 URL만 등록할 수 있습니다. 게시물 메뉴의 "임베드 > 고급 설정 > 코드 가져오기"에서 나온 링크를 사용해 주세요.';
      }
    }

    return null;
  } catch {
    return '올바른 동영상 주소를 입력해 주세요.';
  }
};

const updateTimeRange = (range: TimeRange, field: keyof TimeRange, value: string): TimeRange => ({
  ...range,
  [field]: value,
});

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(DEFAULT_SITE_SETTINGS.mapQuery);

  const previewMapUrl = useMemo(
    () => getMapEmbedUrl(searchKeyword || settings.mapQuery || settings.addressLine1),
    [searchKeyword, settings.addressLine1, settings.mapQuery],
  );

  useEffect(() => {
    if (isAuthenticated) {
      void loadVideos();
      void loadSettings();
    }
  }, [isAuthenticated]);

  const loadVideos = async () => {
    setLoading(true);

    try {
      const data = await videoStorage.getVideos();
      setVideos(data);
    } catch (loadError) {
      console.error('Failed to load videos:', loadError);
      setError('동영상 목록을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await settingsStorage.getSettings();
      setSettings(data);
      setSearchKeyword(data.mapQuery);
    } catch (loadError) {
      console.error('Failed to load site settings:', loadError);
      setSettings(DEFAULT_SITE_SETTINGS);
      setSearchKeyword(DEFAULT_SITE_SETTINGS.mapQuery);
    }
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      return;
    }

    setError('비밀번호가 올바르지 않습니다.');
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
      await videoStorage.addVideo({
        title: trimmedTitle,
        description: description.trim(),
        url: trimmedUrl,
      });

      setSuccess('동영상 주소를 등록했습니다.');
      setTitle('');
      setDescription('');
      setVideoUrl('');
      await loadVideos();
    } catch (saveError) {
      console.error('Failed to save video URL:', saveError);
      setError('등록 중 오류가 발생했습니다. Firestore 설정을 확인해 주세요.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await videoStorage.deleteVideo(id);
      setSuccess('동영상을 삭제했습니다.');
      await loadVideos();
    } catch (deleteError) {
      console.error('Failed to delete video:', deleteError);
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleClosedDay = (day: Weekday) => {
    setSettings((prev) => ({
      ...prev,
      closedDays: prev.closedDays.includes(day)
        ? prev.closedDays.filter((item) => item !== day)
        : [...prev.closedDays, day],
    }));
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!settings.addressLine1.trim()) {
      setSettingsError('주소를 입력해 주세요.');
      return;
    }

    if (!settings.phone.trim() || !settings.email.trim()) {
      setSettingsError('전화번호와 이메일을 입력해 주세요.');
      return;
    }

    const payload: SiteSettings = {
      ...settings,
      addressLine1: settings.addressLine1.trim(),
      addressLine2: settings.addressLine2.trim(),
      mapQuery: (settings.mapQuery || settings.addressLine1).trim(),
      phone: settings.phone.trim(),
      email: settings.email.trim(),
      instagramUrl: settings.instagramUrl.trim(),
      tiktokUrl: settings.tiktokUrl.trim(),
      facebookUrl: settings.facebookUrl.trim(),
      kakaoOpenChatUrl: settings.kakaoOpenChatUrl.trim(),
      xUrl: settings.xUrl.trim(),
    };

    setSettingsSaving(true);
    setSettingsError('');
    setSettingsMessage('');

    try {
      await settingsStorage.saveSettings(payload);
      setSettings(payload);
      setSearchKeyword(payload.mapQuery);
      setSettingsMessage('영업시간과 오시는 길 설정을 저장했습니다.');
    } catch (saveError) {
      console.error('Failed to save site settings:', saveError);
      setSettingsError('설정 저장 중 오류가 발생했습니다. Firestore rules에서 `settings/site` 쓰기 권한을 확인해 주세요.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const applySearchAddress = () => {
    const trimmed = searchKeyword.trim();
    if (!trimmed) {
      setSettingsError('검색할 주소를 입력해 주세요.');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      addressLine1: trimmed,
      mapQuery: trimmed,
    }));
    setSettingsError('');
    setAddressSearchOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-full max-w-md shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">관리자 로그인</CardTitle>
                <CardDescription>비밀번호를 입력해 관리자 페이지에 접속해 주세요.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="비밀번호를 입력해 주세요"
                      autoComplete="current-password"
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full">
                    로그인
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-24">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="videos" className="space-y-6">
            <div className="flex justify-center sm:justify-start">
              <TabsList className="h-auto rounded-2xl p-1">
                <TabsTrigger value="videos" className="cursor-pointer rounded-xl px-5 py-2.5">
                  <VideoIcon className="mr-2 h-4 w-4" />
                  동영상 등록
                </TabsTrigger>
                <TabsTrigger value="settings" className="cursor-pointer rounded-xl px-5 py-2.5">
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="videos" className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">동영상 등록</CardTitle>
                    <CardDescription>인스타그램, 틱톡, 페이스북, X 게시물 주소를 입력해 갤러리에 등록합니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpload} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">제목</Label>
                        <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="동영상 제목을 입력해 주세요" required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">설명</Label>
                        <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="동영상 설명을 입력해 주세요" rows={4} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="video-url">동영상 주소</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                            <a href={INSTAGRAM_HOME_URL} target="_blank" rel="noreferrer">
                              <Globe className="mr-2 h-4 w-4" />
                              인스타 새창 열기
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                            <a href={TIKTOK_HOME_URL} target="_blank" rel="noreferrer">
                              <Music4 className="mr-2 h-4 w-4" />
                              틱톡 새창 열기
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                            <a href={FACEBOOK_HOME_URL} target="_blank" rel="noreferrer">
                              <Globe className="mr-2 h-4 w-4" />
                              페이스북 새창 열기
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                            <a href={X_HOME_URL} target="_blank" rel="noreferrer">
                              <Globe className="mr-2 h-4 w-4" />
                              X 새창 열기
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                        <Input
                          id="video-url"
                          type="url"
                          value={videoUrl}
                          onChange={(event) => setVideoUrl(event.target.value)}
                          placeholder="https://www.instagram.com/reel/... 또는 Facebook 임베드용 게시물 링크"
                          required
                        />
                        <p className="text-sm text-muted-foreground">새창에서 게시물 주소를 복사한 뒤 여기에 붙여넣어 주세요.</p>
                        <p className="text-sm text-amber-600">
                          Facebook은 게시물 메뉴의 "임베드 &gt; 고급 설정 &gt; 코드 가져오기"에서 나온 링크만 등록할 수 있습니다.
                        </p>
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

                      <Button type="submit" disabled={uploading} className="w-full">
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            등록 중...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            등록
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">등록된 동영상</CardTitle>
                    <CardDescription>저장된 동영상 목록을 확인하고 삭제할 수 있습니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : videos.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">등록된 동영상이 없습니다.</div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {videos.map((video) => (
                          <VideoCard key={video.id} video={video} onDelete={handleDelete} isAdmin />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">오시는 길 및 영업시간 설정</CardTitle>
                  <CardDescription>영업시간을 숫자 입력으로 저장하고 휴무 요일을 체크해서 관리합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="address-line-1">주소</Label>
                        <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => setAddressSearchOpen(true)}>
                          <Search className="mr-2 h-4 w-4" />
                          주소검색
                        </Button>
                      </div>
                      <Input
                        id="address-line-1"
                        value={settings.addressLine1}
                        onChange={(event) => setSettings((prev) => ({ ...prev, addressLine1: event.target.value }))}
                        placeholder="예: 서울 강남구 테헤란로 123"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address-line-2">상세주소</Label>
                      <Input
                        id="address-line-2"
                        value={settings.addressLine2}
                        onChange={(event) => setSettings((prev) => ({ ...prev, addressLine2: event.target.value }))}
                        placeholder="예: 네일아트 빌딩 2층"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="map-query">지도 검색어</Label>
                      <Input
                        id="map-query"
                        value={settings.mapQuery}
                        onChange={(event) => setSettings((prev) => ({ ...prev, mapQuery: event.target.value }))}
                        placeholder="지도에 표시할 검색어"
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">전화번호</Label>
                        <Input id="phone" value={settings.phone} onChange={(event) => setSettings((prev) => ({ ...prev, phone: event.target.value }))} placeholder="02-1234-5678" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input id="email" type="email" value={settings.email} onChange={(event) => setSettings((prev) => ({ ...prev, email: event.target.value }))} placeholder="contact@nailart.com" />
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                        <Label>평일 영업시간</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={settings.weekdayHours.startHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'startHour', event.target.value) }))} placeholder="시작 시" />
                          <Input value={settings.weekdayHours.startMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'startMinute', event.target.value) }))} placeholder="시작 분" />
                          <Input value={settings.weekdayHours.endHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'endHour', event.target.value) }))} placeholder="종료 시" />
                          <Input value={settings.weekdayHours.endMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekdayHours: updateTimeRange(prev.weekdayHours, 'endMinute', event.target.value) }))} placeholder="종료 분" />
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                        <Label>주말 영업시간</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={settings.weekendHours.startHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'startHour', event.target.value) }))} placeholder="시작 시" />
                          <Input value={settings.weekendHours.startMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'startMinute', event.target.value) }))} placeholder="시작 분" />
                          <Input value={settings.weekendHours.endHour} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'endHour', event.target.value) }))} placeholder="종료 시" />
                          <Input value={settings.weekendHours.endMinute} onChange={(event) => setSettings((prev) => ({ ...prev, weekendHours: updateTimeRange(prev.weekendHours, 'endMinute', event.target.value) }))} placeholder="종료 분" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>휴무일</Label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => {
                          const active = settings.closedDays.includes(day);

                          return (
                            <Button
                              key={day}
                              type="button"
                              variant={active ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => handleToggleClosedDay(day)}
                            >
                              {day}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="instagram-url">인스타 주소</Label>
                        <Input id="instagram-url" value={settings.instagramUrl} onChange={(event) => setSettings((prev) => ({ ...prev, instagramUrl: event.target.value }))} placeholder="https://instagram.com/..." />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tiktok-url">틱톡 주소</Label>
                        <Input id="tiktok-url" value={settings.tiktokUrl} onChange={(event) => setSettings((prev) => ({ ...prev, tiktokUrl: event.target.value }))} placeholder="https://www.tiktok.com/..." />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="facebook-url">페이스북 주소</Label>
                        <Input id="facebook-url" value={settings.facebookUrl} onChange={(event) => setSettings((prev) => ({ ...prev, facebookUrl: event.target.value }))} placeholder="https://facebook.com/..." />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kakao-open-chat-url">카카오 오픈채팅방 주소</Label>
                        <Input id="kakao-open-chat-url" value={settings.kakaoOpenChatUrl} onChange={(event) => setSettings((prev) => ({ ...prev, kakaoOpenChatUrl: event.target.value }))} placeholder="https://open.kakao.com/..." />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="x-url">X 주소</Label>
                        <Input id="x-url" value={settings.xUrl} onChange={(event) => setSettings((prev) => ({ ...prev, xUrl: event.target.value }))} placeholder="https://x.com/..." />
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border/50">
                      <div className="border-b px-4 py-3 text-sm font-medium text-foreground">지도 미리보기</div>
                      <iframe title="주소 미리보기" src={getMapEmbedUrl(settings.mapQuery || settings.addressLine1)} className="h-80 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </div>

                    {settingsError && (
                      <Alert variant="destructive">
                        <AlertDescription>{settingsError}</AlertDescription>
                      </Alert>
                    )}

                    {settingsMessage && (
                      <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>{settingsMessage}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={settingsSaving} className="w-full sm:w-auto">
                      {settingsSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <MapPinned className="mr-2 h-4 w-4" />
                          설정 저장
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={addressSearchOpen} onOpenChange={setAddressSearchOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl">
          <DialogHeader>
            <DialogTitle>주소검색</DialogTitle>
            <DialogDescription>주소 또는 장소명을 입력하면 지도 미리보기로 확인한 뒤 적용할 수 있습니다.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address-search">검색어</Label>
              <Input id="address-search" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="예: 서울 강남구 테헤란로 123" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/50">
              <iframe title="주소 검색 미리보기" src={previewMapUrl} className="h-[420px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setAddressSearchOpen(false)}>
                취소
              </Button>
              <Button type="button" className="cursor-pointer" onClick={applySearchAddress}>
                이 주소 사용
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
