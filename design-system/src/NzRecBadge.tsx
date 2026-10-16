import * as React from 'react';

/**
 * 추천도 뱃지 — 리뷰의 총평 4단계를 색으로 표시. 14px 700, radius 5px, padding 2px 8px.
 * 강력추천(파랑 채움) · 추천(연파랑) · 괜찮음(회청) · 음..(연회색). 실제 사이트 갤러리·리뷰 상세에서 쓰는 등급 그대로.
 * 전역 규칙이라 어디서든 쓸 수 있다. 비교·순위·결론 문단, 카드 메타 줄 옆에 둔다.
 */
export interface NzRecBadgeProps {
  /** 등급. strong=강력추천 · rec=추천 · ok=괜찮음 · meh=음.. */
  level: 'strong' | 'rec' | 'ok' | 'meh';
  /** 표시 텍스트. 생략하면 등급의 사이트 기본 문구(강력추천/추천/괜찮음/음..) */
  children?: React.ReactNode;
  /** 리뷰 상세 크기(12.5px, padding 4px 11px, radius 6px) */
  size?: 'default' | 'review';
  className?: string;
}

const LABEL: Record<NzRecBadgeProps['level'], string> = { strong: '강력추천', rec: '추천', ok: '괜찮음', meh: '음..' };

export function NzRecBadge({ level, children, size = 'default', className }: NzRecBadgeProps) {
  const cls = [size === 'review' ? 'nz4-rec' : '', 'nz2-rec', `nz2-rec--${level}`, className].filter(Boolean).join(' ');
  return <span className={cls}>{children ?? LABEL[level]}</span>;
}
