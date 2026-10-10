import { NzPaperSheet, NzExtra } from 'nazo-darakbang-ds';

const LEMON = 'https://delve6127.github.io/Nazoblog/assets/lemon.png';
const wrap = (children: React.ReactNode) => (
  <NzPaperSheet title="입문작 5선">
    <h3>번외</h3>
    {children}
  </NzPaperSheet>
);

/** 썸네일 + 메타 + 링크 — 2단 그리드 */
export const WithThumb = () =>
  wrap(
    <NzExtra title="지금은 구할 수 없는 명작" meta="2021 · 절판" image={LEMON}
      description="중고로만 돌고 있어 목록에서는 뺐지만, 보이면 사세요. 다락방 리뷰 중 가장 높은 점수를 받은 작품입니다."
      href="#old" />
  );

/** 텍스트만 — 왼쪽 세로선 하나로 위계 표시 */
export const TextOnly = () =>
  wrap(
    <NzExtra title="주의 — 시리즈 순서" meta="읽고 가세요"
      description={['2편부터 사면 1편의 결말이 상자 겉면에 적혀 있습니다.', '순서대로 사는 걸 권합니다.']} />
  );

/** 연속 세 항목 — 18px 리듬 */
export const Stacked = () =>
  wrap(
    <>
      <NzExtra title="함께 보면 좋은 글" meta="다락방 노트" description="나조토키란 무엇인가 — 용어와 장르 정리." href="#what" linkLabel="읽기 →" />
      <NzExtra title="구매처" meta="해외 배송" description="일본 아마존·BOOTH·제작사 직판. 배송비 비교는 구매 가이드에." href="#buy" />
      <NzExtra title="절판 소식" meta="2026. 9" description="디저트 퍼즐 팩 초판이 절판되었습니다. 재판 예정은 미정." />
    </>
  );
