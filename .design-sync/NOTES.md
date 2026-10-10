# design-sync 메모 — 몬빵의 나조토키 다락방

- 이 리포는 React 컴포넌트 라이브러리가 아니라 Super.so(Notion) 블로그의 커스텀 CSS/JS 한 쌍이다.
  `superso_inject.css`(4,837줄)가 디자인 시스템의 유일한 진짜 소스. **원본은 절대 수정하지 않는다.**
- `design-system/`은 동기화용 래퍼 패키지. `npm run build`가 `../superso_inject.css`를 `styles.css`로 복사만 한다.
  컴포넌트 export가 없어 converter가 **tokens-only** 모드로 돈다 (`[ZERO_MATCH] ... treating as tokens-only DS`).
- 가이드라인은 리포 루트의 `DESIGN_SYSTEM.md` (실측 기반 디자인 문법서, 2026-10-10 작성)를 `guidelinesGlob`으로 가져온다.
- 폰트 3종(Jua, IBM Plex Sans KR = Google Fonts @import / OmyuPretty = jsdelivr @font-face)은 모두 CDN 런타임 로드.
  리포에 폰트 파일 없음 → `runtimeFontPrefixes`로 [FONT_MISSING] 억제.
- 에셋(`assets/lemon.png`, `assets/masthead-title.png`)은 CSS가 아니라 `superso_inject.js`가 삽입하므로 번들에 포함되지 않는다.
  URL은 DESIGN_SYSTEM.md §11에 기재.
- 패키지 매니저/락파일 없음 — 설치 단계 해당 없음.

## 실행 절차 (재동기화 시)
1. `cd design-system && npm i` (react, react-dom, @types/react — converter가 React를 번들에 vendoring하기 위해 필요. 락파일 없음, `--no-package-lock`)
2. `.ds-sync/` 스테이징 + `npm i esbuild ts-morph @types/react playwright` + `npx playwright install chromium`
3. 리포 루트에서: `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules design-system/node_modules --out ./ds-bundle --entry ./design-system/index.js`
   (첫 동기화 2026-10-10: build/validate 통과, capture는 empty_worklist로 스킵 — tokens-only라 정상)

## Re-sync risks
- **CSS 원본이 바뀌면 그대로 반영된다.** `superso_inject.css`가 유일한 소스이므로 사이트 CSS 수정 = 디자인 시스템 변경. 재동기화하면 `_ds_bundle.css`가 통째로 교체된다 (styleSha 변경). 의도한 동작.
- **DESIGN_SYSTEM.md와 CSS의 불일치.** 가이드라인 문서는 2026-10-10 실측 수기 작성. CSS가 바뀌어도 문서는 자동 갱신되지 않는다. 재동기화 전에 §1 토큰·§4 프리미티브 값이 여전히 맞는지 확인할 것 (특히 `:root` 블록 14~38행).
- **conventions.md에 적힌 클래스명.** 사이트 CSS에서 클래스가 리네임/삭제되면 규약서가 거짓이 된다. 재동기화 시 regex 검증 스크립트(이 세션에서 python으로 한 것: conventions의 `.nz*`/`.notion*`/`--nz-*` 이름을 `_ds_bundle.css`에서 grep)를 다시 돌릴 것.
- **폰트는 CDN 의존.** Google Fonts `@import`는 `_ds_bundle.css` 첫 줄에 그대로 남고, OmyuPretty `@font-face`는 jsdelivr URL로 `fonts/fonts.css`에 들어간다. 오프라인·CDN 장애 시 디자인이 fallback 폰트로 렌더된다. 번들에 폰트 파일 없음.
- **에셋 미포함.** 레몬/배너 PNG는 번들에 없고 URL만 문서에 있다. GitHub Pages(delve6127.github.io/Nazoblog)가 내려가면 이미지가 깨진다 — 리포 public 유지 필수(별도 메모리 참조).
- **검증 범위.** 컴포넌트 0개라 스크린샷 채점 없음. 검증은 "CSS가 파싱되고 @import가 전부 resolve된다"까지. 디자인 에이전트가 클래스를 올바르게 조합하는지는 사용 중 확인해야 한다.
- 툴체인: node v24.14.0, esbuild/ts-morph는 .ds-sync 설치 당시 최신, playwright chromium-headless-shell v1248.
