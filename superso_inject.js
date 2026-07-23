// ── 메인 히어로 카피 (문구 수정은 여기서) ──
var NZ_HERO_COPY = {
  tagline: '한국인의 시선으로 기록하는 일본 나조토키',
  tagline_count: '지금까지 {N}작품을 풀었어요',   // {N} 자리에 리뷰 수가 들어감
  cta_before: '나조토키가 처음이라면',
  cta_link: '나조토키란?',
  cta_url: '/what-is-nazo'
};

// ── 다락방 노트 공개 스위치 (5단계 완료 시 true로 바꾸면 칩·박스·사이드바 노출) ──
var NZ_NOTES_READY = true; // 2026-07-23 다락방 노트 오픈 (사용자 승인)

// ── 에셋 베이스 (로컬 프리뷰에서는 window.NZ_ASSET_BASE로 덮어씀) ──
var NZ_ASSET_BASE = window.NZ_ASSET_BASE || 'https://delve6127.github.io/Nazoblog/';

// ── 외부 JSON에서 데이터 로드 (전역) ──
var NAZO_DATA_URL = NZ_ASSET_BASE + 'nazo_data.json';
var PHONETIC_MAP = {};
var COMPANY_MAP = {};
var SORT_DATA = {};
var _nazoDataLoaded = false;
var _nazoDataCallbacks = [];

function loadNazoData(callback) {
  if (_nazoDataLoaded) { callback(); return; }
  _nazoDataCallbacks.push(callback);
  if (_nazoDataCallbacks.length > 1) return; // 이미 로딩 중
  fetch(NAZO_DATA_URL)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      PHONETIC_MAP = data.PHONETIC_MAP || {};
      COMPANY_MAP = data.COMPANY_MAP || {};
      SORT_DATA = data.SORT_DATA || {};
      _nazoDataLoaded = true;
      console.log('[나조토키] 외부 데이터 로드 완료 (' + Object.keys(SORT_DATA).length + '개 리뷰)');
      _nazoDataCallbacks.forEach(function (cb) { cb(); });
      _nazoDataCallbacks = [];
    })
    .catch(function (err) {
      console.warn('[나조토키] 데이터 로드 실패, 기능 제한 모드:', err);
      _nazoDataLoaded = true;
      _nazoDataCallbacks.forEach(function (cb) { cb(); });
      _nazoDataCallbacks = [];
    });
}

// ── CSS 미러: 본 CSS 전문을 브라우저 저장소에 복사해두고, 다음 방문부터
// JS 실행 즉시 적용한다. 하이드레이션이 <link>를 재부착하며 재다운로드하는 동안에도
// 미러가 살아 있어 원본 노출 공백이 사라진다 (첫 방문만 기존 방어로 커버).
var NZ_CSS_URL = NZ_ASSET_BASE + 'superso_inject.css';
function nzInjectCssMirror() {
  if (document.getElementById('nz-css-mirror')) return;
  var txt = null;
  try { txt = localStorage.getItem('nz_css_mirror_v1'); } catch (e) {}
  if (!txt) return;
  var s = document.createElement('style');
  s.id = 'nz-css-mirror';
  s.textContent = txt;
  var head = document.head || document.documentElement;
  // 링크보다 앞에 둬서, 새로 배포된 CSS(링크)가 항상 우선하게 한다
  head.insertBefore(s, head.firstChild);
}
nzInjectCssMirror();

// 미러 갱신: 페이지 로드가 끝나고 한가할 때 최신 CSS를 받아 저장
window.addEventListener('load', function () {
  setTimeout(function () {
    fetch(NZ_CSS_URL)
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (txt) {
        if (txt && txt.indexOf('nz-loader') > -1) {
          try { localStorage.setItem('nz_css_mirror_v1', txt); } catch (e) {}
        }
      })
      .catch(function () {});
  }, 1500);
});

// ── 크리티컬 스타일 (인라인 주입) ──
// 하이드레이션이 head의 CSS <link>를 뽑았다 다시 꽂는 동안(재다운로드 ~수백ms)
// 가림막·로더 규칙이 함께 죽어 노션 원본이 노출된다.
// 생존에 필요한 최소 규칙을 JS가 직접 <style>로 심어 네트워크와 무관하게 유지한다.
var NZ_CRITICAL_CSS = ''
  + 'html { background: #FAF7F2; }'
  + 'body:not(.nz-ready) .super-root { opacity: 0 !important; }'
  + 'body.nz-loading .super-root, body.nz-loading #__next > *:not(#nz-loader) { opacity: 0 !important; }'
  + '#nz-loader { position: fixed; inset: 0; z-index: 99999; background: #FAF7F2;'
  +   ' display: flex; flex-direction: column; align-items: center; justify-content: center;'
  +   ' gap: 16px; transition: opacity 0.4s ease; }'
  + '#nz-loader.nz-loader-hide { opacity: 0; pointer-events: none; }'
  + '#nz-loader-lemon { width: 48px; height: 48px; animation: nz-c-bounce 1s ease-in-out infinite; }'
  + '#nz-loader-lemon img { width: 100%; height: 100%; object-fit: contain; }'
  + '#nz-loader-spinner { width: 24px; height: 24px; border: 3px solid #E8E0D5;'
  +   ' border-top-color: #C8B888; border-radius: 50%; animation: nz-c-spin 0.7s linear infinite; }'
  + '@keyframes nz-c-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }'
  + '@keyframes nz-c-spin { to { transform: rotate(360deg); } }';

function nzInjectCriticalStyle() {
  if (document.getElementById('nz-critical')) return;
  var s = document.createElement('style');
  s.id = 'nz-critical';
  s.textContent = NZ_CRITICAL_CSS;
  (document.head || document.documentElement).appendChild(s);
}
nzInjectCriticalStyle();

// 본 CSS(<link>)가 실제 적용 중인지 — 하이드레이션 재부착 중엔 목록에서 사라진다
function nzMainCssActive() {
  var mirror = document.getElementById('nz-css-mirror');
  if (mirror && mirror.textContent) return true; // 미러가 전체 스타일을 대신 유지 중
  try {
    for (var i = 0; i < document.styleSheets.length; i++) {
      var href = document.styleSheets[i].href || '';
      if (href.indexOf('superso_inject.css') > -1) return true;
    }
  } catch (e) {}
  return false;
}

// ── 로딩 스크린 ──
function showLoader() {
  if (document.getElementById('nz-loader')) return;
  if (document.body) document.body.classList.add('nz-loading');
  var loader = document.createElement('div');
  loader.id = 'nz-loader';
  loader.innerHTML = '<div id="nz-loader-lemon"><img src="https://assets.super.so/b529abf1-8288-44d9-87eb-38228677c041/images/bcc6ec8e-275b-4bfc-b598-b2108922863e/noname.png" alt="lemon" /></div><div id="nz-loader-spinner"></div>';
  // 하이드레이션이 body를 갈아끼우는 찰나에는 html에 붙인다 (position:fixed라 위치 동일)
  (document.body || document.documentElement).appendChild(loader);
}

// 하이드레이션이 로더를 지우는 즉시 되살리는 감시자 (공개 전까지만)
var nzLoaderGuard = null;
function startLoaderGuard() {
  if (nzLoaderGuard || typeof MutationObserver === 'undefined') return;
  nzLoaderGuard = new MutationObserver(function () {
    nzInjectCriticalStyle(); // 크리티컬 스타일이 지워지면 즉시 재주입
    nzInjectCssMirror();     // CSS 미러도 지워지면 즉시 재주입
    if (!window.__nzReadyOnce && !document.getElementById('nz-loader')) showLoader();
  });
  nzLoaderGuard.observe(document.documentElement, { childList: true, subtree: true });
}

function hideLoader() {
  window.__nzReadyOnce = true;
  if (nzLoaderGuard) { nzLoaderGuard.disconnect(); nzLoaderGuard = null; }
  document.body.classList.add('nz-ready');  // CSS 선가림 해제
  var loader = document.getElementById('nz-loader');
  if (!loader) {
    document.body.classList.remove('nz-loading');
    return;
  }
  document.body.classList.remove('nz-loading');
  loader.classList.add('nz-loader-hide');
  setTimeout(function() {
    if (loader.parentNode) loader.parentNode.removeChild(loader);
  }, 500);
}

function nzPageTitleText() {
  var el = document.querySelector('.notion-header__title');
  return el ? el.textContent.trim() : '';
}

function waitAndHideLoader(prevTitle) {
  // SPA 전환이면 이전 페이지 제목을 받아, 내용이 실제로 교체된 뒤에만 연다
  var needTitleChange = typeof prevTitle === 'string';
  // 페일세이프: 4.5초 내 준비가 안 되면 폴링까지 완전히 멈추고 화면을 연다
  // (멈추지 않으면 로더 재생성 폴링이 계속 돌아 화면이 영영 가려짐)
  var maxWait = setTimeout(function () {
    opened = true;
    clearInterval(checkReady);
    hideLoader();
  }, 4500);
  var path = window.location.pathname;
  var isHome = path === '/' || path === '';
  var isReview = path.indexOf('/nazotoki-reviews/') === 0;
  var isGuide = path.indexOf('/what-is-nazo') === 0;
  var isNoteDetail = /^\/darakbang-note\/.+/.test(path);
  var isToReview = path.replace(/\/$/, '') === '/to-review';
  var isNoteList = path.replace(/\/$/, '') === '/darakbang-note';
  var isAbout = path.indexOf('/lemonbread') === 0;
  var isShop = path.indexOf('/how-to-buy-nazotokis') === 0;
  var stableSince = null;
  var opened = false;
  function openScreen() {
    if (opened) return;
    opened = true;
    clearTimeout(maxWait);
    replaceMainTitle();
    hideLoader();
  }
  var checkReady = setInterval(function() {
    if (opened) { clearInterval(checkReady); return; }
    // 하이드레이션이 로더를 지워버리는 경우가 있어, 공개 전까지는 다시 그려 넣는다
    if (!document.getElementById('nz-loader')) showLoader();
    var ready;
    if (isHome) {
      ready = document.getElementById('nz2-layout') && document.querySelector('.nz-card-custom');
    } else if (isReview) {
      ready = document.querySelector('.nz-review-wrap');
    } else if (isGuide) {
      // 리뷰 페이지와 동일 원칙: JS 장식 결과물이 실제로 존재해야 준비로 판정
      // (nz-wn 장식 모듈이 콜아웃 전부에 클래스를 붙이고 ending까지 만든 상태)
      var art = document.querySelector('article.notion-root');
      ready = art && art.querySelector('.nz-wn-ending') &&
              !art.querySelector('.notion-callout:not(.nz-wn-callout)');
    } else if (isNoteDetail) {
      // 노트 상세: 머리글+본문 장식 결과물 존재로 판정
      ready = document.querySelector('.nz-dn-head') && document.querySelector('.nz-dn-article');
    } else if (isAbout) {
      // 레몬빵?도 동일: 소개 카드(커스텀 DOM) 존재로 판정
      ready = document.querySelector('.nz-about-card');
    } else if (isNoteList) {
      ready = document.querySelector('.nz-dl-card') || document.querySelector('.nz-dl-empty');
    } else if (isToReview) {
      // 커스텀 목록(행 또는 빈 상태)이 실제로 그려진 뒤에만 공개
      ready = document.querySelector('.nz-tr-wrap .nz-tr-row') || document.querySelector('.nz-tr-empty');
    } else if (isShop) {
      ready = document.querySelector('.nz-shop-header');
    } else {
      ready = document.querySelector('.super-content');
    }
    // SPA 전환 중에는 옛 페이지 내용이 남아 있으므로, 제목이 바뀌기 전엔 준비로 치지 않는다
    if (ready && needTitleChange && nzPageTitleText() === prevTitle) ready = false;
    // 본 CSS가 (재부착 등으로) 빠져 있는 동안엔 열지 않는다
    if (ready && !nzMainCssActive()) ready = false;
    // 하이드레이션이 커스텀을 갈아엎는 순간이 있으므로,
    // 준비 상태가 400ms 연속 유지될 때만 화면을 연다
    if (ready) {
      if (stableSince === null) stableSince = Date.now();
      if (Date.now() - stableSince >= 400) {
        clearInterval(checkReady);
        // 폰트가 아직이면 시스템 글씨로 떴다가 확 바뀌므로, 완료를 기다린다 (최대 2.5초)
        if (document.fonts && document.fonts.status === 'loading') {
          var fontCap = setTimeout(openScreen, 2500);
          document.fonts.ready.then(function () { clearTimeout(fontCap); openScreen(); });
        } else {
          openScreen();
        }
      }
    } else {
      stableSince = null;
    }
  }, 100);
}

// 최초 로드 시 로딩 표시
showLoader();
startLoaderGuard();
waitAndHideLoader();

// ── 본 CSS 이탈 감시: 하이드레이션이 <link>를 재부착하는 동안 화면을 닫아 원본 노출 차단 ──
// 폴링이 아니라 DOM 변경 즉시(페인트 전 microtask) 반응해야 원본이 한 프레임도 안 보인다
(function () {
  var seenActive = false;
  var lostMode = false;
  var recoverPoll = null;

  function closeForCssLoss() {
    if (lostMode) return;
    lostMode = true;
    nzInjectCssMirror();     // 미러가 있으면 스타일을 즉시 대체 유지
    nzInjectCriticalStyle(); // 가림막·로더 규칙 생존 보장
    window.__nzReadyOnce = false;
    if (document.body) document.body.classList.remove('nz-ready');
    showLoader();
    startLoaderGuard();
    // CSS가 돌아오면 준비 조건 재확인 후 재공개
    if (recoverPoll) clearInterval(recoverPoll);
    recoverPoll = setInterval(function () {
      if (nzMainCssActive()) {
        clearInterval(recoverPoll);
        recoverPoll = null;
        lostMode = false;
        waitAndHideLoader();
      }
    }, 100);
  }

  function checkNow() {
    var active = nzMainCssActive();
    if (!seenActive) { if (active) seenActive = true; return; }
    if (!active) closeForCssLoss();
  }

  // head/문서 변경 즉시 확인 — mutation microtask는 페인트보다 먼저 실행된다
  var mo = new MutationObserver(checkNow);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  // 보험: 저빈도 폴링 (감시자가 놓치는 경우 대비)
  setInterval(checkNow, 300);
})();

// ── 날짜 변환 ──
function convertDates() {
  document.querySelectorAll(".notion-property__date .date").forEach(function(el) {
    const text = el.innerText.trim();
    const date = new Date(text);
    if (!isNaN(date)) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      el.innerText = year + "년 " + month + "월 " + day + "일";
    }
  });
}

// ── 메인 페이지 마스트헤드 (v2): 타이틀 이미지 → 오뮤 태그라인 → 업데이트 → 담백 CTA ──
var nzMastheadCountText = null;   // 마지막으로 계산한 카운트 문구 (재생성 시 즉시 사용)
var nzMastheadUpdatedText = null; // 마지막 업데이트 문구
function replaceMainTitle() {
  if (window.location.pathname !== '/' && window.location.pathname !== '') return;

  // 이미 정상 마스트헤드가 있으면 재생성하지 않는다 (깜빡임 방지)
  if (document.querySelector('.nz-masthead')) {
    var dupTitle = document.querySelector('.notion-header__title');
    if (dupTitle) dupTitle.style.display = 'none'; // 하이드레이션이 원제목을 되살렸을 때만 재숨김
    return;
  }

  // 이전 잔재 제거 (구버전 클래스 포함)
  ['.nz-masthead', '.nz-title-img-wrap', '.nz-hero-copy', '#nz-review-counter'].forEach(function (sel) {
    var old = document.querySelector(sel);
    if (old) old.parentNode.removeChild(old);
  });

  var titleEl = document.querySelector('.notion-header__title');
  if (!titleEl) return;

  titleEl.dataset.nzReplaced = 'true';
  titleEl.style.display = 'none';

  var wrap = document.createElement('div');
  wrap.className = 'nz-masthead';
  wrap.innerHTML =
    '<img class="nz-masthead__title-img" src="' + NZ_ASSET_BASE + 'assets/masthead-title.png" alt="몬빵의 나조토키 다락방" draggable="false">' +
    '<p class="nz-masthead__tagline">' + NZ_HERO_COPY.tagline +
      '<span class="nz-masthead__dot"> · </span><br class="nz-masthead__br">' +
      '<span id="nz-masthead-count">' + (nzMastheadCountText || NZ_HERO_COPY.tagline_count.replace('{N}', '…')) + '</span></p>' +
    '<p class="nz-masthead__updated" id="nz-masthead-updated">' + (nzMastheadUpdatedText || '') + '</p>' +
    '<p class="nz-masthead__cta">' + NZ_HERO_COPY.cta_before +
      ' <span class="nz-masthead__cta-arrow">→</span> ' +
      '<a class="nz-masthead__cta-link" href="' + NZ_HERO_COPY.cta_url + '">' + NZ_HERO_COPY.cta_link + '</a></p>';

  titleEl.parentNode.insertBefore(wrap, titleEl);

  wrap.querySelector('.nz-masthead__title-img').addEventListener('click', function () {
    window.location.href = '/';
  });

  // 리뷰 수 + 마지막 업데이트 채우기 (카드 DOM에서 집계 — 기존 로직 유지)
  var counterTry = 0;
  var counterInterval = setInterval(function () {
    counterTry++;
    if (counterTry > 30) { clearInterval(counterInterval); return; }
    var countEl = document.getElementById('nz-masthead-count');
    if (!countEl) { clearInterval(counterInterval); return; }
    var cards = document.querySelectorAll('.notion-collection-card');
    if (!cards.length) return;
    clearInterval(counterInterval);
    var publishSel = '.property-54495c70';
    var dateSel = '.property-57636b4d';
    var visibleCount = 0;
    var latestDate = null;
    cards.forEach(function (card) {
      var pubEl = card.querySelector(publishSel);
      if (pubEl && pubEl.textContent.trim() === '비공개') return;
      visibleCount++;
      var dateEl = card.querySelector(dateSel);
      if (!dateEl) return;
      var parsed = new Date(dateEl.textContent.trim());
      if (!isNaN(parsed.getTime()) && (!latestDate || parsed > latestDate)) latestDate = parsed;
    });
    nzMastheadCountText = NZ_HERO_COPY.tagline_count.replace('{N}', visibleCount);
    countEl.textContent = nzMastheadCountText;
    if (latestDate) {
      var y = latestDate.getFullYear();
      var m = ('0' + (latestDate.getMonth() + 1)).slice(-2);
      var d = ('0' + latestDate.getDate()).slice(-2);
      nzMastheadUpdatedText = '마지막 업데이트 ' + y + '.' + m + '.' + d;
      var updEl = document.getElementById('nz-masthead-updated');
      if (updEl) updEl.textContent = nzMastheadUpdatedText;
    }
  }, 200);
}

// 마스트헤드 보장 루프: 하이드레이션이 지워도 150ms 내 복구 (있으면 즉시 통과)
function ensureMastheadLoop() {
  var started = Date.now();
  var iv = setInterval(function () {
    replaceMainTitle();
    if (Date.now() - started > 3000) clearInterval(iv);
  }, 150);
}

// ── SPA 네비게이션 감지 ──
(function() {
  var lastUrl = location.href;

  function onNavigate() {
    // SPA 전환: 이전 페이지에서 켜둔 '화면 열림' 상태를 되돌려
    // 새 내용이 꾸며지기 전까지 CSS 선가림이 다시 작동하게 한다
    window.__nzReadyOnce = false;
    if (document.body) document.body.classList.remove('nz-ready');
    var prevTitle = nzPageTitleText(); // 아직 옛 페이지 제목 — 교체 감지 기준
    showLoader();
    startLoaderGuard(); // 첫 공개 때 해제된 로더 감시자 재가동
    setTimeout(convertDates, 500);
    setTimeout(convertDates, 1500);
    ensureMastheadLoop();
    waitAndHideLoader(prevTitle);
  }

  // popstate (뒤로/앞으로 가기)
  window.addEventListener('popstate', function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onNavigate();
    }
  });

  // pushState/replaceState 가로채기 (SPA 링크 클릭)
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function() {
    origPush.apply(this, arguments);
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onNavigate();
    }
  };
  history.replaceState = function() {
    origReplace.apply(this, arguments);
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onNavigate();
    }
  };
})();

// 최초 로드 시 실행
setTimeout(convertDates, 500);
setTimeout(convertDates, 1000);
setTimeout(convertDates, 2000);
setTimeout(convertDates, 3000);
ensureMastheadLoop();

// ── 공용 라이트박스 ────────────────────────────────────────
function nzLightboxInit() {
  if (document.getElementById('nz-lightbox')) return;
  var lb = document.createElement('div');
  lb.id = 'nz-lightbox';
  lb.innerHTML = '<div id="nz-lightbox-backdrop"></div>'
    + '<div id="nz-lightbox-content">'
    +   '<button id="nz-lightbox-close">✕</button>'
    +   '<img id="nz-lightbox-img" src="" alt="사진">'
    + '</div>';
  document.body.appendChild(lb);

  document.getElementById('nz-lightbox-backdrop').addEventListener('click', nzLightboxClose);
  document.getElementById('nz-lightbox-close').addEventListener('click', nzLightboxClose);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') nzLightboxClose();
  });
}

