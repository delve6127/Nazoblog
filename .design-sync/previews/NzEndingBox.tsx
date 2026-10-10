import { NzEndingBox } from 'nazo-darakbang-ds';

/** 두 줄 문구 + CTA */
export const Default = () => (
  <NzEndingBox lead={['여기까지 읽으셨다면 이미 반은 고른 거예요.', '나머지 반은 다락방에서.']} href="#home" />
);

/** 한 줄 + 다른 라벨 */
export const OneLine = () => (
  <NzEndingBox lead="다락방엔 리뷰가 더 있어요." href="#reviews" label="리뷰 보러가기 →" />
);

/** 버튼 없이 문구만 */
export const LeadOnly = () => <NzEndingBox lead="오늘도 즐거운 나조토키." />;
