# 몬빵의 나조토키 다락방 — 디자인 시스템

> nazo.monbbang.me / Notion + Super.so
> 출처: `superso_inject.css` (운영 중 커스텀 CSS, 4,837줄) 실측 추출. 추측값 없음.
> 용도: 이 문서를 등록해 두고, 새 포맷(새 다락방 노트 유형, 새 페이지 타입 등)을
> 기존 디자인 문법에 맞게 파생시키기 위한 기준서.

---

## 0. 이 시스템의 핵심 문법 (먼저 읽을 것)

새 포맷을 만들 때 이 6가지가 "이 블로그처럼 보이는가"를 결정합니다.

1. **종이 시트 (Paper Sheet)** — 문서형 페이지는 크림 배경(`#FAF7F2`) 위에
   종이색 시트(`#FFFDF7` + 테두리 `#E5DCC6` + 그림자)를 올린다.
   헤더와 본문은 **테두리를 이어 붙여 하나의 종이**로 보이게 한다.
   (헤더는 `border-bottom: none`, 본문은 `border-top: none`)
2. **모바일에서는 시트를 해제한다** — 768px 이하에서 배경·테두리·그림자를 모두 없애고
   페이지 배경 위에 평면으로 흐르게 한다. 좌우 패딩만 20px로 남긴다.
   이 시스템에서 가장 중요한 반응형 규칙이며, 모든 문서형 페이지가 이를 따른다.
3. **3폰트 역할 분담** — 제목은 Jua(둥근 고딕), 감성 텍스트는 OmyuPretty(손글씨),
   정보 텍스트는 IBM Plex Sans KR. 이 3개를 섞는 리듬이 브랜드의 목소리다.
4. **리드문 + 갈색 실선** — 문서 시작부는 손글씨 리드문 아래
   `border-bottom: 2px solid #C4B695`로 끊는다. 본문 진입 신호.
5. **레몬은 점으로만** — 포인트 컬러(`#FFD953`)는 CTA 밑줄·활성 상태·형광펜·뱃지·
   불릿 아이콘에만. 넓은 면적을 칠하지 않는다. 예외는 맺음 박스(`#FFF7DC`, 연한 톤).
6. **활성 상태 공식** — 선택/활성은 언제나 `배경 #3D372E + 글자 #FFFDF7` 반전.

---

## 1. 컬러 토큰

```css
:root {
  --nz-bg-page: #FAF7F2;        /* 페이지 배경 (html 배경 동일) */
  --nz-bg-sidebar: #EEE8D6;     /* 사이드바 */
  --nz-paper: #FFFDF7;          /* 종이 시트 · 카드 */
  --nz-paper-warm: #FAF6EB;     /* 따뜻한 종이 (내부 카드) */
  --nz-ink: #3D372E;            /* 본문 텍스트 · 활성 배경 */
  --nz-muted-1: #8A8272;        /* 보조 텍스트 (가장 연함, 날짜·캡션) */
  --nz-muted-3: #5C554A;        /* 보조 텍스트 (진함, 라벨) */
  --nz-muted-4: #6B6353;        /* 보조 텍스트 (중간, 리드문) */
  --nz-line: #D9CFB6;           /* 구분선 */
  --nz-line-soft: #E0D7C2;      /* 연한 구분선 · 내부 카드 테두리 */
  --nz-card-border: #E5DCC6;    /* 종이 시트 · 갤러리 카드 테두리 */
  --nz-rule-brown: #C4B695;     /* 강조 실선 2px */
  --nz-lemon: #FFD953;          /* 브랜드 포인트 */
  --nz-lemon-hi: #FFDE59;       /* 형광펜 */
  --nz-lemon-hover: #FFCF33;    /* 호버 */
  --nz-chip-hover: #FFF3C9;     /* 칩·버튼 호버 배경 */
  --nz-featured-bg: #FFF7DC;    /* 맺음/강조 박스 배경 */
  --nz-featured-border: #F0E1AC;/* 맺음/강조 박스 테두리 */
  --nz-link: #8A6D00;           /* 링크 */
  --nz-link-hover: #5C4B00;     /* 링크 호버 */
  --nz-new-badge: #E4573D;      /* NEW 뱃지 */
}
```