function nzLightboxOpen(url) {
  nzLightboxInit();
  var lb = document.getElementById('nz-lightbox');
  var img = document.getElementById('nz-lightbox-img');
  if (!lb || !img) return;

  function showLightbox() {
    var content = document.getElementById('nz-lightbox-content');
    lb.classList.add('nz-lightbox-active');
    document.body.style.overflow = 'hidden';
    if (!content) return;

    var start = null;
    var duration = 300;
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px) scale(0.95)';

    function animate(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var e = 1 - Math.pow(1 - p, 3);
      content.style.opacity = e;
      content.style.transform = 'translateY(' + (20 * (1 - e)) + 'px) scale(' + (0.95 + 0.05 * e) + ')';
      if (p < 1) requestAnimationFrame(animate);
      else { content.style.opacity = '1'; content.style.transform = ''; }
    }
    requestAnimationFrame(animate);
  }

  img.onload = showLightbox;
  img.onerror = showLightbox;
  img.src = url;
  if (img.complete) { img.onload = null; img.onerror = null; showLightbox(); }
}

function nzLightboxClose() {
  var lb = document.getElementById('nz-lightbox');
  if (!lb) return;
  lb.classList.remove('nz-lightbox-active');
  document.body.style.overflow = '';
}

// ── 리뷰 상세 페이지 레이아웃 ──
(function () {
  'use strict';

  // ── 속성 ID 설정 ─────────────────────────────────────
  var ID = {
    mNumber:      'property-59577577',
    company:      'property-5667463f',
    playDate:     'property-74554066',
    officialDiff: 'property-6d44666a',
    personalDiff: 'property-47784163',
    recommend:    'property-646a6749',
    officialTime: 'property-5e45624a',
    actualTime:   'property-63606553',
    line:         'property-7e6a4060',
    web:          'property-514d6d57',
    recycle:      'property-453a7b3d',
    audio:        'property-42724e77',
    players:      'property-6d6b5440',
    satisfaction: 'property-4f404375',
    puzzle:       'property-67634243',
    gimmick:      'property-5874536e',
    language:     'property-4c61545a',
    design:       'property-5f3d7a66',
    photo:        'property-3e44474d',
    purchase:     'property-48527e3b',
    pad:          'property-46464855',
    mfyRelease:   'property-517d3b40'
  };

  // ── 값 읽기 헬퍼 ─────────────────────────────────────
  function getEl(id) {
    return document.querySelector('.' + id);
  }

  function getTextVal(id) {
    var el = getEl(id);
    if (!el) return '';
    var inner = el.querySelector('span, p, div:not([class*="notion-page__property-icon"])');
    var val = inner ? inner.textContent.trim() : el.textContent.trim();
    return val;
  }

  // 날짜 → "2026년 3월 22일" 형식 변환
  var MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6,
                 Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };

  function getDateVal(id) {
    var el = getEl(id);
    if (!el) return '';
    var timeEl = el.querySelector('time');
    var raw = timeEl
      ? (timeEl.getAttribute('datetime') || timeEl.textContent.trim())
      : (el.querySelector('span') || el).textContent.trim();
    var isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return isoMatch[1] + '년 ' + parseInt(isoMatch[2]) + '월 ' + parseInt(isoMatch[3]) + '일';
    }
    var engMatch = raw.match(/([A-Za-z]+)\s+(\d+),\s*(\d{4})/);
    if (engMatch && MONTHS[engMatch[1]]) {
      return engMatch[3] + '년 ' + MONTHS[engMatch[1]] + '월 ' + parseInt(engMatch[2]) + '일';
    }
    return raw;
  }

  function getSelectVal(id) {
    var el = getEl(id);
    if (!el) return { text: '', cls: '' };
    var pill = el.querySelector('.notion-pill');
    if (!pill) return { text: '', cls: '' };
    return { text: pill.textContent.trim(), cls: pill.className };
  }

  function getMultiSelectVals(id) {
    var el = getEl(id);
    if (!el) return [];
    return Array.from(el.querySelectorAll('.notion-pill')).map(function (pill) {
      return { text: pill.textContent.trim(), cls: pill.className };
    });
  }

  function getNumVal(id) {
    var el = document.querySelector('.' + id + ' .notion-property__number__progress-value');
    return el ? (parseFloat(el.textContent.trim()) || 0) : 0;
  }

  // ── pill 색상 → badge 색상 변환 ──────────────────────
  function pillToColor(cls) {
    if (cls.indexOf('pill-red')    > -1) return 'badge-red';
    if (cls.indexOf('pill-blue')   > -1) return 'badge-blue';
    if (cls.indexOf('pill-green')  > -1) return 'badge-green';
    if (cls.indexOf('pill-purple') > -1) return 'badge-purple';
    if (cls.indexOf('pill-orange') > -1) return 'badge-orange';
    if (cls.indexOf('pill-yellow') > -1) return 'badge-yellow';
    if (cls.indexOf('pill-pink')   > -1) return 'badge-pink';
    if (cls.indexOf('pill-brown')  > -1) return 'badge-brown';
    return 'badge-gray';
  }

  // ── badge 색상값 매핑 (파스텔) ──────────────────────────
  var BADGE_COLORS = {
    'badge-red':    { bg: '#fde8e8', color: '#c05050' },
    'badge-blue':   { bg: '#dbeafe', color: '#2563a0' },
    'badge-green':  { bg: '#dcfce7', color: '#3a7a55' },
    'badge-purple': { bg: '#ede9fe', color: '#7c5db0' },
    'badge-orange': { bg: '#fed7aa', color: '#b06830' },
    'badge-yellow': { bg: '#fef3c7', color: '#92700e' },
    'badge-pink':   { bg: '#fce7f3', color: '#b04880' },
    'badge-gray':   { bg: '#f0eeec', color: '#78716c' },
    'badge-brown':  { bg: '#f2e8e0', color: '#8a6a50' }
  };

  var BADGE_BORDERS = {
    'badge-red': '#f0a0a0', 'badge-blue': '#93b8e0', 'badge-green': '#86e5a0',
    'badge-purple': '#c4b5f0', 'badge-orange': '#f0b080', 'badge-yellow': '#f0d87a',
    'badge-pink': '#f0b4d0', 'badge-gray': '#d6d3d1', 'badge-brown': '#d4c0b0'
  };

  var DIFF_LEVEL_COLORS = {
    'ROOKIE': 'badge-gray', 'BEGINNER': 'badge-gray', 'EASY': 'badge-green',
    'MEDIUM': 'badge-blue', 'NORMAL': 'badge-blue', 'HARD': 'badge-orange',
    'DIFFICULT': 'badge-red', 'EXPERT': 'badge-purple', 'MASTER': 'badge-pink'
  };

  function buildGradBadge(text, sizeClass) {
    var sep = text.indexOf('/') > -1 ? '/' : '&';
    var parts = text.split(sep).map(function(p) { return p.trim(); });
    var pd = parts.map(function(p) {
      var key = DIFF_LEVEL_COLORS[p.toUpperCase()] || 'badge-gray';
      var bc = BADGE_COLORS[key] || BADGE_COLORS['badge-gray'];
      return { text: p, color: bc.color, bg: bc.bg, border: BADGE_BORDERS[key] || '#d6d3d1' };
    });
    var bgStops = pd.map(function(d, i) {
      return d.bg + ' ' + Math.round(i * 100 / (pd.length - 1)) + '%';
    }).join(',');
    var borderStops = pd.map(function(d, i) {
      return d.border + ' ' + Math.round(i * 100 / (pd.length - 1)) + '%';
    }).join(',');
    var html = pd.map(function(d) {
      return '<span style="color:' + d.color + '">' + d.text + '</span>';
    }).join('<span class="nz-diff-sep">' + sep + '</span>');
    return '<div class="nz-diff-grad-border" style="background:linear-gradient(90deg,' + borderStops + ')">'
         + '<div class="nz-diff-grad-inner badge-lg' + sizeClass + '" style="background:linear-gradient(90deg,' + bgStops + ')">'
         + html + '</div></div>';
  }

  // ── 추천도 색상 매핑 ─────────────────────────────────
  var REC_COLORS = {
    '강력추천': { bg: '#3b82f6', color: '#fff', weight: '700' },
    '추천':     { bg: '#dbeafe', color: '#1d4ed8', weight: '600' },
    '괜찮음':   { bg: '#e8e0d5', color: '#78716c', weight: '600' },
    '음..':     { bg: '#f0eeec', color: '#78716c', weight: '600' }
  };

  // ── 체감 난이도 단계별 색상 (v2: 그라데이션 솔리드) ──
  var DIFF_STEP_COLORS = {
    '아주 쉬움':  '#8FB05E',
    '쉬움':       '#6E9E52',
    '보통':       '#D9A13B',
    '어려움':     '#CD7A45',
    '아주 어려움': '#B85742'
  };

  // ── O/X 사용여부 뱃지 생성 ───────────────────────────
  function usageBadge(type, val) {
    if (!val.text) return '';
    var isO = val.text.trim() === 'O';
    var color = isO ? 'badge-teal' : 'badge-red';
    var label = type === 'line'    ? (isO ? 'LINE 사용'   : '')
              : type === 'web'     ? (isO ? 'WEB 사용'    : 'WEB 미사용')
              : type === 'audio'   ? (isO ? '음성 듣기 필요'   : '')
              :                      (isO ? '재활용 가능' : '재활용 불가');
    if (!label) return '';
    return '<span class="badge ' + color + '">' + label + '</span>';
  }

  // ── 체감 난이도 5단계 인디케이터 ────────────────────
  var DIFF_STEPS = ['아주 쉬움', '쉬움', '보통', '어려움', '아주 어려움'];

  function buildDiffSteps(selected) {
    return DIFF_STEPS.map(function (s) {
      var isActive = s === selected;
      var c = DIFF_STEP_COLORS[s];
      var flex = (s === '아주 쉬움' || s === '아주 어려움') ? '1.35' : '1';
      var style = isActive
        ? 'flex:' + flex + ';background:' + c + ';color:#FFFFFF;font-weight:700;box-shadow:0 2px 5px ' + c + '66;'
        : 'flex:' + flex + ';background:#F1EADA;color:#B5AC94;font-weight:600;';
      return '<div class="nz4-step" style="' + style + '">' + s + '</div>';
    }).join('');
  }

  // ── 레이더 차트 SVG (시안 리뷰 페이지.dc.html 구조 그대로) ──
  function buildRadar(s) {
    // 중심 (100,100), 최대 반지름 70. 위에서 시계방향: 만족도→문제→기믹→연출→언어접근성
    var AXES = [
      { ux: 0,       uy: -1      },
      { ux: 0.9511,  uy: -0.309  },
      { ux: 0.5878,  uy: 0.809   },
      { ux: -0.5878, uy: 0.809   },
      { ux: -0.9511, uy: -0.309  }
    ];
    var vals = [s.satisfaction, s.puzzle, s.gimmick, s.design, s.language];
    var CX = 100, CY = 100, R = 70;

    function ringPts(r) {
      return AXES.map(function (a) {
        return (CX + a.ux * r).toFixed(1) + ',' + (CY + a.uy * r).toFixed(1);
      }).join(' ');
    }

    // 그리드: 외곽 + 중간 + 안쪽 3겹만 (시안과 동일)
    var grids =
        '<polygon points="' + ringPts(70) + '" fill="none" stroke="#D9CFB6" stroke-width="1"/>'
      + '<polygon points="' + ringPts(42) + '" fill="none" stroke="#E5DCC6" stroke-width="1"/>'
      + '<polygon points="' + ringPts(14) + '" fill="none" stroke="#E5DCC6" stroke-width="1"/>';

    // 축선
    var lines = AXES.map(function (a) {
      return '<line x1="' + CX + '" y1="' + CY + '" x2="' + (CX + a.ux * R).toFixed(1) + '" y2="' + (CY + a.uy * R).toFixed(1) + '" stroke="#E5DCC6" stroke-width="1"/>';
    }).join('');

    // 데이터
    var pts = AXES.map(function (a, i) {
      var r = Math.max(0, Math.min(5, vals[i])) / 5 * R;
      return { x: CX + a.ux * r, y: CY + a.uy * r };
    });
    var polygon = '<polygon points="' + pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ')
      + '" fill="#FFD953" fill-opacity="0.45" stroke="#D9A13B" stroke-width="2" stroke-linejoin="round"/>';
    var dots = pts.map(function (p) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3" fill="#D9A13B"/>';
    }).join('');

    // 레이블 + 점수 (축 바깥, 시안 좌표)
    function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
    var FONT = "'IBM Plex Sans KR',sans-serif";
    var labels =
        '<text x="100" y="12" text-anchor="middle" font-size="12" font-weight="700" fill="#5C554A" font-family="' + FONT + '">만족도 <tspan fill="#B08900">' + fmt(vals[0]) + '</tspan></text>'
      + '<text x="174" y="70" text-anchor="start" font-size="12" font-weight="700" fill="#5C554A" font-family="' + FONT + '">문제</text>'
      + '<text x="174" y="86" text-anchor="start" font-size="12" font-weight="700" fill="#B08900" font-family="' + FONT + '">' + fmt(vals[1]) + '</text>'
      + '<text x="146" y="166" text-anchor="start" font-size="12" font-weight="700" fill="#5C554A" font-family="' + FONT + '">기믹</text>'
      + '<text x="146" y="182" text-anchor="start" font-size="12" font-weight="700" fill="#B08900" font-family="' + FONT + '">' + fmt(vals[2]) + '</text>'
      + '<text x="54" y="166" text-anchor="end" font-size="12" font-weight="700" fill="#5C554A" font-family="' + FONT + '">연출/디자인</text>'
      + '<text x="54" y="182" text-anchor="end" font-size="12" font-weight="700" fill="#B08900" font-family="' + FONT + '">' + fmt(vals[3]) + '</text>'
      + '<text x="26" y="70" text-anchor="end" font-size="12" font-weight="700" fill="#5C554A" font-family="' + FONT + '">언어접근성</text>'
      + '<text x="26" y="86" text-anchor="end" font-size="12" font-weight="700" fill="#B08900" font-family="' + FONT + '">' + fmt(vals[4]) + '</text>';

    return '<svg width="100%" height="223" viewBox="-42 -14 284 234" xmlns="http://www.w3.org/2000/svg">'
      + grids + lines + polygon + dots + labels
      + '</svg>';
  }

  // ── 메인 렌더링 ───────────────────────────────────────
  function render() {
    // 리뷰 페이지 여부 판별 (개인 만족도 속성 존재 확인)
    if (!getEl(ID.satisfaction)) return;

    // 값 읽기
    var mNum         = getTextVal(ID.mNumber);
    var company      = getSelectVal(ID.company);
    if (!company.text) company = { text: getTextVal(ID.company), cls: '' };
    var playDate     = getDateVal(ID.playDate);
    var officialDiffs = getMultiSelectVals(ID.officialDiff);
    var personalDiff = getSelectVal(ID.personalDiff);
    var recommend    = getSelectVal(ID.recommend);
    var officialTime = getTextVal(ID.officialTime);
    var actualTime   = getTextVal(ID.actualTime);
    var players      = getTextVal(ID.players);
    var line         = getSelectVal(ID.line);
    var web          = getSelectVal(ID.web);
    var recycle      = getSelectVal(ID.recycle);
    var audio        = getSelectVal(ID.audio);
    var pad          = getSelectVal(ID.pad);
    var purchase     = getSelectVal(ID.purchase);
    if (!purchase.text) purchase = { text: getTextVal(ID.purchase), cls: '' };
    var mfyRelease   = getTextVal(ID.mfyRelease);
    var scores = {
      satisfaction: getNumVal(ID.satisfaction),
      puzzle:       getNumVal(ID.puzzle),
      gimmick:      getNumVal(ID.gimmick),
      design:       getNumVal(ID.design),
      language:     getNumVal(ID.language)
    };

    // 페이지 타이틀 읽기 (나조 이름)
    var titleEl = document.querySelector(
      '.notion-page__title, h1[class*="title"], [class*="page-title"] h1, [class*="notion-title"]'
    );
    var nazoTitle = titleEl ? titleEl.textContent.trim() : '';

    // ── v2 (4단계): 시안 리뷰 페이지.dc.html 구조 ──
    var data = (typeof SORT_DATA !== 'undefined' && SORT_DATA[nazoTitle]) ? SORT_DATA[nazoTitle] : {};
    var quote = data.quote || '';
    var reviewNum = data.num || null;
    var brandDisplay = (company.text || '').replace(/ - /g, ' · ');

    // 공식 난이도: 노션 지정 색 → 다락방 톤의 짙은 색으로 변환 (표기 없음 = 회색)
    var NOTION_DEEP = {
      'pill-pink':   '#B0616E',  // 花の謎 계열
      'pill-purple': '#8171A8',  // 月の謎 계열
      'pill-blue':   '#5F8CA3',  // 雪の謎 계열
      'pill-red':    '#B25E5E',
      'pill-orange': '#C07A48',
      'pill-yellow': '#B08900',
      'pill-green':  '#6E9E52',
      'pill-brown':  '#96705A',
      'pill-gray':   '#8A8272'
    };
    var MOTIF_FIXED = { '花の謎': '#B0616E', '月の謎': '#8171A8', '雪の謎': '#5F8CA3' };
    function officialPill(d) {
      if (d.text === '표기 없음') return '<span class="nz4-opill nz4-opill--none">표기 없음</span>';
      var bg = '#8A8272';
      for (var key in NOTION_DEEP) {
        if ((d.cls || '').indexOf(key) > -1) { bg = NOTION_DEEP[key]; break; }
      }
      var base = d.text.replace('(추정)', '').trim();
      if (MOTIF_FIXED[base]) bg = MOTIF_FIXED[base];
      return '<span class="nz4-opill" style="background:' + bg + '">' + d.text + '</span>';
    }
    var officialHtml = officialDiffs.length
      ? officialDiffs.map(officialPill).join('')
      : officialPill({ text: '표기 없음', cls: '' });

    // 추천도 뱃지 (메인 카드와 동일 클래스 재사용)
    var REC_CLASS_V2 = { '강력추천': 'nz2-rec--strong', '추천': 'nz2-rec--rec', '괜찮음': 'nz2-rec--ok', '음..': 'nz2-rec--meh' };
    var recHtml = recommend.text
      ? '<span class="nz4-rec nz2-rec ' + (REC_CLASS_V2[recommend.text] || 'nz2-rec--meh') + '">' + recommend.text + '</span>'
      : '';

    // 추가 정보 파스텔 칩 (해당되는 것만)
    var infoChips = [];
    if (web.text.trim() === 'O')     infoChips.push('<span class="nz4-info" style="background:#EDF2F9;border-color:#D5DFEC;color:#5A78A0">WEB 사용</span>');
    if (line.text.trim() === 'O')    infoChips.push('<span class="nz4-info" style="background:#F3F0F9;border-color:#DED6EC;color:#7A6B9D">LINE 사용 필요</span>');
    if (audio.text.trim() === 'O')   infoChips.push('<span class="nz4-info" style="background:#FBF3E7;border-color:#EEDFC5;color:#A8834A">듣기 필요</span>');
    if (recycle.text.trim() === 'X') infoChips.push('<span class="nz4-info" style="background:#F8F0EA;border-color:#EBD9CF;color:#A0705C">재활용 불가</span>');
    if (pad.text.trim() === 'O')     infoChips.push('<span class="nz4-info" style="background:#EEF4EF;border-color:#D7E3DA;color:#5E7F6A">패드 사용 권장</span>');
    if (purchase.text)               infoChips.push('<span class="nz4-info nz4-info--buy">&#128722; ' + purchase.text + '</span>');

    // 배너: 노션 커버 이미지를 종이 시트 상단으로
    var bannerHtml = '';
    var coverImg = document.querySelector('.notion-header__cover img, img.notion-header__cover');
    if (coverImg && coverImg.src) {
      bannerHtml = '<img class="nz4-banner" src="' + coverImg.src + '" alt="">';
      var coverBox = document.querySelector('.notion-header__cover');
      if (coverBox) coverBox.style.display = 'none';
    }

    var html = ''
      + '<div class="nz-review-wrap nz4">'
      + '<div class="nz4-sheet">'
      + bannerHtml
      + '<div class="nz4-body">'

      // 제목 블록
      + '<div class="nz4-head">'
      +   '<div class="nz4-title-row">'
      +     '<span class="nz4-title">' + nazoTitle + '</span>'
      +     (reviewNum ? '<span class="nz4-num">#' + reviewNum + '</span>' : (mNum ? '<span class="nz4-num">' + mNum + '</span>' : ''))
      +   '</div>'
      +   '<div class="nz4-badges">'
      +     (brandDisplay ? '<span class="nz4-chip-brand">' + brandDisplay + '</span>' : '')
      +     recHtml
      +     (mfyRelease ? '<span class="nz4-chip-mfy"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> ' + mfyRelease + '</span>' : '')
      +   '</div>'
      + '</div>'

      // 2단: 난이도+기록 / 레이더
      + '<div class="nz4-cols">'
      + '<div class="nz4-left">'

      + '<div class="nz4-sec">'
      +   '<p class="nz4-label">난이도</p>'
      +   '<div class="nz4-diffbox">'
      +     '<div class="nz4-diffrow">'
      +       '<span class="nz4-difflabel">공식 난이도</span>'
      +       '<div class="nz4-opills">' + officialHtml + '</div>'
      +     '</div>'
      +     '<div class="nz4-diffsep"></div>'
      +     '<div class="nz4-diffrow">'
      +       '<span class="nz4-difflabel">체감 난이도</span>'
      +       '<div class="nz4-steps">' + buildDiffSteps(personalDiff.text) + '</div>'
      +     '</div>'
      +   '</div>'
      + '</div>'

      + '<div class="nz4-sec">'
      +   '<p class="nz4-label">플레이 기록</p>'
      +   '<div class="nz4-table">'
      +     '<div class="nz4-td"><p class="nz4-td-label">클리어 날짜</p><p class="nz4-td-value">' + (playDate || '표기 없음') + '</p></div>'
      +     '<div class="nz4-td"><p class="nz4-td-label">참여 인원</p><p class="nz4-td-value">' + (players ? players + (/명|인/.test(players) ? '' : '명') : '표기 없음') + '</p></div>'
      +     '<div class="nz4-td"><p class="nz4-td-label">공식 소요시간</p><p class="nz4-td-value' + (officialTime ? '' : ' nz4-td-value--none') + '">' + (officialTime || '표기 없음') + '</p></div>'
      +     '<div class="nz4-td"><p class="nz4-td-label">실제 소요시간</p><p class="nz4-td-value">' + (actualTime || '표기 없음') + '</p></div>'
      +   '</div>'
      + '</div>'

      + '</div>'
      + '<div class="nz4-right">'
      + '<div class="nz4-sec nz4-sec--radar">'
      +   '<p class="nz4-label">점수 분석</p>'
      +   '<div class="nz4-radarbox">'
      +     buildRadar(scores)
      +     (quote ? '<div class="nz4-quote">&ldquo;' + quote + '&rdquo;</div>' : '')
      +   '</div>'
      + '</div>'
      + '</div>'
      + '</div>'

      // 추가 정보 · 구입처
      + (infoChips.length
          ? '<div class="nz4-sec"><p class="nz4-label">추가 정보 · 구입처</p><div class="nz4-chips">' + infoChips.join('') + '</div></div>'
          : '')

      + '</div>'  // nz4-body
      + '</div>'; // nz4-sheet

    var propsContainer = document.querySelector(
      '.notion-page__properties, [class*="notion-page__properties"]'
    );
    if (!propsContainer) {
      console.warn('[나조토키] 속성 컨테이너를 찾을 수 없습니다.');
      return;
    }

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    propsContainer.parentNode.insertBefore(wrapper, propsContainer);
    propsContainer.style.display = 'none';
    if (titleEl) titleEl.style.display = 'none';

    // MFY 발매 시기: 렌더 시점에 속성이 아직 안 떴으면 폴링으로 뒤늦게 삽입
    if (!mfyRelease && company.text && company.text.toLowerCase().indexOf('mystery for you') > -1) {
      (function pollMfyRelease(tries) {
        if (tries <= 0) return;
        setTimeout(function () {
          var val = getTextVal(ID.mfyRelease);
          if (val) {
            var badges = document.querySelector('.nz-review-wrap .nz-badges');
            if (badges && !badges.querySelector('.badge-mfy-release')) {
              var companyBadge = badges.querySelector('.badge');
              var span = document.createElement('span');
              span.className = 'badge badge-mfy-release';
              span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> ' + val;
              if (companyBadge && companyBadge.nextSibling) {
                badges.insertBefore(span, companyBadge.nextSibling);
              } else {
                badges.appendChild(span);
              }
            }
          } else {
            pollMfyRelease(tries - 1);
          }
        }, 300);
      })(20);
    }

    var calloutEl = document.querySelector('.notion-callout');
    if (calloutEl) {
      var contentEl = calloutEl.querySelector('.notion-callout__content');
      if (contentEl) {
        var section = document.createElement('div');
        section.className = 'nz4-sec nz4-sec--desc';
        section.innerHTML = '<p class="nz4-label">나조 설명</p>';
        var descDiv = document.createElement('div');
        descDiv.className = 'nz-desc';
        descDiv.innerHTML = contentEl.innerHTML;
        section.appendChild(descDiv);
        document.querySelector('.nz4-body').appendChild(section);
      }
      calloutEl.style.display = 'none';
    }

    var photoEl = document.querySelector('.' + ID.photo);
    if (photoEl) {
      var photoLinks = photoEl.querySelectorAll('a[href]');
      if (photoLinks.length > 0) {
        var photoSection = document.createElement('div');
        photoSection.className = 'nz4-sec nz4-sec--photos';
        photoSection.innerHTML = '<p class="nz4-label">플레이 사진</p>';
        var grid = document.createElement('div');
        grid.className = 'nz-photos-grid';
        photoLinks.forEach(function (a) {
          var url = a.getAttribute('href');
          var img = document.createElement('img');
          img.src = url;
          img.alt = '플레이 사진';
          img.loading = 'lazy';
          img.style.cursor = 'pointer';
          img.addEventListener('click', function () { nzLightboxOpen(url); });
          grid.appendChild(img);
        });
        photoSection.appendChild(grid);
        document.querySelector('.nz4-body').appendChild(photoSection);
      }
    }

    nzLightboxInit();

    buildPrevNext(reviewNum);

    console.log('[나조토키] 리뷰 레이아웃 적용 완료');
  }

  // ── 이전/다음 리뷰 내비 + 메인으로 돌아가기 ──
  function buildPrevNext(currentNum) {
    var wrap = document.querySelector('.nz-review-wrap.nz4');
    if (!wrap || wrap.querySelector('.nz4-nav')) return;

    var prev = null, next = null;
    if (currentNum && typeof SORT_DATA !== 'undefined') {
      for (var key in SORT_DATA) {
        var d = SORT_DATA[key];
        if (d.num === currentNum - 1) prev = { title: key, url: d.url };
        if (d.num === currentNum + 1) next = { title: key, url: d.url };
      }
    }

    var nav = document.createElement('div');
    nav.className = 'nz4-nav';
    nav.innerHTML =
      (prev
        ? '<a class="nz4-nav-card" href="' + prev.url + '"><span class="nz4-nav-dir">&larr; 이전 리뷰 #' + (currentNum - 1) + '</span><span class="nz4-nav-name">' + prev.title + '</span></a>'
        : '<div class="nz4-nav-card nz4-nav-card--empty"><span class="nz4-nav-dir">&larr; 이전 리뷰</span><span class="nz4-nav-name nz4-nav-name--none">아직 없어요</span></div>')
      + (next
        ? '<a class="nz4-nav-card nz4-nav-card--next" href="' + next.url + '"><span class="nz4-nav-dir">다음 리뷰 &rarr;</span><span class="nz4-nav-name">' + next.title + '</span></a>'
        : '<div class="nz4-nav-card nz4-nav-card--next nz4-nav-card--empty"><span class="nz4-nav-dir">다음 리뷰 &rarr;</span><span class="nz4-nav-name nz4-nav-name--none">아직 없어요</span></div>');
    wrap.appendChild(nav);

    var back = document.createElement('a');
    back.className = 'nz4-back';
    back.href = '/';
    back.textContent = '← 메인으로 돌아가기';
    wrap.appendChild(back);
  }

  // ── 플레이 일기 박스 감싸기 ──────────────────────────────
  function wrapDiary() {
    if (document.querySelector('.nz-diary-box')) return;
    var propsEl = document.querySelector('.notion-page__properties');
    if (!propsEl) return;

    var elements = [];
    var sibling = propsEl.nextElementSibling;
    while (sibling) {
      if (sibling.style.display !== 'none'
          && !sibling.classList.contains('nz-like-wrap')
          && !sibling.classList.contains('nz-brand-reviews')
          && !sibling.querySelector('.nz-like-wrap')) {
        elements.push(sibling);
      }
      sibling = sibling.nextElementSibling;
    }
    if (elements.length === 0) return;

    var box = document.createElement('div');
    box.className = 'nz-diary-box';

    var title = document.createElement('p');
    title.className = 'nz-diary-title';
    title.textContent = '플레이 일기';
    box.appendChild(title);

    var content = document.createElement('div');
    content.className = 'nz-diary-content';
    elements.forEach(function (el) { content.appendChild(el); });
    box.appendChild(content);

    var body4 = document.querySelector('.nz4-body');
    if (body4) body4.appendChild(box);
    else propsEl.parentNode.appendChild(box);

    // 이미 만들어진 좋아요 버튼이 있으면 일기 뒤로 (시안 위치)
    var likeWrap = document.querySelector('.nz-like-wrap');
    if (likeWrap && body4) body4.appendChild(likeWrap);
  }

  // ── 좋아요 버튼 (별도 파이프라인) ───────────────────────

  // ── 브랜드 다른 리뷰 표시 ──────────────────────────────
  function renderBrandReviews() {
    if (document.querySelector('.nz-brand-reviews')) return;

    // 현재 페이지 타이틀로 SORT_DATA에서 현재 리뷰 찾기
    var currentTitle = null;
    var currentData = null;
    var pageTitle = document.querySelector('.nz4-title') || document.querySelector('.nz-title-main');
    if (!pageTitle) return;
    var pageTitleText = pageTitle.textContent.trim();

    // SORT_DATA에서 매칭 (정확 매칭 우선)
    if (SORT_DATA[pageTitleText]) {
      currentTitle = pageTitleText;
      currentData = SORT_DATA[pageTitleText];
    } else {
      var keys = Object.keys(SORT_DATA).sort(function (a, b) { return b.length - a.length; });
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (pageTitleText.indexOf(key) > -1 || key.indexOf(pageTitleText) > -1) {
          currentTitle = key;
          currentData = SORT_DATA[key];
          break;
        }
      }
    }

    // DOM에서 제작사 읽기 (fallback)
    var brand = currentData ? currentData.brand : null;
    if (!brand) {
      var companyEl = document.querySelector('.nz4-chip-brand');
      if (companyEl) brand = companyEl.textContent.trim();
    }
    if (!brand) return;

    // 같은 브랜드의 다른 리뷰 수집 (현재 리뷰 제외)
    var others = [];
    var currentDiff = currentData ? currentData.diff : 3;
    for (var key in SORT_DATA) {
      if (key === currentTitle) continue;
      var d = SORT_DATA[key];
      if (d.brand === brand && d.url) {
        others.push({ title: key, data: d });
      }
    }

    if (others.length === 0) return;

    // 정렬: 추천도 높은 순 → 체감 난이도 비슷한 순
    others.sort(function (a, b) {
      var satDiff = b.data.satisfaction - a.data.satisfaction;
      if (satDiff !== 0) return satDiff;
      return Math.abs(a.data.diff - currentDiff) - Math.abs(b.data.diff - currentDiff);
    });

    var totalCount = others.length;
    var maxShow = 5;
    var shown = others.slice(0, maxShow);
    var overflow = totalCount - shown.length;

    // HTML 생성
    var box = document.createElement('div');
    box.className = 'nz-brand-reviews';

    var title = document.createElement('div');
    title.className = 'nz-br-title';
    title.innerHTML = brand.replace(/ - /g, ' · ') + '의 다른 리뷰 <span class="nz-br-count">(' + totalCount + ')</span>';
    box.appendChild(title);

    var pills = document.createElement('div');
    pills.className = 'nz-br-pills';
    shown.forEach(function (item) {
      var a = document.createElement('a');
      a.href = item.data.url;
      a.textContent = item.title;
      pills.appendChild(a);
    });
    box.appendChild(pills);

    if (overflow > 0) {
      var more = document.createElement('a');
      more.className = 'nz-br-more';
      more.href = '/?search=' + encodeURIComponent(brand);
      more.textContent = '외 ' + overflow + '개 더보기 →';
      box.appendChild(more);
    }

    // 삽입 위치: 종이 시트 안 맨 아래 (일기 뒤)
    var body4 = document.querySelector('.nz4-body');
    var diaryBox = document.querySelector('.nz-diary-box');
    if (body4) {
      body4.appendChild(box);
    } else if (diaryBox) {
      diaryBox.parentNode.insertBefore(box, diaryBox.nextSibling);
    } else {
      // 플레이 일기가 없으면 페이지 마지막에 추가
      var propsEl = document.querySelector('.notion-page__properties');
      if (propsEl && propsEl.parentNode) {
        propsEl.parentNode.appendChild(box);
      }
    }

    console.log('[나조토키] 브랜드 다른 리뷰 표시: ' + brand + ' (' + totalCount + '개)');
  }

  // ── DOM 변경 감지 (hydration 대응) ─────────────────────
  var nzObserver = null;
  var nzRendering = false;
  var nzDebounceTimer = null;

  function startObserver() {
    if (nzObserver) nzObserver.disconnect();

    nzObserver = new MutationObserver(function () {
      if (nzDebounceTimer) clearTimeout(nzDebounceTimer);
      nzDebounceTimer = setTimeout(function () {
        if (!document.querySelector('.nz-review-wrap') &&
            document.querySelector('.' + ID.satisfaction) &&
            !nzRendering) {
          nzRendering = true;
          nzObserver.disconnect();
          render();
          wrapDiary();
          renderBrandReviews();
          nzRendering = false;
          startObserver();
        }
      }, 200);
    });

    nzObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ── 초기 실행 ─────────────────────────────────────────
  function tryRender(attempt) {
    attempt = attempt || 0;
    if (document.querySelector('.nz-review-wrap')) return; // 이미 적용됨
    if (document.querySelector('.' + ID.satisfaction)) {
      render();
      wrapDiary();
      renderBrandReviews();
      startObserver();
    } else if (attempt < 30) {
      setTimeout(function () { tryRender(attempt + 1); }, 300);
    }
  }

  // SPA 네비게이션 감지 → URL 변경 시 tryRender 재실행
  var lastUrl = location.href;
  var spaObserver = new MutationObserver(function () {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      tryRender();
    }
  });
  spaObserver.observe(document.body, { childList: true, subtree: true });

  // 데이터 로드 후 렌더링 시작
  function startAfterDataLoad() {
    loadNazoData(function () {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { tryRender(); });
      } else {
        tryRender();
      }
    });
  }
  startAfterDataLoad();

})();

