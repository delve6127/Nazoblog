import * as React from 'react';
import { NzSheetHead } from './NzSheetHead';
import { NzLead } from './NzLead';

/**
 * 종이 시트 — 문서형 페이지(다락방 노트·가이드)의 그릇.
 * 크림 배경(#FAF7F2) 위에 종이색(#FFFDF7) 시트를 올리고, 헤더와 본문의 테두리를 이어 붙여 한 장으로 보이게 한다.
 * PC: 880px(wide는 1080px) 중앙, 테두리 #E5DCC6 + 그림자. 모바일(≤768px): 시트가 사라지고 좌우 20px 평면으로 흐른다 — CSS가 자동 처리.
 *
 * 본문(children) 작성 규칙:
 * - 문단은 `<p className="notion-text">` (14.5px / 1.95, #4A4335, 폭 800px 제한)
 * - 소제목은 article 직속 `<h2>`/`<h3>` (Jua 23px)
 * - 구분선은 `<hr className="notion-divider" />`
 * - 작품 항목은 NzCard, 번외/부가 항목은 NzExtra, 마무리는 NzEndingBox
 * - 링크는 `<a className="notion-link">` (갈색 #8A6D00 + 레몬색 밑줄)
 */
export interface NzPaperSheetProps {
  /** 페이지 제목. Jua 32px(모바일 25px), 좌측 정렬 */
  title: React.ReactNode;
  /** 머리글 뱃지 (예: "입문작 5선", "다락방 노트"). badge·date·listHref 중 하나라도 있으면 머리글 행을 그린다 */
  badge?: React.ReactNode;
  /** 머리글 날짜 (예: "2026. 10. 10") */
  date?: React.ReactNode;
  /** 우측 "노트 목록으로" pill 버튼의 링크 */
  listHref?: string;
  /** pill 버튼 라벨 (기본 "노트 목록으로") */
  listLabel?: React.ReactNode;
  /** 손글씨 리드문. 아래 갈색 실선이 자동으로 깔린다 */
  lead?: React.ReactNode;
  /** 넓은 리스트형 시트 (880px → 1080px). N선·추천 목록처럼 카드가 많을 때 */
  wide?: boolean;
  /** 본문 블록들 */
  children?: React.ReactNode;
  className?: string;
}

export function NzPaperSheet({ title, badge, date, listHref, listLabel, lead, wide, children, className }: NzPaperSheetProps) {
  const hasHead = badge != null || date != null || !!listHref;
  return (
    <div className={['super-content', 'parent-page__darakbang-note', className].filter(Boolean).join(' ')}>
      <header className="notion-header">
        <div className="notion-header__content">
          {hasHead && <NzSheetHead badge={badge} date={date} listHref={listHref} listLabel={listLabel} />}
          <h1 className="notion-header__title">{title}</h1>
        </div>
      </header>
      <article className={['notion-root', wide ? 'nz-dn-list' : ''].filter(Boolean).join(' ')}>
        {lead != null && <NzLead>{lead}</NzLead>}
        {children}
      </article>
    </div>
  );
}
