---
category: Accents
---
추천도 뱃지 — 리뷰 총평 4단계를 색으로 표시하는 작은 라벨. 14px 700, radius 5px. 강력추천(파랑 채움 #1D5FD6) · 추천(연파랑 #D6E6FF) · 괜찮음(회청 #EDF2F7) · 음..(연회색 #F1F2F4).

## 언제 쓰나
비교·순위·결론 문단에서 작품의 총평을 한눈에. 카드의 메타 줄 옆, 결론 문장 안, 표의 셀. 전역 규칙이라 시트 안팎 어디서든 쓸 수 있다. 이 시스템에서 **파랑 계열이 허용되는 유일한 자리**다.

## Props
- `level` `strong`(강력추천) · `rec`(추천) · `ok`(괜찮음) · `meh`(음..)
- `children` 표시 텍스트 — 생략하면 사이트 기본 문구를 그대로 쓴다(권장)
- `size` `default`(14px) · `review`(12.5px, padding 4px 11px, radius 6px — 리뷰 상세용)

## 규칙
한 작품에 하나. 문구는 기본값을 쓴다(사이트와 등급 표기가 일치해야 한다). 태그(NzTag)와 혼동 금지 — 태그는 형식 분류, 이건 평가.

## 예시
```tsx
<p className="notion-text">첫 감성 나조라면 <NzRecBadge level="strong" /> 별이 떨어진 밤의 편지.</p>
<NzCard title="도서관의 열두 열쇠" meta={<>난이도 ★★★ · 1~3인 <NzRecBadge level="rec" /></>} … />
```