// ── 갤러리 v2: 필터 칩 / 상시 검색 / 카드 레이아웃 / 페이지네이션 / 다락방 노트 박스 ──
(function () {
  'use strict';

  // 메인 페이지에서만 동작 (노트 페이지 등 다른 갤러리/표는 건드리지 않음)
  if (window.location.pathname !== '/' && window.location.pathname !== '') return;

  document.body.classList.add('nz-home');

  loadNazoData(function () { initGallery(); });

  function initGallery() {
  var GALLERY_SEL   = '.notion-collection-gallery';
  var CARD_SEL      = '.notion-collection-card.gallery';
  var TITLE_SEL     = '.notion-property__title';
  var COMPANY_SEL   = '.property-5667463f';
  var DIFF_SEL      = '.property-47784163';
  var RECOMMEND_SEL = '.property-646a6749';
  var OFFICIAL_SEL  = '.property-6d44666a';
  var PUBLISH_SEL   = '.property-54495c70';
  var MFY_REL_SEL   = '.property-517d3b40';

  // 체감 난이도 색 (핸드오프 그라데이션 스케일)
  var DIFF_COLORS = {
    '아주 쉬움':   '#8FB05E',
    '쉬움':       '#6E9E52',
    '보통':       '#D9A13B',
    '어려움':     '#CD7A45',
    '아주 어려움': '#B85742'
  };
  var REC_CLASS = {
    '강력추천': 'nz2-rec--strong',
    '추천':    'nz2-rec--rec',
    '괜찮음':  'nz2-rec--ok',
    '음..':    'nz2-rec--meh'
  };
  var CAL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>';

  var state = { searchQ: '', filter: 'all', diff: '전체', brand: '전체', page: 1 };

  function isMobile() { return window.innerWidth <= 768; }
  function perPage() { return isMobile() ? 11 : 10; }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function getText(card, sel) {
    var el = card.querySelector(sel);
    return el ? el.textContent.trim() : '';
  }
  function pillTexts(card, sel) {
    var el = card.querySelector(sel);
    if (!el) return [];
    var pills = el.querySelectorAll('.notion-pill');
    if (pills.length) return Array.from(pills).map(function (p) { return p.textContent.trim(); });
    var t = el.textContent.trim();
    return t ? [t] : [];
  }

  // ── 카드 커스텀 렌더 ──
  function renderMfyChip(val) {
    return '<span class="nz2-mfy">' + CAL_SVG + esc(val) + '</span>';
  }

  function customizeCards() {
    document.querySelectorAll(CARD_SEL).forEach(function (card) {
      if (card.classList.contains('nz-card-custom')) return;

      var publishEl = card.querySelector(PUBLISH_SEL);
      if (publishEl) {
        if (publishEl.textContent.trim() === '비공개') {
          card.classList.add('nz-card-hidden');
          card.classList.add('nz-card-custom');
          return;
        }
        publishEl.style.display = 'none';
      }

      var title = getText(card, TITLE_SEL);
      var data = SORT_DATA[title] || {};
      var brands = pillTexts(card, COMPANY_SEL);
      // 표기용: "SCRAP - Mystery For You" → "SCRAP · Mystery For You" (시안 표기)
      var brand = brands.join(' · ').replace(/ - /g, ' · ');
      var rating = pillTexts(card, RECOMMEND_SEL)[0] || data.rating || '';
      var diff = pillTexts(card, DIFF_SEL)[0] || '';
      var mfyEl = card.querySelector(MFY_REL_SEL);
      var mfy = mfyEl ? mfyEl.textContent.trim() : '';
      if (mfyEl) mfyEl.style.display = 'none';

      var dColor = DIFF_COLORS[diff] || '#8A8272';
      var html = '<div class="nz2-badges">'
        + '<span class="nz2-brand-chip">' + esc(brand) + '</span>'
        + (rating ? '<span class="nz2-rec ' + (REC_CLASS[rating] || 'nz2-rec--meh') + '">' + esc(rating) + '</span>' : '')
        + (diff ? '<span class="nz2-diff"><span class="nz2-diff-dot" style="background:' + dColor + '"></span>' + esc(diff) + '</span>' : '')
        + '<span class="nz2-mfy-slot">' + (mfy ? renderMfyChip(mfy) : '') + '</span>'
        + '</div>'
        + '<div class="nz2-brand-line">' + esc(brand) + '</div>'
        + (data.quote ? '<div class="nz2-quote">&ldquo;' + esc(data.quote) + '&rdquo;</div>' : '');

      var div = document.createElement('div');
      div.className = 'nz-card-props nz2-card-props';
      div.innerHTML = html;
      card.appendChild(div);
      card.classList.add('nz-card-custom');

      // MFY 발매년월이 늦게 로드되는 경우 폴링
      if (!mfy) {
        (function pollMfy(c, tries) {
          if (tries <= 0) return;
          setTimeout(function () {
            var el = c.querySelector(MFY_REL_SEL);
            if (el) {
              var val = el.textContent.trim();
              if (val) {
                el.style.display = 'none';
                var slot = c.querySelector('.nz2-mfy-slot');
                if (slot && !slot.querySelector('.nz2-mfy')) slot.innerHTML = renderMfyChip(val);
              }
            } else {
              pollMfy(c, tries - 1);
            }
          }, 300);
        })(card, 20);
      }
    });
  }

  // ── 정렬: 최근에 푼 순서(리뷰 순번 내림차순) 고정 ──
  function sortCardsByRecent() {
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;
    var cards = Array.from(gallery.querySelectorAll(CARD_SEL));
    if (cards.length < 2) return;
    var sorted = cards.slice().sort(function (a, b) {
      var da = SORT_DATA[getText(a, TITLE_SEL)] || {};
      var db = SORT_DATA[getText(b, TITLE_SEL)] || {};
      // 순번을 모르는 카드(방금 공개된 신규 리뷰)는 최신으로 간주 → 맨 앞
      var na = (da.num != null) ? da.num : 999999;
      var nb = (db.num != null) ? db.num : 999999;
      return nb - na;
    });
    var changed = sorted.some(function (c, i) { return c !== cards[i]; });
    if (changed) sorted.forEach(function (c) { gallery.appendChild(c); });
  }

  // ── 필터 + 검색 매칭 → 표시/숨김 + 페이지네이션 ──
  function cardMatches(card) {
    var title = getText(card, TITLE_SEL);
    var titleLower = title.toLowerCase();
    var data = SORT_DATA[title] || {};
    var brands = pillTexts(card, COMPANY_SEL);
    var brandsLower = brands.map(function (c) { return c.toLowerCase(); });
    var diff = pillTexts(card, DIFF_SEL)[0] || '';
    var rating = pillTexts(card, RECOMMEND_SEL)[0] || data.rating || '';

    var q = state.searchQ;
    var phonetics = PHONETIC_MAP[titleLower] || [];
    var companyPhonetics = [];
    brandsLower.forEach(function (c) {
      companyPhonetics = companyPhonetics.concat(COMPANY_MAP[c.trim()] || []);
    });
    var searchMatch = !q
      || titleLower.indexOf(q) > -1
      || brandsLower.join(' ').indexOf(q) > -1
      || phonetics.some(function (p) { return p.indexOf(q) > -1; })
      || companyPhonetics.some(function (p) { return p.indexOf(q) > -1; });

    var filterMatch = state.filter === 'all'
      || (state.filter === 'strong' && rating === '강력추천')
      || (state.filter === 'beginner' && data.beginner === true);
    var diffMatch = state.diff === '전체' || diff === state.diff;
    var brandMatch = state.brand === '전체' || brands.indexOf(state.brand) > -1;

    return searchMatch && filterMatch && diffMatch && brandMatch;
  }

  function isFiltered() {
    return !!state.searchQ || state.filter !== 'all' || state.diff !== '전체' || state.brand !== '전체';
  }

  function applyVisibility(scrollToTop) {
    var cards = document.querySelectorAll(CARD_SEL);
    var matched = [];
    cards.forEach(function (card) {
      if (card.classList.contains('nz-card-hidden')) { card.style.display = 'none'; return; }
      if (cardMatches(card)) matched.push(card);
      card.style.display = 'none';
      card.classList.remove('nz2-card--big');
    });

    var pp = perPage();
    var bigCount = isMobile() ? 1 : 2;
    var totalPages = Math.max(1, Math.ceil(matched.length / pp));
    if (state.page > totalPages) state.page = totalPages;
    var startIdx = (state.page - 1) * pp;
    for (var i = startIdx; i < Math.min(matched.length, startIdx + pp); i++) {
      matched[i].style.display = '';
      if (i - startIdx < bigCount) matched[i].classList.add('nz2-card--big');
    }

    // 결과 코멘트
    var comment = document.getElementById('nz2-result-comment');
    if (comment) {
      comment.textContent = isFiltered()
        ? '조건에 맞는 기록 ' + matched.length + '개'
        : '최근에 푼 순서대로 보여드려요';
    }

    // 빈 결과
    var empty = document.getElementById('nz2-empty');
    if (empty) empty.style.display = matched.length === 0 ? '' : 'none';

    renderPagination(totalPages);

    if (scrollToTop) {
      var controls = document.getElementById('nz2-controls');
      if (controls) controls.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── 페이지네이션 (숫자 + 다음 →) ──
  function renderPagination(totalPages) {
    var existing = document.getElementById('nz-pagination');
    if (existing) existing.remove();
    if (totalPages <= 1) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    var wrap = document.createElement('div');
    wrap.id = 'nz-pagination';

    var startPage = Math.max(1, state.page - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (var i = startPage; i <= endPage; i++) {
      (function (n) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nz2-page-btn' + (n === state.page ? ' nz2-page-btn--active' : '');
        btn.textContent = n;
        btn.addEventListener('click', function () {
          if (n === state.page) return;
          state.page = n;
          applyVisibility(true);
        });
        wrap.appendChild(btn);
      })(i);
    }

    if (state.page < totalPages) {
      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'nz2-page-next';
      next.textContent = '다음 →';
      next.addEventListener('click', function () {
        state.page++;
        applyVisibility(true);
      });
      wrap.appendChild(next);
    }

    gallery.parentNode.insertBefore(wrap, gallery.nextSibling);
  }

  // ── 필터 칩 + 검색 바 + 결과 코멘트 ──
  function setChipActive() {
    document.querySelectorAll('#nz2-chips .nz2-chip[data-f]').forEach(function (chip) {
      chip.classList.toggle('nz2-chip--active', chip.getAttribute('data-f') === state.filter);
    });
    var diffChip = document.getElementById('nz2-chip-diff');
    var diffLabel = document.getElementById('nz2-diff-label');
    if (diffChip && diffLabel) {
      var active = state.diff !== '전체';
      diffChip.classList.toggle('nz2-chip--active', active);
      diffLabel.textContent = active ? state.diff : '난이도 ▾';
    }
  }

  function resetFilters() {
    state.filter = 'all';
    state.diff = '전체';
    state.brand = '전체';
    state.searchQ = '';
    state.page = 1;
    var input = document.getElementById('nz2-search');
    if (input) input.value = '';
    ['nz2-diff-select', 'nz2-diff-select-pc', 'nz2-brand-select'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '전체';
    });
    var clearBtn = document.getElementById('nz2-search-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    setChipActive();
    applyVisibility();
  }

  function buildControls() {
    if (document.getElementById('nz2-controls')) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    // 브랜드 select 옵션 (SORT_DATA 기준, 가나다순)
    var brandSet = {};
    Object.keys(SORT_DATA).forEach(function (k) {
      var b = SORT_DATA[k].brand;
      if (b) brandSet[b] = true;
    });
    var brandOptions = Object.keys(brandSet).sort().map(function (b) {
      return '<option value="' + esc(b) + '">' + esc(b) + '</option>';
    }).join('');

    var DIFF_OPTIONS =
        '<option value="전체">난이도 · 전체</option>'
      + '<option value="아주 쉬움">아주 쉬움</option>'
      + '<option value="쉬움">쉬움</option>'
      + '<option value="보통">보통</option>'
      + '<option value="어려움">어려움</option>'
      + '<option value="아주 어려움">아주 어려움</option>';

    var wrap = document.createElement('div');
    wrap.id = 'nz2-controls';
    wrap.innerHTML =
      '<div id="nz2-bar">'
      + '<div id="nz2-chips">'
      + '<button type="button" class="nz2-chip" data-f="all">전체 리뷰</button>'
      + (NZ_NOTES_READY ? '<a class="nz2-chip nz2-chip--link" href="/darakbang-note">다락방 노트</a>' : '')
      + '<button type="button" class="nz2-chip" data-f="strong">강력추천</button>'
      + '<button type="button" class="nz2-chip" data-f="beginner">입문 추천</button>'
      + '<div class="nz2-chip nz2-chip--diff" id="nz2-chip-diff">'
      +   '<span id="nz2-diff-label">난이도 ▾</span>'
      +   '<select id="nz2-diff-select" aria-label="체감 난이도 필터">'
      +     '<option value="전체">난이도 ▾</option>'
      +     '<option value="아주 쉬움">아주 쉬움</option>'
      +     '<option value="쉬움">쉬움</option>'
      +     '<option value="보통">보통</option>'
      +     '<option value="어려움">어려움</option>'
      +     '<option value="아주 어려움">아주 어려움</option>'
      +   '</select>'
      + '</div>'
      + '<select id="nz2-brand-select" class="nz2-pc-select" aria-label="브랜드 필터">'
      +   '<option value="전체">브랜드별 · 전체</option>' + brandOptions
      + '</select>'
      + '<select id="nz2-diff-select-pc" class="nz2-pc-select" aria-label="체감 난이도 필터">' + DIFF_OPTIONS + '</select>'
      + '</div>'
      + '<div id="nz2-searchbar">'
      +   '<span id="nz2-search-icon">⌕</span>'
      +   '<input id="nz2-search" type="text" placeholder="나조 이름 또는 브랜드 검색" autocomplete="off">'
      +   '<span id="nz2-search-clear" style="display:none">✕</span>'
      + '</div>'
      + '</div>';

    var anchor = document.getElementById('nz2-layout') || gallery;
    anchor.parentNode.insertBefore(wrap, anchor);

    // 결과 코멘트는 구분선 아래, 본문 컬럼 안 (갤러리 바로 위)
    var comment = document.createElement('div');
    comment.id = 'nz2-result-comment';
    gallery.parentNode.insertBefore(comment, gallery);

    // 칩 클릭
    wrap.querySelectorAll('.nz2-chip[data-f]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.filter = this.getAttribute('data-f');
        state.page = 1;
        setChipActive();
        applyVisibility();
      });
    });

    // 난이도 select (모바일 투명 오버레이 + PC 알약, 상태 동기화)
    function onDiffChange(val) {
      state.diff = val;
      state.page = 1;
      var m = document.getElementById('nz2-diff-select');
      var pc = document.getElementById('nz2-diff-select-pc');
      if (m && m.value !== val) m.value = val;
      if (pc && pc.value !== val) pc.value = val;
      setChipActive();
      applyVisibility();
    }
    document.getElementById('nz2-diff-select').addEventListener('change', function () { onDiffChange(this.value); });
    document.getElementById('nz2-diff-select-pc').addEventListener('change', function () { onDiffChange(this.value); });
    document.getElementById('nz2-brand-select').addEventListener('change', function () {
      state.brand = this.value;
      state.page = 1;
      applyVisibility();
    });

    // 검색 (입력 즉시, 디바운스)
    var input = document.getElementById('nz2-search');
    var clearBtn = document.getElementById('nz2-search-clear');
    var debounce = null;
    input.addEventListener('input', function () {
      var v = this.value;
      clearBtn.style.display = v ? '' : 'none';
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(function () {
        state.searchQ = v.trim().toLowerCase();
        state.page = 1;
        applyVisibility();
      }, 150);
    });
    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.style.display = 'none';
      state.searchQ = '';
      state.page = 1;
      applyVisibility();
      input.focus();
    });

    setChipActive();
  }

  // Esc = 검색어 지우기
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var input = document.getElementById('nz2-search');
    if (input && input.value) {
      input.value = '';
      var clearBtn = document.getElementById('nz2-search-clear');
      if (clearBtn) clearBtn.style.display = 'none';
      state.searchQ = '';
      state.page = 1;
      applyVisibility();
    }
  });

  // ── 빈 결과 상태 ──
  function buildEmptyState() {
    if (document.getElementById('nz2-empty')) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;
    var div = document.createElement('div');
    div.id = 'nz2-empty';
    div.style.display = 'none';
    div.innerHTML =
      '<img src="' + NZ_ASSET_BASE + 'assets/lemon.png" alt="레몬" onerror="this.style.display=\'none\'">'
      + '<div class="nz2-empty-msg">조건에 맞는 나조가 아직 다락방에 없어요</div>'
      + '<button type="button" id="nz2-empty-reset">필터 초기화</button>';
    gallery.parentNode.insertBefore(div, gallery.nextSibling);
    document.getElementById('nz2-empty-reset').addEventListener('click', resetFilters);
  }

  // ── PC 2단 레이아웃 + 사이드바 ──
  var upcomingItems = null;
  var notesItems = null;

  function buildLayout() {
    if (document.getElementById('nz2-layout')) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    var layout = document.createElement('div');
    layout.id = 'nz2-layout';
    var left = document.createElement('div');
    left.id = 'nz2-left';
    var sidebar = document.createElement('div');
    sidebar.id = 'nz2-sidebar';
    sidebar.innerHTML =
      '<div class="nz-profile-card">'
      +   '<div class="nz-profile-card__head">'
      +     '<div class="nz-profile-card__avatar"><img src="' + NZ_ASSET_BASE + 'assets/lemon.png" alt=""></div>'
      +     '<div class="nz-profile-card__id">'
      +       '<div class="nz-profile-card__name">레몬빵</div>'
      +       '<div class="nz-profile-card__tag">나조토키에 빠진 한국인</div>'
      +     '</div>'
      +   '</div>'
      +   '<p class="nz-profile-card__bio">방탈출을 천 번 넘게 하다가 일본의 나조토키를 만나 푹 빠진 방탈러(+나조러)입니다. 직접 풀어본 나조토키를 하나씩 기록하고 있어요. 레몬빵이 조금 더 궁금하다면? 우상단 <a class="nz-profile-card__lemon" href="/lemonbread">레몬빵?</a> 페이지로!</p>'
      +   '<div class="nz-profile-card__sns">'
      +     '<a class="nz-profile-card__btn" href="https://instagram.com/seohyun_pika" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C554A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="0.5" fill="#5C554A"></circle></svg>Instagram</a>'
      +     '<a class="nz-profile-card__btn" href="https://x.com/Monbbread" target="_blank" rel="noopener"><svg width="12" height="12" viewBox="0 0 24 24" fill="#5C554A"><path d="M18.9 1.2h3.7l-8.1 9.3L24 23.2h-7.5l-5.9-7.7-6.7 7.7H.2l8.7-9.9L-.2 1.2h7.7l5.3 7 6.1-7z"></path></svg>X</a>'
      +   '</div>'
      + '</div>'
      + (NZ_NOTES_READY
        ? '<div class="nz2-sb-header">다락방 노트</div>'
          + '<div class="nz2-notes-target nz2-sb-notes"></div>'
          + '<a class="nz2-notes-more" href="/darakbang-note">특집 전체 보기 →</a>'
        : '')
      + '<div class="nz2-upcoming">'
      +   '<div class="nz2-up-head"><span>리뷰 예정</span><a href="/to-review">전체 →</a></div>'
      +   '<div id="nz2-upcoming-list"></div>'
      + '</div>';

    gallery.parentNode.insertBefore(layout, gallery);
    left.appendChild(gallery);
    layout.appendChild(left);
    layout.appendChild(sidebar);

    if (notesItems !== null) renderNotes(notesItems);
    if (upcomingItems !== null) renderUpcoming();
    fetchUpcoming();
  }

  // ── 리뷰 예정 티저: 실제 /to-review 페이지 상단 순서와 동일 (임박 순 + 등록 오래된 순) ──
  var upcomingFetched = false;
  var UP_PRIORITY = ['리뷰 작성 중', '플레이 완료', '보유중', '구입 완료', '해보고 싶다', '해보고싶다'];
  var UP_NOTION_DEEP = {
    'pill-pink': '#B0616E', 'pill-purple': '#8171A8', 'pill-blue': '#5F8CA3',
    'pill-red': '#B25E5E', 'pill-orange': '#C07A48', 'pill-yellow': '#B08900',
    'pill-green': '#6E9E52', 'pill-brown': '#96705A', 'pill-gray': '#8A8272'
  };
  var UP_FALLBACK = { '리뷰 작성 중': '#B08900', '플레이 완료': '#A0705C', '보유중': '#7AA85C', '구입 완료': '#5A78A0', '해보고 싶다': '#A79E8A', '해보고싶다': '#A79E8A' };
  function fetchUpcoming() {
    if (upcomingFetched) return;
    upcomingFetched = true;
    fetch('/to-review')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var table = doc.querySelector('.notion-collection-table');
        if (!table) { upcomingItems = []; renderUpcoming(); return; }
        // 헤더 텍스트로 컬럼 인덱스 매핑 (nz-tr와 동일 방식)
        var idx = {};
        table.querySelectorAll('thead .notion-collection-table__head-cell').forEach(function (th, i) {
          var s = th.textContent;
          if (s.indexOf('제목') !== -1) idx.title = i;
          else if (s.indexOf('상태') !== -1) idx.status = i;
          else if (s.indexOf('생성') !== -1) idx.created = i;
        });
        var items = [];
        table.querySelectorAll('tbody tr').forEach(function (tr) {
          var cells = tr.children;
          var title = idx.title !== undefined && cells[idx.title] ? cells[idx.title].textContent.trim() : '';
          if (!title) return;
          var pill = idx.status !== undefined && cells[idx.status] ? cells[idx.status].querySelector('.notion-pill') : null;
          var status = pill ? pill.textContent.trim() : '';
          var prio = UP_PRIORITY.indexOf(status);
          if (prio === -1) return; // 리뷰 완료 등 5그룹 외 제외
          var colorCls = pill && (pill.className.match(/pill-[a-z]+/) || [])[0];
          var created = 0;
          if (idx.created !== undefined && cells[idx.created]) {
            created = new Date(cells[idx.created].textContent.trim()).getTime() || 0;
          }
          items.push({
            title: title, status: status, prio: prio, created: created,
            color: (colorCls && UP_NOTION_DEEP[colorCls]) || UP_FALLBACK[status] || '#FFD953'
          });
        });
        items.sort(function (a, b) { return (a.prio - b.prio) || (a.created - b.created); });
        upcomingItems = items.slice(0, 8);
        renderUpcoming();
      })
      .catch(function () { upcomingItems = []; renderUpcoming(); });
  }
  function renderUpcoming() {
    var list = document.getElementById('nz2-upcoming-list');
    if (!list || upcomingItems === null) return;
    if (!upcomingItems.length) {
      var box = document.querySelector('.nz2-upcoming');
      if (box) box.style.display = 'none';
      return;
    }
    list.innerHTML = upcomingItems.map(function (it) {
      var dot = it.color || '#FFD953';
      return '<div class="nz2-up-item">'
        + '<span class="nz2-up-dot" style="background:' + dot + '"></span>'
        + '<span class="nz2-up-name">' + esc(it.title) + '</span>'
        + '<span class="nz2-up-status">' + esc(it.status) + '</span>'
        + '</div>';
    }).join('');
  }

  // ── 다락방 노트 박스 ──
  var notesFetched = false;
  function buildNotesBox() {
    if (!NZ_NOTES_READY) return;
    if (document.getElementById('nz2-notes')) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    var box = document.createElement('div');
    box.id = 'nz2-notes';
    box.innerHTML =
      '<div class="nz2-notes-title">다락방 노트</div>'
      + '<div id="nz2-notes-list" class="nz2-notes-target"></div>'
      + '<a class="nz2-notes-more" href="/darakbang-note">특집 전체 보기 →</a>';
    gallery.parentNode.appendChild(box);

    if (notesFetched) return;
    notesFetched = true;
    fetch('/darakbang-note')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var items = [];
        doc.querySelectorAll('.notion-collection-table tbody tr, .notion-collection-table tr').forEach(function (tr) {
          var link = tr.querySelector('a[href*="darakbang-note/"]');
          if (!link) return;
          var rowText = tr.textContent;
          if (rowText.indexOf('비공개') > -1) return;
          var title = '';
          var titleCell = tr.querySelector('.title, td:first-child');
          if (titleCell) title = titleCell.textContent.trim();
          if (!title) title = link.textContent.trim();
          if (!title) return;
          var category = '';
          var pill = tr.querySelector('.notion-pill');
          if (pill) category = pill.textContent.trim();
          if (category === '공개') category = '';
          var dateText = '';
          var dateCell = tr.querySelector('td.date, .date');
          if (dateCell) {
            var parsed = new Date(dateCell.textContent.trim());
            if (!isNaN(parsed.getTime())) {
              dateText = parsed.getFullYear() + '.' + ('0' + (parsed.getMonth() + 1)).slice(-2);
            }
          }
          items.push({
            title: title,
            href: link.getAttribute('href'),
            meta: [dateText, category].filter(Boolean).join(' · '),
            sortKey: dateText || ''
          });
        });
        // 최신순 상위 3개
        items.sort(function (a, b) { return b.sortKey.localeCompare(a.sortKey); });
        renderNotes(items.slice(0, 3));
      })
      .catch(function () { renderNotes([]); });
  }

  function renderNotes(items) {
    notesItems = items;
    var targets = document.querySelectorAll('.nz2-notes-target');
    if (!targets.length) return;
    var emptyHtml =
      '<div class="nz2-notes-empty">'
      + '<img src="' + NZ_ASSET_BASE + 'assets/lemon.png" alt="레몬" onerror="this.style.display=\'none\'">'
      + '<span>아직 쓰는 중이에요. 첫 노트를 기대해 주세요!</span>'
      + '</div>';
    var cardsHtml = items.map(function (it) {
      return '<a class="nz2-note-card" href="' + esc(it.href) + '">'
        + '<div class="nz2-note-card-title">' + esc(it.title) + '</div>'
        + (it.meta ? '<div class="nz2-note-card-meta">' + esc(it.meta) + '</div>' : '')
        + '</a>';
    }).join('');
    targets.forEach(function (list) {
      list.innerHTML = items.length ? cardsHtml : emptyHtml;
    });
    document.querySelectorAll('.nz2-notes-more').forEach(function (more) {
      more.style.display = items.length ? '' : 'none';
    });
  }

  // ── URL 검색 파라미터 ──
  function applyUrlSearch() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('search');
    if (!q) return;
    var input = document.getElementById('nz2-search');
    if (input) {
      input.value = q;
      var clearBtn = document.getElementById('nz2-search-clear');
      if (clearBtn) clearBtn.style.display = '';
      state.searchQ = q.trim().toLowerCase();
      state.page = 1;
    }
    history.replaceState(null, '', window.location.pathname);
  }

  // ── 홈 로고 클릭 시 새로고침 (필터 초기화) ──
  var logoRefreshDone = false;
  function setupLogoRefresh() {
    if (logoRefreshDone) return;
    logoRefreshDone = true;
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.href;
      if (href === window.location.origin + '/' || href === window.location.origin) {
        if (window.location.pathname === '/') {
          e.preventDefault();
          e.stopPropagation();
          window.location.reload();
        }
      }
    }, true);
  }

  // ── 조립 + SPA/lazy 대응 ──
  function destroyAll() {
    var gallery = document.querySelector(GALLERY_SEL);
    var layout = document.getElementById('nz2-layout');
    if (layout) {
      if (gallery && layout.contains(gallery)) layout.parentNode.insertBefore(gallery, layout);
      layout.parentNode.removeChild(layout);
    }
    ['nz2-controls', 'nz2-result-comment', 'nz-pagination', 'nz2-empty', 'nz2-notes'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    document.querySelectorAll('.nz-card-props').forEach(function (el) { el.parentNode.removeChild(el); });
    document.querySelectorAll('.nz-card-custom').forEach(function (el) { el.classList.remove('nz-card-custom'); });
  }

  function buildAll() {
    buildLayout();
    buildControls();
    customizeCards();
    sortCardsByRecent();
    buildEmptyState();
    applyUrlSearch();
    applyVisibility();
    buildNotesBox();
  }

  // 화면 폭이 모바일↔PC 경계를 넘으면 페이지 크기 재계산
  var lastMobile = isMobile();
  window.addEventListener('resize', function () {
    if (isMobile() !== lastMobile) {
      lastMobile = isMobile();
      state.page = 1;
      applyVisibility();
    }
  });

  var galleryDebounce = null;
  var galleryObserver = new MutationObserver(function () {
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;
    var controls = document.getElementById('nz2-controls');
    var left = document.getElementById('nz2-left');
    if (!controls || !left || !left.contains(gallery)) {
      destroyAll();
      buildAll();
      return;
    }
    var uncustomized = gallery.querySelector(CARD_SEL + ':not(.nz-card-custom)');
    if (uncustomized) {
      customizeCards();
      if (galleryDebounce) clearTimeout(galleryDebounce);
      galleryDebounce = setTimeout(function () {
        sortCardsByRecent();
        applyVisibility();
      }, 150);
    }
  });
  galleryObserver.observe(document.body, { childList: true, subtree: true });

  if (document.querySelector(GALLERY_SEL)) buildAll();
  } // initGallery 끝
})();

