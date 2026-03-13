# 블링 (Vling Clone)

YouTube 데이터 분석 및 인플루언서 마케팅 플랫폼

## 주요 기능

- **채널 검색** — YouTube Data API v3 연동, 무한스크롤, CSV 내보내기
- **유튜브 순위** — 구독자/조회수/수익/슈퍼챗/성장률 랭킹
- **채널 상세** — 개요/영상/수익/AI분석 탭, 인기영상 TOP10
- **AI 파인더** — Anthropic Claude 연동, 자연어 채널 추천
- **수익 계산기** — CPM 기반 예상 수익 시뮬레이션
- **채널 비교** — 최대 4채널, Bar/Radar 차트
- **카테고리 트렌드** — CPM/성장률/채널수 대시보드
- **요즘 뜨는 채널** — 성장률 기반 랭킹
- **즐겨찾기** — Zustand persist
- **인증** — NextAuth v5 (Credentials)
- **다크/라이트 테마**
- **토스트 알림**

## 기술 스택

- Next.js 15 App Router + TypeScript + Turbopack
- Tailwind CSS v4 + shadcn/ui v4
- Recharts, TanStack React Query, Zustand
- YouTube Data API v3, Anthropic SDK

## 시작하기

### 1. 클론 및 설치

```bash
git clone https://github.com/pengu85/vling-clone.git
cd vling-clone
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성:

```env
# YouTube Data API v3 (필수 - 채널 검색/상세)
YOUTUBE_API_KEY=your_youtube_api_key

# Anthropic API (선택 - AI 기능, 없으면 mock 데이터 사용)
ANTHROPIC_API_KEY=your_anthropic_api_key

# NextAuth (필수 - 인증)
NEXTAUTH_SECRET=any_random_string_here
NEXTAUTH_URL=http://localhost:4000
```

**API 키 발급:**
- YouTube: [Google Cloud Console](https://console.cloud.google.com/) → API 및 서비스 → YouTube Data API v3 활성화
- Anthropic: [Anthropic Console](https://console.anthropic.com/) → API Keys

### 3. 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

### 4. 데모 계정

```
이메일: demo@vling.com
비밀번호: password123
```

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/          # 로그인/회원가입
│   ├── (main)/          # 메인 레이아웃 (사이드바+헤더)
│   │   ├── search/      # 채널 검색
│   │   ├── ranking/     # 순위 (수익/슈퍼챗/성장/카테고리)
│   │   ├── channel/     # 채널 상세
│   │   ├── tools/       # AI파인더/계산기/비교/AI콘텐츠
│   │   └── my/          # 즐겨찾기
│   └── api/             # API 라우트
├── components/          # UI 컴포넌트
├── hooks/               # React Query 커스텀 훅
├── stores/              # Zustand 스토어
├── lib/                 # 유틸리티 (youtube, ai, csv 등)
├── domain/              # 비즈니스 로직
└── types/               # TypeScript 타입
```
