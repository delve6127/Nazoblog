import { NzPaperSheet, NzSheetHead } from 'nazo-darakbang-ds';

/** 기본 — 뱃지 + 날짜 + 목록 버튼 (NzPaperSheet의 prop으로 그린 것) */
export const Default = () => (
  <NzPaperSheet title="처음 사는 나조토키, 뭘 고를까" badge="입문작 5선" date="2026. 10. 10" listHref="#notes">
    <p className="notion-text">머리글 행은 시트 헤더 안에서만 스타일이 적용됩니다.</p>
  </NzPaperSheet>
);

/** 버튼 없이 뱃지 + 날짜만 */
export const BadgeAndDate = () => (
  <NzPaperSheet title="나조토키 보관법" badge="다락방 노트" date="2026. 9. 2">
    <p className="notion-text">목록 버튼을 생략한 머리글.</p>
  </NzPaperSheet>
);

/** 아이콘 없는 버튼 + 다른 라벨 — 헤더를 직접 조립할 때 */
export const Manual = () => (
  <div className="super-content parent-page__darakbang-note">
    <header className="notion-header">
      <div className="notion-header__content">
        <NzSheetHead badge="미포유 가이드" date="2026. 8. 9" listHref="#guides" listLabel="가이드 목록으로" icon={null} />
        <h1 className="notion-header__title">미포유 구독, 처음이라면</h1>
      </div>
    </header>
    <article className="notion-root">
      <p className="notion-text">NzSheetHead를 직접 쓴 헤더.</p>
    </article>
  </div>
);
