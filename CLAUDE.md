# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (granite CLI)
npm run dev:local    # Dev server with MODE=development
npm run dev:remote   # Dev server with MODE=remote (remote backend)
npm run build        # Production build (ait build)
npm run build:prod   # Build with MODE=production
npm run lint         # Run ESLint
npm run deploy       # Deploy via AIT (ait deploy)
```

There are no automated tests configured in this project.

## Architecture

**dayLine** is a one-line diary mini-app running inside the Toss app (Apps in Toss platform). Users write a single sentence about their day, watch an ad while GPT-4o-mini analyzes sentiment, then view emotion score graphs.

### Build System

`granite` is the Toss-internal dev CLI (wraps Vite). Build/deploy uses `ait` CLI (`@apps-in-toss/web-framework` v2.4.6). The `@apps-in-toss/web-framework` package provides native bridge APIs (anonymous key, Toss login, AdMob). Production deploy is via the `ait` CLI. `TDSMobileAITProvider` wrapper is only applied in production/AIT environments (detected via hostname or `MODE`).

### Pages and Routing

Four routes in `src/App.tsx`:
- `/` → `IntroPage` — login landing; uses anonymous login (`getAnonymousKey`) instead of Toss OAuth
- `/write` → `WritePage` — diary entry form; navigates to `/stats` on submit
- `/stats` → `StatsPage` — emotion graph + calendar view with month Swiper navigation
- `/rewrite` → `RewritePage` — edit an existing diary entry; reads `location.state.entry` (DiaryEntry), redirects to `/stats` if missing

`StatsPage` accepts `location.state.skipComplete` to skip the post-write completion screen.

### Auth Flow

Anonymous login (no Toss account required):
1. `getAnonymousKey()` from `@apps-in-toss/web-framework` → `{ hash, type: 'HASH' } | 'ERROR' | undefined`
2. Hash sent to backend `POST /v1/auth/anonymous/login` (TODO: path TBD) → returns `user_key`
3. `user_key` stored in `localStorage`; sent as raw `Authorization` header (no Bearer prefix)

**Merge flow** (existing data import): "기존 데이터 불러오기" button in StatsPage opens `MergeDataBottomSheet`, which calls `mergeDataWithToss()` → `appLogin()` → backend login → `PUT /v1/users/merge` (TODO).

### Data Flow: Diary Submit

`WritePage` → `useDiarySubmit` hook:
1. `showAd()` (AdMob) and GPT analysis run in **parallel** via `Promise.all`
2. GPT response (`analyzeDiaryText`) returns `{ line, score, description }`
3. `saveDiaryMutation` saves to backend with `description` included
4. Navigates to `/stats` on success

`RewritePage` → `useRewriteSubmit` hook: same parallel pattern, calls `updateDiaryMutation` instead, navigates to `/stats?skipComplete=true`.

### Data Fetching Architecture (StatsPage)

Two-tier data fetching strategy:
1. **Primary**: `useRecentYearDiaries()` — single `GET /v1/scores` (no params) fetches last 12 months at once
2. **On-demand**: `useMultipleMonthlyDiaries(extraMonths)` — `GET /v1/scores?year=Y&month=M` only for months older than initial range

`StatsPage` maintains a dynamic `monthRange` state (array of `{year, month}`). When user swipes to the leftmost slide (index 0), 6 months are prepended and `swiper.slideTo(BATCH, 0)` is called (no animation) to maintain position. This enables infinite backward scrolling without fetching data upfront.

`useHasTodayDiary` uses `useRecentYearDiaries` (not `useMonthlyDiaries`) to check for today's diary — so `useSaveDiary.onSuccess` must invalidate **both** `DIARY_KEYS.monthly(year, month)` and `DIARY_KEYS.recentYear()`.

### Services Layer (`src/services/`)

- **`api.ts`** — base `apiRequest<T>` helper; reads `user_key` from `localStorage` and sets it as the `Authorization` header (raw number, no `Bearer` prefix); base URL from `VITE_API_BASE_URL`
- **`diary.ts`** — CRUD for diary entries; `getMonthlyDiaries(year, month)` (1-indexed month), `getRecentYearDiaries()` (no params), `saveDiary`, `updateDiary` (currently mocked as POST, TODO: PUT /v1/scores/:id)
- **`tossAuth.ts`** — anonymous login + Toss merge flow; `loginWithAnonymousKey()`, `mergeDataWithToss()`; `loginWithToss()` is deprecated
- **`gpt.ts`** — calls OpenAI `gpt-4o-mini` with structured JSON output; requires `VITE_OPENAI_API_KEY`

### Hooks (`src/hooks/`)

- `hooks/domain/auth/useLogin.ts` — wraps `loginWithAnonymousKey` for the intro page
- `hooks/domain/diary/useDiaryData.ts` — TanStack Query hooks; `useRecentYearDiaries`, `useMonthlyDiaries`, `useMultipleMonthlyDiaries`, `useHasTodayDiary`, `useSaveDiary`, `useUpdateDiary`
- `hooks/domain/diary/useDiarySubmit.ts` — ad + GPT + save orchestration (new diary)
- `hooks/domain/diary/useRewriteSubmit.ts` — ad + GPT + update orchestration (edit diary)
- `hooks/common/useAdMob.ts` — loads and shows Toss AdMob interstitials
- `hooks/common/useTextInput.ts` — text validation for the diary input

### Components

- `components/stats/GraphView.tsx` — Recharts `LineChart` via shadcn `ChartContainer`/`ChartTooltip` (adapted with inline styles, no Tailwind); custom dot with enlarged touch area
- `components/stats/CalendarView.tsx` — monthly calendar grid
- `components/stats/StatsDetailView.tsx` — Swiper of diary entries synced bidirectionally with GraphView/CalendarView selected date; ✏️ button navigates to `/rewrite`
- `components/ui/chart.tsx` — shadcn chart adapted without Tailwind (inline styles, CSS variables)
- `components/bottomSheets/MergeDataBottomSheet.tsx` — data merge UI for anonymous → Toss account migration

### Month Indexing Convention

`month` is **0-indexed** (JavaScript convention) throughout the frontend. All hooks/services convert to 1-indexed before hitting the backend API.

### Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (defaults to `/dayline/api`) |
| `VITE_OPENAI_API_KEY` | OpenAI API key for GPT analysis |
| `VITE_PORT` | Dev server port |

Env files: `.env.development` (local), `.env.remote` (remote backend), `.env.production`.


## Commit Message Convention

모든 커밋 메시지를 작성할 때는 아래 규칙과 형식을 엄격하게 준수.
커밋 메시지 형식: `타입: 변경 사항에 대한 한국어 요약`

### 타입 (Type) 가이드
* **feat**: 새로운 기능 추가에 대해 간단히 서술
* **fix**: 버그 및 오류 수정
* **docs**: 문서 내용 변경 (README.md, 주석 등)
* **style**: 코드 포맷팅, 세미콜론 누락 수정 등 (코드 로직 변경이 없는 경우)
* **refactor**: 코드 리팩토링 (결과나 기능의 변경은 없음)
* **test**: 테스트 코드 추가 및 수정
* **chore**: 빌드 스크립트, 패키지 매니저(package.json 등) 설정 변경

### [작성 세부 규칙]
1. 제목은 '타입: 작업 내용' 형태로 작성하며, 반드시 한국어로 명확하고 간결하게 작성합니다.
2. 제목의 끝에는 마침표(.)를 찍지 않으며, 명사형으로 끝내는 것을 권장합니다. (예: ~ 기능 추가, ~ 버그 수정)
3. 커밋이 여러 논리적 단위로 쪼개질 수 있다면, 최대한 독립적인 기능/수정 단위로 분리하여 여러 개의 커밋으로 제안해 주세요.