// ── 구매처 정보 페이지 커스터마이징 ────────────────────────
(function () {
  'use strict';

  var PURCHASE_PATH = '%ea%b5%ac%eb%a7%a4%ec%b2%98';
  var LINK_ICON_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3H3v10h10v-3M9 1h6v6M15 1L7 9"/></svg>';

  // 태그 자동 분류 키워드
  var TAG_KEYWORDS = {
    ship:  ['배송', '배대지'],
    merit: ['가격', '종류', '많음', '갠춘', '갠찮'],
    warn:  ['비싸', '미엄', '보통', '주의']
  };

  // 예외 태그 오버라이드
  var TAG_OVERRIDE = {
    '#배송비보통': 'warn',
    '#나조종류적음': 'warn',
    '#단종나조발견가능': 'merit'
  };

  function isPurchasePage() {
    return location.pathname.indexOf('how-to-buy-nazotokis') !== -1;
  }

  function classifyTag(text) {
    text = text.trim();
    if (TAG_OVERRIDE[text]) return TAG_OVERRIDE[text];
    for (var cat in TAG_KEYWORDS) {
      var keywords = TAG_KEYWORDS[cat];
      for (var i = 0; i < keywords.length; i++) {
        if (text.indexOf(keywords[i]) !== -1) return cat;
      }
    }
    return 'brand';
  }

  function extractDomain(url) {
    try {
      var a = document.createElement('a');
      a.href = url;
      return a.hostname.replace(/^www\./, '');
    } catch (e) { return url; }
  }

  function customizeCallout(callout, sectionNum) {
    if (callout.dataset.nzDone) return;
    callout.dataset.nzDone = '1';

    var content = callout.querySelector('.notion-callout__content');
    if (!content) return;

    // H3 (샵 이름) 추출
    var h3 = content.querySelector('h3');
    var shopName = h3 ? h3.textContent.trim() : '';

    // URL 및 태그가 있는 P 찾기
    var paragraphs = content.querySelectorAll('p.notion-text');
    var urlParagraph = null;
    var shopUrl = '';
    var tags = [];

    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var link = p.querySelector('a.notion-link');
      var codes = p.querySelectorAll('code.code');
      if (link && codes.length > 0) {
        urlParagraph = p;
        shopUrl = link.href;
        codes.forEach(function (c) {
          var t = c.textContent.trim();
          if (t.charAt(0) === '#') tags.push(t);
        });
        break;
      }
      if (link && p.textContent.indexOf('URL') !== -1) {
        urlParagraph = p;
        shopUrl = link.href;
      }
      if (!link && codes && codes.length > 0) {
        codes.forEach(function (c) {
          var t = c.textContent.trim();
          if (t.charAt(0) === '#') tags.push(t);
        });
        if (!urlParagraph) urlParagraph = p;
      }
    }

    // 헤더 구성 (이름 + 링크 버튼)
    if (h3 && shopUrl) {
      var header = document.createElement('div');
      header.className = 'nz-shop-header';
      h3.parentNode.insertBefore(header, h3);
      header.appendChild(h3);

      var domain = extractDomain(shopUrl);
      var linkBtn = document.createElement('a');
      linkBtn.href = shopUrl;
      linkBtn.target = '_blank';
      linkBtn.rel = 'noopener noreferrer';
      linkBtn.className = 'nz-shop-link';
      linkBtn.innerHTML = LINK_ICON_SVG + '<span class="nz-shop-link-text">' + domain + '</span>';
      header.appendChild(linkBtn);
    }

    // 태그 행 구성
    if (tags.length > 0) {
      var tagsDiv = document.createElement('div');
      tagsDiv.className = 'nz-shop-tags';
      tags.forEach(function (t) {
        var cat = classifyTag(t);
        var span = document.createElement('span');
        span.className = 'nz-shop-tag nz-shop-tag--' + cat;
        span.textContent = t;
        tagsDiv.appendChild(span);
      });
      var insertAfter = content.querySelector('.nz-shop-header') || h3;
      if (insertAfter && insertAfter.nextSibling) {
        insertAfter.parentNode.insertBefore(tagsDiv, insertAfter.nextSibling);
      } else {
        content.appendChild(tagsDiv);
      }
    }

    // 원본 URL+태그 행 숨김
    if (urlParagraph) {
      urlParagraph.classList.add('nz-shop-url-row');
    }
  }

  function customizeSectionHeadings() {
    if (document.querySelector('.nz-section-heading')) return;
    var headings = document.querySelectorAll('h2.notion-heading');
    headings.forEach(function (h2) {
      var text = h2.textContent.trim();
      var match = text.match(/^(\d+)\.\s*(.+)/);
      if (match) {
        var num = match[1];
        var title = match[2];
        h2.className += ' nz-section-heading';
        h2.innerHTML = '<span class="nz-section-num">' + num + '</span>' + title;
      }
    });
  }

  function run() {
    if (!isPurchasePage()) {
      document.body.classList.remove('nz-purchase-page');
      return;
    }
    document.body.classList.add('nz-purchase-page');

    // 서브타이틀 삽입
    if (!document.querySelector('.nz-purchase-subtitle')) {
      var title = document.querySelector('h1.notion-header__title');
      if (title) {
        var subtitle = document.createElement('p');
        subtitle.className = 'nz-purchase-subtitle';
        subtitle.textContent = '어디서 나조토키를 살 수 있을까?';
        title.parentNode.insertBefore(subtitle, title.nextSibling);
      }
    }

    customizeSectionHeadings();

    var currentSection = '1';
    var headings = document.querySelectorAll('h2.notion-heading');
    var callouts = document.querySelectorAll('.notion-callout');

    // 각 callout에 해당 섹션 번호 매핑
    var allElements = document.querySelectorAll('h2.notion-heading, .notion-callout');
    allElements.forEach(function (el) {
      if (el.tagName === 'H2') {
        var match = el.textContent.trim().match(/^(\d+)/);
        if (match) currentSection = match[1];
      } else {
        customizeCallout(el, currentSection);
      }
    });
  }

  function needsRun() {
    if (!isPurchasePage()) return false;
    if (!document.querySelector('.notion-callout')) return false;
    // 하이드레이션이 마커(data-nz-done)만 남기고 꾸민 내용을 날리는 경우가 있어
    // 마커가 아니라 실제 결과물(꾸며진 헤더) 존재 여부로 판단
    if (!document.querySelector('.nz-shop-header')) {
      document.querySelectorAll('[data-nz-done]').forEach(function (el) {
        el.removeAttribute('data-nz-done');
      });
      return true;
    }
    return false;
  }

  function tryRun(attempt) {
    attempt = attempt || 0;
    if (!isPurchasePage()) return;
    if (document.querySelector('.notion-callout')) {
      run();
    } else if (attempt < 20) {
      setTimeout(function () { tryRun(attempt + 1); }, 300);
    }
  }

  // SPA 감지 + 하이드레이션 후 재적용
  var lastUrl = location.href;
  var debounceTimer = null;
  var purchaseObserver = new MutationObserver(function () {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      tryRun();
      return;
    }
    if (debounceTimer) return;
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      if (needsRun()) run();
    }, 200);
  });
  purchaseObserver.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryRun(); });
  } else {
    tryRun();
  }
})();