### 토큰에 없지만 실사용 중인 색 (함께 유지)

| 값 | 용도 |
|---|---|
| `#DCD2BA` | 칩·pill 버튼 테두리 (17회, 토큰 `--nz-line`보다 빈번) |
| `#A79E8A` | 검색 아이콘 · placeholder |
| `#4A4335` | 다락방 노트 본문 텍스트 (본문 전용, `--nz-ink`보다 약간 따뜻함) |
| `#F1EADA` | 브랜드 칩 · 기본 태그 배경 |
| `#D9C46A` | 링크 밑줄 색 (`text-decoration-color`) |
| `#1D5FD6` `#D6E6FF` `#EDF2F7` `#5E7186` `#F1F2F4` `#98A0A8` | 추천도 뱃지 4단계 |
| `#E9F4E4/#CFE4C6/#5A8A50` 외 | 파스텔 태그 계열 (§4.7) |

### 다크모드
**없음.** `prefers-color-scheme` / `[data-theme]` 분기 0건. 라이트 단일 테마.

---

## 2. 폰트

### 스택 (fallback 원문)

```css
--nz-font-display: 'Jua', sans-serif;
--nz-font-hand: 'OmyuPretty', sans-serif;
--nz-font-body: 'IBM Plex Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
```

코드 폰트: 커스텀 지정 없음 (플랫폼 기본).

### 로드 (파일 최상단 필수)

```css
@import url('https://fonts.googleapis.com/css2?family=Jua&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap');

@font-face {
  font-family: 'OmyuPretty';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2304-01@1.0/omyu_pretty.woff2') format('woff2');
  font-weight: normal;
  font-display: swap;
}
```

### 역할 분담 규칙

| 폰트 | 쓰는 곳 | weight |
|---|---|---|
| **Jua** (display) | 페이지 제목, 섹션 소제목, 카드 제목 | 400 (카드 내부 제목만 700) |
| **OmyuPretty** (hand) | 히어로 태그라인, 리드문, 한줄평, 목록 버튼, 맺음 문구, 빈 상태 | 700 또는 기본 |
| **IBM Plex Sans KR** (body) | 본문, 메타, 칩, 뱃지, 태그, UI 전체 | 400/500/600/700 |

> Jua는 weight 400으로 쓴다. 굵게 하지 않아도 충분히 두껍고, 700을 주면 브랜드 톤이 깨진다.
> 예외는 카드 내부 제목(21px/700)뿐이다.

---

## 3. 타이포 스케일

### 문서형 페이지 (PC → 모바일)

| 역할 | 폰트 | PC | 모바일 |
|---|---|---|---|
| 페이지 제목 | Jua 400 | 32px / 1.35 | 25px |
| 페이지 제목(넓은 페이지) | Jua 400 | 34px / 1.25 | — |
| 리드문 | OmyuPretty | 19px / 1.55 | 17px |
| 리드문(나조토키란) | OmyuPretty | 21px / 1.5 | — |
| 섹션 소제목 (h2/h3) | Jua 400 | 23px / 1.4 | 20px |
| 본문 문단 | IBM Plex | 14.5px / 1.95 | 14px / 1.9 |
| 본문 문단(나조토키란) | IBM Plex | 15.5px / 1.85 | — |
| 내부 카드 제목 | Jua 700 | 21px / 1.4 | 19px |
| 내부 카드 부제 | IBM Plex 400 | 16px | 14px (block 전환) |
| 내부 카드 메타 | IBM Plex | 13px / 1.75 | 12.5px |
| 번외 항목 제목 | IBM Plex 700 | 15.5px / 1.5 | — |
| 메타 · 날짜 | IBM Plex | 13.5px | 13px |

