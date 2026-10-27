# 프로젝트: WhereHouse (집안 재고 관리 앱)

- Android 패키지명: io.github.leesh00.wherehouse (Play 등록 후 변경 불가)

## 개요

- 1인 가구가 생필품 재고·위치·유통기한을 관리하는 모바일 웹앱.
- 목적: 중복 구매 방지, 보관 위치 기억, 유통기한 관리.
- 프론트엔드 이직 포트폴리오용. 모든 결정과 문제 해결을 docs/에 기록한다.

## 기술 스택

- Next.js (App Router) + TypeScript (strict)
- 상태관리: Zustand / 스타일: Tailwind CSS
- 저장소: 1차는 IndexedDB (idb 라이브러리)
- 테스트: Vitest (로직 레이어 단위 테스트)
- 패키지 매니저: npm만 사용 (pnpm, yarn 사용 금지)
- 린트·포맷: ESLint + Prettier. 커밋 전 npm run lint와 Prettier 포맷을 통과해야 한다.
- 저장소: GitHub leesh00 조직 (github.com/leesh00/wherehouse), Public. Vercel Hobby는 조직의 비공개 저장소를 배포할 수 없음.
- 배포: Vercel (Hobby, 비상업용. 상업화 시 Cloudflare Pages 또는 Vercel Pro로 이전)
- 앱 전환: 2차 이후 Capacitor로 Android 앱 배포. iOS는 Mac 확보 전까지 제외.
- Next.js는 정적 내보내기(output: 'export')로 빌드한다. SSR, API 라우트, 서버 액션 사용 금지. next/image는 unoptimized로 쓴다.

## 구조 규칙 (반드시 지킬 것)

- src/core/ : 데이터 처리, 계산, 저장소 어댑터. React·DOM·Next.js import 금지.
- src/hooks/ : core를 감싼 훅. Capacitor 플러그인 직접 호출 금지 (core/ 어댑터 경유).
- src/app/, src/components/ : 화면 UI만.
- 저장소는 StorageAdapter 인터페이스로만 접근한다. localStorage·indexedDB 직접 호출 금지.

## 라우팅 규칙

- App Router + 정적 내보내기. next.config에 output: 'export', trailingSlash: true 설정.
- 동적 경로(\[id]) 사용 금지. id는 쿼리 파라미터로 넘긴다.

  - 홈: /
  - 목록: /list?loc=위치id
  - 등록: /item/new?loc=위치id
  - 수정: /item/edit?id=재고id

- useSearchParams를 쓰는 컴포넌트는 반드시 Suspense로 감싼다.

## 상태관리 규칙

- 저장 데이터의 원본은 IndexedDB. 스토어는 core/ 어댑터를 통해서만 읽고 쓴다.
- Zustand 스토어에는 불러온 재고·위치 데이터와 그 변경 함수만 둔다.
- 지금 보는 위치, 수정 중인 재고 id는 스토어가 아닌 URL 쿼리로 관리한다.
- 폼 입력값, 모달 열림 같은 화면 상태는 컴포넌트 안 useState로 관리한다.
- 저장 흐름: 화면 → 스토어 함수 → 어댑터 저장 → 성공 시 스토어 갱신.

## 데이터 모델

- Location: id, name, parentId, depth, order

  - 트리 구조. parentId가 null이면 최상위(방), 값이 있으면 그 위치의 하위(서랍장, 칸).
  - 예: 방 > 1번 서랍장 > 2칸. depth는 0(방)부터 시작, 최대 2까지 허용.
  - order는 같은 부모 안에서의 순서.
  - 기본 방: 방, 부엌, 화장실. 사용자가 추가·수정·삭제 가능.

- Item: id, name, category, locationId, quantity, unit,
  purchasedAt(입고일), expiresAt(유통기한, 선택), memo, createdAt, updatedAt
- 날짜는 ISO 문자열로 저장한다.
- Item.locationId는 가장 구체적인 위치(예: 1번 서랍장)를 가리킨다.
- 상위 위치의 재고 조회 시 하위 위치 재고까지 포함한다 (core/의 getDescendantIds 사용).
- 위치 표시는 경로로 한다: "방 > 1번 서랍장" (core/의 getLocationPath 사용).
- 하위 위치나 재고가 있는 위치는 삭제할 수 없다.

## 화면 규칙

- 기준 폭 375px, 최대 768px. PC에서도 768px로 가운데 정렬.
- 화면 깊이는 최대 2뎁스.
- 접근성: 버튼 최소 44px, 색만으로 상태를 구분하지 않는다.

## 제약

- 1\~2차는 무료 서비스만 사용. 신용카드 등록이 필요한 서비스는 쓰지 않는다.
- 외부 서비스를 추가할 때는 무료 한도와 비용 발생 조건을 먼저 보고한다.
- 서버를 쓰더라도 로컬 우선 저장, 서버는 동기화용으로 설계한다.
- 저장소는 Public이다. .env 등 API 키·비밀번호가 담긴 파일은 절대 커밋하지 않는다. 커밋 전 .gitignore에 포함됐는지 확인하고, 코드에 키를 직접 쓰지 않는다.

## 작업 방식

- 기능 하나를 끝낼 때마다 멈추고 결과를 요약해 확인받는다.
- 새 패키지 설치 전에 이유와 대안을 먼저 묻는다.
- 커밋 메시지: feat/fix/docs/refactor/test: 요약 (한글)

## 문서화 규칙

- 기술 선택: docs/decisions/NNN-제목.md (결정 템플릿)
- 문제 해결: docs/troubleshooting/YYYY-MM-DD-제목.md (트러블슈팅 템플릿)
- 차수 완료 시: docs/retro/N차.md 에 한 일, 남은 일, 배운 점
