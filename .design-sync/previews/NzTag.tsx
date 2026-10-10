import { NzTag } from 'nazo-darakbang-ds';

/** 5종 전부 */
export const AllVariants = () => (
  <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: 0 }}>
    <NzTag>기본</NzTag>
    <NzTag variant="line">LINE 나조</NzTag>
    <NzTag variant="web">웹</NzTag>
    <NzTag variant="pad">종이</NzTag>
    <NzTag variant="recycle">재플레이 가능</NzTag>
  </p>
);

/** 메타 줄 안에서 — 실제 쓰임 */
export const InMetaLine = () => (
  <p style={{ margin: 0, fontFamily: 'var(--nz-font-body)', fontSize: 13, color: 'var(--nz-muted-4)' }}>
    난이도 ★★☆ · 1~2인 &nbsp;<NzTag variant="pad">종이</NzTag> <NzTag variant="recycle">재플레이 가능</NzTag>
  </p>
);
