import * as React from 'react';
import { LEMON_URL } from './assets';

/**
 * 머리글 행 — 레몬 뱃지 + 날짜 + 우측 pill 버튼("노트 목록으로").
 * NzPaperSheet의 header 안에서만 스타일이 적용된다 (스코프 `.super-content.parent-page__darakbang-note`).
 * 보통은 NzPaperSheet의 badge/date/listHref prop으로 쓰고, 직접 쓰는 일은 드물다.
 */
export interface NzSheetHeadProps {
  /** 뱃지 텍스트. 레몬(#FFD953) 배경 + 진갈색 글자, radius 6px */
  badge?: React.ReactNode;
  /** 날짜 텍스트. 예: "2026. 10. 10" — 연한 회갈색 13.5px */
  date?: React.ReactNode;
  /** 우측 pill 버튼 링크. 있으면 버튼을 그린다 */
  listHref?: string;
  /** pill 버튼 라벨 (기본 "노트 목록으로"). 손글씨 폰트 */
  listLabel?: React.ReactNode;
  /** pill 버튼 아이콘 URL (기본 레몬). null이면 아이콘 없음 */
  icon?: string | null;
  className?: string;
}

export function NzSheetHead({ badge, date, listHref, listLabel = '노트 목록으로', icon = LEMON_URL, className }: NzSheetHeadProps) {
  return (
    <div className={['nz-dn-head', className].filter(Boolean).join(' ')}>
      {badge != null && <span className="nz-dn-badge">{badge}</span>}
      {date != null && <span className="nz-dn-date">{date}</span>}
      {listHref && (
        <a className="nz-dn-listbtn" href={listHref}>
          {icon && <img src={icon} alt="" />}
          {listLabel}
        </a>
      )}
    </div>
  );
}
