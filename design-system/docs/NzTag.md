---
category: Accents
---
파스텔 태그 칩 — pill(99px) 12.5px 700. 저채도 파스텔 배경 + 한 단 진한 테두리 + 같은 색조의 어두운 글자, 5종. 형식·매체 분류용.

## 언제 쓰나
작품의 형식(LINE 나조 / 웹 / 종이·패드 / 재사용 가능)을 한눈에 표시. 메타 줄 옆, 제목 아래. 자체 스코프를 포함하므로 시트 밖에서도 쓸 수 있다.

## Props
- `variant` `default`(베이지 #F1EADA) · `line`(녹색 #E9F4E4) · `web`(파랑 #EDF2F9) · `pad`(청록 #EEF4EF) · `recycle`(살구 #F8F0EA)
- `children` 짧은 텍스트 (1~4 단어)

## 규칙
한 작품에 태그 1~3개. 상태 표시(NEW·추천)는 태그가 아니라 뱃지의 몫. 새 색을 만들지 말고 5종 안에서 고른다.

## 예시
```tsx
<NzTag variant="line">LINE 나조</NzTag> <NzTag variant="pad">종이</NzTag> <NzTag variant="recycle">재플레이 가능</NzTag>
```
