import { NzPaperSheet, NzCard, NzExtra, NzEndingBox, NzTag, NzCtaLink } from 'nazo-darakbang-ds';

const LEMON = 'https://delve6127.github.io/Nazoblog/assets/lemon.png';

/** 입문작 5선 노트 — 머리글·리드문·소제목·카드·번외·맺음까지 한 장 */
export const BeginnerNote = () => (
  <NzPaperSheet
    title="처음 사는 나조토키, 뭘 고를까"
    badge="입문작 5선"
    date="2026. 10. 10"
    listHref="#notes"
    lead={<>퍼즐 좋아하는 친구가 "하나만 추천해줘" 했을 때 꺼내는 다섯 개.</>}
  >
    <p className="notion-text">
      나조토키는 '수수께끼 풀이'지만, 첫 작품은 머리보다 손이 즐거운 쪽이 좋습니다. 막혀도 만지작거릴 거리가 있는 것, 답을 봐도 억울하지 않은 것. 그 기준으로 다섯 개를 골랐습니다.{' '}
      <a className="notion-link" href="#how">고르는 기준은 따로 적어두었어요.</a>
    </p>
    <h2>1. 가볍게 시작하기</h2>
    <NzCard
      title="무비무드 디저트 퍼즐 팩"
      sub="MovieMood"
      meta="난이도 ★★☆ · 1~2인 · 약 2시간"
      image={LEMON}
      description={[
        '디저트 모양 조각을 맞추면 영화 제목이 떠오르는 구조. 그림이 예뻐서 풀다 말고 사진을 찍게 됩니다.',
        '첫 나조로 추천하는 이유는 하나 — 막혀도 손이 계속 움직인다는 것.',
      ]}
      href="#moviemood"
    >
      <p className="notion-text"><NzTag variant="pad">종이</NzTag> <NzTag variant="recycle">재플레이 가능</NzTag></p>
    </NzCard>
    <NzCard
      title="Premium One — THE NUMBERS"
      sub="Premium One"
      meta="난이도 ★★★ · 1인 · 약 3시간"
      description="숫자만으로 이루어진 단서가 한 장씩 늘어나는 구성. 중반의 전환이 아름답습니다."
      href="#numbers"
    />
    <hr className="notion-divider" />
    <h3>번외</h3>
    <NzExtra
      title="지금은 구할 수 없는 명작"
      meta="2021 · 절판"
      image={LEMON}
      description="중고로만 돌고 있어 목록에서는 뺐지만, 보이면 사세요. 다락방 리뷰 중 가장 높은 점수를 받은 작품입니다."
      href="#old"
    />
    <p className="notion-text">
      여기까지가 다섯 개. 궁금한 작품이 있다면 <NzCtaLink href="#reviews">리뷰 목록에서 찾아보기 →</NzCtaLink>
    </p>
    <NzEndingBox lead={['여기까지 읽으셨다면 이미 반은 고른 거예요.', '나머지 반은 다락방에서.']} href="#home" />
  </NzPaperSheet>
);

/** 머리글 없이 제목 + 리드문 + 본문만 — 짧은 가이드 글 */
export const ShortGuide = () => (
  <NzPaperSheet title="나조토키 보관법" lead="다 푼 나조는 버리지 마세요. 다시 봉하는 법이 있습니다.">
    <p className="notion-text">
      소품이 있는 작품은 봉투에 번호를 적어 두면 재플레이가 쉬워집니다. 종이 단서는 클리어파일에, 입체 소품은 원래 상자에.
    </p>
    <h2>봉투 라벨 쓰기</h2>
    <p className="notion-text">열었던 순서대로 1, 2, 3을 적습니다. 순서를 모르면 재플레이 때 스포일러가 됩니다.</p>
  </NzPaperSheet>
);

/** wide — 1080px 넓은 리스트형 시트 */
export const WideList = () => (
  <NzPaperSheet title="2026 상반기 리뷰 모아보기" badge="리스트" date="2026. 7. 1" listHref="#notes" wide
    lead="상반기에 다락방에 올라온 리뷰 열두 편을 추천순으로.">
    <NzCard title="AXIDENTZ" sub="SCRAP" meta="난이도 ★★★★ · 2~4인" description="사고 현장을 재구성하는 수사형 나조. 네 명이 각자 단서를 쥐고 시작하면 가장 재밌습니다." href="#axidentz" />
    <NzCard title="레몬브레드의 수상한 영업일지" sub="LemonBread" meta="난이도 ★★☆ · 1~2인" description="가게 장부에 숨은 암호를 푸는 짧고 달콤한 작품." href="#lemonbread" />
  </NzPaperSheet>
);