### 실사용 값 팔레트 (이 안에서 고를 것)

```
font-size   : 11 · 11.5 · 12 · 12.5 · 13 · 13.5 · 14 · 14.5 · 15 · 15.5 · 16
              17 · 18 · 19 · 20 · 21 · 23 · 25 · 26 · 32 · 34   (px)
line-height : 1.25 · 1.3 · 1.35 · 1.4 · 1.5 · 1.55 · 1.6 · 1.65
              1.7 · 1.75 · 1.8 · 1.85 · 1.9 · 1.95
```

> 본문 line-height가 1.85~1.95로 매우 넉넉하다. 이게 "다락방" 특유의 편안한 읽기 리듬이다.
> 새 포맷에서 본문을 1.6 이하로 조이면 톤이 깨진다.

---

## 4. 프리미티브 (재사용 부품)

### 4.1 종이 시트 — 문서형 페이지의 기본 그릇

```css
/* 헤더 (상단 절반) */
max-width: 880px;
margin: 44px auto 0;
background: #FFFDF7;
border: 1px solid #E5DCC6;
border-bottom: none;          /* ← 본문과 이어 붙임 */
padding: 44px 48px 0;

/* 본문 (하단 절반) */
max-width: 880px;
margin: 0 auto;
background: #FFFDF7;
border: 1px solid #E5DCC6;
border-top: none;             /* ← 헤더와 이어 붙임 */
box-shadow: 0 4px 14px rgba(61, 55, 46, .07);
padding: 8px 48px 50px;
color: #4A4335;
```

**모바일 (≤768px) — 시트 해제:**
```css
max-width: none;  margin: 0;
background: transparent;  border: none;  box-shadow: none;
padding: 24px 20px 0;   /* 헤더 */
padding: 6px 20px 40px; /* 본문 */
```

### 4.2 머리글 행 (뱃지 + 날짜 + 우측 버튼)

```css
display: flex; align-items: center; gap: 9px;
/* 우측 버튼은 margin-left: auto */
```

**카테고리 뱃지**
```css
background: #FFD953; color: #5C4B00;
font: 700 12.5px var(--nz-font-body);
border-radius: 6px; padding: 3px 11px;
/* 모바일: 12px / padding 3px 10px */
```

**날짜**
```css
font-size: 13.5px; color: #8A8272;   /* 모바일 13px */
```

### 4.3 Pill 버튼 (목록으로 / 보조 내비)

```css
display: flex; align-items: center; gap: 6px;
background: #FFFDF7;
border: 1px solid #DCD2BA;
border-radius: 99px;
padding: 5px 14px 5px 9px;      /* 아이콘 있는 쪽이 좁음 */
color: #5C554A;
font: 700 15px var(--nz-font-hand);   /* ← 손글씨 */
text-decoration: none;
transition: all .15s ease;
```
```css
:hover { background: #FFF3C9; transform: translateY(-1px); }
/* 아이콘(레몬) 18px × 18px, object-fit: contain */
/* 모바일: font 14px / padding 4px 12px 4px 8px / 아이콘 16px / hover transform 없음 */
```

### 4.4 리드문 + 실선 (문서 진입부)

```css
font-family: var(--nz-font-hand);
font-size: 19px; line-height: 1.55;
color: #6B6353;
margin: 0;
border-bottom: 2px solid #C4B695;
padding-bottom: 24px;     /* 모바일 18px, font 17px */
```

### 4.5 내부 카드 (작품 카드 / 항목 카드)

