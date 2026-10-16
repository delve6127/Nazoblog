import { NzRecBadge, NzPaperSheet, NzCard } from 'nazo-darakbang-ds';

/** 4단계 전부 — 사이트 기본 문구 */
export const AllLevels = () => (
  <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: 0 }}>
    <NzRecBadge level="strong" />
    <NzRecBadge level="rec" />
    <NzRecBadge level="ok" />
    <NzRecBadge level="meh" />
  </p>
);

/** 리뷰 상세 크기 */
export const ReviewSize = () => (
  <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: 0 }}>
    <NzRecBadge level="strong" size="review" />
    <NzRecBadge level="rec" size="review" />
    <NzRecBadge level="ok" size="review" />
    <NzRecBadge level="meh" size="review" />
  </p>
);

/** 결론 문단 + 카드 메타 줄 안에서 — 실제 쓰임 */
export const InContext = () => (
  <NzPaperSheet title="달빛 편지냐, 열두 열쇠냐">
    <h2>그래서 결론</h2>
    <p className="notion-text">
      첫 감성 나조라면 <NzRecBadge level="strong" /> 별이 떨어진 밤의 편지. 퍼즐 경험이 있다면 <NzRecBadge level="rec" /> 도서관의 열두 열쇠.
    </p>
    <NzCard title="도서관의 열두 열쇠" sub="책갈피 퍼즐" meta={<>난이도 ★★★ · 1~3인 · 약 120분 &nbsp;<NzRecBadge level="rec" /></>}
      description="열두 장의 카드 열쇠를 모아 서고 문을 여는 방식." href="#keys" />
  </NzPaperSheet>
);
