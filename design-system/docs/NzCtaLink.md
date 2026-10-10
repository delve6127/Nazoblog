---
category: Accents
---
레몬 밑줄 인라인 링크 — 브랜드 시그니처. 굵은 잉크색(#3D372E) 글자 아래 3px 레몬 밑줄, 호버 시 진한 레몬(#FFCF33) + 검정 글자. 밑줄 외 장식 없음.

## 언제 쓰나
문장 속 핵심 행동 1개("리뷰 보기", "구매처 안내"). 히어로·리드문·맺음 근처. 본문의 일반 참조 링크는 `<a className="notion-link">`(갈색)를 쓰고, 이 컴포넌트는 "여기를 눌러라"에만 쓴다.

## Props
- `href` · `children` 링크 텍스트 · `external` 새 탭

## 규칙
한 문단에 하나. 문장 끝에 "→"를 붙이는 관례. 버튼처럼 블록으로 만들지 않는다(그건 NzEndingBox의 CTA).

## 예시
```tsx
<p className="notion-text">궁금한 작품이 있다면 <NzCtaLink href="/reviews">리뷰 목록에서 찾아보기 →</NzCtaLink></p>
```
