---
category: Body Blocks
---
작품 카드 — 시트 안에서 작품 하나를 소개하는 따뜻한 종이색(#FAF6EB) 카드. radius 12px, 테두리 #E0D7C2, 그림자 없음(시트 안이라서). 우측에 180px 정방형 썸네일.

## 언제 쓰나
N선·추천 목록·비교 글에서 작품 1개 = 카드 1개. NzPaperSheet 안에서만 스타일이 적용된다. 위계: 소제목(h2) 아래 2단.

## Props
- `title` 작품명 (Jua 21px 700) · `sub` 제작사/시리즈 (16px 회색, 모바일 줄바꿈)
- `meta` 한 줄 메타 "난이도 ★★☆ · 1~2인 · 2,500엔" (13px)
- `description` 문자열 또는 문자열 배열 → 문단들
- `image` / `imageAlt` 썸네일 (정방형 권장, 180→모바일 124px)
- `href` / `linkLabel` 우측 하단 링크 (기본 "리뷰 보러가기 →")
- `children` 추가 블록

## 규칙
카드 안 문단은 폭 제한 없이 카드를 채운다. 카드 사이 간격 16px(자동). 카드 안에 또 카드를 넣지 않는다. 설명은 2~4문장.

## 예시
```tsx
<NzCard title="무비무드 디저트 퍼즐 팩" sub="MovieMood" meta="난이도 ★★☆ · 1~2인 · 약 2시간"
  image="/img/moviemood.jpg" description={["디저트 모양 조각을 맞추면 영화 제목이 떠오르는 구조.", "첫 나조로 추천하는 이유는 막혀도 손이 계속 움직인다는 것."]}
  href="/reviews/moviemood" />
```