// ── 리뷰 예정 목록 페이지 커스터마이징 ────────────────────────
(function () {
  'use strict';

  function isReviewListPage() {
    return false; // nz-tr 모듈(시안 3a)이 대체 — 구 표 재스타일 비활성화
  }

  function run() {
    if (!isReviewListPage()) {
      document.body.classList.remove('nz-review-list-page');
      return;
    }
    document.body.classList.add('nz-review-list-page');

    // 서브타이틀 삽입
    if (!document.querySelector('.nz-review-subtitle')) {
      var title = document.querySelector('h1.notion-header__title');
      if (title) {
        var subtitle = document.createElement('p');
        subtitle.className = 'nz-review-subtitle';
        subtitle.textContent = '언젠가 플레이하여 리뷰 예정인 나조토키들';
        title.parentNode.insertBefore(subtitle, title.nextSibling);
      }
    }

    // 제목 열 헤더 텍스트 변경: '나조토키 제목' → '나조토키'
    var titleHead = document.querySelector('.notion-collection-table__head-cell.title .notion-collection-table__head-cell-content');
    if (titleHead && titleHead.textContent.trim() === '나조토키 제목') {
      titleHead.textContent = '나조토키';
    }

    // 제작사 열 → 제목 셀 아래로 병합 (2열화)
    if (!document.querySelector('[data-nz-2col]')) {
      var rows = document.querySelectorAll('.notion-collection-table tbody tr');
      rows.forEach(function (row) {
        var titleCell = row.querySelector('.notion-collection-table__cell.title');
        var makerCell = row.querySelector('.notion-collection-table__cell.multi_select');
        if (!titleCell || !makerCell) return;
        var pills = makerCell.querySelectorAll('.notion-pill');
        if (pills.length === 0) return;
        var makerRow = document.createElement('div');
        makerRow.className = 'nz-maker-row';
        pills.forEach(function (p) {
          makerRow.appendChild(p.cloneNode(true));
        });
        var innerDiv = titleCell.querySelector('div');
        if (innerDiv) {
          innerDiv.style.flexDirection = 'column';
          innerDiv.style.alignItems = 'flex-start';
          innerDiv.style.gap = '4px';
          innerDiv.appendChild(makerRow);
        } else {
          titleCell.appendChild(makerRow);
        }
      });
      // 제작사 헤더 + 셀 숨기기
      var table = document.querySelector('.notion-collection-table');
      if (table) table.setAttribute('data-nz-2col', '1');
    }

    // 사진 열 → 제목 셀에 썸네일로 표시
    var thumbRows = document.querySelectorAll('.notion-collection-table tbody tr:not([data-nz-thumb])');
    if (thumbRows.length > 0) {
      thumbRows.forEach(function (row) {
        var titleCell = row.querySelector('.notion-collection-table__cell.title');
        var fileCell = row.querySelector('.notion-collection-table__cell.file');
        if (!titleCell) return;

        // 이미지 URL 추출
        var imgSrc = null;
        if (fileCell) {
          var img = fileCell.querySelector('img');
          var link = fileCell.querySelector('a');
          if (img && img.src) imgSrc = img.src;
          else if (link && link.href) imgSrc = link.href;
        }

        // 썸네일 div 생성
        var thumb = document.createElement('div');
        thumb.className = 'nz-thumb';
        if (imgSrc) {
          thumb.style.backgroundImage = "url('" + imgSrc + "')";
          thumb.style.cursor = 'pointer';
          // 원본 이미지 URL 저장 (라이트박스용)
          var origUrl = null;
          if (fileCell) {
            var link = fileCell.querySelector('a');
            if (link && link.href) origUrl = link.href;
          }
          if (origUrl) {
            thumb.setAttribute('data-nz-full', origUrl);
            thumb.addEventListener('click', function () {
              nzLightboxOpen(this.getAttribute('data-nz-full'));
            });
          }
        } else {
          thumb.classList.add('nz-thumb--empty');
          var logo = document.createElement('img');
          logo.src = 'https://assets.super.so/b529abf1-8288-44d9-87eb-38228677c041/images/bcc6ec8e-275b-4bfc-b598-b2108922863e/noname.png';
          logo.alt = '';
          logo.className = 'nz-thumb-logo';
          thumb.appendChild(logo);
        }

        // 제목 셀 내부 재구성: [thumb] [info(title + maker)]
        var innerDiv = titleCell.querySelector('div');
        if (innerDiv) {
          var infoWrap = document.createElement('div');
          infoWrap.className = 'nz-thumb-info';
          while (innerDiv.firstChild) {
            infoWrap.appendChild(innerDiv.firstChild);
          }
          innerDiv.appendChild(thumb);
          innerDiv.appendChild(infoWrap);
          innerDiv.classList.add('nz-thumb-row');
        }

        // NEW 뱃지: 생성일시 4일 이내면 표시
        var timeCell = row.querySelector('.notion-collection-table__cell.created_time');
        if (timeCell) {
          var dateText = timeCell.textContent.trim();
          var created = new Date(dateText);
          if (!isNaN(created.getTime())) {
            var now = new Date();
            var diffDays = (now - created) / (1000 * 60 * 60 * 24);
            if (diffDays <= 4) {
              var badge = document.createElement('span');
              badge.className = 'nz-new-badge';
              badge.textContent = 'NEW';
              thumb.appendChild(badge);
            }
          }
        }

        row.setAttribute('data-nz-thumb', '1');
      });
    }
  }

  function needsRun() {
    return isReviewListPage() &&
      document.querySelector('.notion-collection-table') &&
      (!document.querySelector('.nz-review-subtitle') || !document.querySelector('[data-nz-2col]') || document.querySelector('.notion-collection-table tbody tr:not([data-nz-thumb])'));
  }

  function tryRun(attempt) {
    attempt = attempt || 0;
    if (!isReviewListPage()) return;
    if (document.querySelector('.notion-collection-table')) {
      run();
    } else if (attempt < 20) {
      setTimeout(function () { tryRun(attempt + 1); }, 300);
    }
  }

  var lastUrl = location.href;
  var debounceTimer = null;
  var reviewObserver = new MutationObserver(function () {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      tryRun();
      return;
    }
    if (debounceTimer) return;
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      if (needsRun()) run();
    }, 200);
  });
  reviewObserver.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryRun(); });
  } else {
    tryRun();
  }
})();

// ── 갤러리 카드 NEW 뱃지 (작성일 4일 이내) ──
(function () {
  'use strict';
  var DATE_SEL = '.property-57636b4d';
  var CARD_SEL = '.notion-collection-card';
  var NEW_DAYS = 4;
  var MARKER  = 'data-nz-new';

  function addNewBadges() {
    var cards = document.querySelectorAll(CARD_SEL);
    if (!cards.length) return;
    var now = new Date();
    cards.forEach(function (card) {
      if (card.hasAttribute(MARKER)) return;
      card.setAttribute(MARKER, '');
      var dateEl = card.querySelector(DATE_SEL);
      if (!dateEl) return;
      var dateText = dateEl.textContent.trim();
      var parsed = new Date(dateText);
      if (isNaN(parsed.getTime())) return;
      var diff = (now - parsed) / (1000 * 60 * 60 * 24);
      if (diff <= NEW_DAYS) {
        var coverImg = card.querySelector('img.notion-collection-card__cover');
        var container = coverImg ? coverImg.parentElement : card;
        container.style.position = 'relative';
        var badge = document.createElement('span');
        badge.className = 'nz-new-badge';
        badge.textContent = 'NEW';
        container.appendChild(badge);
      }
    });
  }

  var newObserver = new MutationObserver(function () { addNewBadges(); });
  newObserver.observe(document.body, { childList: true, subtree: true });
  addNewBadges();
})();

