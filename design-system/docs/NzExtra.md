---
category: Body Blocks
---
번외 항목 — 박스 없이 왼쪽 세로선(3px #E0D7C2)만으로 격하시킨 부가 항목. 제목은 본문 폰트 700 15.5px(디스플레이 폰트 안 씀). 썸네일이 있으면 왼쪽 92px 기둥 + 오른쪽 글.

## 언제 쓰나
"번외", "함께 보면 좋은", "품절/절판", "주의할 점" — 본문의 흐름을 끊지 않는 낮은 위계. NzCard가 1군이면 NzExtra는 2군. NzPaperSheet 안에서만 스타일이 적용된다.

## Props
- `title` 항목 제목 · `meta` 제목 옆 회색 메타 (13px 500, 8px 간격)
- `description` 문자열 또는 배열 → 문단 (14.5px / 1.95)
- `image` / `imageAlt` 작은 썸네일 (92→모바일 64px, radius 8px)
- `href` / `linkLabel` 링크 줄 (기본 "자세히 →")

## 규칙
이탤릭 쓰지 않는다(CSS가 `font-style: normal` 고정). 항목 간 간격 18px(자동). 한 글에 3~4개까지.

## 예시
```tsx
<NzExtra title="번외 — 지금은 구할 수 없는 명작" meta="2021 · 절판"
  image="/img/old.jpg" description="중고로만 돌고 있어 목록에서는 뺐지만, 보이면 사세요." href="/reviews/old" />
```
