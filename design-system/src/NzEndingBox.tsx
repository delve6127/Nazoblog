import * as React from 'react';

/**
 * 맺음 박스 — 문서 마무리용 연한 레몬(#FFF7DC) 박스 + 손글씨 맺음 문구 + 레몬 pill CTA 버튼. 가운데 정렬, radius 10px.
 * 레몬색이 넓게 쓰이는 유일한 자리. 시트 본문의 마지막 블록으로 쓴다.
 * 자체 스코프를 포함하므로 NzPaperSheet 밖에서도 스타일이 적용된다.
 */
export interface NzEndingBoxProps {
  /** 맺음 문구. 문자열 하나 또는 여러 줄(각각 한 문단, 6px 간격) */
  lead: string | string[];
  /** CTA 버튼 링크. 있으면 버튼을 그린다 */
  href?: string;
  /** CTA 버튼 라벨 (기본 "리뷰 구경하러 가기 →" — 실제 사이트 문구) */
  label?: React.ReactNode;
  className?: string;
}

export function NzEndingBox({ lead, href, label = '리뷰 구경하러 가기 →', className }: NzEndingBoxProps) {
  const lines = Array.isArray(lead) ? lead : [lead];
  // .nz-wn-ending 규칙은 .super-content.page__what-is-nazo 스코프 아래에만 있어 래퍼로 스코프를 공급한다.
  return (
    <div className="super-content page__what-is-nazo">
      <div className={['nz-wn-ending', className].filter(Boolean).join(' ')}>
        {lines.map((t, i) => (
          <p className="nz-wn-ending__lead" key={i}>{t}</p>
        ))}
        {href && (
          <a className="nz-wn-go" href={href}>{label}</a>
        )}
      </div>
    </div>
  );
}
