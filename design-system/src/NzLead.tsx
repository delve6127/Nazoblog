import * as React from 'react';

/**
 * 리드문 — 손글씨(OmyuPretty) 19px 회갈색 문장. 아래에 갈색 2px 실선이 깔려 본문 진입을 알린다.
 * NzPaperSheet의 본문 첫 요소로 쓴다 (스코프 `.super-content.parent-page__darakbang-note article.notion-root`).
 * 보통은 NzPaperSheet의 lead prop으로 쓴다.
 */
export interface NzLeadProps {
  /** 리드 문장. 1~2줄 권장 */
  children: React.ReactNode;
  className?: string;
}

export function NzLead({ children, className }: NzLeadProps) {
  return <p className={['notion-text', 'nz-dn-lead', className].filter(Boolean).join(' ')}>{children}</p>;
}
