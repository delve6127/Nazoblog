#!/usr/bin/env python3
"""백업 스냅샷 → 로컬 프리뷰 변환기 (개편 작업용)"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SNAP = ROOT / "backup_개편전_2026-07-12/live_site_snapshot"
OUT = ROOT / "_preview"

PAGES = {
    "home.html": "index.html",
    "nazotoki-reviews_skeletonfreak.html": "nazotoki-reviews/skeletonfreak/index.html",
    "darakbang-note.html": "darakbang-note/index.html",
    "darakbang-note_test.html": "darakbang-note/test/index.html",
    "darakbang-note_entrybest5.html": "darakbang-note/entrybest5/index.html",
    "to-review.html": "to-review/index.html",
    "how-to-buy-nazotokis.html": "how-to-buy-nazotokis/index.html",
    "lemonbread.html": "lemonbread/index.html",
    "what-is-nazo.html": "what-is-nazo/index.html",
}

def make(src_name, out_rel):
    h = (SNAP / src_name).read_text(encoding="utf-8", errors="replace")
    # Next.js 하이드레이션·통계 스크립트 제거 (정적 DOM 프리뷰)
    h = re.sub(r'<script[^>]*src="/_next/[^"]*"[^>]*></script>', '', h)
    h = re.sub(r'<script[^>]*src="https://cloud\.umami\.is[^"]*"[^>]*></script>', '', h)
    # 배포 커스텀 코드 → 로컬 (에셋 베이스 오버라이드 주입)
    h = re.sub(r'https://delve6127\.github\.io/Nazoblog/superso_inject\.css[^"]*', '/superso_inject.css', h)
    h = re.sub(r'<script([^>]*)src="https://delve6127\.github\.io/Nazoblog/superso_inject\.js[^"]*"',
               '<script>window.NZ_ASSET_BASE="/";</script><script\\1src="/superso_inject.js"', h)
    h = re.sub(r'(src="/superso_inject\.js)[^"]*', r'\1', h)
    # 나머지 루트 상대 리소스는 실사이트로 절대화
    def absolutize(m):
        attr, path = m.group(1), m.group(2)
        if path.startswith(('/superso_inject.css', '/superso_inject.js')):
            return m.group(0)
        return f'{attr}="https://nazo.monbbang.me{path}"'
    h = re.sub(r'(href|src|srcSet)="(/[^"]*)"', absolutize, h)
    out = OUT / out_rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(h, encoding="utf-8")
    print(f"{out_rel}: OK")

for s, o in PAGES.items():
    make(s, o)
