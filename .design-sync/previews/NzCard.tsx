import { NzPaperSheet, NzCard, NzTag } from 'nazo-darakbang-ds';

const LEMON = 'https://delve6127.github.io/Nazoblog/assets/lemon.png';
const wrap = (children: React.ReactNode) => (
  <NzPaperSheet title="입문작 5선">
    <h2>1. 가볍게 시작하기</h2>
    {children}
  </NzPaperSheet>
);

/** 썸네일 + 부제 + 메타 + 두 문단 + 링크 — 완전형 */
export const Full = () =>
  wrap(
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
    />
  );

/** 썸네일 없이 텍스트만 */
export const TextOnly = () =>
  wrap(
    <NzCard
      title="Premium One — THE NUMBERS"
      sub="Premium One"
      meta="난이도 ★★★ · 1인 · 약 3시간"
      description="숫자만으로 이루어진 단서가 한 장씩 늘어나는 구성. 중반의 전환이 아름답습니다."
      href="#numbers"
      linkLabel="리뷰 읽기 →"
    />
  );

/** 태그 칩을 children으로 — 형식 표시 */
export const WithTags = () =>
  wrap(
    <NzCard title="AXIDENTZ" sub="SCRAP" meta="난이도 ★★★★ · 2~4인" image={LEMON}
      description="사고 현장을 재구성하는 수사형 나조. 네 명이 각자 단서를 쥐고 시작하면 가장 재밌습니다.">
      <p className="notion-text"><NzTag variant="pad">종이</NzTag> <NzTag variant="line">LINE 연동</NzTag></p>
    </NzCard>
  );

/** 연속 두 장 — 카드 간 16px 리듬 */
export const Stacked = () =>
  wrap(
    <>
      <NzCard title="무비무드 디저트 퍼즐 팩" sub="MovieMood" meta="★★☆ · 1~2인" description="디저트 조각으로 영화 제목을 맞추는 가벼운 입문작." href="#a" />
      <NzCard title="레몬브레드의 수상한 영업일지" sub="LemonBread" meta="★★☆ · 1~2인" description="가게 장부에 숨은 암호를 푸는 짧고 달콤한 작품." href="#b" />
    </>
  );
