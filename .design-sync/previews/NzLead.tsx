import { NzPaperSheet, NzLead } from 'nazo-darakbang-ds';

/** 한 줄 리드문 + 갈색 실선 */
export const OneLine = () => (
  <NzPaperSheet title="처음 사는 나조토키, 뭘 고를까">
    <NzLead>퍼즐 좋아하는 친구가 "하나만 추천해줘" 했을 때 꺼내는 다섯 개.</NzLead>
    <p className="notion-text">리드문 아래 갈색 실선이 깔리고, 그 다음부터 본문 폰트로 바뀝니다.</p>
  </NzPaperSheet>
);

/** 두 줄 리드문 — 길이가 늘어도 손글씨 톤 유지 */
export const TwoLines = () => (
  <NzPaperSheet title="나조토키 보관법">
    <NzLead>다 푼 나조는 버리지 마세요. 다시 봉하는 법이 있고, 다시 푸는 재미도 있습니다. 소품이 있는 작품이라면 더욱.</NzLead>
    <p className="notion-text">본문 첫 문단.</p>
  </NzPaperSheet>
);
