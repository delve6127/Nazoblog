import * as React from 'react';

/**
 * 내부 작품 카드 — 시트 안에서 작품 하나를 소개하는 따뜻한 종이색(#FAF6EB) 카드. radius 12px, 테두리 #E0D7C2, 그림자 없음.
 * 제목(Jua 21px) + 회색 부제 + 메타 줄 + 설명 문단 + 우측 하단 링크. 썸네일은 오른쪽에 180px(모바일 124px) 정방형으로 떠 있다.
 * NzPaperSheet 안에서만 스타일이 적용된다.
 */
export interface NzCardProps {
  /** 작품 제목 */
  title: React.ReactNode;
  /** 제목 옆 부제 (제작사·시리즈 등). 모바일에선 줄바꿈 */
  sub?: React.ReactNode;
  /** 메타 한 줄 (예: "난이도 ★★☆ · 1~2인 · 2,500엔") */
  meta?: React.ReactNode;
  /** 설명 문단. 문자열 하나 또는 여러 개(각각 한 문단) */
  description?: string | string[];
  /** 썸네일 이미지 URL (정방형 권장) */
  image?: string;
  imageAlt?: string;
  /** 우측 하단 링크 URL. 있으면 링크 줄을 그린다 */
  href?: string;
  /** 링크 라벨 (기본 "리뷰 보러가기 →") */
  linkLabel?: React.ReactNode;
  /** 추가 블록 (description 뒤에 들어감). 문단은 `<p className="notion-text">` */
  children?: React.ReactNode;
  className?: string;
}

export function NzCard({ title, sub, meta, description, image, imageAlt = '', href, linkLabel = '리뷰 보러가기 →', children, className }: NzCardProps) {
  const paras = description == null ? [] : Array.isArray(description) ? description : [description];
  return (
    <div className={['nz-dn-card', className].filter(Boolean).join(' ')}>
      <div className="notion-callout__content">
        {image && (
          <div className="nz-dn-card__img">
            <img src={image} alt={imageAlt} />
          </div>
        )}
        <h3 className="notion-heading">
          {title}
          {sub != null && <> <span className="nz-dn-card__sub">{sub}</span></>}
        </h3>
        {meta != null && <p className="notion-text nz-dn-card__meta">{meta}</p>}
        {paras.map((t, i) => (
          <p className="notion-text" key={i}>{t}</p>
        ))}
        {children}
        {href && (
          <p className="notion-text nz-dn-card__go">
            <a className="notion-link" href={href}>{linkLabel}</a>
          </p>
        )}
      </div>
    </div>
  );
}
