import { NzCtaLink } from 'nazo-darakbang-ds';

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ margin: 0, fontFamily: 'var(--nz-font-body)', fontSize: 15, lineHeight: 1.9, color: 'var(--nz-ink)' }}>{children}</p>
);

/** 문장 속 — 가장 흔한 쓰임 */
export const InSentence = () => (
  <P>궁금한 작품이 있다면 <NzCtaLink href="#reviews">리뷰 목록에서 찾아보기 →</NzCtaLink></P>
);

/** 손글씨 문장 속 — 히어로/리드문 톤 */
export const InHandwriting = () => (
  <p style={{ margin: 0, fontFamily: 'var(--nz-font-hand)', fontSize: 19, color: 'var(--nz-muted-4)' }}>
    처음이라면 <NzCtaLink href="#what">나조토키란? →</NzCtaLink>
  </p>
);

/** 외부 링크 */
export const External = () => (
  <P>구매는 <NzCtaLink href="https://example.com" external>제작사 공식 스토어에서 →</NzCtaLink></P>
);