// ── 좋아요 버튼 (독립 모듈) ──────────────────────────────
(function () {
  'use strict';

  var SUPABASE_URL = 'https://llwdqogseeddnffradej.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_8cOoT2cGQ0x7Is57k-VT5A_fqgVKr6f';
  var LIKE_COLORS = ['#FFD953', '#FFCF33', '#FFDE59', '#F0C93D', '#D9A13B', '#FFE98A'];

  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function getSessionId() {
    var id = null;
    try { id = localStorage.getItem('nz_session_id'); } catch (e) {}
    if (!id) id = readCookie('nz_session_id'); // localStorage가 지워지는 브라우저 대비
    if (!id) id = 'nz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    try { localStorage.setItem('nz_session_id', id); } catch (e) {}
    try {
      document.cookie = 'nz_session_id=' + encodeURIComponent(id) +
        '; max-age=' + (60 * 60 * 24 * 400) + '; path=/; SameSite=Lax; Secure';
    } catch (e) {}
    return id;
  }

  function getPageSlug() {
    return location.pathname.replace(/\/$/, '') || '/';
  }

  function supabaseRequest(method, endpoint, body) {
    var opts = {
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': method === 'GET' ? 'count=exact' : ''
      }
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(SUPABASE_URL + '/rest/v1/' + endpoint.replace(/^likes/, 'Likes'), opts);
  }

  // 보이는 DOM에서 삽입 지점 찾기
  function findVisibleAnchor() {
    // 브랜드 다른 리뷰 앞 (시안: 일기 다음, 브랜드 앞)
    var brands = document.querySelectorAll('.nz-brand-reviews');
    for (var i = 0; i < brands.length; i++) {
      if (brands[i].offsetWidth > 0) return { el: brands[i], position: 'before' };
    }
    // 브랜드 박스가 아직 없으면 일기 박스 안 맨 아래
    var diaries = document.querySelectorAll('.nz-diary-box');
    for (var i = 0; i < diaries.length; i++) {
      if (diaries[i].offsetWidth > 0) return { el: diaries[i], position: 'inside' };
    }
    // 노트 상세: 본문 맨 끝(맺음 박스 뒤)에 부착
    if (isNoteDetailPage()) {
      var arts = document.querySelectorAll('article.notion-root');
      for (var i = 0; i < arts.length; i++) {
        if (arts[i].offsetWidth > 0) return { el: arts[i], position: 'inside' };
      }
      return null;
    }
    // 둘 다 없으면 보이는 notion-page__properties 뒤에
    var props = document.querySelectorAll('.notion-page__properties');
    for (var i = 0; i < props.length; i++) {
      if (props[i].offsetWidth > 0) return { el: props[i], position: 'after-last-sibling' };
    }
    return null;
  }

  function isNoteDetailPage() {
    return /^\/darakbang-note\/.+/.test(location.pathname);
  }

  function hasVisibleLikeButton() {
    var wraps = document.querySelectorAll('.nz-like-wrap');
    for (var i = 0; i < wraps.length; i++) {
      if (wraps[i].offsetWidth > 0) return true;
    }
    return false;
  }

  function renderLikeButton() {
    if (hasVisibleLikeButton()) return;
    if (location.pathname.indexOf('/nazotoki-reviews/') === -1 && !isNoteDetailPage()) return;

    var anchor = findVisibleAnchor();
    if (!anchor) return;

    var slug = getPageSlug();
    var sessionId = getSessionId();

    var wrap = document.createElement('div');
    wrap.className = 'nz-like-wrap';

    var pill = document.createElement('div');
    pill.className = 'nz-like-pill';

    pill.innerHTML =
      '<div class="nz-like-particles"></div>' +
      '<div class="nz-like-icon">' +
        '<img class="nz-like-lemon" src="' + NZ_ASSET_BASE + 'assets/lemon.png" alt="">' +
      '</div>' +
      '<span class="nz-like-text">잘 읽었어요</span>' +
      '<span class="nz-like-count">…</span>';

    wrap.appendChild(pill);

    // 삽입
    if (anchor.position === 'inside') {
      anchor.el.appendChild(wrap);
    } else if (anchor.position === 'before') {
      anchor.el.parentNode.insertBefore(wrap, anchor.el);
    } else if (anchor.position === 'after-last-sibling') {
      var lastChild = anchor.el.parentNode.lastElementChild;
      anchor.el.parentNode.insertBefore(wrap, lastChild ? lastChild.nextSibling : null);
    }

    var countEl = pill.querySelector('.nz-like-count');

    // 총 좋아요 수
    supabaseRequest('GET', 'likes?page_slug=eq.' + encodeURIComponent(slug) + '&select=id')
      .then(function (res) {
        var count = res.headers.get('content-range');
        var total = count ? parseInt(count.split('/')[1]) || 0 : 0;
        countEl.textContent = total;
      })
      .catch(function () { countEl.textContent = 0; });

    // 내가 이미 눌렀는지
    supabaseRequest('GET', 'likes?page_slug=eq.' + encodeURIComponent(slug) + '&session_id=eq.' + encodeURIComponent(sessionId) + '&select=id')
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        if (rows.length > 0) {
          pill.classList.add('active');
        }
      })
      .catch(function () {});

    // 서버 진실과 재동기화: 총 개수 + 내 눌림 상태를 다시 받아 표시를 맞춘다
    var resyncTimer = null;
    function resyncFromServer() {
      supabaseRequest('GET', 'likes?page_slug=eq.' + encodeURIComponent(slug) + '&select=session_id')
        .then(function (res) { return res.json(); })
        .then(function (rows) {
          countEl.textContent = rows.length;
          var mine = rows.some(function (r) { return r.session_id === sessionId; });
          pill.classList.toggle('active', mine);
        })
        .catch(function () {});
    }

    // 클릭 이벤트
    pill.addEventListener('click', function () {
      var isActive = pill.classList.contains('active');
      var currentCount = parseInt(countEl.textContent) || 0;
      var req;

      if (isActive) {
        pill.classList.remove('active');
        countEl.textContent = Math.max(0, currentCount - 1);
        req = supabaseRequest('DELETE', 'likes?page_slug=eq.' + encodeURIComponent(slug) + '&session_id=eq.' + encodeURIComponent(sessionId));
      } else {
        pill.classList.add('active');
        countEl.textContent = currentCount + 1;
        nzBurstParticles(pill.querySelector('.nz-like-particles'));
        req = supabaseRequest('POST', 'likes', { page_slug: slug, session_id: sessionId });
      }

      // 요청이 끝나면(성공/실패 모두) 서버 진실로 표시를 맞춘다
      req.catch(function () {}).then(function () {
        if (resyncTimer) clearTimeout(resyncTimer);
        resyncTimer = setTimeout(resyncFromServer, 800);
      });
    });

    console.log('[나조토키] 좋아요 버튼 렌더링 완료');
  }

  function nzBurstParticles(container) {
    container.innerHTML = '';
    for (var i = 0; i < 8; i++) {
      var particle = document.createElement('div');
      particle.className = 'nz-like-particle';
      var angle = (360 / 8) * i;
      var distance = 18 + Math.random() * 14;
      var rad = angle * Math.PI / 180;
      var tx = Math.cos(rad) * distance;
      var ty = Math.sin(rad) * distance;
      var size = 4 + Math.random() * 3;

      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.background = LIKE_COLORS[Math.floor(Math.random() * LIKE_COLORS.length)];

      var animName = 'nzPb' + i + '_' + Date.now();
      var s = document.createElement('style');
      s.textContent = '@keyframes ' + animName + '{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(' + tx + 'px,' + ty + 'px) scale(0);opacity:0}}';
      document.head.appendChild(s);
      particle.style.animation = animName + ' 0.45s ease-out forwards';
      container.appendChild(particle);
    }
    setTimeout(function () { container.innerHTML = ''; }, 600);
  }

  // 자체 옵저버: 보이는 DOM에 좋아요 버튼이 없으면 계속 시도
  var likeObserver = new MutationObserver(function () {
    if (!hasVisibleLikeButton() &&
        (location.pathname.indexOf('/nazotoki-reviews/') > -1 || isNoteDetailPage())) {
      renderLikeButton();
    }
  });
  likeObserver.observe(document.body, { childList: true, subtree: true });

  // 초기 시도 (약간의 딜레이 후)
  setTimeout(function () { renderLikeButton(); }, 1000);
  setTimeout(function () { renderLikeButton(); }, 3000);
  setTimeout(function () { renderLikeButton(); }, 5000);

  // SPA 네비게이션 대응
  var likeLastUrl = location.href;
  setInterval(function () {
    if (location.href !== likeLastUrl) {
      likeLastUrl = location.href;
      setTimeout(function () { renderLikeButton(); }, 1500);
    }
  }, 500);
})();

