# 몬빵의 나조토키 다락방 — 사용 규약 (design agent용)

**이 시스템은 React 컴포넌트가 아니라 CSS 클래스 + CSS 변수로만 이루어져 있다.** `window.NazoDarakbang`에는 컴포넌트가 없다. 디자인은 평범한 HTML에 아래 클래스와 `var(--nz-*)` 토큰을 써서 만든다. 다른 라이브러리의 컴포넌트·유틸리티 클래스(Tailwind 등)는 쓰지 않는다.

## 1. 셋업 — 필수 2가지

1. `styles.css` 하나만 링크한다. 그 안에서 `fonts/fonts.css`(OmyuPretty)와 `_ds_bundle.css`(Jua·IBM Plex Sans KR Google Fonts `@import` + 전체 규칙)가 연쇄 로드된다. 폰트는 모두 CDN이라 네트워크가 필요하다.
2. 페이지 배경을 직접 지정한다: `body { background: var(--nz-bg-page); color: var(--nz-ink); font-family: var(--nz-font-body); }`. 이 CSS는 Super.so 페이지를 전제로 `html`에만 배경을 걸기 때문에, 안 하면 흰 배경에 뜬다.

## 2. 스타일링 관용구

**토큰**: 색·폰트는 반드시 `var(--nz-*)`로. 주요 이름 — 배경 `--nz-bg-page` `--nz-paper` `--nz-paper-warm`, 글자 `--nz-ink` `--nz-muted-1` `--nz-muted-3` `--nz-muted-4`, 선 `--nz-line` `--nz-line-soft` `--nz-card-border` `--nz-rule-brown`, 포인트 `--nz-lemon` `--nz-lemon-hi` `--nz-lemon-hover` `--nz-chip-hover` `--nz-featured-bg` `--nz-featured-border`, 링크 `--nz-link` `--nz-link-hover`, 폰트 `--nz-font-display`(Jua, 제목) `--nz-font-hand`(OmyuPretty, 리드문·한줄평) `--nz-font-body`(IBM Plex Sans KR, 본문). 토큰에 없는 실사용 값 3개: 칩 테두리 `#DCD2BA`, 본문 글자 `#4A4335`, 링크 밑줄 `#D9C46A`.

**스코프 클래스 — 가장 중요한 규칙.** 거의 모든 규칙이 페이지 스코프 조상 아래에서만 켜진다. 스코프 없이 클래스만 쓰면 아무 스타일도 안 붙는다.

| 만들 것 | 바깥 래퍼에 반드시 붙일 클래스 | 그 안의 구조 |
|---|---|---|
| 문서형 "종이 시트" (노트·가이드) | `super-content parent-page__darakbang-note` | `header.notion-header` > `h1.notion-header__title` / `article.notion-root` > `p.notion-text` |
| 나조토키란 류 설명 페이지 | `super-content page__what-is-nazo` | 같은 header/article 구조 |
| 리뷰 예정 목록 | `super-content page__to-review` | 같은 구조 + `.nz-tr-*` |
| 갤러리 인덱스 카드 | (스코프 불필요) | `.notion-collection-card.gallery` |

**종이 시트 안의 부품 클래스** (스코프 `parent-page__darakbang-note` 안에서): 머리글 행 `.nz-dn-head` > 뱃지 `.nz-dn-badge` + 날짜 `.nz-dn-date` + 우측 pill 버튼 `a.nz-dn-listbtn`; 리드문 `p.notion-text.nz-dn-lead`; 작품 카드 `.nz-dn-card` (내부 `.notion-callout__content`, `.nz-dn-card__sub`, `.nz-dn-card__meta`, `.nz-dn-card__img`, `.nz-dn-card__go`); 번외 항목 `.nz-dn-extra` (`.nz-dn-extra__img`, `.nz-dn-extra__meta`); 인용 `.notion-quote`; 구분선 `.notion-divider`; 소제목 `h2`/`h3`를 `article.notion-root` 직속으로. 넓은 리스트형은 `article.notion-root.nz-dn-list`.

**갤러리 부품**: 필터 칩 `.nz2-chip` / `.nz2-chip--active`, 검색바 `#nz2-search`, 추천도 뱃지 `.nz2-rec--strong|--rec|--ok|--meh`, 브랜드 칩 `.nz2-brand-chip`, 페이지 버튼 `.nz2-page-btn` / `.nz2-page-btn--active`, NEW 뱃지 `.nz-new-badge`. 메인 히어로 `.nz-masthead`와 CTA 링크 `.nz-masthead__cta-link`.

**새 레이아웃 글루**를 쓸 때는 `guidelines/DESIGN_SYSTEM.md` §5 간격표(섹션 40px · 문단 16px · 카드 16px · 카드 내부 12px)와 §7 모양(pill 99px · 카드 12px · 시트 카드 radius 0)만 쓴다. 그림자는 `0 4px 14px rgba(61,55,46,.07)` 계열만, 시트 안 카드는 그림자 없음. 브레이크포인트는 `768px` 하나. 모바일에서 시트는 배경·테두리·그림자가 사라지고 좌우 20px만 남는다 — CSS가 자동으로 처리하니 래퍼 구조만 지키면 된다.

## 3. 진실이 있는 곳

- `_ds_bundle.css` — 실제 운영 CSS 원문(4,800줄). 섹션 헤더 주석(`다락방 노트 상세`, `갤러리 v2`, `리뷰 상세 v2` 등)으로 찾는다. 스타일 전에 해당 섹션을 읽는다.
- `guidelines/DESIGN_SYSTEM.md` — 토큰·19개 프리미티브·간격 리듬·반응형 규칙·금지사항·신규 포맷 체크리스트(§9). 새 포맷은 §9부터.
- 에셋: 레몬 아이콘 `https://delve6127.github.io/Nazoblog/assets/lemon.png` (50×50), 타이틀 배너 `https://delve6127.github.io/Nazoblog/assets/masthead-title.png` (1057×174).

## 4. 예시 — 다락방 노트 시트 뼈대

```html
<div class="super-content parent-page__darakbang-note">
  <header class="notion-header">
    <div class="nz-dn-head">
      <span class="nz-dn-badge">입문작 5선</span>
      <span class="nz-dn-date">2026. 10. 10</span>
      <a class="nz-dn-listbtn" href="#"><img src="https://delve6127.github.io/Nazoblog/assets/lemon.png" alt="">노트 목록으로</a>
    </div>
    <h1 class="notion-header__title">처음 사는 나조토키, 뭘 고를까</h1>
  </header>
  <article class="notion-root">
    <p class="notion-text nz-dn-lead">손글씨 리드문 — 아래에 갈색 실선이 자동으로 깔린다.</p>
    <p class="notion-text">본문 14.5px / 1.95. <a class="notion-link" href="#">링크</a>.</p>
    <div class="nz-dn-card"><div class="notion-callout__content">
      <h3 class="notion-heading">작품 제목 <span class="nz-dn-card__sub">제작사</span></h3>
      <p class="notion-text nz-dn-card__meta">난이도 · 인원 · 가격</p>
      <p class="notion-text">카드 설명 문단.</p>
    </div></div>
    <div class="nz-dn-extra"><div class="notion-callout__content">
      <h3>번외 항목</h3><p class="notion-text">왼쪽 세로선 스타일의 부가 항목.</p>
    </div></div>
  </article>
</div>
```
