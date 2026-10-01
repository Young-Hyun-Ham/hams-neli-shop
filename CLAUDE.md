# CLAUDE.md

Claude Code 등 AI 개발 도구를 위한 프로젝트 컨텍스트입니다. 공통 작업 규칙은 [AGENTS.md](./AGENTS.md)를 먼저 따릅니다.

## 핵심 구조

- 앱 진입: `src/main.tsx` → `src/App.tsx`
- 레이아웃/로그인 상태: `src/components/Layout.tsx`
- 고객 화면: `src/pages/Home.tsx`, `Events.tsx`, `GalleryPage.tsx`, `Testimonials.tsx`, `Review.tsx`
- 관리자: `src/pages/Admin.tsx`, `src/components/admin/*`
- 공유 타입/라우트/기본 설정: `src/lib/index.ts`
- Firebase: `src/lib/firebase.ts`, `src/lib/*Storage.ts`
- 클라이언트 SSO: `src/lib/sso.ts`, `src/lib/auth-store.ts`
- 서버 SSO/세션: `server/sso-handler.ts`, `server/sso-session.ts`
- 로컬 통합 서버: `server/dev-server.mjs`
- Vercel 함수: `api/`

## 연결 관계

- 서비스/가격: 기본 데이터, 홈 localStorage 캐시, 관리자 CRUD를 함께 확인합니다.
- 영업시간: 설정, 예약 가능 시간 계산, 홈 표시를 함께 확인합니다.
- 갤러리: 카테고리 공개 여부, `categoryId`, 대표 이미지, Storage 정리를 확인합니다.
- 후기: 목록/상세/작성·수정, 최대 5장 이미지, 브라우저 초안을 확인합니다.
- SSO: 로컬 서버와 Vercel 함수가 `server/sso-handler.ts`를 공유합니다.
- 라우터: Vite가 `react-router-dom`을 로컬 프록시로 치환합니다.
- 이미지: production build의 `cdnPrefixImages`는 실제 `public/images` 파일만 CDN 경로로 바꿉니다.

## 데이터 폴백

Firebase 구성 여부는 `isFirebaseConfigured`로 판단합니다.

- 예약: localStorage
- 사이트 설정: `DEFAULT_SITE_SETTINGS`
- 서비스/가격: 홈 캐시 또는 `src/data/index.ts`
- 이벤트: 기본 이벤트 데이터 사용 가능
- 그 외 Firebase 콘텐츠: 모듈별 빈 목록 또는 기본 동작

새 기능은 Firebase가 없는 로컬 환경에서 앱 전체를 중단시키지 않아야 합니다.

## 인증 모델

SSO 세션은 HMAC-SHA256 서명 쿠키로 7일, 로그인 state는 10분간 유지됩니다. 중앙 로그아웃 전달 토큰은 AES-256-GCM으로 암호화됩니다.

관리자 진입의 `VITE_ADMIN_EMAILS`는 내비게이션 노출을, `settings/admin.pwd`는 관리자 화면 비밀번호를 담당합니다. 둘 다 Firebase 서버 권한을 대신하지 않습니다.

## 권장 작업 순서

1. 타입과 storage 모듈을 읽습니다.
2. 데이터를 사용하는 화면을 `rg`로 모두 찾습니다.
3. 최소 범위로 구현하고 폴백을 유지합니다.
4. `npm run lint`와 `npm run build`를 실행합니다.
5. 환경 변수, 컬렉션, 운영 절차가 바뀌면 문서를 갱신합니다.

현재 프런트엔드 자동 테스트는 없습니다. 복잡한 로직 추가 시 순수 함수 분리와 테스트 도입을 고려합니다.
