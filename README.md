# HAMS Neil Shop

`hams-neil-shop`은 네일숍 고객용 소개·예약 사이트와 운영자용 콘텐츠 관리 화면을 제공하는 React SPA입니다. 서비스, 가격, 이벤트, 갤러리, 후기, 매장 정보와 예약을 Firebase에서 관리합니다. Firebase가 없는 개발 환경에서는 일부 기본 데이터와 브라우저 저장소를 사용합니다.

> 프로젝트 이름에는 `neil`이 사용되지만 서비스 도메인은 nail shop(네일숍)입니다.

## 주요 기능

- 홈: 서비스, 가격표, 최근 후기, 진행 중 이벤트 팝업, 매장 정보와 지도
- 예약: 영업시간·휴무일 반영, 동일 시간대 중복 예약 방지
- 이벤트 및 카테고리별 이미지·동영상 갤러리
- 후기: 별점·텍스트·사진(최대 5장) 등록, 비밀번호 기반 수정/삭제
- 관리자: 콘텐츠, 예약·정산, 매장 설정 및 관리자 비밀번호 관리
- HAMS 통합 로그인: 로그인/로그아웃, 사용자 세션, 이메일별 관리자 메뉴 표시
- 빌드 시 `public/images` 경로의 선택적 CDN 치환

## 기술 스택

- React 18, TypeScript, Vite 5
- Tailwind CSS 4, shadcn/ui(Radix UI), Framer Motion
- React Router, TanStack Query, Zustand
- Firebase Firestore 및 Storage
- Node.js 개발 서버와 Vercel Functions 기반 SSO API

## 시작하기

Node.js 18 이상(20 LTS 권장)과 npm이 필요합니다.

```bash
npm install
copy .env.example .env.local
npm run dev
```

통합 개발 서버는 기본 `http://localhost:3002`에서 Vite와 SSO API를 함께 구동합니다. 프런트엔드만 실행하려면 `npm run dev:vite`를 사용하며 기본 포트는 `8080`입니다.

## 환경 변수

| 변수 | 용도 |
| --- | --- |
| `VITE_FIREBASE_*` | Firebase 앱, Firestore, Storage 연결 정보 |
| `VITE_SSO_AUTH_ORIGIN` | 중앙 인증 서비스 주소 |
| `VITE_SSO_CLIENT_ID` | SSO 서비스 ID |
| `VITE_SERVICE_PORT` | 로컬 통합 서버 포트 |
| `VITE_SERVICE_ORIGIN` | 서비스의 공개 origin |
| `VITE_SSO_CALLBACK_PATH` | SSO 콜백 경로 |
| `VITE_SSO_LOGIN_START_PATH` | 로그인 시작 경로 |
| `VITE_SSO_ME_ENDPOINT` | 현재 사용자 조회 API |
| `VITE_SSO_LOGOUT_ENDPOINT` | 로그아웃 API |
| `VITE_SSO_EXCHANGE_PATH` | 인증 코드 교환 API 경로 |
| `VITE_ADMIN_EMAILS` | 관리자 메뉴 노출 이메일(쉼표 구분) |
| `SERVICE_SSO_CLIENT_SECRET` | 서버 간 SSO 비밀값 |
| `SERVICE_SESSION_SECRET` | 서비스 세션 서명 키 |
| `SERVICE_SESSION_COOKIE_NAME` | HttpOnly 세션 쿠키 이름 |
| `VITE_SERVICE_SESSION_HINT_COOKIE_NAME` | 클라이언트용 로그인 힌트 쿠키 이름 |
| `SERVICE_SSO_STATE_COOKIE_NAME` | SSO state 검증 쿠키 이름 |
| `CDN_IMG_PREFIX` | 선택 사항. 이미지 CDN 기본 URL |
| `CDN_IMG_DEBUG` | `1`이면 CDN 변환 로그 출력 |

운영 환경의 서버 비밀값은 충분히 긴 임의 값으로 교체하고 `VITE_*` 변수에 넣지 마세요.