```css
background: #FAF6EB;              /* 시트보다 한 톤 따뜻하게 */
border: 1px solid #E0D7C2;
border-radius: 12px;
box-shadow: none;                 /* ← 시트 안이므로 그림자 없음 */
padding: 24px 28px;
margin: 16px 0 0;
```
- 제목: Jua 700 21px / 1.4 / `#3D372E` / margin 0
- 부제: 16px / 400 / `#6B6353` (모바일 `display:block` + margin-top 4px)
- 메타: 13px / 1.75 / `#6B6353` / margin-top 12px
- 썸네일: `float: right; width:180px; margin: 14px 0 14px 22px;`
  이미지 180×180 / `object-fit: cover` / radius 10px / border 1px `#E0D7C2`
- 하단 링크: `text-align: right; font-size 13px; clear: both;` (호버에만 밑줄)
- 모바일: padding 18px 16px / 제목 19px / 썸네일 124×124

### 4.6 번외 · 인용 항목 (왼쪽 기둥 스타일)

박스가 아니라 **왼쪽 세로선**으로 격하시키는 패턴. 본문보다 낮은 위계.

```css
background: transparent;
border: none;
border-left: 3px solid #E0D7C2;
border-radius: 0;
box-shadow: none;
padding: 2px 0 2px 18px;      /* 모바일 padding-left 14px */
margin: 18px 0 0;
max-width: 800px;
font-size: 14.5px; line-height: 1.95; color: #4A4335;
font-style: normal;           /* 이탤릭 쓰지 않음 */
```
- 제목: **IBM Plex** 700 15.5px / 1.5 (여기선 Jua 아님 — 위계가 낮으므로)
- 썸네일이 있으면 2단 그리드:
  `grid-template-columns: 92px minmax(0, 1fr); column-gap: 16px; align-items: start;`
  이미지 92×92 / radius 8px / border 1px `#E0D7C2` (모바일 64×64)
- 메타: 13px / 500 / `#8A8272` / margin-left 8px

### 4.7 태그 칩 (파스텔)

```css
display: inline-block;
border-radius: 99px;
padding: 2px 11px;
font-size: 12.5px; font-weight: 700; line-height: 1.5;
/* 기본 */
background: #F1EADA; border: 1px solid #E0D7C2; color: #5C554A;
```
| 변형 | background | border | color |
|---|---|---|---|
| `--line` | `#E9F4E4` | `#CFE4C6` | `#5A8A50` |
| `--web` | `#EDF2F9` | `#D5DFEC` | `#5A78A0` |
| `--pad` | `#EEF4EF` | `#D7E3DA` | `#5E7F6A` |
| `--recycle` | `#F8F0EA` | `#EBD9CF` | `#A0705C` |

> 파스텔 태그 공식: 배경은 채도 낮은 파스텔, 테두리는 배경보다 한 단 진하게,
> 글자는 같은 색조의 어두운 중간톤. 새 카테고리를 추가할 때 이 3단 구조를 따를 것.

### 4.8 추천도 뱃지 (4단계)

```css
font-size: 14px; font-weight: 700; border-radius: 5px; padding: 2px 8px;
/* 큰 카드에서는 12.5px / padding 2px 9px */
```
| 등급 | background | color |
|---|---|---|
| 강력추천 | `#1D5FD6` | `#FFFFFF` |
| 추천 | `#D6E6FF` | `#1D5FD6` |
| 보통 | `#EDF2F7` | `#5E7186` |
| 비추 | `#F1F2F4` | `#98A0A8` |

### 4.9 형광펜 (레몬)

```css
background: linear-gradient(transparent 58%, #FFDE59 58%);
padding: 0 3px;
font-weight: 600;      /* 나조토키란 페이지는 700 */
color: #3D372E;
```

### 4.10 본문 링크

```css
color: #8A6D00;
font-weight: 600;
text-decoration: underline;
text-underline-offset: 3px;
text-decoration-color: #D9C46A;    /* 밑줄만 레몬 계열로 */
:hover { color: #5C4B00; }
```
강조 문맥(나조토키란)에서는 `color: #3D372E; font-weight: 700; text-decoration-thickness: 2px;`

