import * as React from 'react';

/**
 * 레몬 밑줄 인라인 링크 — 브랜드 시그니처. 굵은 잉크색 글자 아래 3px 레몬(#FFD953) 밑줄, 호버 시 진한 레몬.
 * 문장 안의 핵심 행동("리뷰 보기", "구매처 안내")에 한 문단당 하나만 쓴다. 전역 규칙이라 어디서든 적용된다.
 */
export interface NzCtaLinkProps {
  href: string;
  /** 링크 텍스트 */
  children: React.ReactNode;
  /** 새 탭으로 열기 */
  external?: boolean;
  className?: string;
}

export function NzCtaLink({ href, children, external, className }: NzCtaLinkProps) {
  return (
    <a
      className={['nz-masthead__cta-link', className].filter(Boolean).join(' ')}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}
