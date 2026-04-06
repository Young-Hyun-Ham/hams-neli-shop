import { motion } from 'framer-motion';
import {
  ExternalLink,
  Globe,
  Loader2,
  MapPinned,
  Music4,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { GalleryImageCard, VideoCard } from '@/components/Cards';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export function AdminTabPanels(props: any) {
  const {
    INSTAGRAM_HOME_URL,
    TIKTOK_HOME_URL,
    FACEBOOK_HOME_URL,
    X_HOME_URL,
    WEEKDAYS,
    SERVICES_PER_PAGE,
    RESERVATIONS_PER_PAGE,
    rowVisibilityClassName,
  } = props;

  return (
    <>
      <TabsContent value="videos" className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">동영상 등록</CardTitle>
              <CardDescription>인스타그램, 틱톡, 페이스북, X 게시물 주소를 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={props.handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input id="title" value={props.title} onChange={(event) => props.setTitle(event.target.value)} placeholder="동영상 제목" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea id="description" value={props.description} onChange={(event) => props.setDescription(event.target.value)} placeholder="동영상 설명" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-url">동영상 주소</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                      <a href={INSTAGRAM_HOME_URL} target="_blank" rel="noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        인스타 열기
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                      <a href={TIKTOK_HOME_URL} target="_blank" rel="noreferrer">
                        <Music4 className="mr-2 h-4 w-4" />
                        틱톡 열기
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                      <a href={FACEBOOK_HOME_URL} target="_blank" rel="noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        페이스북 열기
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                      <a href={X_HOME_URL} target="_blank" rel="noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        X 열기
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <Input
                    id="video-url"
                    type="url"
                    value={props.videoUrl}
                    onChange={(event) => props.setVideoUrl(event.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>노출여부</Label>
                  <div className="inline-flex rounded-xl border border-border/60 p-1">
                    <Button type="button" variant={props.videoVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setVideoVisible(true)}>O</Button>
                    <Button type="button" variant={!props.videoVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setVideoVisible(false)}>X</Button>
                  </div>
                </div>
                {props.error && <Alert variant="destructive"><AlertDescription>{props.error}</AlertDescription></Alert>}
                {props.success && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{props.success}</AlertDescription></Alert>}
                <Button type="submit" disabled={props.uploading} className="w-full">
                  {props.uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />등록</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">등록된 동영상</CardTitle>
              <CardDescription>현재 등록된 동영상 목록을 확인하고 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {props.loadingVideos ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : props.videos.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">등록된 동영상이 없습니다.</div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {props.videos.map((video: any) => (
                    <div key={video.id} className={rowVisibilityClassName(video.visible)}>
                      <VideoCard video={video} onDelete={props.handleDeleteVideo} isAdmin />
                      <div className="mt-3 flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => props.openEditVideoDialog(video)}>
                          <Pencil className="mr-1 h-4 w-4" />
                          수정
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="images" className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">이미지 등록</CardTitle>
              <CardDescription>갤러리 이미지 파일을 업로드하고 제목과 설명을 함께 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={props.handleImageUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="image-title">제목</Label>
                  <Input id="image-title" value={props.imageTitle} onChange={(event) => props.setImageTitle(event.target.value)} placeholder="이미지 제목" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-description">설명</Label>
                  <Textarea id="image-description" value={props.imageDescription} onChange={(event) => props.setImageDescription(event.target.value)} placeholder="이미지 설명" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-file">이미지 파일</Label>
                  <Input key={props.imageInputKey} id="image-file" type="file" accept="image/*" onChange={props.handleImageFileChange} required />
                  {props.imagePreviewUrl && (
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                        <img src={props.imagePreviewUrl} alt="업로드 미리보기" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>노출여부</Label>
                  <div className="inline-flex rounded-xl border border-border/60 p-1">
                    <Button type="button" variant={props.imageVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setImageVisible(true)}>O</Button>
                    <Button type="button" variant={!props.imageVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setImageVisible(false)}>X</Button>
                  </div>
                </div>
                {props.imageError && <Alert variant="destructive"><AlertDescription>{props.imageError}</AlertDescription></Alert>}
                {props.imageSuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{props.imageSuccess}</AlertDescription></Alert>}
                <Button type="submit" disabled={props.imageUploading} className="w-full">
                  {props.imageUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />이미지 등록</>}
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
              {props.loadingImages ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : props.images.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">등록된 이미지가 없습니다.</div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {props.images.map((image: any) => (
                    <div key={image.id} className={rowVisibilityClassName(image.visible)}>
                      <GalleryImageCard image={image} onDelete={props.handleDeleteImage} isAdmin />
                      <div className="mt-3 flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => props.openEditImageDialog(image)}>
                          <Pencil className="mr-1 h-4 w-4" />
                          수정
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="services" className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">서비스 등록</CardTitle>
              <CardDescription>메인 서비스 섹션에 노출할 서비스 정보를 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">기본 services 데이터 가져오기</p>
                    <p className="text-sm text-muted-foreground">
                      `src/data/index.ts`의 `services` 배열을 같은 `id`로 Firebase `services` 컬렉션에 저장합니다.
                    </p>
                  </div>
                  <Button type="button" variant="outline" disabled={props.serviceImporting} onClick={() => void props.handleImportDefaultServices()}>
                    {props.serviceImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가져오는 중...</> : 'data/index.ts 가져오기'}
                  </Button>
                </div>
              </div>
              <form onSubmit={props.handleServiceSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="service-title">제목</Label>
                  <Input id="service-title" value={props.serviceTitle} onChange={(event) => props.setServiceTitle(event.target.value)} placeholder="서비스 제목" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-description">설명</Label>
                  <Textarea id="service-description" value={props.serviceDescription} onChange={(event) => props.setServiceDescription(event.target.value)} placeholder="서비스 설명" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-features">특징</Label>
                  <Textarea
                    id="service-features"
                    value={props.serviceFeatures}
                    onChange={(event) => props.setServiceFeatures(event.target.value)}
                    placeholder={'줄바꿈으로 특징을 구분해 주세요.\n예) 유지력 우수'}
                    rows={5}
                  />
                </div>
                <div className="space-y-3">
                  <Label>이미지 입력 방식</Label>
                  <div className="inline-flex rounded-xl border border-border/60 p-1">
                    <Button
                      type="button"
                      variant={props.serviceImageMode === 'url' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        props.setServiceImageMode('url');
                        props.setServiceImageFile(null);
                        props.setServiceImageInputKey((prev: number) => prev + 1);
                      }}
                    >
                      주소 입력
                    </Button>
                    <Button type="button" variant={props.serviceImageMode === 'file' ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setServiceImageMode('file')}>
                      파일 첨부
                    </Button>
                  </div>
                  {props.serviceImageMode === 'url' ? (
                    <div className="space-y-2">
                      <Label htmlFor="service-image-url">이미지 주소</Label>
                      <Input id="service-image-url" type="url" value={props.serviceImageUrl} onChange={(event) => props.setServiceImageUrl(event.target.value)} placeholder="https://example.com/service.jpg" required />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="service-image-file">이미지 파일</Label>
                      <Input key={props.serviceImageInputKey} id="service-image-file" type="file" accept="image/*" onChange={props.handleServiceImageFileChange} required />
                    </div>
                  )}
                  {props.serviceImagePreviewUrl && (
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                        <img src={props.serviceImagePreviewUrl} alt="서비스 미리보기" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>노출여부</Label>
                  <div className="inline-flex rounded-xl border border-border/60 p-1">
                    <Button type="button" variant={props.serviceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setServiceVisible(true)}>O</Button>
                    <Button type="button" variant={!props.serviceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setServiceVisible(false)}>X</Button>
                  </div>
                </div>
                {props.serviceError && <Alert variant="destructive"><AlertDescription>{props.serviceError}</AlertDescription></Alert>}
                {props.serviceSuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{props.serviceSuccess}</AlertDescription></Alert>}
                <Button type="submit" disabled={props.serviceUploading} className="w-full">
                  {props.serviceUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />서비스 등록</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">등록된 서비스</CardTitle>
              <CardDescription>서비스를 수정하거나 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {props.loadingServices ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : props.services.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">등록된 서비스가 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>이미지</TableHead>
                        <TableHead>제목</TableHead>
                        <TableHead className="hidden md:table-cell">설명</TableHead>
                        <TableHead className="hidden md:table-cell">특징</TableHead>
                        <TableHead className="w-[180px]">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {props.paginatedServices.map((service: any) => (
                        <TableRow key={service.id} className={rowVisibilityClassName(service.visible)}>
                          <TableCell>
                            <div className="h-16 w-20 overflow-hidden rounded-lg border border-border/60">
                              <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{service.title}</TableCell>
                          <TableCell className="hidden max-w-xs whitespace-pre-line text-sm text-muted-foreground md:table-cell">{service.description}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {service.features.map((feature: string) => (
                                <li key={`${service.id}-${feature}`}>• {feature}</li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => props.openEditServiceDialog(service)}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                              <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={props.serviceDeletingId === service.id} onClick={() => void props.handleDeleteService(service)}>
                                {props.serviceDeletingId === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!props.loadingServices && props.services.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    총 {props.services.length}건 중 {(props.servicesPage - 1) * SERVICES_PER_PAGE + 1}-
                    {Math.min(props.servicesPage * SERVICES_PER_PAGE, props.services.length)}건 표시
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={props.servicesPage === 1} onClick={() => props.setServicesPage((prev: number) => Math.max(1, prev - 1))}>이전</Button>
                    <span className="min-w-20 text-center text-sm text-muted-foreground">{props.servicesPage} / {props.servicesTotalPages}</span>
                    <Button type="button" variant="outline" size="sm" disabled={props.servicesPage === props.servicesTotalPages} onClick={() => props.setServicesPage((prev: number) => Math.min(props.servicesTotalPages, prev + 1))}>다음</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="prices" className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">가격표 설정</CardTitle>
              <CardDescription>홈 가격 안내 섹션에 노출할 항목을 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">기본 priceItems 데이터 가져오기</p>
                    <p className="text-sm text-muted-foreground">`src/data/index.ts`의 `priceItems` 배열을 같은 `id`로 Firebase `priceItems` 컬렉션에 저장합니다.</p>
                  </div>
                  <Button type="button" variant="outline" disabled={props.priceImporting} onClick={() => void props.handleImportDefaultPrices()}>
                    {props.priceImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가져오는 중...</> : 'data/index.ts 가져오기'}
                  </Button>
                </div>
              </div>
              <form onSubmit={props.handlePriceSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="price-category">카테고리</Label><Input id="price-category" value={props.priceCategory} onChange={(event) => props.setPriceCategory(event.target.value)} placeholder="기본 케어" required /></div>
                  <div className="space-y-2"><Label htmlFor="price-name">항목명</Label><Input id="price-name" value={props.priceName} onChange={(event) => props.setPriceName(event.target.value)} placeholder="베이직 매니큐어" required /></div>
                  <div className="space-y-2"><Label htmlFor="price-value">가격</Label><Input id="price-value" value={props.priceValue} onChange={(event) => props.setPriceValue(event.target.value)} placeholder="30,000원" required /></div>
                  <div className="space-y-2"><Label htmlFor="price-duration">소요시간</Label><Input id="price-duration" value={props.priceDuration} onChange={(event) => props.setPriceDuration(event.target.value)} placeholder="40분" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="price-description">설명</Label><Textarea id="price-description" value={props.priceDescription} onChange={(event) => props.setPriceDescription(event.target.value)} placeholder="서비스 설명" rows={4} /></div>
                <div className="space-y-3">
                  <Label>노출여부</Label>
                  <div className="inline-flex rounded-xl border border-border/60 p-1">
                    <Button type="button" variant={props.priceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setPriceVisible(true)}>O</Button>
                    <Button type="button" variant={!props.priceVisible ? 'default' : 'ghost'} size="sm" className="rounded-lg" onClick={() => props.setPriceVisible(false)}>X</Button>
                  </div>
                </div>
                {props.priceError && <Alert variant="destructive"><AlertDescription>{props.priceError}</AlertDescription></Alert>}
                {props.priceSuccess && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{props.priceSuccess}</AlertDescription></Alert>}
                <Button type="submit" disabled={props.priceUploading} className="w-full">
                  {props.priceUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />등록 중...</> : <><Upload className="mr-2 h-4 w-4" />가격표 등록</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">등록된 가격표</CardTitle>
              <CardDescription>가격표를 수정하거나 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {props.loadingPrices ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : props.prices.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">등록된 가격표가 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>카테고리</TableHead>
                        <TableHead>항목명</TableHead>
                        <TableHead className="hidden md:table-cell">가격</TableHead>
                        <TableHead className="hidden md:table-cell">소요시간</TableHead>
                        <TableHead className="hidden lg:table-cell">설명</TableHead>
                        <TableHead className="w-[180px]">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {props.prices.map((item: any) => (
                        <TableRow key={item.id} className={rowVisibilityClassName(item.visible)}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{item.price}</TableCell>
                          <TableCell className="hidden md:table-cell">{item.duration || '-'}</TableCell>
                          <TableCell className="hidden max-w-xs whitespace-pre-line text-sm text-muted-foreground lg:table-cell">{item.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={() => props.openEditPriceDialog(item)}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                              <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={props.priceDeletingId === item.id} onClick={() => void props.handleDeletePrice(item)}>
                                {props.priceDeletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="reservations">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">예약 현황</CardTitle>
            <CardDescription>예약 내역을 확인하고 수정하거나 삭제할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="reservation-search-start-date">검색 시작일자</Label>
                  <Input id="reservation-search-start-date" type="date" value={props.reservationSearchStartDate} onChange={(event) => props.setReservationSearchStartDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reservation-search-end-date">검색 종료일자</Label>
                  <Input id="reservation-search-end-date" type="date" value={props.reservationSearchEndDate} onChange={(event) => props.setReservationSearchEndDate(event.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={() => { props.setReservationSearchStartDate(''); props.setReservationSearchEndDate(''); }}>
                    초기화
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => props.applyReservationRange('today')}>당일</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => props.applyReservationRange('week')}>1주일</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => props.applyReservationRange('month')}>1달</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => props.applyReservationRange('year')}>1년</Button>
              </div>
            </div>

            {props.reservationError && <Alert variant="destructive"><AlertDescription>{props.reservationError}</AlertDescription></Alert>}
            {props.reservationMessage && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{props.reservationMessage}</AlertDescription></Alert>}
            {props.loadingReservations ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : props.filteredReservations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">검색 조건에 맞는 예약이 없습니다.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>시간</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead className="hidden md:table-cell">연락처</TableHead>
                    <TableHead className="w-[180px]">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {props.paginatedReservations.map((reservation: any) => {
                    const reservationKey = `${reservation.date}_${reservation.time}`;
                    return (
                      <TableRow key={reservation.id} className="cursor-pointer" onClick={() => props.openReservationDetailDialog(reservation)}>
                        <TableCell>{reservation.date}</TableCell>
                        <TableCell>{reservation.time}</TableCell>
                        <TableCell>{reservation.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{reservation.phone}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" className="gap-1 px-2" onClick={(event) => { event.stopPropagation(); props.openEditReservationDialog(reservation); }}><Pencil className="mr-1 h-4 w-4" />수정</Button>
                            <Button type="button" variant="destructive" size="sm" className="gap-1 px-2" disabled={props.reservationDeletingKey === reservationKey} onClick={(event) => { event.stopPropagation(); void props.handleDeleteReservation(reservation); }}>
                              {props.reservationDeletingKey === reservationKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-1 h-4 w-4" />삭제</>}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {!props.loadingReservations && props.filteredReservations.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  총 {props.filteredReservations.length}건 중 {(props.reservationPage - 1) * RESERVATIONS_PER_PAGE + 1}-
                  {Math.min(props.reservationPage * RESERVATIONS_PER_PAGE, props.filteredReservations.length)}건 표시
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={props.reservationPage === 1} onClick={() => props.setReservationPage((prev: number) => Math.max(1, prev - 1))}>이전</Button>
                  <span className="min-w-20 text-center text-sm text-muted-foreground">{props.reservationPage} / {props.reservationTotalPages}</span>
                  <Button type="button" variant="outline" size="sm" disabled={props.reservationPage === props.reservationTotalPages} onClick={() => props.setReservationPage((prev: number) => Math.min(props.reservationTotalPages, prev + 1))}>다음</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">사이트 정보 및 영업시간 설정</CardTitle>
            <CardDescription>영업시간, 휴무일, 주소와 연락처 정보를 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={props.handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="address-line-1">주소</Label>
                  <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => props.setAddressSearchOpen(true)}>
                    <Search className="mr-2 h-4 w-4" />
                    주소 검색
                  </Button>
                </div>
                <Input id="address-line-1" value={props.settings.addressLine1} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, addressLine1: event.target.value }))} placeholder="서울 강남구 테헤란로 123" />
              </div>
              <div className="space-y-2"><Label htmlFor="address-line-2">상세주소</Label><Input id="address-line-2" value={props.settings.addressLine2} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, addressLine2: event.target.value }))} placeholder="네일아트 빌딩 2층" /></div>
              <div className="space-y-2"><Label htmlFor="map-query">지도 검색어</Label><Input id="map-query" value={props.settings.mapQuery} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, mapQuery: event.target.value }))} placeholder="지도에 표시할 검색어" /></div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="phone">전화번호</Label><Input id="phone" value={props.settings.phone} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, phone: event.target.value }))} placeholder="02-1234-5678" /></div>
                <div className="space-y-2"><Label htmlFor="email">이메일</Label><Input id="email" type="email" value={props.settings.email} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, email: event.target.value }))} placeholder="contact@nailart.com" /></div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                  <Label>평일 영업시간</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={props.settings.weekdayHours.startHour} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekdayHours: props.updateTimeRange(prev.weekdayHours, 'startHour', event.target.value) }))} placeholder="시작 시" />
                    <Input value={props.settings.weekdayHours.startMinute} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekdayHours: props.updateTimeRange(prev.weekdayHours, 'startMinute', event.target.value) }))} placeholder="시작 분" />
                    <Input value={props.settings.weekdayHours.endHour} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekdayHours: props.updateTimeRange(prev.weekdayHours, 'endHour', event.target.value) }))} placeholder="종료 시" />
                    <Input value={props.settings.weekdayHours.endMinute} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekdayHours: props.updateTimeRange(prev.weekdayHours, 'endMinute', event.target.value) }))} placeholder="종료 분" />
                  </div>
                </div>
                <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                  <Label>주말 영업시간</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={props.settings.weekendHours.startHour} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekendHours: props.updateTimeRange(prev.weekendHours, 'startHour', event.target.value) }))} placeholder="시작 시" />
                    <Input value={props.settings.weekendHours.startMinute} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekendHours: props.updateTimeRange(prev.weekendHours, 'startMinute', event.target.value) }))} placeholder="시작 분" />
                    <Input value={props.settings.weekendHours.endHour} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekendHours: props.updateTimeRange(prev.weekendHours, 'endHour', event.target.value) }))} placeholder="종료 시" />
                    <Input value={props.settings.weekendHours.endMinute} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, weekendHours: props.updateTimeRange(prev.weekendHours, 'endMinute', event.target.value) }))} placeholder="종료 분" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label>휴무일</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day: string) => {
                    const active = props.settings.closedDays.includes(day);
                    return <Button key={day} type="button" variant={active ? 'default' : 'outline'} className="cursor-pointer" onClick={() => props.handleToggleClosedDay(day)}>{day}</Button>;
                  })}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="instagram-url">인스타그램 주소</Label><Input id="instagram-url" value={props.settings.instagramUrl} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, instagramUrl: event.target.value }))} placeholder="https://instagram.com/..." /></div>
                <div className="space-y-2"><Label htmlFor="tiktok-url">틱톡 주소</Label><Input id="tiktok-url" value={props.settings.tiktokUrl} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, tiktokUrl: event.target.value }))} placeholder="https://www.tiktok.com/..." /></div>
                <div className="space-y-2"><Label htmlFor="facebook-url">페이스북 주소</Label><Input id="facebook-url" value={props.settings.facebookUrl} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, facebookUrl: event.target.value }))} placeholder="https://facebook.com/..." /></div>
                <div className="space-y-2"><Label htmlFor="kakao-open-chat-url">카카오톡 오픈채팅방 주소</Label><Input id="kakao-open-chat-url" value={props.settings.kakaoOpenChatUrl} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, kakaoOpenChatUrl: event.target.value }))} placeholder="https://open.kakao.com/..." /></div>
                <div className="space-y-2"><Label htmlFor="x-url">X 주소</Label><Input id="x-url" value={props.settings.xUrl} onChange={(event) => props.setSettings((prev: any) => ({ ...prev, xUrl: event.target.value }))} placeholder="https://x.com/..." /></div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/50">
                <div className="border-b px-4 py-3 text-sm font-medium text-foreground">지도 미리보기</div>
                <iframe title="주소 미리보기" src={props.getMapEmbedUrl(props.settings.mapQuery || props.settings.addressLine1)} className="h-80 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              {props.settingsError && <Alert variant="destructive"><AlertDescription>{props.settingsError}</AlertDescription></Alert>}
              {props.settingsMessage && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{props.settingsMessage}</AlertDescription></Alert>}
              <Button type="submit" disabled={props.settingsSaving} className="w-full sm:w-auto">
                {props.settingsSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : <><MapPinned className="mr-2 h-4 w-4" />설정 저장</>}
              </Button>
            </form>

            <div className="mt-8 border-t border-border/60 pt-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">관리자 비밀번호 변경</h3>
                <p className="text-sm text-muted-foreground">비밀번호는 해시 처리되어 `settings/admin` 문서의 `pwd` 필드에 저장됩니다.</p>
              </div>
              <form onSubmit={props.handleUpdateAdminPassword} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2"><Label htmlFor="current-admin-password">현재 비밀번호</Label><Input id="current-admin-password" type="password" value={props.currentAdminPassword} onChange={(event) => props.setCurrentAdminPassword(event.target.value)} autoComplete="current-password" /></div>
                  <div className="space-y-2"><Label htmlFor="next-admin-password">새 비밀번호</Label><Input id="next-admin-password" type="password" value={props.nextAdminPassword} onChange={(event) => props.setNextAdminPassword(event.target.value)} autoComplete="new-password" /></div>
                  <div className="space-y-2"><Label htmlFor="confirm-admin-password">새 비밀번호 확인</Label><Input id="confirm-admin-password" type="password" value={props.confirmAdminPassword} onChange={(event) => props.setConfirmAdminPassword(event.target.value)} autoComplete="new-password" /></div>
                </div>
                {props.passwordError && <Alert variant="destructive"><AlertDescription>{props.passwordError}</AlertDescription></Alert>}
                {props.passwordMessage && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{props.passwordMessage}</AlertDescription></Alert>}
                <Button type="submit" disabled={props.passwordSaving} className="w-full sm:w-auto">
                  {props.passwordSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />변경 중...</> : '비밀번호 변경'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
