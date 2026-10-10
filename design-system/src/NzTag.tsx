import * as React from 'react';

/**
 * 파스텔 태그 칩 — pill(99px) 12.5px 굵은 글자. 배경은 저채도 파스텔, 테두리는 한 단 진하게, 글자는 같은 색조의 어두운 중간톤.
 * 형식·매체 분류에 쓴다: default(베이지) · line(LINE 나조, 녹색) · web(웹, 파랑) · pad(종이/패드, 청록) · recycle(재사용, 살구).
 * 자체 스코프를 포함하므로 어디서든 쓸 수 있다.
 */
export interface NzTagProps {
  /** 색 변형 */
  variant?: 'default' | 'line' | 'web' | 'pad' | 'recycle';
  /** 태그 텍스트 (짧게, 1~4 단어) */
  children: React.ReactNode;
  className?: string;
}

export function NzTag({ variant = 'default', children, className }: NzTagProps) {
  const cls = ['nz-wn-tag', variant !== 'default' ? `nz-wn-tag--${variant}` : '', className].filter(Boolean).join(' ');
  // .nz-wn-tag 규칙은 .super-content.page__what-is-nazo 스코프 아래에만 있어 래퍼 span으로 스코프를 공급한다.
  return (
    <span className="super-content page__what-is-nazo">
      <span className={cls}>{children}</span>
    </span>
  );
}