// ── 다락방 노트 목록 (nz-dl): 노트목록_핸드오프.md 스펙 ────────
// 노션 표(제목·카테고리·날짜·공개)를 카드 목록으로 재조립.
// 대표 이미지는 각 글 본문의 첫 이미지를 자동 추출 (세션 캐시).
(function () {
  'use strict';

  function isDlPage() {
    return location.pathname.replace(/\/$/, '') === '/darakbang-note';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var DL_LEMON = NZ_ASSET_BASE + 'assets/lemon.png';

  // ── 노션 표 파싱 ──
  function parseNotes() {
    var table = document.querySelector('.notion-collection-table');
    if (!table) return null;
    var items = [];
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var link = tr.querySelector('a[href*="/darakbang-note/"]');
      if (!link) return;
      var href = link.getAttribute('data-link-uri') || link.getAttribute('href') || '';
      if (/^https?:/.test(href)) {
        try { href = new URL(href).pathname; } catch (e) { return; }
      }
      if (href.indexOf('/darakbang-note/') !== 0) return;
      if (/\/test$/.test(href)) return; // 테스트 글 제외
      var title = '';
      var cats = [];
      var dateText = '';
      var isPublic = false;
      var cells = tr.children;
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var pills = cell.querySelectorAll('.notion-pill');
        var text = cell.textContent.trim();
        if (cell.querySelector('a[href*="/darakbang-note/"]')) {
          title = text;
        } else if (pills.length && text.indexOf('공개') === -1) {
          pills.forEach(function (p) {
            var t = p.textContent.trim();
            if (t) cats.push(t);
          });
        } else if (text === '공개') {
          isPublic = true;
        } else if (/\d{4}/.test(text)) {
          dateText = text;
        }
      }
      if (!title || !isPublic) return;
      var parsed = new Date(dateText);
      var ts = isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      var dateFmt = ts
        ? parsed.getFullYear() + '.' + ('0' + (parsed.getMonth() + 1)).slice(-2) + '.' + ('0' + parsed.getDate()).slice(-2)
        : '';
      items.push({ title: title, cats: cats, date: dateFmt, ts: ts, href: href });
    });
    items.sort(function (a, b) { return b.ts - a.ts; }); // 최신 글 위
    return items;
  }

  // ── 본문 첫 이미지 자동 추출 (세션 캐시) ──
  function fillCover(card, href) {
    var key = 'nz_dl_img_' + href;
    var cached = null;
    try { cached = sessionStorage.getItem(key); } catch (e) {}
    if (cached === 'none') return;
    if (cached) { setCover(card, cached); return; }
    fetch(href)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var img = doc.querySelector('article .notion-image img, article img.notion-image');
        var src = img ? (img.getAttribute('src') || '') : '';
        try { sessionStorage.setItem(key, src || 'none'); } catch (e) {}
        if (src) setCover(card, src);
      })
      .catch(function () {});
  }
  function setCover(card, src) {
    var box = card.querySelector('.nz-dl-card__img');
    if (!box || box.querySelector('img:not(.nz-dl-card__ph)')) return; // 자리표시자 레몬은 무시
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    box.appendChild(img);
    box.classList.add('nz-dl-card__img--loaded');
  }

  // ── 렌더 ──
  function buildWrap(items) {
    var wrap = document.createElement('div');
    wrap.className = 'nz-dl-wrap';
    if (!items.length) {
      wrap.innerHTML = '<div class="nz-dl-empty">'
        + '<img src="' + DL_LEMON + '" alt="">'
        + '<p>첫 번째 노트를 열심히 쓰고 있어요.<br>조금만 기다려 주세요!</p>'
        + '<a class="nz-dl-empty__btn" href="/">리뷰 구경하기</a>'
        + '</div>';
      return wrap;
    }
    wrap.innerHTML = items.map(function (it) {
      return '<a class="nz-dl-card" href="' + esc(it.href) + '">'
        + '<div class="nz-dl-card__img"><img class="nz-dl-card__ph" src="' + DL_LEMON + '" alt=""></div>'
        + '<div class="nz-dl-card__body">'
        + '<div class="nz-dl-card__badges">' + it.cats.map(function (c) {
            return '<span class="nz-dl-badge">' + esc(c) + '</span>';
          }).join('') + '</div>'
        + '<div class="nz-dl-card__title">' + esc(it.title) + '</div>'
        + (it.date ? '<div class="nz-dl-card__date">' + esc(it.date) + '</div>' : '')
        + '</div></a>';
    }).join('');
    return wrap;
  }

  function render() {
    if (!isDlPage()) return;
    if (document.querySelector('.nz-dl-wrap')) return;
    var items = parseNotes();
    if (items === null) return;
    var article = document.querySelector('article.notion-root');
    if (!article) return;
    var wrap = buildWrap(items);
    article.insertBefore(wrap, article.firstChild);
    wrap.querySelectorAll('.nz-dl-card').forEach(function (card) {
      fillCover(card, card.getAttribute('href'));
    });
  }

  function tryRender(attempt) {
    attempt = attempt || 0;
    if (!isDlPage()) return;
    if (document.querySelector('.notion-collection-table tbody tr') || attempt >= 25) {
      render();
    } else if (attempt < 40) {
      setTimeout(function () { tryRender(attempt + 1); }, 200);
    }
  }

  var dlObserver = new MutationObserver(function () {
    if (isDlPage() && !document.querySelector('.nz-dl-wrap')) tryRender();
  });

  function boot() {
    tryRender();
    dlObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  var dlLastUrl = location.href;
  setInterval(function () {
    if (location.href !== dlLastUrl) {
      dlLastUrl = location.href;
      if (isDlPage()) tryRender();
    }
  }, 300);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

// ── 리뷰 예정 목록 v2 (nz-tr): 상태 그룹 재조립 + 기대돼요 ────
// 노션 표(제목·제작사·상태·사진·생성일시)를 읽어 시안 3a 레이아웃으로 재조립.
// 기대돼요는 기존 ReviewRequests 테이블(nazo_slug/session_id)을 그대로 이어받는다.
(function () {
  'use strict';

  var SUPABASE_URL = 'https://llwdqogseeddnffradej.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_8cOoT2cGQ0x7Is57k-VT5A_fqgVKr6f';
  var TABLE = 'ReviewRequests';

  function isTrPage() {
    return location.pathname.replace(/\/$/, '') === '/to-review';
  }

  // ── 세션 ID (좋아요 모듈과 공유) ──
  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function getSessionId() {
    var id = null;
    try { id = localStorage.getItem('nz_session_id'); } catch (e) {}
    if (!id) id = readCookie('nz_session_id');
    if (!id) id = 'nz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    try { localStorage.setItem('nz_session_id', id); } catch (e) {}
    try {
      document.cookie = 'nz_session_id=' + encodeURIComponent(id) +
        '; max-age=' + (60 * 60 * 24 * 400) + '; path=/; SameSite=Lax; Secure';
    } catch (e) {}
    return id;
  }

  function supaReq(method, endpoint, body) {
    var opts = {
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': method === 'GET' ? 'count=exact' : 'return=minimal'
      }
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(SUPABASE_URL + '/rest/v1/' + endpoint, opts);
  }

  // ── 상태 정의 (표시 순서 = 리뷰 임박 순, 표기 = 노션 값 그대로) ──
  var STATUS = [
    { key: '리뷰 작성 중', comment: '며칠 내 리뷰 업로드 예정이에요', shortLabel: '작성 중', fallback: '#B08900', featured: true },
    { key: '플레이 완료', comment: '플레이 완료 되어 리뷰 대기 중인 작품이에요', shortLabel: '플레이', fallback: '#A0705C' },
    { key: '보유중', comment: '나조 책장에 보관 중인 나조예요', shortLabel: '보유', fallback: '#7AA85C' },
    { key: '구입 완료', comment: '배송 중인 나조예요', shortLabel: '구매', fallback: '#5A78A0' },
    { key: '해보고 싶다', comment: '언젠가 꼭 해보고 싶은 나조예요', shortLabel: '위시', fallback: '#A79E8A' }
  ];
  // 노션 지정색 → 다락방 딥톤 (리뷰 공식 난이도 알약과 동일 체계)
  var TR_NOTION_DEEP = {
    'pill-pink': '#B0616E', 'pill-purple': '#8171A8', 'pill-blue': '#5F8CA3',
    'pill-red': '#B25E5E', 'pill-orange': '#C07A48', 'pill-yellow': '#B08900',
    'pill-green': '#6E9E52', 'pill-brown': '#96705A', 'pill-gray': '#8A8272'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── 행 슬러그 (기존 투표 데이터와 호환 유지) ──
  function getRowSlug(row) {
    var anchor = row.querySelector('a[href*="/to-review/"]');
    if (anchor) {
      var href = anchor.getAttribute('href') || '';
      var m = href.match(/\/to-review\/([^\/?#]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    var idAnchor = row.querySelector('a[id^="block-to-review-"]');
    if (idAnchor) return idAnchor.id.replace('block-to-review-', '');
    var blockAnchor = row.querySelector('a.notion-link[id^="block-"]');
    if (blockAnchor && blockAnchor.id.length > 'block-'.length) return blockAnchor.id;
    return null;
  }

  // ── 노션 표 파싱 ──
  function parseTable() {
    var table = document.querySelector('.notion-collection-table');
    if (!table) return null;
    var headCells = table.querySelectorAll('thead .notion-collection-table__head-cell');
    if (!headCells.length) return null;
    var idx = {};
    headCells.forEach(function (th, i) {
      var t = th.textContent;
      if (t.indexOf('제목') !== -1) idx.title = i;
      else if (t.indexOf('제작사') !== -1) idx.brand = i;
      else if (t.indexOf('상태') !== -1) idx.status = i;
      else if (t.indexOf('사진') !== -1) idx.photo = i;
      else if (t.indexOf('생성') !== -1) idx.created = i;
    });
    if (idx.title === undefined || idx.status === undefined) return null;

    var items = [];
    var statusColor = {};
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var cells = tr.children;
      if (!cells.length) return;
      var cell = function (i) { return i !== undefined && cells[i] ? cells[i] : null; };

      var titleCell = cell(idx.title);
      var title = titleCell ? titleCell.textContent.trim() : '';
      if (!title) return;

      var statusEl = cell(idx.status) ? cell(idx.status).querySelector('.notion-pill') : null;
      var status = statusEl ? statusEl.textContent.trim() : '';
      if (statusEl && !statusColor[status]) {
        var cm = statusEl.className.match(/pill-[a-z]+/);
        if (cm && TR_NOTION_DEEP[cm[0]]) statusColor[status] = TR_NOTION_DEEP[cm[0]];
      }

      var brandPills = cell(idx.brand) ? cell(idx.brand).querySelectorAll('.notion-pill') : [];
      var brand = brandPills.length
        ? Array.prototype.map.call(brandPills, function (p) { return p.textContent.trim(); }).filter(Boolean).join(' · ')
        : (cell(idx.brand) ? cell(idx.brand).textContent.trim() : '');

      var imgEl = cell(idx.photo) ? cell(idx.photo).querySelector('img') : null;
      var img = imgEl ? (imgEl.getAttribute('src') || '') : '';

      var createdText = cell(idx.created) ? cell(idx.created).textContent.trim() : '';
      var created = createdText ? new Date(createdText).getTime() : 0;
      if (isNaN(created)) created = 0;

      items.push({ title: title, brand: brand, status: status, img: img, created: created, slug: getRowSlug(tr) });
    });
    return { items: items, statusColor: statusColor };
  }

  // ── 렌더 ──
  var LEMON_SRC = NZ_ASSET_BASE + 'assets/lemon.png';

  function makeExpectBtnHtml(slug) {
    return '<button type="button" class="nz-tr-expect" data-slug="' + esc(slug || '') + '" aria-label="기대돼요">'
      + '<img src="' + LEMON_SRC + '" alt="">기대돼요 <span class="nz-tr-expect__count nz-tr-expect__count--loading"></span>'
      + '</button>';
  }

  function rowHtml(item) {
    var thumb = item.img
      ? '<div class="nz-tr-thumb"><img src="' + esc(item.img) + '" alt="" loading="lazy"></div>'
      : '<div class="nz-tr-thumb nz-tr-thumb--empty"><img src="' + LEMON_SRC + '" alt=""></div>';
    return '<div class="nz-tr-row">'
      + thumb
      + '<div class="nz-tr-row__body"><div class="nz-tr-row__title">' + esc(item.title) + '</div>'
      + (item.brand ? '<div class="nz-tr-row__brand">' + esc(item.brand) + '</div>' : '')
      + '</div>'
      + (item.slug ? makeExpectBtnHtml(item.slug) : '')
      + '</div>';
  }

  function buildWrap(parsed) {
    var groups = STATUS.map(function (st) {
      var arr = parsed.items.filter(function (it) { return it.status === st.key; });
      arr.sort(function (a, b) { return a.created - b.created; }); // 들어온 순서 (오래된 것부터)
      return { st: st, items: arr, color: parsed.statusColor[st.key] || st.fallback };
    });

    var wrap = document.createElement('div');
    wrap.className = 'nz-tr-wrap';

    var html = ''
      + '<p class="nz-tr-lead">다음 순서를 기다리는 나조들이에요. 궁금한 작품에 기대돼요를 눌러주시면 플레이 우선 순위가 올라갑니다.</p>'
      + '<p class="nz-tr-sortnote">모든 목록은 들어온 순서(오래된 것부터)로 정렬돼요</p>';

    // 파이프라인 칩 바 (여정 순 = 표시 역순) + 리뷰!
    var chipHtml = '';
    for (var i = groups.length - 1; i >= 0; i--) {
      var g = groups[i];
      if (!g.items.length) continue;
      chipHtml += '<button type="button" class="nz-tr-chip" data-status="' + esc(g.st.key) + '">'
        + '<span class="nz-tr-chip__dot" style="background:' + g.color + '"></span>'
        + '<span class="nz-tr-chip__label">' + esc(g.st.key) + '</span>'
        + '<span class="nz-tr-chip__n">' + g.items.length + '</span></button>'
        + '<span class="nz-tr-chip-arrow">→</span>';
    }
    chipHtml += '<span class="nz-tr-chip nz-tr-chip--goal"><img src="' + LEMON_SRC + '" alt="">리뷰!</span>';
    html += '<div class="nz-tr-chipbar"><div class="nz-tr-chipbar__inner">' + chipHtml + '</div></div>'
      + '<div class="nz-tr-rule"></div>';

    // 상태 그룹
    var any = false;
    groups.forEach(function (g) {
      if (!g.items.length) return;
      any = true;
      var total = g.items.length;
      var rowsHtml = g.items.map(rowHtml).join('');
      var moreHtml = '';
      if (total > 3) {
        var pcExtra = total - 5;
        var moExtra = total - 3;
        moreHtml = '<button type="button" class="nz-tr-more' + (pcExtra <= 0 ? ' nz-tr-more--mo-only' : '') + '">'
          + (pcExtra > 0 ? '<span class="nz-tr-more__pc">' + esc(g.st.key) + ' ' + pcExtra + '개 더 보기 ▾</span>' : '')
          + '<span class="nz-tr-more__mo">' + esc(g.st.key) + ' ' + moExtra + '개 더 보기 ▾</span>'
          + '<span class="nz-tr-more__close">접기 ▴</span>'
          + '</button>';
      }
      html += '<section class="nz-tr-group" data-status="' + esc(g.st.key) + '">'
        + '<div class="nz-tr-ghead">'
        + '<span class="nz-tr-ghead__dot" style="background:' + g.color + '"></span>'
        + '<span class="nz-tr-ghead__name">' + esc(g.st.key) + '</span>'
        + '<span class="nz-tr-ghead__n">' + total + '</span>'
        + '<span class="nz-tr-ghead__comment">' + esc(g.st.comment) + '</span>'
        + '</div>'
        + '<div class="nz-tr-card collapsed' + (g.st.featured ? ' nz-tr-card--featured' : '') + '">'
        + rowsHtml + moreHtml
        + '</div></section>';
    });

    if (!any) {
      html += '<div class="nz-tr-empty"><img src="' + LEMON_SRC + '" alt="">'
        + '<p>지금은 기다리는 나조가 없어요</p></div>';
    }

    // 최근 리뷰 박스
    html += '<div class="nz-tr-recent"><div class="nz-tr-recent__title">최근 리뷰로 올라간 나조들</div>'
      + '<div class="nz-tr-recent__chips"></div></div>';

    wrap.innerHTML = html;
    return wrap;
  }

  // ── 최근 리뷰 3건 (nazo_data) ──
  function fillRecent(wrap) {
    if (typeof loadNazoData !== 'function') return;
    loadNazoData(function () {
      var box = wrap.querySelector('.nz-tr-recent__chips');
      if (!box || box.children.length) return;
      var entries = [];
      try {
        Object.keys(SORT_DATA).forEach(function (t) {
          var d = SORT_DATA[t];
          if (d && d.num && d.url) entries.push({ title: t, num: d.num, url: d.url });
        });
      } catch (e) { return; }
      entries.sort(function (a, b) { return b.num - a.num; });
      var html = entries.slice(0, 3).map(function (e) {
        return '<a class="nz-tr-recent__chip" href="' + esc(e.url) + '">'
          + '<img src="' + LEMON_SRC + '" alt="">' + esc(e.title) + '</a>';
      }).join('');
      html += '<a class="nz-tr-recent__chip nz-tr-recent__chip--all" href="/">리뷰 전체 보기 →</a>';
      box.innerHTML = html;
    });
  }

  // ── 기대돼요 데이터 ──
  function loadExpects(wrap) {
    var btns = wrap.querySelectorAll('.nz-tr-expect[data-slug]');
    var slugs = [];
    btns.forEach(function (b) { if (b.dataset.slug) slugs.push(b.dataset.slug); });
    if (!slugs.length) return;
    var sessionId = getSessionId();
    var slugList = slugs.map(function (s) { return '"' + s + '"'; }).join(',');
    supaReq('GET', TABLE + '?nazo_slug=in.(' + encodeURIComponent(slugList) + ')&select=nazo_slug,session_id')
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        var counts = {}, mine = {};
        if (Array.isArray(rows)) {
          rows.forEach(function (r) {
            counts[r.nazo_slug] = (counts[r.nazo_slug] || 0) + 1;
            if (r.session_id === sessionId) mine[r.nazo_slug] = true;
          });
        }
        btns.forEach(function (b) {
          applyExpect(b, !!mine[b.dataset.slug], counts[b.dataset.slug] || 0);
        });
      })
      .catch(function () {
        btns.forEach(function (b) { applyExpect(b, false, 0); });
      });
  }

  function applyExpect(btn, on, count) {
    btn.classList.toggle('on', on);
    btn.dataset.count = count;
    var c = btn.querySelector('.nz-tr-expect__count');
    if (c) {
      c.classList.remove('nz-tr-expect__count--loading');
      c.textContent = count;
    }
  }

  var expectBusy = {};
  function onExpectClick(btn) {
    var slug = btn.dataset.slug;
    if (!slug || expectBusy[slug]) return;
    expectBusy[slug] = true;
    var wasOn = btn.classList.contains('on');
    var count = parseInt(btn.dataset.count || '0', 10) || 0;
    var next = wasOn ? Math.max(0, count - 1) : count + 1;
    applyExpect(btn, !wasOn, next); // 낙관적 업데이트
    if (!wasOn) {
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
    }
    var sessionId = getSessionId();
    var req = wasOn
      ? supaReq('DELETE', TABLE + '?nazo_slug=eq.' + encodeURIComponent(slug) + '&session_id=eq.' + encodeURIComponent(sessionId))
      : supaReq('POST', TABLE, { nazo_slug: slug, session_id: sessionId });
    req.then(function (res) {
      if (!res.ok && res.status !== 409) applyExpect(btn, wasOn, count); // 롤백
    }).catch(function () {
      applyExpect(btn, wasOn, count);
    }).then(function () {
      expectBusy[slug] = false;
    });
  }

  // ── 상호작용 (위임) ──
  function bindEvents(wrap) {
    wrap.addEventListener('click', function (e) {
      var expect = e.target.closest('.nz-tr-expect');
      if (expect) { onExpectClick(expect); return; }
      var more = e.target.closest('.nz-tr-more');
      if (more) {
        var card = more.closest('.nz-tr-card');
        card.classList.toggle('collapsed');
        card.classList.toggle('expanded');
        return;
      }
      var chip = e.target.closest('.nz-tr-chip[data-status]');
      if (chip) {
        var target = wrap.querySelector('.nz-tr-group[data-status="' + chip.dataset.status + '"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // 스크롤 스파이: 현재 섹션 칩 하이라이트
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (!document.body.contains(wrap)) return;
        var groups = wrap.querySelectorAll('.nz-tr-group');
        var current = null;
        groups.forEach(function (g) {
          if (g.getBoundingClientRect().top <= 120) current = g.dataset.status;
        });
        wrap.querySelectorAll('.nz-tr-chip[data-status]').forEach(function (c) {
          c.classList.toggle('active', c.dataset.status === current);
        });
      });
    }, { passive: true });
  }

  // ── 조립 ──
  function render() {
    if (!isTrPage()) return;
    if (document.querySelector('.nz-tr-wrap')) return;
    var parsed = parseTable();
    if (!parsed) return;
    var article = document.querySelector('article.notion-root');
    if (!article) return;
    var wrap = buildWrap(parsed);
    article.insertBefore(wrap, article.firstChild);
    bindEvents(wrap);
    loadExpects(wrap);
    fillRecent(wrap);
  }

  function tryRender(attempt) {
    attempt = attempt || 0;
    if (!isTrPage()) return;
    if (document.querySelector('.notion-collection-table tbody tr')) {
      render();
    } else if (attempt < 40) {
      setTimeout(function () { tryRender(attempt + 1); }, 200);
    }
  }

  // 하이드레이션이 커스텀을 갈아엎으면 재적용
  var trObserver = new MutationObserver(function () {
    if (isTrPage() && !document.querySelector('.nz-tr-wrap')) tryRender();
  });

  function boot() {
    tryRender();
    trObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // SPA 이동 대응
  var trLastUrl = location.href;
  setInterval(function () {
    if (location.href !== trLastUrl) {
      trLastUrl = location.href;
      if (isTrPage()) tryRender();
    }
  }, 300);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();


/* ============================================================
 *  what-is-nazo 페이지 전용 리디자인 (Task 2)
 *  팔레트: Cream + Ink Blue  |  아이콘: Lucide 인라인 SVG
 * ============================================================ */
(function () {
  'use strict';

  function isWhatIsNazoPage() {
    return location.pathname.indexOf('/what-is-nazo') !== -1;
  }

  // ── 커버 (플레인 노션 레이아웃 깜빡임 가림용) ──
  function _createCover() {
    if (document.getElementById('nz-wn-cover')) return;
    if (!document.body) return;
    var cover = document.createElement('div');
    cover.id = 'nz-wn-cover';
    cover.innerHTML =
      '<div class="nz-wn-cover__inner">' +
        '<div class="nz-wn-cover__lemon"><img src="https://assets.super.so/b529abf1-8288-44d9-87eb-38228677c041/images/bcc6ec8e-275b-4bfc-b598-b2108922863e/noname.png" alt=""/></div>' +
        '<div class="nz-wn-cover__spinner"></div>' +
      '</div>';
    document.body.appendChild(cover);
  }
  function showCover() {
    if (!isWhatIsNazoPage()) return;
    if (document.body) _createCover();
    else document.addEventListener('DOMContentLoaded', _createCover);
  }
  function hideCover() {
    var cover = document.getElementById('nz-wn-cover');
    if (!cover) return;
    cover.classList.add('nz-wn-cover--fade');
    setTimeout(function () {
      if (cover.parentNode) cover.parentNode.removeChild(cover);
    }, 420);
  }

  // ── Lucide 인라인 SVG (필요한 8개만) ──
  var LUCIDE = {
    'message-circle-question': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    'git-compare-arrows': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/><path d="m15 9-3-3 3-3"/><circle cx="19" cy="18" r="3"/><path d="M12 18H7a2 2 0 0 1-2-2V9"/><path d="m9 15 3 3-3 3"/></svg>',
    'square-scissors': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m19.5 8.5-8 8"/><circle cx="8" cy="16" r="2"/><path d="m8.5 9.5 7 7"/></svg>',
    'crown': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>',
    'recycle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg>',
    'book-open-check': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V7"/><path d="m16 12 2 2 4-4"/><path d="M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3"/></svg>',
    'package-plus': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16h6"/><path d="M19 13v6"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="M16.5 9.4 7.55 4.24"/><path d="M3.29 7 12 12l8.71-5"/><path d="M12 22V12"/></svg>',
    'list-checks': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>',
    'link': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    'tablet': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
  };

  // 이모지 → 타입/아이콘 매핑 (variation selector FE0F 처리)
  var EMOJI_MAP = [
    { emoji: '💬',  type: 'info1', icon: null },
    { emoji: '🔀',  type: 'info2', icon: null },
    { emoji: '✂️', type: 'term1', icon: 'lemon' },
    { emoji: '✂',  type: 'term1', icon: 'lemon' },
    { emoji: '👑',  type: 'term2', icon: 'lemon' },
    { emoji: '♻️', type: 'term3', icon: 'lemon' },
    { emoji: '♻',  type: 'term3', icon: 'lemon' },
    { emoji: '🗺️', type: 'guide', icon: null },
    { emoji: '🗺',  type: 'guide', icon: null },
    { emoji: '📊',  type: 'sub',   icon: null },
    { emoji: '🏷️', type: 'tags',  icon: null },
    { emoji: '🏷',  type: 'tags',  icon: null }
  ];

  function matchEmoji(text) {
    if (!text) return null;
    for (var i = 0; i < EMOJI_MAP.length; i++) {
      if (text.indexOf(EMOJI_MAP[i].emoji) !== -1) return EMOJI_MAP[i];
    }
    return null;
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // "제목 : 설명" 또는 "제목: 설명" 형식의 p를 b.title + span.desc로 변환
  function splitTitleDesc(p) {
    var bold = p.querySelector('strong, b');
    if (!bold) return null;
    var title = bold.textContent.trim();
    if (!title) return null;
    var fullText = p.textContent;
    var idx = fullText.indexOf(title);
    if (idx === -1) return null;
    var rest = fullText.slice(idx + title.length);
    var desc = rest.replace(/^\s*[::]\s*/, '').trim();
    return { title: title, desc: desc };
  }

  // ── 🏷️ "추가 정보" 콜아웃 파서 ──
  function tagsLucide(name) {
    if (!LUCIDE[name]) return '';
    return LUCIDE[name].replace(/^<svg /, '<svg class="ico" ');
  }
  function replaceContentEmojis(html) {
    // 시안 2a: 태그 박스 안 이모지는 표기하지 않음
    return html
      .replace(/📲\uFE0F?\s*/g, '')
      .replace(/📱\uFE0F?\s*/g, '')
      .replace(/♻\uFE0F?\s*/g, '');
  }
  function tagChipClass(label) {
    if (label.indexOf('LINE') !== -1) return 'nz-wn-tag--line';
    if (label.indexOf('WEB') !== -1) return 'nz-wn-tag--web';
    if (label.indexOf('패드') !== -1) return 'nz-wn-tag--pad';
    if (label.indexOf('재활용') !== -1) return 'nz-wn-tag--recycle';
    return '';
  }
  function replaceContentCodes(html) {
    // 노션 인라인 코드 <code>X</code> → 파스텔 태그 칩 (시안 2a 색)
    return html.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, function (_, label) {
      return '<span class="nz-wn-tag ' + tagChipClass(label) + '">' + label + '</span>';
    });
  }
  function isTagsHeader(p) {
    var text = p.textContent || '';
    var hasEmoji = /📲|📱|♻/.test(text);
    var hasStrong = !!p.querySelector('strong, b');
    return hasEmoji && hasStrong;
  }
  function decorateTagsCallout(callout) {
    var content = callout.querySelector('.notion-callout__content');
    if (!content) return;
    var ps = Array.prototype.slice.call(content.querySelectorAll('p.notion-text'));
    if (ps.length === 0) return;

    // 이모지+볼드 헤더 기준으로 그룹핑: 헤더 → 이어지는 본문들
    var groups = [];
    var current = null;
    ps.forEach(function (p) {
      if (isTagsHeader(p)) {
        if (current) groups.push(current);
        current = { header: p, bodies: [] };
      } else if (current) {
        current.bodies.push(p);
      }
    });
    if (current) groups.push(current);
    if (groups.length === 0) return;

    // DOM 재조립
    var anchor = groups[0].header;
    groups.forEach(function (g) {
      var item = document.createElement('div');
      item.className = 'nz-wn-info-item';

      var head = document.createElement('div');
      head.className = 'nz-wn-info-item__head';
      head.innerHTML = replaceContentEmojis(g.header.innerHTML);
      item.appendChild(head);

      g.bodies.forEach(function (b) {
        var body = document.createElement('div');
        body.className = 'nz-wn-info-item__body';
        body.innerHTML = replaceContentCodes(b.innerHTML);
        item.appendChild(body);
      });

      anchor.parentNode.insertBefore(item, anchor);
    });
    // 원본 p 제거
    groups.forEach(function (g) {
      g.header.remove();
      g.bodies.forEach(function (b) { b.remove(); });
    });
  }

  function decorateCallout(callout) {
    if (callout.dataset.nzWnDone) return;
    var iconBox = callout.querySelector('.notion-callout__icon');
    if (!iconBox) return;
    var iconText = iconBox.textContent.trim();
    var m = matchEmoji(iconText);
    if (!m) return;

    callout.classList.add('nz-wn-callout', 'nz-wn-' + m.type);
    callout.dataset.nzWnDone = '1';

    // 노션 이모지 아이콘 교체: 매력 불릿 = 레몬 이미지 (시안 2a)
    if (m.icon === 'lemon') {
      iconBox.textContent = '';
      iconBox.innerHTML = '<img class="nz-wn-bullet-lemon" src="' + NZ_ASSET_BASE + 'assets/lemon.png" alt="">';
    } else if (m.icon && LUCIDE[m.icon]) {
      iconBox.textContent = '';
      iconBox.innerHTML = LUCIDE[m.icon];
    }

    // 용어 카드 본문 파싱
    if (m.type.indexOf('term') === 0) {
      var content = callout.querySelector('.notion-callout__content');
      if (content) {
        var p = content.querySelector('p.notion-text');
        if (p) {
          var parsed = splitTitleDesc(p);
          if (parsed) {
            p.classList.add('nz-wn-term__row');
            p.innerHTML =
              '<b class="nz-wn-term__title">' + escHtml(parsed.title) + '</b>' +
              '<span class="nz-wn-term__desc">' + escHtml(parsed.desc) + '</span>';
          }
        }
      }
    }

    // sub-callout metric 파싱
    if (m.type === 'sub') {
      var subContent = callout.querySelector('.notion-callout__content');
      if (subContent) {
        var ps = subContent.querySelectorAll('p.notion-text');
        ps.forEach(function (p) {
          var hasMotif = p.textContent.indexOf('달의 나조') !== -1;
          var parsed = splitTitleDesc(p);
          if (parsed) {
            // '대체로 달의 나조가...' 꼬리 문장은 알약 줄로 대체하므로 설명에서 제거 (시안 2a)
            var desc = hasMotif ? parsed.desc.replace(/대체로[\s\S]*$/, '').trim() : parsed.desc;
            p.classList.add('nz-wn-metric');
            p.innerHTML =
              '<b>' + escHtml(parsed.title) + '</b>' +
              '<span>' + escHtml(desc) + '</span>';
          }
          if (hasMotif && !subContent.querySelector('.nz-wn-motif-row')) {
            var row = document.createElement('p');
            row.className = 'notion-text nz-wn-motif-row';
            row.innerHTML =
              '<span class="nz-wn-motif"><span class="nz-wn-opill" style="background:#8171A8">月の謎</span><span class="nz-wn-motif__cap">고난이도 퍼즐</span></span>' +
              '<span class="nz-wn-motif"><span class="nz-wn-opill" style="background:#B0616E">花の謎</span><span class="nz-wn-motif__cap">기믹 위주</span></span>' +
              '<span class="nz-wn-motif"><span class="nz-wn-opill" style="background:#5F8CA3">雪の謎</span><span class="nz-wn-motif__cap">스토리 나조</span></span>';
            p.parentNode.insertBefore(row, p.nextSibling);
          }
        });
      }
    }

    // 🏷️ 추가 정보 콜아웃 파싱
    if (m.type === 'tags') {
      decorateTagsCallout(callout);
    }
  }

  function markSubtitle(article) {
    var children = article.children;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.tagName === 'P' && (el.innerText || '').trim()) {
        el.classList.add('nz-wn-subtitle');
        return;
      }
    }
  }

  function injectEnding(article) {
    if (article.querySelector('.nz-wn-ending')) return;

    var ending = document.createElement('div');
    ending.className = 'nz-wn-ending';

    // '어떤 작품부터'가 나오는 문단부터 문서 끝까지를 맺음 박스로 이동 (시안 2a)
    // (해당 문단은 '둘러보는 법' 콜아웃 안에 있으므로 article 전체를 문서 순서로 검색)
    var allPs = Array.prototype.slice.call(article.querySelectorAll('p.notion-text'));
    var startIdx = -1;
    for (var i = 0; i < allPs.length; i++) {
      if (allPs[i].textContent.indexOf('어떤 작품부터') !== -1) { startIdx = i; break; }
    }
    if (startIdx !== -1) {
      for (var j = startIdx; j < allPs.length; j++) {
        if (!(allPs[j].innerText || '').trim()) continue;
        if (allPs[j].closest('.nz-wn-ending')) continue;
        var lead = document.createElement('p');
        lead.className = 'nz-wn-ending__lead';
        lead.innerHTML = allPs[j].innerHTML;
        ending.appendChild(lead);
        allPs[j].remove();
      }
    } else {
      var fallback = document.createElement('p');
      fallback.className = 'nz-wn-ending__lead';
      fallback.textContent = '그럼 즐거운 나조토키 여행 되시길 바랍니다!';
      ending.appendChild(fallback);
    }

    var cta = document.createElement('a');
    cta.className = 'nz-wn-go';
    cta.href = '/';
    cta.textContent = '리뷰 구경하러 가기 →';
    ending.appendChild(cta);
    article.appendChild(ending);
  }

  function decorateAll() {
    if (!isWhatIsNazoPage()) return;
    var article = document.querySelector('article.notion-root');
    if (!article) return;

    // 노션 빈 문단은 공백만 차지하므로 숨김 표시
    article.querySelectorAll('p.notion-text').forEach(function (el) {
      if (!el.textContent.trim() && !el.querySelector('img')) el.classList.add('nz-wn-blank');
    });

    markSubtitle(article);

    var callouts = article.querySelectorAll('.notion-callout');
    for (var i = 0; i < callouts.length; i++) {
      decorateCallout(callouts[i]);
    }

    injectEnding(article);

    // 장식 완료 → 다음 프레임에 커버 페이드아웃 (페인트 이후 제거)
    requestAnimationFrame(function () { hideCover(); });
  }

  function tryDecorate(attempt) {
    attempt = attempt || 0;
    if (!isWhatIsNazoPage()) return;
    if (document.querySelector('article.notion-root .notion-callout')) {
      decorateAll();
    } else if (attempt < 30) {
      setTimeout(function () { tryDecorate(attempt + 1); }, 200);
    }
  }

  // React hydration 완료 후 실행 (Super.so/Next.js 환경)
  function start(delay) {
    if (!isWhatIsNazoPage()) return;
    showCover();
    setTimeout(function () { tryDecorate(); }, delay || 1200);
  }

  // 우리가 장식한 DOM을 React가 리렌더링으로 덮어쓰는 경우 대비해 재적용
  var wnReapplyObserver = null;
  function startReapplyGuard() {
    if (wnReapplyObserver) return;
    var article = document.querySelector('article.notion-root');
    if (!article) return;
    wnReapplyObserver = new MutationObserver(function () {
      if (!isWhatIsNazoPage()) return;
      // 장식 안 된 콜아웃이 다시 생기거나 ending이 사라지면 재실행
      var pending = article.querySelectorAll('.notion-callout:not(.nz-wn-callout)');
      var endingGone = !article.querySelector('.nz-wn-ending');
      if (pending.length > 0 || endingGone) {
        // 콜아웃들에 nzWnDone 플래그 리셋
        Array.prototype.forEach.call(article.querySelectorAll('.notion-callout'), function (c) {
          if (!c.classList.contains('nz-wn-callout')) delete c.dataset.nzWnDone;
        });
        tryDecorate();
      }
    });
    wnReapplyObserver.observe(article, { childList: true, subtree: false });
  }

  // SPA 내비게이션 대응 (History API 훅 방식; MutationObserver보다 가벼움)
  var wnLastUrl = location.href;
  function wnOnRouteChange() {
    if (location.href === wnLastUrl) return;
    wnLastUrl = location.href;
    if (wnReapplyObserver) { wnReapplyObserver.disconnect(); wnReapplyObserver = null; }
    if (isWhatIsNazoPage()) start(600);
  }
  ['pushState', 'replaceState'].forEach(function (m) {
    var orig = history[m];
    history[m] = function () {
      var rv = orig.apply(this, arguments);
      setTimeout(wnOnRouteChange, 0);
      return rv;
    };
  });
  window.addEventListener('popstate', wnOnRouteChange);

  // 최초 진입: 가능한 한 빨리 커버 띄우고, hydration 대기 후 장식
  showCover();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { start(1200); });
  } else {
    start(1200);
  }
  // decorateAll 종료 후 재적용 감시 켜기
  var _origDecorate = decorateAll;
  decorateAll = function () {
    _origDecorate();
    startReapplyGuard();
  };
})();


/* ============================================================
 *  다락방 노트 상세 (5단계)
 *  스펙: 핸드오프 §6 + 리스트형(N선) 변형 — 입문작 5선.dc.html
 *  스킨 규칙: 카테고리에 '나조 추천' 포함 → 리스트형(.nz-dn-list)
 * ============================================================ */
(function () {
  'use strict';

  var PROP_DATE = 'property-4b763f5c';
  var PROP_CATEGORY = 'property-59627443';

  function isNotePage() {
    return /^\/darakbang-note\/.+/.test(location.pathname);
  }

  // 속성 셀에서 개별 값들(멀티 셀렉트 알약) 추출
  function leafTexts(root) {
    if (!root) return [];
    var out = [];
    root.querySelectorAll('*').forEach(function (el) {
      if (!el.children.length) {
        var txt = el.textContent.trim();
        if (txt) out.push(txt);
      }
    });
    if (!out.length && root.textContent.trim()) out.push(root.textContent.trim());
    // 중복 제거 (라벨 '카테고리' 텍스트 등 소음 제거는 값 사용처에서)
    return out.filter(function (v, i) { return out.indexOf(v) === i; });
  }

  function readNoteProps() {
    var catCell = document.querySelector('.notion-page__properties .' + PROP_CATEGORY);
    var dateCell = document.querySelector('.notion-page__properties .' + PROP_DATE);
    var cats = leafTexts(catCell).filter(function (v) { return v !== '카테고리'; });
    var dateText = '';
    if (dateCell) {
      var parsed = new Date(dateCell.textContent.trim().replace(/^[^A-Z가-힣0-9]*/, ''));
      // 셀 텍스트에 라벨이 섞여도 날짜 부분만 파싱 시도
      if (isNaN(parsed.getTime())) {
        var m = dateCell.textContent.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/);
        if (m) parsed = new Date(m[0]);
      }
      if (!isNaN(parsed.getTime())) {
        dateText = parsed.getFullYear() + '.' + ('0' + (parsed.getMonth() + 1)).slice(-2);
      }
    }
    return { categories: cats, date: dateText };
  }

  function isRecommendNote(cats) {
    return cats.some(function (c) { return c.indexOf('나조 추천') !== -1; });
  }

  // ── 머리글: 뱃지 + 날짜 (제목 위에 삽입) ──
  function buildHead(props) {
    if (document.querySelector('.nz-dn-head')) return;
    var headerContent = document.querySelector('.notion-header__content');
    if (!headerContent) return;
    var row = document.createElement('div');
    row.className = 'nz-dn-head';
    props.categories.slice(0, 2).forEach(function (c) {
      var b = document.createElement('span');
      b.className = 'nz-dn-badge';
      b.textContent = c;
      row.appendChild(b);
    });
    if (props.date) {
      var d = document.createElement('span');
      d.className = 'nz-dn-date';
      d.textContent = props.date;
      row.appendChild(d);
    }
    // 우측 끝: [레몬 + 노트 목록으로] 알약 버튼 (노트목록버튼_핸드오프)
    var listBtn = document.createElement('a');
    listBtn.className = 'nz-dn-listbtn';
    listBtn.href = '/darakbang-note';
    listBtn.innerHTML = '<img src="' + NZ_ASSET_BASE + 'assets/lemon.png" alt="">노트 목록으로';
    row.appendChild(listBtn);
    headerContent.insertBefore(row, headerContent.firstChild);
  }

  // ── 본문 장식 ──
  function decorateArticle(article, listSkin) {
    if (listSkin) article.classList.add('nz-dn-list');
    article.classList.add('nz-dn-article');

    // 빈 문단 숨김
    article.querySelectorAll('p.notion-text').forEach(function (el) {
      if (!el.textContent.trim() && !el.querySelector('img')) el.classList.add('nz-dn-blank');
    });

    // 리드문: 첫 콜아웃 전의 첫 실문단 → 오뮤 리드 + 실선. 그 주변 구분선은 숨김
    var lead = null;
    var kids = Array.prototype.slice.call(article.children);
    var firstCalloutIdx = kids.findIndex(function (el) { return el.classList.contains('notion-callout'); });
    for (var i = 0; i < kids.length; i++) {
      if (firstCalloutIdx !== -1 && i >= firstCalloutIdx) break;
      var el = kids[i];
      if (!lead && el.tagName === 'P' && el.textContent.trim()) {
        lead = el;
        el.classList.add('nz-dn-lead');
      }
      if (el.classList.contains('notion-divider') && !lead) el.classList.add('nz-dn-hide');
      if (el.classList.contains('notion-divider') && lead) {
        el.classList.add('nz-dn-hide'); // 리드 아래 구분선도 숨김 (실선은 리드의 border로)
        break;
      }
    }

    // 콜아웃 분류 (색 기반 규칙 + 제목 유무 보조):
    //   노랑 = 맺음 박스 · 제목 있는 콜아웃 = 작품 카드 · 그 외 = 번외 항목
    //   (하위 호환: 제목 없는 갈색도 맺음으로 취급)
    article.querySelectorAll(':scope > .notion-callout').forEach(function (callout) {
      var content = callout.querySelector('.notion-callout__content');
      if (!content) return;
      var heading = content.querySelector('h2, h3');
      var isYellow = /bg-yellow/.test(callout.className);
      var isBrown = /bg-brown/.test(callout.className);
      var isGray = /bg-gray/.test(callout.className);
      // 색 우선 규칙: 노랑=맺음 · 갈색=작품 카드 · 회색=번외 (제목 유무는 색 없을 때만 참고)
      if (isYellow) {
        callout.classList.add('nz-dn-close');
      } else if (isGray) {
        callout.classList.add('nz-dn-extra');
        decorateExtra(callout, content);
      } else if (isBrown && heading) {
        callout.classList.add('nz-dn-card');
        decorateCard(callout, content, heading);
      } else if (isBrown) {
        callout.classList.add('nz-dn-close'); // 갈색인데 제목 없음 = 구버전 맺음 호환
      } else if (heading) {
        callout.classList.add('nz-dn-card');
        decorateCard(callout, content, heading);
      } else {
        callout.classList.add('nz-dn-extra');
        decorateExtra(callout, content);
      }
    });

    // 인용 = 번외 항목 (CSS 처리) / 이후 구분선은 얇은 룰 (CSS 기본)
  }

  function decorateCard(callout, content, heading) {
    // 제목 "작품명 - 부제" → 부제를 흐린 서브 스팬으로
    // (innerHTML 기준 분리 — 노션에서 지정한 글자색 스팬을 보존해야 함)
    if (!heading.querySelector('.nz-dn-card__sub')) {
      var html = heading.innerHTML;
      var sep = html.match(/\s[-—–]\s(?![^<]*>)/); // 태그 내부가 아닌 구분자만
      if (sep) {
        heading.innerHTML = html.slice(0, sep.index) +
          ' <span class="nz-dn-card__sub">— ' + html.slice(sep.index + sep[0].length) + '</span>';
      }
    }

    var ps = Array.prototype.slice.call(content.querySelectorAll('p.notion-text'))
      .filter(function (p) { return p.textContent.trim(); });

    // 메타 줄: 제목 다음 첫 문단
    if (ps[0] && !ps[0].classList.contains('nz-dn-card__meta')) {
      ps[0].classList.add('nz-dn-card__meta');
    }

    // 링크 줄: '리뷰 전문 보기' 문단
    ps.forEach(function (p) {
      if (p.textContent.indexOf('리뷰 전문 보기') !== -1) p.classList.add('nz-dn-card__go');
    });

    // 사진: 본문 첫 문단 앞으로 이동해 우측 플로트
    var img = content.querySelector('.notion-image');
    if (img && !img.classList.contains('nz-dn-card__img')) {
      img.classList.add('nz-dn-card__img');
      var bodyStart = ps[1] || null; // 메타 다음 문단
      if (bodyStart) content.insertBefore(img, bodyStart);
    }
  }

  // 번외 항목: 썸네일 왼쪽 플로트 + 제작사·링크 줄을 제목 우측에 인라인 (시안)
  function decorateExtra(callout, content) {
    var img = content.querySelector('.notion-image');
    if (img && !img.classList.contains('nz-dn-extra__img')) {
      img.classList.add('nz-dn-extra__img');
      content.insertBefore(img, content.firstChild);
    }
    var heading = content.querySelector('h2, h3');
    if (heading && !heading.querySelector('.nz-dn-extra__meta')) {
      var ps = content.querySelectorAll('p.notion-text');
      for (var i = 0; i < ps.length; i++) {
        if (ps[i].textContent.indexOf('리뷰 전문 보기') !== -1) {
          var meta = document.createElement('span');
          meta.className = 'nz-dn-extra__meta';
          meta.innerHTML = ps[i].innerHTML;
          heading.appendChild(meta);
          ps[i].remove();
          break;
        }
      }
    }
  }

  // ── 돌아가기 링크 (노트 목록 + 메인) ──
  function injectBack(article) {
    if (article.querySelector('.nz-dn-back-wrap')) return;
    var old = article.querySelector('.nz-dn-back');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.className = 'nz-dn-back-wrap';
    wrap.innerHTML =
      '<a class="nz-dn-back" href="/darakbang-note">← 다락방 노트 목록으로</a>' +
      '<a class="nz-dn-back nz-dn-back--sub" href="/">← 메인으로 돌아가기</a>';
    article.appendChild(wrap);
  }

  function ensureOrder(article) {
    // 시안 순서: 맺음 → 잘 읽었어요 → 돌아가기 (좋아요 버튼이 늦게 붙어도 유지)
    var back = article.querySelector('.nz-dn-back-wrap');
    var like = article.querySelector('.nz-like-wrap');
    if (back && like && (back.compareDocumentPosition(like) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      article.appendChild(back);
    }
  }

  function renderAll() {
    if (!isNotePage()) return;
    var article = document.querySelector('article.notion-root');
    if (!article) return;
    var props = readNoteProps();
    buildHead(props);
    decorateArticle(article, isRecommendNote(props.categories));
    injectBack(article);
    ensureOrder(article);
    // 좋아요 버튼은 1~5초 지연 부착이라 뒤늦게라도 순서 보정
    [1500, 3500, 5500].forEach(function (ms) {
      setTimeout(function () {
        var a = document.querySelector('article.notion-root');
        if (a) ensureOrder(a);
      }, ms);
    });
  }

  function isDecorated() {
    return !!document.querySelector('.nz-dn-head') &&
           !!document.querySelector('.nz-dn-article');
  }

  function tryRender(attempt) {
    attempt = attempt || 0;
    if (!isNotePage()) return;
    if (document.querySelector('article.notion-root') && document.querySelector('.notion-header__content')) {
      renderAll();
    } else if (attempt < 40) {
      setTimeout(function () { tryRender(attempt + 1); }, 200);
    }
  }

  // 하이드레이션이 장식을 갈아엎으면 재적용
  var dnObserver = new MutationObserver(function () {
    if (isNotePage() && !isDecorated()) tryRender();
  });

  function boot() {
    tryRender();
    dnObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // SPA 이동 대응
  var dnLastUrl = location.href;
  setInterval(function () {
    if (location.href !== dnLastUrl) {
      dnLastUrl = location.href;
      if (isNotePage()) tryRender();
    }
  }, 300);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

// ── 전역 크롬 v2: 네비 레몬 홈버튼 + 모바일 ☰ 드롭다운 + 푸터 문구 ──
(function () {
  var LEMON_URL = 'https://assets.super.so/b529abf1-8288-44d9-87eb-38228677c041/images/bcc6ec8e-275b-4bfc-b598-b2108922863e/noname.png';
  var NAV_LINKS = [
    { label: '나조토키란?', href: '/what-is-nazo' },
    { label: '리뷰 예정 목록', href: '/to-review' },
    { label: '나조 구매 정보', href: '/how-to-buy-nazotokis' },
    { label: '레몬빵?', href: '/lemonbread' }
  ];

  // 네비 로고 → 레몬 아이콘 (hydration으로 노드가 갈려도 재적용)
  function swapLogo() {
    var img = document.querySelector('.super-navbar__logo-image img');
    if (!img || img.dataset.nzLemon === '1') return;
    img.dataset.nzLemon = '1';
    img.removeAttribute('srcset');
    img.src = LEMON_URL;
    img.alt = '홈으로';
    img.title = '홈으로';
  }

  // 모바일 ☰ 버튼 + 드롭다운
  var menuOpen = false;

  function closeMenu() {
    menuOpen = false;
    var dd = document.querySelector('.nz-mobile-dropdown');
    if (dd) dd.parentNode.removeChild(dd);
    var bd = document.querySelector('.nz-mobile-menu-backdrop');
    if (bd) bd.parentNode.removeChild(bd);
    var btn = document.querySelector('.nz-mobile-menu-btn');
    if (btn) btn.textContent = '☰';
  }

  function openMenu() {
    var nav = document.querySelector('.super-navbar');
    if (!nav) return;
    menuOpen = true;

    var backdrop = document.createElement('div');
    backdrop.className = 'nz-mobile-menu-backdrop';
    backdrop.addEventListener('click', closeMenu);
    document.body.appendChild(backdrop);

    var dd = document.createElement('div');
    dd.className = 'nz-mobile-dropdown';
    NAV_LINKS.forEach(function (link) {
      var a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label;
      dd.appendChild(a);
    });
    // 네비바 스태킹 컨텍스트(z-index 40) 밖으로 — 백드롭(150)에 덮이지 않도록 body 직속 + fixed
    dd.style.top = (nav.getBoundingClientRect().bottom + 6) + 'px';
    document.body.appendChild(dd);

    var btn = document.querySelector('.nz-mobile-menu-btn');
    if (btn) btn.textContent = '✕';
  }

  function ensureMobileMenuBtn() {
    var navContent = document.querySelector('.super-navbar__content');
    if (!navContent || navContent.querySelector('.nz-mobile-menu-btn')) return;
    var btn = document.createElement('div');
    btn.className = 'nz-mobile-menu-btn';
    btn.textContent = '☰';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', '메뉴');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuOpen) closeMenu(); else openMenu();
    });
    navContent.appendChild(btn);
  }

  // 푸터: 전 페이지 SNS 푸터 — 단, 메인 데스크톱은 CSS로 SNS 줄을 숨겨 저작권 한 줄만 (SNS팔로우_핸드오프)
  var SNSF_IG = '<svg class="nz-snsf__ig" viewBox="0 0 24 24" fill="none" stroke="#5C554A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="0.5" fill="#5C554A"></circle></svg>';
  var SNSF_X = '<svg class="nz-snsf__x" viewBox="0 0 24 24" fill="#5C554A"><path d="M18.9 1.2h3.7l-8.1 9.3L24 23.2h-7.5l-5.9-7.7-6.7 7.7H.2l8.7-9.9L-.2 1.2h7.7l5.3 7 6.1-7z"></path></svg>';
  function fixFooter() {
    var fn = document.querySelector('.super-footer__footnote');
    if (!fn) return;
    var isHome = location.pathname === '/' || location.pathname === '';
    var mode = isHome ? 'home' : 'sns';
    if (fn.dataset.nzDone === mode) return;
    fn.dataset.nzDone = mode;
    fn.innerHTML =
      '<div class="nz-snsf' + (isHome ? ' nz-snsf--home' : '') + '">'
      + '<div class="nz-snsf__row">'
      +   '<span class="nz-snsf__msg">새 다락방 소식은 여기에 먼저 올라와요</span>'
      +   '<span class="nz-snsf__icons">'
      +     '<a class="nz-snsf__btn" href="https://instagram.com/seohyun_pika" target="_blank" rel="noopener" title="Instagram" aria-label="Instagram">' + SNSF_IG + '</a>'
      +     '<a class="nz-snsf__btn" href="https://x.com/Monbbread" target="_blank" rel="noopener" title="X" aria-label="X">' + SNSF_X + '</a>'
      +   '</span>'
      + '</div>'
      + '<div class="nz-snsf__copy">저의 작은 기록들이 도움이 되길 바라며 · © 2026 Monbbang</div>'
      + '</div>';
  }

  function ensureHomeClass() {
    // React 하이드레이션이 body class를 리셋하므로 계속 재적용 (페이지별 마커)
    if (window.__nzReadyOnce && !document.body.classList.contains('nz-ready')) {
      document.body.classList.add('nz-ready');
    }
    var path = window.location.pathname;
    document.body.classList.toggle('nz-home', path === '/' || path === '');
    document.body.classList.toggle('nz-review', path.indexOf('/nazotoki-reviews/') === 0);
    document.body.classList.toggle('nz-about', path.indexOf('/lemonbread') === 0);
    document.body.classList.toggle('nz-guide', path.indexOf('/what-is-nazo') === 0);
  }

  // 홈으로 가는 내부 링크는 항상 전체 로드 (SPA 복원 시 갤러리 커스텀이 누락되는 문제 방지)
  var homeNavInstalled = false;
  function installHomeNav() {
    if (homeNavInstalled) return;
    homeNavInstalled = true;
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      if (link.href === window.location.origin + '/' || link.href === window.location.origin) {
        e.preventDefault();
        e.stopPropagation();
        if (window.location.pathname === '/' || window.location.pathname === '') {
          window.location.reload();
        } else {
          window.location.assign('/');
        }
      }
    }, true);
    // 뒤로가기로 홈에 SPA 복원됐는데 커스텀 UI가 없으면 새로고침
    window.addEventListener('popstate', function () {
      setTimeout(function () {
        if ((window.location.pathname === '/' || window.location.pathname === '')
            && !document.getElementById('nz2-controls')) {
          window.location.reload();
        }
      }, 400);
    });
  }

  function runAll() {
    ensureHomeClass();
    installHomeNav();
    swapLogo();
    ensureMobileMenuBtn();
    fixFooter();
  }

  // body 클래스 감시: React가 className을 초기화하면 페인트 전에 즉시 되붙인다
  // (나조토키란?/레몬빵? 페이지는 디자인 전체가 body 클래스에 걸려 있어 이 공백이 원본 노출로 보임)
  var watchedBody = null;
  function watchBodyClass() {
    if (!document.body || document.body === watchedBody) return;
    watchedBody = document.body;
    new MutationObserver(function () { ensureHomeClass(); })
      .observe(watchedBody, { attributes: true, attributeFilter: ['class'] });
  }

  // 초기 실행 + hydration/SPA 대응 재적용
  runAll();
  watchBodyClass();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { runAll(); watchBodyClass(); });
  }
  setTimeout(runAll, 800);
  setTimeout(runAll, 2000);
  setTimeout(runAll, 4500);
  var chromeObserver = new MutationObserver(function () {
    runAll();
    watchBodyClass(); // body 요소 자체가 교체됐을 수도 있으니 감시 재설치
  });
  chromeObserver.observe(document.documentElement, { childList: true, subtree: true });

  // 페이지 이동 시 열린 메뉴 정리
  window.addEventListener('popstate', closeMenu);
})();


