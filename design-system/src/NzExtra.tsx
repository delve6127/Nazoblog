import * as React from 'react';

/**
 * 번외 항목 — 박스 대신 왼쪽 세로선(3px #E0D7C2)으로 격하시킨 부가 항목. 본문보다 한 단 낮은 위계.
 * 제목은 IBM Plex 700 15.5px(디스플레이 폰트를 쓰지 않음), 옆에 회색 메타. 썸네일이 있으면 왼쪽 92px(모바일 64px) 기둥 + 오른쪽 글 2단.
 * NzPaperSheet 안에서만 스타일이 적용된다. "번외", "함께 보면 좋은", "주의" 같은 부가 항목에 쓴다.
 */
export interface NzExtraProps {
  /** 항목 제목 */
  title: React.ReactNode;
  /** 제목 옆 회색 메타 (예: "2024 · 라인 나조") */
  meta?: React.ReactNode;
  /** 설명 문단. 문자열 하나 또는 여러 개 */
  description?: string | string[];
  /** 작은 썸네일 URL (정방형) */
  image?: string;
  imageAlt?: string;
  /** 링크 URL. 있으면 링크 줄을 그린다 */
  href?: string;
  /** 링크 라벨 (기본 "자세히 →") */
  linkLabel?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function NzExtra({ title, meta, description, image, imageAlt = '', href, linkLabel = '자세히 →', children, className }: NzExtraProps) {
  const paras = description == null ? [] : Array.isArray(description) ? description : [description];
  return (
    <div className={['nz-dn-extra', className].filter(Boolean).join(' ')}>
      <div className="notion-callout__content">
        {image && (
          <div className="nz-dn-extra__img">
            <img src={image} alt={imageAlt} />
          </div>
        )}
        <h3>
          {title}
          {meta != null && <span className="nz-dn-extra__meta">{meta}</span>}
        </h3>
        {paras.map((t, i) => (
          <p className="notion-text" key={i}>{t}</p>
        ))}
        {children}
        {href && (
          <p className="notion-text nz-dn-extra__go">
            <a className="notion-link" href={href}>{linkLabel}</a>
          </p>
        )}
      </div>
    </div>
  );
}