### 4.11 불릿 리스트 (레몬 아이콘)

```css
display: flex; align-items: flex-start; gap: 12px;
margin: 14px 0 0;      /* 첫 항목만 16px */
/* 아이콘 20×20, margin-top 3px, flex-shrink: 0 */
```

### 4.12 구분선

```css
/* 얇은 룰 */
border: none; border-top: 1px solid #D9CFB6; margin: 26px 0 0;
/* 강조 실선 (리드문 하단) */
border-bottom: 2px solid #C4B695;
```

### 4.13 맺음 박스 + CTA (문서 마무리)

```css
/* 박스 */
background: #FFF7DC;
border: 1px solid #F0E1AC;
border-radius: 10px;
padding: 24px 30px;
margin-top: 36px;
text-align: center;

/* 박스 안 문구 */
font-family: var(--nz-font-hand);
font-size: 19px; line-height: 1.65; color: #8A6D00;
/* 문구가 2줄 이상이면 두 번째부터 margin-top: 6px */

/* CTA 버튼 */
display: inline-flex; align-items: center; gap: 8px;
background: #FFD953;
border-radius: 99px;
padding: 10px 22px;
font-size: 14px; font-weight: 700; color: #3D372E;
margin-top: 16px;
box-shadow: 0 3px 10px rgba(61, 55, 46, .15);
transition: background .15s ease;
:hover { background: #FFCF33; }
```

### 4.14 인라인 CTA 링크 (레몬 밑줄 — 브랜드 시그니처)

```css
font-weight: 700;
color: #3D372E;
border-bottom: 3px solid #FFD953;
padding-bottom: 1px;
line-height: 1.15;
text-decoration: none;
:hover { border-bottom-color: #FFCF33; color: #000; }
```

### 4.15 갤러리 카드 (인덱스형)

```css
background: #FFFDF7;
border: 1px solid #E5DCC6;
border-radius: 0;                 /* ← 의도적으로 각짐 */
box-shadow: 0 4px 14px rgba(61, 55, 46, .07);
padding: 7px 7px 10px;
:hover { transform: translateY(-2px); transition: transform .2s; }
```
- 제목: 16px / 700 / 1.35 / 1줄 말줄임
- 커버 이미지: radius 0, 모바일 높이 170px 고정
- 큰 카드: padding 11px 11px 13px, 제목 Jua 400 18px, 줄바꿈 허용

### 4.16 필터 칩

```css
background: transparent;
border: 1px solid #DCD2BA;
color: #5C554A;
font-size: clamp(10.5px, 3.2vw, 14px);
font-weight: 600;
border-radius: 99px;
padding: 8px 1px;
text-align: center;
:hover  { background: #FFF3C9; color: #3D372E; }
.active { background: #3D372E; color: #FFFDF7; border-color: #3D372E; }
```

### 4.17 검색바

```css
background: #FFFDF7;
border: 1px solid #DCD2BA;
border-radius: 99px;
padding: 7px 14px;
gap: 8px;
/* 입력: 14px / #3D372E, placeholder #A79E8A, 테두리·배경 없음 */
/* 아이콘: 26px / 700 / #A79E8A */
```

### 4.18 페이지네이션 버튼

```css
width: 28px; height: 28px;             /* 모바일 32×32 */
border: 1px solid #DCD2BA;
background: #FFFDF7;
color: #5C554A;
font-size: 12px; font-weight: 600;     /* 모바일 13px */
border-radius: 7px;                    /* 모바일 8px */
:hover  { background: #FFF3C9; }
.active { background: #3D372E; color: #FFFDF7; border-color: #3D372E; font-weight: 700; }
```

### 4.19 NEW 뱃지

```css
background: #E4573D; color: #fff;
font-size: 10.5px; font-weight: 700;
border-radius: 6px; padding: 2px 7px; letter-spacing: 0;
/* 위치: position absolute; top 8px; left 8px */
```

