# Nazoblog — nazo.monbbang.me 커스텀 코드 저장소

Notion + Super.so 블로그의 커스텀 JS/CSS와 데이터 동기화 스크립트.
GitHub Pages(main 루트)가 파일을 서빙하고, Super 코드 인젝션(Head)이 불러온다.
**git push = 즉시 라이브 배포.** 저장소는 반드시 public 유지(private이면 Pages가 꺼져 사이트가 노션 원본으로 돌아감).

## 어느 파일이 라이브인가

- 사이트가 읽는 파일: `superso_inject.2026-10-14.js` / `superso_inject.2026-10-14.css` (날짜 파일). **코드 수정은 반드시 날짜 파일에.**
- `superso_inject.js` / `superso_inject.css`는 10-14 이전 구본(롤백용). 수정 금지. `_preview/superso_inject.js`도 구본 복사본.
- 의심되면 실제 참조를 확인: `curl -s https://nazo.monbbang.me | grep -oE 'superso_inject[^"]*'`
- JS 안의 `NZ_CSS_FILE` 상수는 CSS 파일명과 항상 짝이 맞아야 한다.

## 저장소 구성

| 파일 | 역할 | 누가 바꾸나 |
|---|---|---|
| `superso_inject.<날짜>.js/.css` | 사이트 커스텀 코드 | 사람 |
| `nazo_data.json` | 리뷰 정렬·검색 데이터. `SORT_DATA`는 자동, `PHONETIC_MAP`·`COMPANY_MAP`은 수동 | 예약 작업(매일 09:09) |
| `sync_nazo_data.py`, `리뷰반영.command` | 노션 → nazo_data.json 동기화. 관련 리뷰 관계 속성을 **노션에 쓰기도 함**(대칭 관계라 보태기만) | 사람·예약 작업 |
| `scripts/fetch-to-review.js`, `data/` | 리뷰 예정 목록 JSON·이미지 | GitHub Actions(6시간마다 커밋) |
| `.github/workflows/` | 위 Actions. **이 Mac에선 푸시 불가** → GitHub 웹에서 편집 안내 | 사람(웹) |
| `assets/` | 레몬 아이콘 등 | 사람 |
| `design-system/`, `.design-sync/`, `DESIGN_SYSTEM.md` | Claude Design 동기화용 | 도구 |
| `nazoblog-hydration-gate-design.md`, `nazoblog-seo-handoff.md` | 하이드레이션 게이트 설계·측정 근거, SEO 인수인계 | 참고 문서 |

봇이 수시로 커밋하므로 **푸시 전에 `git pull --rebase`**. 루트의 mockup-*.html, live-*.html, 스냅샷, " 2"가 붙은 iCloud 복제 파일은 미추적 상태로 둔다 (`git add -A` 금지, 파일 단위로 add).

## JS 수정 후 셀프 체크리스트 (커밋 전 표로 보고)

하나라도 어기면 커밋하지 말고 나에게 먼저 알릴 것.

1. **게이트 뒤 실행**: DOM을 바꾸는 코드는 `nzWhenHydrated(cb)` 안에서 1회 실행하고, SPA 이동은 `nz:navigate` 이벤트로 재적용한다. 즉시 실행 계층에서 허용되는 것은 속성·스타일 변경, 로더, CSS 미러만. (React #418 재발 금지, 근거: nazoblog-hydration-gate-design.md)
2. **원본 보존**: Super가 그린 노드를 제거·교체(replace)하지 않는다. 숨기고(display:none) 옆에 새로 그리는 방식만.
3. **멱등성**: 두 번 실행돼도 두 번 그리지 않는다(플래그·마커 확인).
4. **감시자 절제**: 문서 전체(`documentElement`/`body` + `subtree`) 감시자를 새로 만들지 않는다. 감시는 대상 요소로 범위를 좁히고, 용도가 끝나면 `disconnect()`. 영구 setInterval 금지.
5. **파일명 갱신**: 구글 검색 결과·색인에 영향 주는 변경(SEO, 구조, 서버 HTML에 보이는 내용)이면 날짜 접미사를 올리고(예: `superso_inject.2026-11-02.js`), `NZ_CSS_FILE`도 맞추고, Super Head 태그 교체가 필요하다고 나에게 알릴 것. 구글 WRS가 JS를 최대 30일 캐시하기 때문. 디자인 미세조정은 같은 이름 덮어쓰기 허용.
6. **공개 키만**: JS에 들어가는 Supabase 키는 `sb_publishable_`로 시작하는 공개용만. Umami website-id도 공개 OK.

## Super Head 스니펫을 써 줄 때 (저장소 밖 코드)

noindex 스니펫은 Super 대시보드에 있고 저장소에 없다. 새 문구를 써 줄 때:
- 경로는 `decodeURIComponent(location.pathname)` 후 **정확 일치 또는 `startsWith(p + '/')`**. `indexOf` 부분일치 금지(`/test`가 `/nazotoki-reviews/test-play-please`에 걸렸던 버그).
- 현재 목록은 `['/to-review']` + 비공개 리뷰 자동 noindex. **`/lemonbread`는 색인 허용, 실제 리뷰 페이지는 절대 noindex 금지.**

## 비밀값

- 노션 토큰은 `~/.notion_nazo_token`(로컬)과 GitHub Secrets(`NOTION_TOKEN`, `NOTION_DB_ID`)에만 있다. 어떤 파일에도 쓰지 않는다. 필요하면 나에게 물을 것.

## 작업 방식

- 존댓말로 대화한다. 나는 비개발자라 설명은 비개발자 눈높이로.
- 명시적으로 요청하기 전까지는 구현·실행·브라우저·목업 없이 방안 논의만 한다.
- 수정 전에 현재 코드의 타이밍·실행 로직을 먼저 보여주고, 최소 변경으로 간다.
- 모바일 이용자가 월등히 많으므로 모바일 기준으로 먼저 설계한다.
- 커밋은 되돌릴 수 있게 작게 나눈다. 코드(JS/CSS) 커밋·푸시는 내가 명시적으로 요청할 때만. 리뷰 데이터 동기화("업데이트해줘")는 동기화→커밋→푸시→라이브 검증까지 완주하는 기존 루틴.
- 라이브 검증은 내장 브라우저(Claude Browser)가 기본, 모바일 프리셋으로 먼저 본다. 여러 페이지 반복 검사·밀리초 단위 계측·실사이트와 로컬 변형의 자동 비교가 필요할 때만 Playwright. 로컬 프리뷰는 `.claude/launch.json`의 `preview`(포트 4173, `_preview/` 스냅샷 기반).
- 프로젝트 폴더 밖 검색·전체 디스크 find 금지. 한글 파일명은 ls 목록으로 확인.
- iCloud 폴더라 파일이 예전 버전으로 되돌아간 적이 있다. 중요 변경 후 내용을 다시 확인한다.
- 새 작업 전 `git log --oneline`으로 다른 세션·봇의 최근 커밋을 확인한다.
