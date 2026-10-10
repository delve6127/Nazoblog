---
category: Paper Sheet
---
시트 머리글 행 — 레몬 뱃지 + 날짜 + 우측 "노트 목록으로" pill 버튼. NzPaperSheet의 badge/date/listHref prop이 내부적으로 이 컴포넌트를 그린다.

## 언제 쓰나
보통 직접 쓰지 않고 NzPaperSheet의 prop으로 쓴다. 헤더를 직접 조립해야 할 때만 `header.notion-header` 안에서 사용.

## Props
- `badge` 뱃지 텍스트 — 레몬 #FFD953 배경, #5C4B00 글자, 12.5px 700, radius 6px
- `date` 날짜 — 13.5px #8A8272
- `listHref` 있으면 pill 버튼 표시 · `listLabel` 기본 "노트 목록으로" (손글씨 15px 700)
- `icon` 버튼 아이콘 URL (기본 레몬 18px), null이면 없음

## 규칙
뱃지는 카테고리 1개만. 날짜 포맷은 "2026. 10. 10" (점+공백). 버튼은 항상 우측 끝(`margin-left:auto`).

## 예시
```tsx
<NzSheetHead badge="다락방 노트" date="2026. 10. 10" listHref="/darakbang-note" />
```