## 명령어

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | SSO API 포함 개발 서버 |
| `npm run dev:vite` | Vite 서버만 실행 |
| `npm run build` | 운영 번들 생성 |
| `npm run build:dev` | 개발 모드 및 소스맵 빌드 |
| `npm run build:map` | 운영 모드 소스맵 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 빌드 결과 미리보기 |

프런트엔드 자동 테스트는 현재 없습니다. 최소 검증은 `npm run lint`와 `npm run build`입니다.

## 라우트

클라이언트는 `HashRouter`를 사용합니다.

| 경로 | 화면 |
| --- | --- |
| `#/` | 홈 |
| `#/events` | 이벤트 |
| `#/gallery` | 갤러리 |
| `#/testimonials` | 후기 목록 |
| `#/review` | 후기 작성/수정 |
| `#/admin` | 관리자 로그인 및 관리 |

`/auth/sso/login`, `/auth/sso/callback`, `/api/me`, `/api/logout`은 Node 서버 또는 Vercel Functions가 처리합니다.

## 데이터 구조

| Firestore 경로 | 내용 |
| --- | --- |
| `services` | 서비스 소개와 이미지 |
| `priceItems` | 카테고리별 가격 |
| `events` | 이벤트 내용, 기간, 공개 여부 |
| `galleryCategories` | 갤러리 카테고리 |
| `galleryImages` | 카테고리별 이미지 |
| `videos` | 외부 동영상 URL |
| `testimonials` | 후기, 별점, 이미지, 수정용 비밀번호 |
| `reservations` | 예약 및 정산. 문서 ID는 `날짜_시간` 형식 |
| `settings/site` | 주소, 연락처, 영업시간, 휴무일, SNS |
| `settings/admin` | SHA-256 처리된 관리자 비밀번호 |

업로드 파일은 Firebase Storage에 저장됩니다. Firebase 미설정 시 예약은 `localStorage`, 설정은 기본값을 사용합니다. 서비스와 가격은 홈 캐시 및 `src/data/index.ts` 데이터로 보완됩니다.

## 구조

```text
api/                         Vercel API와 SSO 함수
server/                      개발 서버, 세션, SSO 처리
public/images/               정적 이미지
src/components/              레이아웃, 도메인 및 공통 UI
src/data/                    기본 서비스·가격·후기 데이터
src/lib/*Storage.ts          Firebase 데이터 접근 계층
src/lib/auth-store.ts        SSO 사용자 상태
src/pages/                   라우트 화면
src/App.tsx                  라우팅과 전역 Provider
```

## 인증과 보안

- SSO 세션은 HMAC 서명된 HttpOnly 쿠키이며 기본 유효 기간은 7일입니다. 운영 환경에는 `Secure`가 적용됩니다.
- `VITE_ADMIN_EMAILS`는 관리자 메뉴 표시만 제어합니다. `#/admin`은 별도 관리자 비밀번호를 확인합니다.
- 관리자 비밀번호 검증과 Firebase 쓰기는 브라우저에서 수행됩니다. 반드시 Firestore/Storage Security Rules로 실제 권한을 제한하세요.
- 기본 관리자 비밀번호는 `admin1234`입니다. 최초 배포 즉시 변경하고 `settings/admin` 접근도 제한해야 합니다.
- 후기 비밀번호도 클라이언트 중심 구조이므로 강한 인증 수단으로 간주하면 안 됩니다.

## 배포

`vercel.json`은 SSO 시작/콜백을 서버리스 함수로 전달하고 나머지 경로를 SPA 진입점으로 보냅니다. Vercel 환경 변수를 등록한 뒤 Firebase 허용 도메인과 SSO redirect URI를 실제 도메인에 맞추세요.

추가 개발 지침은 [AGENTS.md](./AGENTS.md), AI 도구용 컨텍스트는 [CLAUDE.md](./CLAUDE.md), 변경 이력은 [HISTORY.md](./HISTORY.md)를 참고하세요.