---

## 5. 간격 리듬 (Spacing)

새 포맷의 수직 리듬은 아래 값만 조합한다.

| 관계 | 값 |
|---|---|
| 시트 상단 여백 (페이지 top → 시트) | `44px` (모바일 24px) |
| 시트 내부 좌우 패딩 | `48px` (모바일 20px) |
| 시트 헤더 상단 패딩 | `44px` (모바일 24px) |
| 시트 본문 하단 패딩 | `50px` (모바일 40px) |
| 제목 ↔ 머리글 행 | `14px` (모바일 12px) |
| 리드문 하단 (실선까지) | `24px` (모바일 18px) |
| **섹션 ↔ 섹션** | `40px` |
| 소제목 ↔ 본문 | `14px` |
| 본문 문단 ↔ 문단 | `16px` (모바일 14px) |
| 카드 ↔ 카드 / 카드 상단 | `16px` (모바일 14px) |
| 카드 내부 요소 간 | `12px` (모바일 10px) |
| 번외/인용 항목 간 | `18px` |
| 구분선 위 | `26px` |
| 맺음 박스 상단 | `36px` |
| 플렉스 행 내부 gap | `6px · 8px · 9px · 12px · 16px` |

---

## 6. 레이아웃 폭

| 페이지 유형 | max-width |
|---|---|
| 문서형 시트 (노트 상세 / 나조토키란 / 리뷰예정목록) | `880px` |
| 문서형 시트 — 리스트형(N선 등 넓은 변형) | `1080px` |
| 문서형 본문 문단 (가독성 제한) | `800px` |
| 리뷰 상세 본문 | `880px` |
| 소개형 짧은 페이지 | `660px` |
| 갤러리 인덱스 (컨트롤 · 2단 레이아웃) | `1520px` |
| 갤러리 2단 그리드 | `minmax(0, 1fr) 340px` |
| 히어로 태그라인 블록 | `390px` (모바일 분기 800px) |

> 시트 폭(880px)과 본문 문단 폭(800px)이 다르다. 시트는 880px이지만 문단은
> `max-width: 800px`로 한 번 더 조여 한 줄 글자수를 제한한다. 단, 카드·번외 항목
> 내부의 문단은 `max-width: none`으로 풀어 카드 폭을 꽉 채운다.

---

## 7. 모양 토큰

### border-radius

| 값 | 쓰는 곳 |
|---|---|
| `99px` | 칩 · pill 버튼 · 태그 · CTA 버튼 · 검색바 |
| `12px` | 내부 카드 |
| `10px` | 맺음 박스 · 큰 썸네일 |
| `8px` | 작은 썸네일 · 셀 · 모바일 페이지 버튼 |
| `7px` | 페이지네이션 버튼 |
| `6px` | 뱃지 · pill 라벨 |
| `5px` | 추천도 뱃지 · 브랜드 칩 |
| `50%` | 점 · 아바타 |
| `0` | **갤러리 카드 · 커버 이미지** (의도적) |

### box-shadow

```css
/* 시트 · 갤러리 카드 (대표) */
0 4px 14px rgba(61, 55, 46, .07)
/* 떠오름 강 / 중 */
0 8px 24px rgba(61, 55, 46, .14)
0 8px 20px rgba(61, 55, 46, .12)
/* CTA 버튼 */
0 3px 10px rgba(61, 55, 46, .15)
/* 작은 요소 */
0 2px 6px rgba(61, 55, 46, .06) ~ .12
/* 은은한 이중 */
0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)
/* 인셋 테두리 */
inset 0 0 0 1px rgba(44,42,36,.10)
```

> 그림자 색은 항상 `rgba(61, 55, 46, ...)` — 따뜻한 갈색. 순수 검정 그림자 금지.
> **시트 안의 카드에는 그림자를 주지 않는다** (`box-shadow: none`). 그림자는 시트 자체에만.