// ── 레몬빵? 페이지: 시안 마스킹테이프 소개 카드 ──
(function () {
  'use strict';

  function isAboutPage() {
    return window.location.pathname.indexOf('/lemonbread') === 0;
  }

  function run() {
    if (!isAboutPage()) return;
    if (document.querySelector('.nz-about-card')) return;
    var root = document.querySelector('.notion-root');
    if (!root) return;

    var blocks = Array.from(root.children).filter(function (el) {
      return !el.classList.contains('nz-about-card')
        && !el.classList.contains('notion-header')
        && el.tagName !== 'SCRIPT';
    });
    if (!blocks.length) return;

    var card = document.createElement('div');
    card.className = 'nz-about-card';
    root.appendChild(card);
    blocks.forEach(function (el) { card.appendChild(el); });
  }

  // 하이드레이션이 카드를 해체하면 재적용 (결과물 존재 기준)
  var aboutDebounce = null;
  var aboutObserver = new MutationObserver(function () {
    if (!isAboutPage()) return;
    if (aboutDebounce) return;
    aboutDebounce = setTimeout(function () {
      aboutDebounce = null;
      var card = document.querySelector('.nz-about-card');
      var root = document.querySelector('.notion-root');
      if (!root) return;
      var strayText = Array.from(root.children).some(function (el) {
        return el.classList.contains('notion-text') || el.classList.contains('notion-bulleted-list');
      });
      if (!card || strayText) {
        if (card && strayText) card.parentNode.removeChild(card);
        run();
      }
    }, 250);
  });
  aboutObserver.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  setTimeout(run, 1200);
  setTimeout(run, 3500);
})();
