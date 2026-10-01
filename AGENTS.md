# AGENTS.md

`hams-neil-shop`에서 작업하는 코딩 에이전트와 기여자를 위한 지침입니다. 문서와 구현이 다르면 실제 코드와 설정을 확인하고 문서도 함께 갱신합니다.

## 프로젝트 개요

- React 18 + TypeScript + Vite 기반 네일숍 SPA
- Firebase Firestore/Storage 기반 콘텐츠와 예약 관리
- Node/Vercel Functions 기반 HAMS SSO
- Tailwind CSS 4와 `src/components/ui`의 shadcn/ui 사용
- 경로 별칭: `@/*` → `src/*`

## 작업 전 확인

1. `package.json`, `README.md`, 변경 대상 주변 코드를 읽습니다.
2. `git status --short`로 사용자의 기존 변경을 확인하고 보존합니다.
3. 모델 변경 시 `src/lib/index.ts`, 관련 `*Storage.ts`, 모든 사용처를 검색합니다.
4. SSO 변경 시 `.env.example`, `server/`, `api/`, `src/lib/sso.ts`를 함께 검토합니다.
5. 모든 기능 추가, 수정, 버그 해결 내용을 `HISTORY.md`의 최신 날짜 항목에 반드시 기록합니다.

## 설계 규칙

- 라우트는 `src/lib/index.ts`의 `ROUTE_PATHS`에 추가하고 `src/App.tsx`에서 연결합니다.
- Firebase 접근은 화면에 직접 넣지 말고 `src/lib/*Storage.ts`에 둡니다.
- Firebase 미설정 환경의 기본 데이터/localStorage 폴백을 유지합니다.
- 공개 콘텐츠는 `visible === false`를 제외합니다. 새 필드는 과거 문서에도 안전하도록 정규화합니다.
- 이미지 교체/삭제 시 Firebase Storage의 이전 파일 정리도 고려합니다.
- 예약 슬롯 고유성은 `YYYY-MM-DD_HH-MM` ID와 transaction으로 보장합니다.
- 앱은 `HashRouter`를 사용합니다. `react-router-dom`은 Vite 별칭으로 `src/lib/react-router-dom-proxy.tsx`를 거치므로 프록시 기능을 확인하지 않고 제거하지 않습니다.
- 기존 localStorage/sessionStorage 키의 호환성을 유지합니다.

## 인증과 보안

- `VITE_*`에 비밀값을 넣지 않습니다.
- 서버 비밀값은 `SERVICE_SSO_CLIENT_SECRET`, `SERVICE_SESSION_SECRET`을 사용합니다.
- `VITE_ADMIN_EMAILS`는 메뉴 노출 필터이며 권한 검증이 아닙니다.
- 관리자 비밀번호 UI도 서버 권한을 대신하지 않습니다. 쓰기 변경 시 Firebase Security Rules 또는 서버 API가 필요한지 평가합니다.
- HttpOnly, SameSite, 운영 환경 Secure 쿠키와 SSO state 검증을 약화하지 않습니다.
- 세션, 비밀번호, 인증 code, secret, 고객 전화번호를 로그에 남기지 않습니다.

## 코드 스타일

- 기존 TypeScript와 함수형 React 스타일을 따릅니다.
- 프런트엔드 import는 가급적 `@/` 별칭을, 서버는 명시적 상대 경로를 사용합니다.
- 도메인 타입은 가급적 `src/lib/index.ts`에 둡니다.
- UI 문구는 한국어 톤을 유지하고 오류에는 사용자가 취할 조치를 포함합니다.
- `src/components/ui`를 불필요하게 일괄 수정하지 않습니다.
- 관련 없는 리팩터링, 의존성 업그레이드, 잠금 파일 변경을 섞지 않습니다.

## 검증

```bash
npm run lint
npm run build
```

SSO 변경 시 `/api/me`의 401, 로그인 state/redirect URI, 콜백 후 세션, 로그아웃 후 중앙 이동을 확인합니다. Firebase 변경 시 구성/미구성 환경, 예약 중복, 실시간 구독, 이미지 교체·삭제를 점검합니다.

## 완료 기준

- 데스크톱과 모바일에서 요청 기능이 동작합니다.
- 로딩, 빈 데이터, 오류, Firebase 미설정 상태가 처리됩니다.
- lint와 production build가 통과합니다.
- 새 환경 변수와 운영 절차가 README와 `.env.example`에 반영됩니다.
- 작업 내용을 `HISTORY.md`에 반영합니다.
- 보안 동작이 단순 메뉴 숨김에만 의존하지 않습니다.
