---
category: Paper Sheet
---
문서형 페이지(다락방 노트·가이드)의 그릇. 크림 배경 위 종이색 시트, 헤더+본문을 한 장으로 이어 붙이고 모바일에선 시트를 해제한다.

## 언제 쓰나
새 노트·가이드·설명 페이지는 전부 이 안에 담는다. 페이지당 하나. 갤러리(목록) 페이지에는 쓰지 않는다.

## 구조 (렌더 결과)
`div.super-content.parent-page__darakbang-note` > `header.notion-header`(머리글 행 + `h1.notion-header__title`) + `article.notion-root`(리드문 + children). 이 스코프 클래스가 있어야 NzCard·NzExtra·본문 문단 스타일이 켜진다.

## Props
- `title` 페이지 제목 (Jua 32px, 모바일 25px)
- `badge` / `date` / `listHref` / `listLabel` 머리글 행 (NzSheetHead와 동일)
- `lead` 손글씨 리드문 — 아래 갈색 실선 자동
- `wide` 1080px 넓은 시트 (카드가 많은 N선 목록)
- `children` 본문 블록

## 본문 작성 규칙
- 문단: `<p className="notion-text">` — 14.5px / 1.95, 폭 800px 제한
- 소제목: article 직속 `<h2>` 또는 `<h3>` — Jua 23px (굵게 하지 않음)
- 구분선: `<hr className="notion-divider" />`
- 링크: `<a className="notion-link" href>` — 갈색 글자 + 레몬색 밑줄
- 작품 항목 → NzCard, 부가/번외 → NzExtra, 마무리 → NzEndingBox, 문장 속 핵심 행동 → NzCtaLink

## 예시
```tsx
<NzPaperSheet
  title="처음 사는 나조토키, 뭘 고를까"
  badge="입문작 5선" date="2026. 10. 10" listHref="/darakbang-note"
  lead="퍼즐 좋아하는 친구가 '하나만 추천해줘' 했을 때 꺼내는 다섯 개."
>
  <p className="notion-text">본문 문단.</p>
  <h2>1. 가볍게 시작하기</h2>
  <NzCard title="무비무드 디저트 퍼즐 팩" sub="MovieMood" meta="난이도 ★★☆ · 1~2인" description="…" href="/reviews/moviemood" />
  <NzExtra title="번외 — 품절된 명작" meta="2023" description="…" />
  <NzEndingBox lead="다락방엔 리뷰가 더 있어요." href="/" />
</NzPaperSheet>
```