### transition

```css
.15s ease   /* 버튼 · 칩 · 색상 변화 */
.2s         /* 카드 transform */
```

---

## 8. 반응형 규칙

**브레이크포인트는 `768px` 하나만 쓴다.** (`max-width: 768px` / `min-width: 769px`)
모바일 비중이 압도적이므로 모바일을 기본으로 설계하고 PC를 확장으로 다룬다.

모바일에서 반드시 적용할 변환:

| 항목 | 변환 |
|---|---|
| 종이 시트 | **해제** — background/border/box-shadow 제거, max-width none, margin 0 |
| 좌우 패딩 | 48px → `20px` |
| 페이지 제목 | 32px → `25px` |
| 리드문 | 19px → `17px` |
| 소제목 | 23px → `20px` |
| 본문 | 14.5px/1.95 → `14px/1.9` |
| 카드 패딩 | 24px 28px → `18px 16px` |
| 카드 썸네일 | 180px → `124px` |
| 번외 썸네일 | 92px → `64px` |
| 번외 좌측 패딩 | 18px → `14px` |
| 카드 부제 | inline → `display: block` + margin-top 4px |
| hover transform | **제거** (`transform: none`) |
| 갤러리 그리드 | `repeat(2, 1fr)`, 커버 높이 170px 고정 |

---

## 9. 새 포맷 설계 체크리스트

새 다락방 노트 유형이나 새 페이지 타입을 만들 때:

1. **그릇 고르기** — 문서형이면 §4.1 종이 시트(880px). 넓은 리스트형이면 1080px.
   인덱스형이면 시트 없이 1520px 갤러리.
2. **머리글 구성** — §4.2 뱃지+날짜 행 → Jua 제목 → §4.4 손글씨 리드문 + 갈색 실선.
   이 3단 진입부가 문서형의 고정 문법이다.
3. **본문 위계 3단으로 제한**
   - 1단: Jua 23px 소제목 + 본문 문단
   - 2단: §4.5 내부 카드 (`#FAF6EB` + radius 12px) — 독립 항목
   - 3단: §4.6 왼쪽 기둥 (`border-left 3px`) — 부가/번외
   새 위계를 추가하지 말고 이 3단에 매핑한다.
4. **마무리** — §4.13 맺음 박스 + 레몬 CTA.
5. **간격은 §5 표에서만** 고른다. 새 수치를 만들지 않는다.
6. **모바일 변환표(§8)를 전부 적용**한다. 특히 시트 해제.
7. **폰트 3개 리듬 확인** — 제목 Jua / 감성 OmyuPretty / 정보 IBM Plex가
   한 화면에 모두 등장하는지. 하나라도 빠지면 톤이 어긋난다.

### 하지 말 것

- 새 hex 색 만들기 (§1 토큰 + 실사용 색 안에서 조합)
- 본문 line-height를 1.6 이하로 조이기
- 레몬(`#FFD953`)으로 넓은 면적 채우기
- 순수 검정/회색 그림자 (`rgba(0,0,0,...)` 단독)
- 시트 안 카드에 그림자 주기
- Jua를 weight 700으로 쓰기 (카드 내부 제목 예외)
- 인용/번외에 이탤릭 쓰기 (`font-style: normal` 고정)
- 768px 외 브레이크포인트 추가
- 다크모드 분기 추가

---

## 10. 구현 시 CSS 아키텍처 (참고)

실제 사이트에 넣을 때의 규약. 디자인 단계에서는 몰라도 되지만,
목업 클래스명을 여기 맞춰두면 이식이 쉬워집니다.

**페이지 스코프** — Super가 URL에서 생성하는 클래스로 전체를 감싼다.
```
.super-content.page__what-is-nazo      /* 단일 페이지 */
.super-content.parent-page__darakbang-note  /* 하위 페이지 전체 */
.nz-home / .nz-review / .nz-about / .nz-purchage-page  /* JS가 body에 부여 */
```

**컴포넌트 접두사** — `nz-` + 2글자 페이지 코드 + `__요소` + `--변형`
```
.nz-dn-card__img        다락방 노트(dn) 카드의 이미지
.nz-wn-ending__lead     나조토키란(wn) 맺음 박스의 리드
.nz2-chip--active       갤러리 v2 칩의 활성 변형
```
기존 코드: `dn` 노트 · `wn` 나조토키란 · `tr` 리뷰예정 · `mfy` 미포유 ·
`dl` 다운로드 · `nz2` 갤러리 v2 · `nz4` 리뷰 상세 v2

**주의** — Notion/Super 기본 스타일을 덮어쓰므로 대부분의 선언에 `!important`가 필요하다.
Notion 캘아웃을 카드로 개조할 때는 `> .notion-callout__icon { display: none }` +
`> .notion-callout__content { display: block; width: 100%; margin: 0; padding: 0 }`
조합이 고정 패턴이다.

---

## 11. 에셋

기준 경로: `https://delve6127.github.io/Nazoblog/`

| 용도 | URL | 원본 크기 | 표시 크기 |
|---|---|---|---|
| 메인 배너(타이틀) | `.../assets/masthead-title.png` | 1057 × 174 PNG | `width: 620px` (모바일 340px), height auto |
| 레몬 아이콘 | `.../assets/lemon.png` | 50 × 50 PNG | 네비 30px(모바일 29px) · 불릿 20px · 버튼 18px(모바일 16px) · 썸네일 92px |
| 파비콘 | `https://assets.super.so/b529abf1-8288-44d9-87eb-38228677c041/uploads/favicon/4755b539-ee21-4713-a95a-b621816ac317.png` | 50 × 50 PNG | — |
| OG / 공유 이미지 | `https://assets.super.so/b529abf1-8288-44d9-87eb-38228677c041/uploads/cover/6c82a645-b3cc-4e38-9cf1-82f5b3f4d208.png` | 1200 × 630 PNG | — |

- **파비콘 · 네비 로고 · `assets/lemon.png`는 완전히 동일한 파일**
  (MD5 `6af2243882f2f64f18c4eb1dcfcb008d`, 50×50, 5,844 bytes). 별개 에셋으로 취급하지 말 것.
- 레몬 로고 호버: `transform: rotate(-8deg) scale(1.08); transition .15s`
- 레몬 아이콘은 언제나 `object-fit: contain`, 썸네일 이미지는 `object-fit: cover`

---

## 12. 로드 구조 (구현 배경)

Super 대시보드의 Custom CSS 입력란은 **비어 있다.** 커스텀 코드는 `head` 주입으로
GitHub Pages의 파일 2개를 불러온다.

```html
<link rel="stylesheet" href="https://delve6127.github.io/Nazoblog/superso_inject.css"/>
<script defer src="https://delve6127.github.io/Nazoblog/superso_inject.js"></script>
```

| 리포 파일 | 라이브 URL |
|---|---|
| `superso_inject.css` (4,837줄) | `https://delve6127.github.io/Nazoblog/superso_inject.css` |
| `superso_inject.js` (4,717줄) | `https://delve6127.github.io/Nazoblog/superso_inject.js` |
| `assets/` | `https://delve6127.github.io/Nazoblog/assets/` |

JS 내 에셋 기준 경로: `superso_inject.js:105`
```js
var NZ_ASSET_BASE = window.NZ_ASSET_BASE || 'https://delve6127.github.io/Nazoblog/';
```

Super가 자동 로드하는 폰트(나눔스퀘어라운드 400/500/600/700, Inter 400~700)는
`html:root`의 `--primary-font` / `--secondary-font`를 IBM Plex Sans KR로 덮어써서
실사용되지 않는다. (preload는 여전히 발생 — 최적화 여지)
