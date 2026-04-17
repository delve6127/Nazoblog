// ── 메인 히어로 카피 (문구 수정은 여기서) ──
var NZ_HERO_COPY = {
  main: '일본 나조토키(謎解き)를 한국인 플레이어 관점에서 풀고 기록합니다.',
  cta_before: '나조토키가 처음이라면',
  cta_link: '나조토키란?',
  cta_url: '/what-is-nazo'
};

// ── 외부 JSON에서 데이터 로드 (전역) ──
var NAZO_DATA_URL = 'https://delve6127.github.io/Nazoblog/nazo_data.json';
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

// ── 로딩 스크린 ──
function showLoader() {
  if (document.getElementById('nz-loader')) return;
  document.body.classList.add('nz-loading');
  var loader = document.createElement('div');
  loader.id = 'nz-loader';
  loader.innerHTML = '<div id="nz-loader-lemon"><img src="https://assets.super.so/b529abf1-8288-44d9-87eb-38228677c041/images/bcc6ec8e-275b-4bfc-b598-b2108922863e/noname.png" alt="lemon" /></div><div id="nz-loader-spinner"></div>';
  document.body.appendChild(loader);
}

function hideLoader() {
  var loader = document.getElementById('nz-loader');
  if (!loader) return;
  document.body.classList.remove('nz-loading');
  loader.classList.add('nz-loader-hide');
  setTimeout(function() {
    if (loader.parentNode) loader.parentNode.removeChild(loader);
  }, 500);
}

function waitAndHideLoader() {
  var maxWait = setTimeout(hideLoader, 4000);
  var checkReady = setInterval(function() {
    var content = document.querySelector('.notion-collection-gallery') || document.querySelector('.super-content');
    if (content) {
      clearInterval(checkReady);
      clearTimeout(maxWait);
      // 타이틀 이미지 + 카운터 준비 후 로딩 해제
      replaceMainTitle();
      setTimeout(hideLoader, 300);
    }
  }, 100);
}

// 최초 로드 시 로딩 표시
showLoader();
waitAndHideLoader();

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

// ── 메인 페이지 타이틀을 이미지로 교체 ──
function replaceMainTitle() {
  if (window.location.pathname !== '/' && window.location.pathname !== '') return;

  // 이전 이미지가 남아있으면 제거
  var oldWrap = document.querySelector('.nz-title-img-wrap');
  if (oldWrap) oldWrap.parentNode.removeChild(oldWrap);

  var titleEl = document.querySelector('.notion-header__title');
  if (!titleEl) return;

  titleEl.dataset.nzReplaced = 'true';
  titleEl.style.display = 'none';

  var wrap = document.createElement('div');
  wrap.className = 'nz-title-img-wrap';

  var img = document.createElement('img');
  img.src = 'https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/14d7b453-161f-42ba-afe1-b0cf8b388744/_-_-_-2/w=1920,quality=90,fit=scale-down';
  img.alt = '몬빵의 나조토키 다락방';
  img.draggable = false;
  wrap.appendChild(img);

  titleEl.parentNode.insertBefore(wrap, titleEl);

  // 히어로 카피 생성/재삽입
  var oldHero = document.querySelector('.nz-hero-copy');
  if (oldHero) oldHero.parentNode.removeChild(oldHero);

  var heroCopy = document.createElement('div');
  heroCopy.className = 'nz-hero-copy';
  heroCopy.innerHTML =
    '<p class="nz-hero-copy__main">' + NZ_HERO_COPY.main + '</p>' +
    '<p class="nz-hero-copy__cta">' + NZ_HERO_COPY.cta_before +
    ' <span class="nz-hero-copy__arrow">→</span> ' +
    '<a class="nz-hero-copy__link" href="' + NZ_HERO_COPY.cta_url + '">' + NZ_HERO_COPY.cta_link + '</a></p>';
  wrap.parentNode.insertBefore(heroCopy, wrap.nextSibling);

  // 카운터 생성/재삽입 (히어로 카피 다음 위치)
  var oldCounter = document.getElementById('nz-review-counter');
  if (oldCounter) {
    heroCopy.parentNode.insertBefore(oldCounter, heroCopy.nextSibling);
  } else {
    var counterTry = 0;
    var counterInterval = setInterval(function () {
      counterTry++;
      if (document.getElementById('nz-review-counter') || counterTry > 30) {
        clearInterval(counterInterval);
        return;
      }
      var cards = document.querySelectorAll('.notion-collection-card');
      if (!cards.length) return;
      clearInterval(counterInterval);
      var publishSel = '.property-54495c70';
      var visibleCount = 0;
      var dateSel = '.property-57636b4d';
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
      var dateStr = '';
      if (latestDate) {
        var y = latestDate.getFullYear();
        var m = ('0' + (latestDate.getMonth() + 1)).slice(-2);
        var d = ('0' + latestDate.getDate()).slice(-2);
        dateStr = y + '.' + m + '.' + d;
      }
      var el = document.createElement('div');
      el.id = 'nz-review-counter';
      el.innerHTML = '지금까지 <strong>' + visibleCount + ' 작품</strong>을 풀고 기록했어요'
        + (dateStr ? ' · 마지막 업데이트 ' + dateStr : '');
      var h = document.querySelector('.nz-hero-copy');
      if (h) h.parentNode.insertBefore(el, h.nextSibling);
    }, 200);
  }
}

// ── SPA 네비게이션 감지 ──
(function() {
  var lastUrl = location.href;

  function onNavigate() {
    showLoader();
    setTimeout(convertDates, 500);
    setTimeout(convertDates, 1500);
    setTimeout(replaceMainTitle, 300);
    setTimeout(replaceMainTitle, 800);
    setTimeout(replaceMainTitle, 1500);
    waitAndHideLoader();
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
setTimeout(replaceMainTitle, 300);
setTimeout(replaceMainTitle, 800);
setTimeout(replaceMainTitle, 1500);

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
    pad:          'property-46464855'
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

  // ── 추천도 색상 매핑 ─────────────────────────────────
  var REC_COLORS = {
    '강력추천': { bg: '#3b82f6', color: '#fff', weight: '700' },
    '추천':     { bg: '#dbeafe', color: '#1d4ed8', weight: '600' },
    '괜찮음':   { bg: '#e8e0d5', color: '#78716c', weight: '600' },
    '음..':     { bg: '#f0eeec', color: '#78716c', weight: '600' }
  };

  // ── 체감 난이도 단계별 색상 ──────────────────────────
  var DIFF_STEP_COLORS = {
    '아주 쉬움':  { bg: '#ccfbf1', color: '#0d7377', border: '#7eddd0' },
    '쉬움':       { bg: '#dcfce7', color: '#166534', border: '#86e5a0' },
    '보통':       { bg: '#fef3c7', color: '#92700e', border: '#f0d87a' },
    '어려움':     { bg: '#fed7aa', color: '#9a3412', border: '#f0b080' },
    '아주 어려움': { bg: '#fde8e8', color: '#c05050', border: '#f0a0a0' }
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
      var label = s === '아주 쉬움'   ? '아주<br>쉬움'
                : s === '아주 어려움' ? '아주<br>어려움'
                : s;
      var c = DIFF_STEP_COLORS[s];
      var style = isActive && c
        ? ' style="background:' + c.bg + ';color:' + c.color + ';font-weight:600;border:1.5px solid ' + c.border + ';"'
        : '';
      return '<div class="nz-diff-step"' + style + '>' + label + '</div>';
    }).join('');
  }

  // ── 레이더 차트 SVG 생성 ─────────────────────────────
  function buildRadar(s) {
    // 5축 단위벡터 (위쪽부터 시계방향: 만족도→문제→기믹→연출→언어장벽)
    var AXES = [
      { label: '만족도',      ux:  0,       uy: -1      },
      { label: '문제',        ux:  0.9511,  uy: -0.3090 },
      { label: '기믹',        ux:  0.5878,  uy:  0.8090 },
      { label: '연출/디자인', ux: -0.5878,  uy:  0.8090 },
      { label: '언어접근성',   ux: -0.9511,  uy: -0.3090 }
    ];
    var vals = [s.satisfaction, s.puzzle, s.gimmick, s.design, s.language];
    var MAX_R = 90; // 점수 5 = 반지름 90 (18 * 5)

    // 그리드 오각형 (점수 1~5)
    var grids = [1, 2, 3, 4, 5].map(function (n) {
      var r = n * 18;
      var pts = AXES.map(function (a) {
        return (a.ux * r).toFixed(1) + ',' + (a.uy * r).toFixed(1);
      }).join(' ');
      return '<polygon points="' + pts + '" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>';
    }).join('');

    // 축선
    var lines = AXES.map(function (a) {
      return '<line x1="0" y1="0" x2="' + (a.ux * MAX_R).toFixed(1) + '" y2="' + (a.uy * MAX_R).toFixed(1) + '" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>';
    }).join('');

    // 데이터 포인트 계산
    var dataPoints = AXES.map(function (a, i) {
      return { x: a.ux * vals[i] * 18, y: a.uy * vals[i] * 18 };
    });
    var dataPtsStr = dataPoints.map(function (p) {
      return p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');

    // 데이터 폴리곤
    var polygon = '<polygon points="' + dataPtsStr + '" fill="#AFA9EC" fill-opacity="0.35" stroke="#7F77DD" stroke-width="2"/>';

    // 데이터 점
    var dots = dataPoints.map(function (p) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4" fill="#7F77DD"/>';
    }).join('');

    // 점수 레이블 (데이터 점 약간 안쪽)
    var scoreLabels = dataPoints.map(function (p, i) {
      var lx = (p.x - AXES[i].ux * 14).toFixed(1);
      var ly = (p.y - AXES[i].uy * 14 + 4).toFixed(1);
      return '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" font-size="11" font-weight="500" fill="#534AB7" font-family="sans-serif">' + vals[i] + '</text>';
    }).join('');

    // 축 레이블 (축 끝에서 약간 바깥)
    var axisLabels = AXES.map(function (a, i) {
      var lx = (a.ux * 103).toFixed(1);
      var ly = (a.uy * 103).toFixed(1);
      var anchor = i === 0 ? 'middle' : a.ux > 0.2 ? 'start' : a.ux < -0.2 ? 'end' : 'middle';
      return '<text x="' + lx + '" y="' + ly + '" text-anchor="' + anchor + '" font-size="11" fill="#444441" font-family="sans-serif">' + a.label + '</text>';
    }).join('');

    // 그리드 숫자 (1~5)
    var gridNums = [1, 2, 3, 4, 5].map(function (n) {
      return '<text x="3" y="' + (-n * 18 + 3).toFixed(1) + '" font-size="9" fill="#888780" font-family="sans-serif">' + n + '</text>';
    }).join('');

    return '<svg viewBox="0 0 300 220" width="100%" xmlns="http://www.w3.org/2000/svg">'
      + '<g transform="translate(150,120)">'
      + grids + lines + polygon + dots + scoreLabels + axisLabels + gridNums
      + '</g></svg>';
  }

  // ── 라이트박스 ────────────────────────────────────────
  function nzLightboxInit() {
    if (document.getElementById('nz-lightbox')) return;
    var lb = document.createElement('div');
    lb.id = 'nz-lightbox';
    lb.innerHTML = '<div id="nz-lightbox-backdrop"></div>'
      + '<div id="nz-lightbox-content">'
      +   '<button id="nz-lightbox-close">✕</button>'
      +   '<img id="nz-lightbox-img" src="" alt="플레이 사진">'
      + '</div>';
    document.body.appendChild(lb);

    document.getElementById('nz-lightbox-backdrop').addEventListener('click', nzLightboxClose);
    document.getElementById('nz-lightbox-close').addEventListener('click', nzLightboxClose);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') nzLightboxClose();
    });
  }

  function nzLightboxOpen(url) {
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
        var e = 1 - Math.pow(1 - p, 3); // ease-out cubic
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

    var html = ''
      + '<div class="nz-review-wrap"><div class="nz-card">'
      + '<div class="nz-pc-layout">'
      + '<div class="nz-col-left">'
      + '<div class="nz-header">'
      +   '<div class="nz-title-row">'
      +     '<span class="nz-title-main">' + nazoTitle + '</span>'
      +     (mNum ? '<span class="nz-title-sub">' + mNum + '</span>' : '')
      +   '</div>'
      +   '<div class="nz-badges">'
      +     (company.text ? '<span class="badge ' + pillToColor(company.cls) + '">' + company.text + '</span>' : '')
      +     (function() {
              if (!recommend.text) return '';
              var rc = REC_COLORS[recommend.text];
              if (rc) return '<span class="badge" style="background:' + rc.bg + ';color:' + rc.color + ';font-weight:' + rc.weight + ';">' + recommend.text + '</span>';
              return '<span class="badge ' + pillToColor(recommend.cls) + '">' + recommend.text + '</span>';
            })()
      +   '</div>'
      + '</div>'

      + '<div class="nz-section">'
      +   '<p class="nz-section-title">난이도</p>'
      +   '<div class="nz-grid2">'
      +     '<div class="nz-cell nz-cell-center">'
      +       '<p class="nz-cell-label">공식 난이도</p>'
      +       (officialDiffs.length
               ? '<div class="nz-official-diff-wrap' + (officialDiffs.length > 1 ? ' nz-official-diff-wrap--multi' : '') + '">'
                 + officialDiffs.map(function (d) {
                     var isMulti = officialDiffs.length > 1;
                     var sizeClass = (isMulti || d.text.length > 8) ? ' badge-lg-sm' : '';
                     return '<span class="badge badge-lg' + sizeClass + ' ' + pillToColor(d.cls) + '">' + d.text + '</span>';
                   }).join('')
                 + '</div>'
               : '<span class="nz-cell-value">-</span>')
      +     '</div>'
      +     '<div class="nz-cell">'
      +       '<p class="nz-cell-label">체감 난이도</p>'
      +       '<div class="nz-diff-steps">' + buildDiffSteps(personalDiff.text) + '</div>'
      +     '</div>'
      +   '</div>'
      + '</div>'

      + '<div class="nz-section">'
      +   '<p class="nz-section-title">플레이 기록</p>'
      +   '<div class="nz-grid2">'
      +     '<div class="nz-cell"><p class="nz-cell-label">클리어 날짜</p><p class="nz-cell-value">' + (playDate || '-') + '</p></div>'
      +     '<div class="nz-cell"><p class="nz-cell-label">참여 인원</p><p class="nz-cell-value">' + (players || '-') + '</p></div>'
      +     '<div class="nz-cell"><p class="nz-cell-label">공식 소요시간</p><p class="nz-cell-value">' + (officialTime || '-') + '</p></div>'
      +     '<div class="nz-cell"><p class="nz-cell-label">실제 소요시간</p><p class="nz-cell-value">' + (actualTime || '-') + '</p></div>'
      +   '</div>'
      + '</div>'

      + '</div>'
      + '<div class="nz-col-right">'
      + '<div class="nz-section">'
      +   '<p class="nz-section-title">점수 분석</p>'
      +   buildRadar(scores)
      + '</div>'

      + '<div class="nz-section">'
      +   '<p class="nz-section-title">추가 정보</p>'
      +   '<div class="nz-badges">'
      +     usageBadge('line', line)
      +     usageBadge('web', web)
      +     usageBadge('audio', audio)
      +     usageBadge('recycle', recycle)
      +     (pad.text.trim() === 'O' ? '<span class="badge badge-teal">패드 사용 권장</span>' : '')
      +   '</div>'
      + '</div>'

      + '<div class="nz-section">'
      +   '<p class="nz-section-title">구입처</p>'
      +   '<div class="nz-badges">'
      +     (purchase.text ? '<span class="badge ' + pillToColor(purchase.cls) + '">' + purchase.text + '</span>' : '<span class="nz-cell-value">-</span>')
      +   '</div>'
      + '</div>'

      + '</div>'
      + '</div>'
      + '</div></div>';

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

    var calloutEl = document.querySelector('.notion-callout');
    if (calloutEl) {
      var contentEl = calloutEl.querySelector('.notion-callout__content');
      if (contentEl) {
        var section = document.createElement('div');
        section.className = 'nz-section';
        section.innerHTML = '<p class="nz-section-title">나조 설명</p>';
        var descDiv = document.createElement('div');
        descDiv.className = 'nz-desc';
        descDiv.innerHTML = contentEl.innerHTML;
        section.appendChild(descDiv);
        document.querySelector('.nz-card').appendChild(section);
      }
      calloutEl.style.display = 'none';
    }

    var photoEl = document.querySelector('.' + ID.photo);
    if (photoEl) {
      var photoLinks = photoEl.querySelectorAll('a[href]');
      if (photoLinks.length > 0) {
        var photoSection = document.createElement('div');
        photoSection.className = 'nz-section';
        photoSection.innerHTML = '<p class="nz-section-title">플레이 사진</p>';
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
        document.querySelector('.nz-card').appendChild(photoSection);
      }
    }

    nzLightboxInit();

    console.log('[나조토키] 리뷰 레이아웃 적용 완료');
  }

  // ── 플레이 일기 박스 감싸기 ──────────────────────────────
  function wrapDiary() {
    if (document.querySelector('.nz-diary-box')) return;
    var propsEl = document.querySelector('.notion-page__properties');
    if (!propsEl) return;

    var elements = [];
    var sibling = propsEl.nextElementSibling;
    while (sibling) {
      if (sibling.style.display !== 'none') {
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

    propsEl.parentNode.appendChild(box);
  }

  // ── 좋아요 버튼 (별도 파이프라인) ───────────────────────

  // ── 브랜드 다른 리뷰 표시 ──────────────────────────────
  function renderBrandReviews() {
    if (document.querySelector('.nz-brand-reviews')) return;

    // 현재 페이지 타이틀로 SORT_DATA에서 현재 리뷰 찾기
    var currentTitle = null;
    var currentData = null;
    var pageTitle = document.querySelector('.nz-title-main');
    if (!pageTitle) return;
    var pageTitleText = pageTitle.textContent.trim();

    // SORT_DATA에서 매칭
    for (var key in SORT_DATA) {
      if (key === pageTitleText || pageTitleText.indexOf(key) > -1 || key.indexOf(pageTitleText) > -1) {
        currentTitle = key;
        currentData = SORT_DATA[key];
        break;
      }
    }

    // DOM에서 제작사 읽기 (fallback)
    var brand = currentData ? currentData.brand : null;
    if (!brand) {
      var companyEl = document.querySelector('.nz-badges .badge');
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
    title.innerHTML = '<span class="nz-br-bullet">&#8226;</span>' + brand + '의 다른 리뷰 <span class="nz-br-count">(' + totalCount + ')</span>';
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

    // 삽입 위치: 플레이 일기 박스 바로 뒤
    var diaryBox = document.querySelector('.nz-diary-box');
    if (diaryBox) {
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

// ── 갤러리 검색 / 필터 / 정렬 ────────────────────────
(function () {
  'use strict';

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

  // ── 체감 난이도 색상 매핑 ──
  var DIFF_COLORS = {
    '아주 쉬움':   '#06b6d4',
    '쉬움':       '#22c55e',
    '보통':       '#eab308',
    '어려움':     '#f97316',
    '아주 어려움': '#ef4444'
  };

  // ── 추천도 CSS 클래스 매핑 ──
  var REC_CLASS = {
    '강력추천': 'nz-card-rec--strong',
    '추천':    'nz-card-rec--rec',
    '괜찮음':  'nz-card-rec--ok',
    '음..':    'nz-card-rec--meh'
  };

  // ── 카드 커스텀 레이아웃 적용 ──
  function customizeCards() {
    var cards = document.querySelectorAll(CARD_SEL);
    cards.forEach(function (card) {
      if (card.classList.contains('nz-card-custom')) return;

      // ── 공개여부 체크: 비공개면 카드 숨김 ──
      var publishEl = card.querySelector(PUBLISH_SEL);
      if (publishEl) {
        var publishText = publishEl.textContent.trim();
        if (publishText === '비공개') {
          card.classList.add('nz-card-hidden');
          card.classList.add('nz-card-custom');
          return;
        }
        // 공개 태그는 사이트에서 안 보이게 숨김
        publishEl.style.display = 'none';
      }

      var companyEl   = card.querySelector(COMPANY_SEL);
      var recommendEl = card.querySelector(RECOMMEND_SEL);
      var diffEl      = card.querySelector(DIFF_SEL);
      var officialEl  = card.querySelector(OFFICIAL_SEL);

      // 제작사 읽기
      var companies = [];
      if (companyEl) {
        var pills = companyEl.querySelectorAll('.notion-pill');
        if (pills.length) {
          Array.from(pills).forEach(function (p) { companies.push(p.textContent.trim()); });
        } else {
          var t = companyEl.textContent.trim();
          if (t) companies.push(t);
        }
      }

      // 추천도 읽기
      var recText = '';
      if (recommendEl) {
        var recPill = recommendEl.querySelector('.notion-pill');
        recText = recPill ? recPill.textContent.trim() : recommendEl.textContent.trim();
      }

      // 체감 난이도 읽기
      var diffText = '';
      if (diffEl) {
        var diffPill = diffEl.querySelector('.notion-pill');
        diffText = diffPill ? diffPill.textContent.trim() : diffEl.textContent.trim();
      }

      // 공식 난이도 읽기 (다중선택)
      var officials = [];
      if (officialEl) {
        var oPills = officialEl.querySelectorAll('.notion-pill');
        if (oPills.length) {
          Array.from(oPills).forEach(function (p) { officials.push(p.textContent.trim()); });
        } else {
          var oText = officialEl.textContent.trim();
          if (oText) officials.push(oText);
        }
      }

      // 새 레이아웃 조립
      var html = '';

      // 제작사
      if (companies.length) {
        html += '<div class="nz-card-maker">' + companies.join(' · ') + '</div>';
      }

      // 추천도 + 난이도 + 공식점수 행
      var bottomParts = [];
      if (recText) {
        var recCls = REC_CLASS[recText] || 'nz-card-rec--meh';
        bottomParts.push('<span class="nz-card-rec ' + recCls + '">' + recText + '</span>');
      }
      if (diffText) {
        var dc = DIFF_COLORS[diffText] || '#78716c';
        bottomParts.push('<span class="nz-card-diff" style="color:' + dc + '; border:1.5px solid ' + dc + ';">' + diffText + '</span>');
      }
      if (officials.length) {
        var officialHtml = officials.map(function (o) {
          return '<span class="nz-card-official">' + o + '</span>';
        }).join('');
        if (officials.length > 1) {
          officialHtml = '<span class="nz-card-official-group">' + officialHtml + '</span>';
        }
        bottomParts.push(officialHtml);
      } else if (officialEl) {
        bottomParts.push('<span class="nz-card-official--none">표기 없음</span>');
      }

      if (bottomParts.length) {
        html += '<div class="nz-card-bottom">' + bottomParts.join('') + '</div>';
      }

      // 삽입
      var propsDiv = document.createElement('div');
      propsDiv.className = 'nz-card-props';
      propsDiv.innerHTML = html;
      card.appendChild(propsDiv);
      card.classList.add('nz-card-custom');
    });
  }

  var state = {
    searchQ:   '',
    filterCompany:   [],
    filterDiff:      [],
    filterRecommend: [],
    sortField: '',
    sortDesc:  true,
    originalOrder: null,
    page: 1,
    perPage: 10
  };

  function getCardTitle(card) {
    var el = card.querySelector(TITLE_SEL);
    return el ? el.textContent.trim() : '';
  }
  function getCardCompanies(card) {
    var el = card.querySelector(COMPANY_SEL);
    if (!el) return [];
    var pills = el.querySelectorAll('.notion-pill');
    if (pills.length) return Array.from(pills).map(function (p) { return p.textContent.trim(); });
    return [el.textContent.trim()];
  }
  function getCardDiff(card) {
    var el = card.querySelector(DIFF_SEL);
    return el ? el.textContent.trim() : '';
  }
  function getCardRecommend(card) {
    var el = card.querySelector(RECOMMEND_SEL);
    return el ? el.textContent.trim() : '';
  }

  // ── 카드 표시/숨김 적용 (페이지네이션 통합) ──
  function applyVisibility() {
    var cards = document.querySelectorAll(CARD_SEL);
    var q = state.searchQ;
    var matched = [];

    cards.forEach(function (card) {
      var title    = getCardTitle(card).toLowerCase();
      var companies = getCardCompanies(card);
      var companiesLower = companies.map(function (c) { return c.toLowerCase(); });
      var companyText = companiesLower.join(' ');
      var diff     = getCardDiff(card);
      var recommend= getCardRecommend(card);

      // 검색 매칭
      var phonetics = PHONETIC_MAP[title] || [];
      var companyPhonetics = [];
      companiesLower.forEach(function (c) {
        var pm = COMPANY_MAP[c.trim()] || [];
        companyPhonetics = companyPhonetics.concat(pm);
      });
      var searchMatch = !q
        || title.indexOf(q) > -1
        || companyText.indexOf(q) > -1
        || phonetics.some(function (p) { return p.indexOf(q) > -1; })
        || companyPhonetics.some(function (p) { return p.indexOf(q) > -1; });

      // 필터 매칭
      var companyMatch   = !state.filterCompany.length   || companies.some(function (c) { return state.filterCompany.indexOf(c) > -1; });
      var diffMatch      = !state.filterDiff.length      || state.filterDiff.indexOf(diff) > -1;
      var recommendMatch = !state.filterRecommend.length || state.filterRecommend.indexOf(recommend) > -1;

      var show = searchMatch && companyMatch && diffMatch && recommendMatch;
      if (show) {
        matched.push(card);
      }
      card.style.display = 'none';
    });

    // 페이지네이션 계산
    var totalPages = Math.max(1, Math.ceil(matched.length / state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    var startIdx = (state.page - 1) * state.perPage;
    var endIdx = startIdx + state.perPage;

    for (var i = 0; i < matched.length; i++) {
      if (i >= startIdx && i < endIdx) {
        matched[i].style.display = '';
      }
    }

    // 카드 수 표시
    var countEl = document.getElementById('nz-search-count');
    if (countEl) {
      var isFiltered = q || state.filterCompany.length || state.filterDiff.length || state.filterRecommend.length;
      countEl.textContent = isFiltered ? matched.length + '개' : '';
    }

    // 페이지네이션 UI 업데이트
    renderPagination(matched.length, totalPages);
  }

  // ── 페이지네이션 UI ──
  function renderPagination(totalItems, totalPages) {
    var existing = document.getElementById('nz-pagination');
    if (existing) existing.remove();

    if (totalPages <= 1) return;

    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    var wrap = document.createElement('div');
    wrap.id = 'nz-pagination';

    // 이전 버튼
    var prevBtn = document.createElement('button');
    prevBtn.className = 'nz-page-btn' + (state.page <= 1 ? ' nz-page-disabled' : '');
    prevBtn.textContent = '‹';
    prevBtn.addEventListener('click', function () {
      if (state.page > 1) { state.page--; applyVisibility(); }
    });
    wrap.appendChild(prevBtn);

    // 페이지 번호
    var startPage = Math.max(1, state.page - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (var i = startPage; i <= endPage; i++) {
      (function (pageNum) {
        var btn = document.createElement('button');
        btn.className = 'nz-page-btn' + (pageNum === state.page ? ' nz-page-active' : '');
        btn.textContent = pageNum;
        btn.addEventListener('click', function () {
          state.page = pageNum; applyVisibility();
        });
        wrap.appendChild(btn);
      })(i);
    }

    // 다음 버튼
    var nextBtn = document.createElement('button');
    nextBtn.className = 'nz-page-btn' + (state.page >= totalPages ? ' nz-page-disabled' : '');
    nextBtn.textContent = '›';
    nextBtn.addEventListener('click', function () {
      if (state.page < totalPages) { state.page++; applyVisibility(); }
    });
    wrap.appendChild(nextBtn);

    gallery.parentNode.insertBefore(wrap, gallery.nextSibling);
  }


  // ── 정렬 적용 ──
  function applySort() {
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;
    var cards = Array.from(gallery.querySelectorAll(CARD_SEL));
    if (!cards.length) return;

    if (!state.originalOrder) state.originalOrder = cards.slice();

    var sorted = !state.sortField ? state.originalOrder.slice() : cards.slice().sort(function (a, b) {
      var ta = getCardTitle(a), tb = getCardTitle(b);
      var da = SORT_DATA[ta], db = SORT_DATA[tb];
      var va = da ? da[state.sortField] : null;
      var vb = db ? db[state.sortField] : null;
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'string') return state.sortDesc ? vb.localeCompare(va) : va.localeCompare(vb);
      return state.sortDesc ? vb - va : va - vb;
    });

    sorted.forEach(function (card) { gallery.appendChild(card); });
    applyVisibility();
  }

  // ── 검색 바 ──
  function buildSearch() {
    if (document.getElementById('nz-search-wrap')) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    var wrap = document.createElement('div');
    wrap.id = 'nz-search-wrap';
    wrap.innerHTML =
      '<img id="nz-search-icon" src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/61d6e642-6df3-462b-b543-05804774285c/search_-1/w=1920,quality=90,fit=scale-down" alt="검색">'
      + '<input id="nz-search" type="text" placeholder="나조 이름 또는 브랜드로 검색">'
      + '<span id="nz-search-count"></span>'
      + '<button id="nz-filter-toggle" type="button" aria-label="필터/정렬 열기"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/0ae160ac-3c90-47e2-b9a5-f3600549997a/sliders-horizontal_-2/w=1920,quality=90,fit=scale-down" alt="필터" id="nz-filter-toggle-icon"></button>';
    gallery.parentNode.insertBefore(wrap, gallery);

    document.getElementById('nz-search').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      state.searchQ = this.value.trim().toLowerCase();
      state.page = 1;
      applyVisibility();
    });

    document.getElementById('nz-filter-toggle').addEventListener('click', function () {
      var panel = document.getElementById('nz-filter-panel');
      if (!panel) return;
      var isOpen = panel.classList.toggle('nz-panel-open');
      this.classList.toggle('nz-toggle-active', isOpen);
    });
  }

  // ── 필터 바 ──
  function getUniqueVals(sel, multi) {
    var vals = [];
    document.querySelectorAll(CARD_SEL).forEach(function (card) {
      var el = card.querySelector(sel);
      if (!el) return;
      if (multi) {
        el.querySelectorAll('.notion-pill').forEach(function (p) {
          var t = p.textContent.trim();
          if (t && vals.indexOf(t) === -1) vals.push(t);
        });
      } else {
        var t = el.textContent.trim();
        if (t && vals.indexOf(t) === -1) vals.push(t);
      }
    });
    return vals;
  }

  function buildFilterGroup(id, label, values, stateKey) {
    var group = document.createElement('div');
    group.className = 'nz-filter-group';
    group.id = id;

    var btn = document.createElement('button');
    btn.className = 'nz-filter-btn';
    btn.type = 'button';
    btn.innerHTML = '<span class="nz-filter-arrow">▾</span> ' + label;
    btn.setAttribute('data-label', label);
    group.appendChild(btn);

    var list = document.createElement('div');
    list.className = 'nz-filter-list';

    values.forEach(function (v) {
      var item = document.createElement('label');
      item.className = 'nz-filter-item';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = v;
      cb.addEventListener('change', function () {
        if (this.checked) {
          state[stateKey].push(v);
        } else {
          state[stateKey] = state[stateKey].filter(function (x) { return x !== v; });
        }
        var count = state[stateKey].length;
        btn.innerHTML = '<span class="nz-filter-arrow">▾</span> ' + label + (count ? ' (' + count + ')' : '');
        state.page = 1;
        applyVisibility();
      });
      var span = document.createElement('span');
      span.textContent = v;
      item.appendChild(cb);
      item.appendChild(span);
      list.appendChild(item);
    });

    group.appendChild(list);

    btn.addEventListener('click', function () {
      var isOpen = group.classList.toggle('nz-filter-group-open');
      // 다른 그룹 닫기
      var siblings = group.parentNode.querySelectorAll('.nz-filter-group');
      siblings.forEach(function (g) {
        if (g !== group) g.classList.remove('nz-filter-group-open');
      });
    });

    return group;
  }

  var DIFF_ORDER = ['아주 쉬움', '쉬움', '보통', '어려움', '아주 어려움'];

  function buildFilter() {
    if (document.getElementById('nz-filter-wrap')) return;

    var companies = getUniqueVals(COMPANY_SEL, true).sort();
    var diffs = getUniqueVals(DIFF_SEL, false).sort(function (a, b) {
      return DIFF_ORDER.indexOf(a) - DIFF_ORDER.indexOf(b);
    });
    var recommends = getUniqueVals(RECOMMEND_SEL, false);

    var wrap = document.createElement('div');
    wrap.id = 'nz-filter-wrap';

    wrap.appendChild(buildFilterGroup('nz-filter-company',   '제작사', companies, 'filterCompany'));
    wrap.appendChild(buildFilterGroup('nz-filter-diff',      '난이도', diffs,     'filterDiff'));
    wrap.appendChild(buildFilterGroup('nz-filter-recommend', '추천',   recommends,'filterRecommend'));

    return wrap;
  }

  // ── 정렬 바 ──
  function buildSort() {
    if (document.getElementById('nz-sort-wrap')) return;

    var wrap = document.createElement('div');
    wrap.id = 'nz-sort-wrap';

    var select = document.createElement('select');
    select.id = 'nz-sort-select';
    [
      ['', '기본순'],
      ['num', '나조 번호'],
      ['date', '클리어 날짜'],
      ['satisfaction', '개인 만족도'],
      ['diff', '체감 난이도'],
      ['puzzle', '문제'],
      ['gimmick', '기믹'],
      ['design', '연출/디자인'],
      ['language', '언어접근성']
    ].forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt[0]; o.textContent = opt[1];
      select.appendChild(o);
    });

    var btn = document.createElement('button');
    btn.id = 'nz-sort-dir';
    btn.textContent = '▼';
    btn.disabled = true;

    select.addEventListener('change', function () {
      state.sortField = this.value;
      btn.disabled = !state.sortField;
      state.page = 1;
      applySort();
    });

    btn.addEventListener('click', function () {
      state.sortDesc = !state.sortDesc;
      btn.textContent = state.sortDesc ? '▼' : '▲';
      state.page = 1;
      applySort();
    });

    wrap.appendChild(select);
    wrap.appendChild(btn);

    return wrap;
  }

  // ── 필터/정렬 통합 패널 ──
  function buildFilterPanel() {
    if (document.getElementById('nz-filter-panel')) return;
    var searchWrap = document.getElementById('nz-search-wrap');
    if (!searchWrap) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    var panel = document.createElement('div');
    panel.id = 'nz-filter-panel';

    var sortEl = buildSort();
    if (sortEl) panel.appendChild(sortEl);

    var filterEl = buildFilter();
    if (filterEl) panel.appendChild(filterEl);

    searchWrap.parentNode.insertBefore(panel, searchWrap.nextSibling);
  }

  // ── 갤러리 등장 감지 ──
  function destroyAll() {
    ['nz-search-wrap', 'nz-filter-panel'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.parentNode.removeChild(el);
    });
    document.querySelectorAll('.nz-card-props').forEach(function (el) {
      el.parentNode.removeChild(el);
    });
    document.querySelectorAll('.nz-card-custom').forEach(function (el) {
      el.classList.remove('nz-card-custom');
    });
  }

  function applyUrlSearch() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('search');
    if (!q) return;
    var input = document.getElementById('nz-search');
    if (input) {
      input.value = q;
      state.searchQ = q.trim().toLowerCase();
      state.page = 1;
    }
    // URL 파라미터 제거 (뒤로가기 시 깔끔하게)
    history.replaceState(null, '', window.location.pathname);
  }

  // ── 홈 로고 클릭 시 새로고침 (필터 초기화) ──
  function setupLogoRefresh() {
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

  function buildAll() {
    buildSearch();
    buildFilterPanel();
    customizeCards();
    applyUrlSearch();
    applyVisibility();
    setupLogoRefresh();
  }

  var galleryDebounce = null;
  var galleryObserver = new MutationObserver(function () {
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;
    var searchWrap = document.getElementById('nz-search-wrap');
    if (!searchWrap || searchWrap.parentNode !== gallery.parentNode) {
      destroyAll();
      state.originalOrder = null;
      buildAll();
    }
    // 새 카드가 추가된 경우 커스텀 적용 + 페이지네이션 갱신 (디바운스)
    var uncustomized = gallery.querySelector(CARD_SEL + ':not(.nz-card-custom)');
    if (uncustomized) {
      customizeCards();
      if (galleryDebounce) clearTimeout(galleryDebounce);
      galleryDebounce = setTimeout(function () {
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
    return isPurchasePage() &&
      document.querySelector('.notion-callout') &&
      !document.querySelector('[data-nz-done]');
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
    return location.pathname.indexOf('to-review') !== -1;
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
  }

  function needsRun() {
    return isReviewListPage() &&
      document.querySelector('.notion-collection-table') &&
      (!document.querySelector('.nz-review-subtitle') || !document.querySelector('[data-nz-2col]'));
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
  var LIKE_COLORS = ['#E24B4A', '#FF6B6B', '#FF8787', '#FFA8A8', '#e55b3c', '#f2847c'];

  function getSessionId() {
    var id = localStorage.getItem('nz_session_id');
    if (!id) {
      id = 'nz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('nz_session_id', id);
    }
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
    // 보이는 diary box 안에 삽입 (맨 아래 자식으로)
    var diaries = document.querySelectorAll('.nz-diary-box');
    for (var i = 0; i < diaries.length; i++) {
      if (diaries[i].offsetWidth > 0) return { el: diaries[i], position: 'inside' };
    }
    // diary box 없으면 보이는 brand reviews 앞에
    var brands = document.querySelectorAll('.nz-brand-reviews');
    for (var i = 0; i < brands.length; i++) {
      if (brands[i].offsetWidth > 0) return { el: brands[i], position: 'before' };
    }
    // 둘 다 없으면 보이는 notion-page__properties 뒤에
    var props = document.querySelectorAll('.notion-page__properties');
    for (var i = 0; i < props.length; i++) {
      if (props[i].offsetWidth > 0) return { el: props[i], position: 'after-last-sibling' };
    }
    return null;
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
    if (location.pathname.indexOf('/nazotoki-reviews/') === -1) return;

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
        '<svg width="18" height="18" viewBox="0 0 24 24"><path class="nz-heart-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="#E24B4A" stroke-width="2"/></svg>' +
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
    var heartPath = pill.querySelector('.nz-heart-path');

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
          heartPath.setAttribute('fill', '#E24B4A');
          heartPath.removeAttribute('stroke');
          heartPath.removeAttribute('stroke-width');
        }
      })
      .catch(function () {});

    // 클릭 이벤트
    pill.addEventListener('click', function () {
      var isActive = pill.classList.contains('active');
      var currentCount = parseInt(countEl.textContent) || 0;

      if (isActive) {
        pill.classList.remove('active');
        heartPath.setAttribute('fill', 'none');
        heartPath.setAttribute('stroke', '#E24B4A');
        heartPath.setAttribute('stroke-width', '2');
        countEl.textContent = Math.max(0, currentCount - 1);
        supabaseRequest('DELETE', 'likes?page_slug=eq.' + encodeURIComponent(slug) + '&session_id=eq.' + encodeURIComponent(sessionId));
      } else {
        pill.classList.add('active');
        heartPath.setAttribute('fill', '#E24B4A');
        heartPath.removeAttribute('stroke');
        heartPath.removeAttribute('stroke-width');
        countEl.textContent = currentCount + 1;
        nzBurstParticles(pill.querySelector('.nz-like-particles'));
        supabaseRequest('POST', 'likes', { page_slug: slug, session_id: sessionId });
      }
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
    if (!hasVisibleLikeButton() && location.pathname.indexOf('/nazotoki-reviews/') > -1) {
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

// ── 리뷰 예정 목록 - 투표 버튼 (ReviewRequests) ────────────────
// /to-review 페이지에서 각 행에 "리뷰 읽고 싶어요" 버튼 삽입
// PC: 4번째 컬럼 / Mobile: 상태 셀 안 세로 스택
(function () {
  'use strict';

  var SUPABASE_URL = 'https://llwdqogseeddnffradej.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_8cOoT2cGQ0x7Is57k-VT5A_fqgVKr6f';
  var TABLE        = 'ReviewRequests';
  var BODY_CLASS   = 'nz-vote-page';

  // ── 페이지 판별: 리뷰 예정 목록(/to-review)에서만 동작 ──
  function isVotePage() {
    var p = location.pathname.replace(/\/$/, '');
    return p === '/to-review';
  }

  // ── 세션 ID (좋아요 모듈과 공유) ──
  function getSessionId() {
    var id = localStorage.getItem('nz_session_id');
    if (!id) {
      id = 'nz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('nz_session_id', id);
    }
    return id;
  }

  // ── Supabase 호출 ──
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

  // ── 행에서 슬러그 추출 ──
  // 1순위: /to-review/{slug} href (정상 케이스)
  // 2순위: id="block-to-review-{slug}" (백업)
  // 3순위: 블록 UUID (Super.so가 슬러그 생성 못한 신규 행 - 충돌, 신규 등)
  function getRowSlug(row) {
    var anchor = row.querySelector('a[href*="/to-review/"]');
    if (anchor) {
      var href = anchor.getAttribute('href') || '';
      var m = href.match(/\/to-review\/([^\/?#]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    var idAnchor = row.querySelector('a[id^="block-to-review-"]');
    if (idAnchor) return idAnchor.id.replace('block-to-review-', '');
    // 슬러그 없는 행 → block UUID 사용 (id="block-XXXX" 그대로)
    var blockAnchor = row.querySelector('a.notion-link[id^="block-"]');
    if (blockAnchor && blockAnchor.id.length > 'block-'.length) {
      return blockAnchor.id; // "block-344d25cb..." 형식 그대로 저장
    }
    return null;
  }

  // ── 손 아이콘 SVG ──
  var HAND_OUTLINE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 16v-5a2 2 0 0 0-4 0"/>' +
      '<path d="M14 11V6a2 2 0 0 0-4 0v6"/>' +
      '<path d="M10 11V5a2 2 0 0 0-4 0v9"/>' +
      '<path d="M6 14v-3a2 2 0 0 0-4 0v6a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0"/>' +
    '</svg>';
  var HAND_FILLED =
    '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">' +
      '<path d="M18 16v-5a2 2 0 0 0-4 0"/>' +
      '<path d="M14 11V6a2 2 0 0 0-4 0v6"/>' +
      '<path d="M10 11V5a2 2 0 0 0-4 0v9"/>' +
      '<path d="M6 14v-3a2 2 0 0 0-4 0v6a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0"/>' +
    '</svg>';

  // ── 버튼 생성 ──
  function makeBtn(slug, variant) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nz-vote-btn nz-vote-btn--' + variant;
    btn.setAttribute('data-slug', slug);
    btn.setAttribute('aria-label', '리뷰 읽고 싶어요');
    btn.innerHTML =
      '<span class="nz-vote-icon">' + HAND_OUTLINE + '</span>' +
      '<span class="nz-vote-count"></span>';
    return btn;
  }

  // ── 버튼 상태 적용 ──
  function applyState(btn, voted, count) {
    if (voted) btn.classList.add('voted');
    else btn.classList.remove('voted');
    var icon = btn.querySelector('.nz-vote-icon');
    if (icon) icon.innerHTML = voted ? HAND_FILLED : HAND_OUTLINE;
    var c = btn.querySelector('.nz-vote-count');
    if (c) c.textContent = count > 0 ? count : '';
  }

  // ── 같은 슬러그의 모든 버튼 동기화 (PC + Mobile) ──
  function syncBtns(slug, voted, count) {
    var btns = document.querySelectorAll('.nz-vote-btn[data-slug="' + slug + '"]');
    for (var i = 0; i < btns.length; i++) applyState(btns[i], voted, count);
  }

  // ── 로딩 상태 토글 ──
  function setLoading(slug, loading) {
    var btns = document.querySelectorAll('.nz-vote-btn[data-slug="' + slug + '"]');
    for (var i = 0; i < btns.length; i++) {
      if (loading) btns[i].classList.add('loading');
      else btns[i].classList.remove('loading');
    }
  }

  // ── 헤더 보장 ──
  function ensureHeader(table) {
    var headRow = table.querySelector('thead tr');
    if (!headRow) return;
    if (headRow.querySelector('.nz-vote-cell-header')) return;
    var th = document.createElement('th');
    th.className = 'nz-vote-cell-header notion-collection-table__head-cell';
    th.innerHTML = '<div class="nz-vote-cell-header-content">리뷰 요청</div>';
    headRow.appendChild(th);
  }

  // ── '상태' 헤더에 모바일 전용 접미사 span 추가 ──
  // ⚠️ 노션 원본 구조(__head-cell-content + 아이콘 래퍼 + 텍스트 노드)는 그대로 두고
  //    그 뒤에 inline span만 append → flex row 안에서 자연스럽게 인라인으로 보임
  function ensureSelectHeaderText(table) {
    var selectHead = table.querySelector('thead .notion-collection-table__head-cell.select');
    if (!selectHead) return;
    if (selectHead.querySelector('.nz-vote-head-mobile-suffix')) return; // 이미 처리됨
    selectHead.classList.add('nz-vote-select-head');
    var content = selectHead.querySelector('.notion-collection-table__head-cell-content');
    if (!content) return;
    var suffix = document.createElement('span');
    suffix.className = 'nz-vote-head-mobile-suffix';
    suffix.textContent = ' / 리뷰 요청';
    content.appendChild(suffix);
  }

  // ── 안내 배너 보장 (표 위에 1개) ──
  function ensureBanner(table) {
    if (document.querySelector('.nz-vote-banner')) return;
    var banner = document.createElement('div');
    banner.className = 'nz-vote-banner';
    banner.innerHTML =
      '<span class="nz-vote-banner-icon">' + HAND_OUTLINE + '</span>' +
      '<span class="nz-vote-banner-text">' +
        '<strong>리뷰 읽고 싶어요!</strong>' +
        '<span class="nz-vote-banner-sub"> — 버튼을 누르면 우선 리뷰 대상에 반영돼요</span>' +
      '</span>';
    if (table.parentNode) table.parentNode.insertBefore(banner, table);
  }

  // ── 행별 버튼 보장 (미주입 행만 처리) ──
  // 모든 행에 data-nz-vote-seen 마커를 붙임 → 옵저버가 신규 행 감지 가능
  function ensureRowButtons(table) {
    var freshSlugs = [];
    var allSlugs   = [];
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) {
      var row  = rows[i];
      // 이미 검사한 행: 슬러그가 있으면 allSlugs에만 추가하고 스킵
      if (row.hasAttribute('data-nz-vote-seen')) {
        var existing = row.getAttribute('data-nz-vote-row');
        if (existing) allSlugs.push(existing);
        continue;
      }
      // 신규 행: 마커부터 찍기 (슬러그 없는 행도 포함 → 무한 재시도 방지)
      row.setAttribute('data-nz-vote-seen', '1');

      var slug = getRowSlug(row);
      if (!slug) continue; // 슬러그 추출 실패한 행은 스킵 (마커는 이미 찍음)

      row.setAttribute('data-nz-vote-row', slug);
      allSlugs.push(slug);
      freshSlugs.push(slug);

      // 1) PC: 4번째 컬럼 추가
      var td = document.createElement('td');
      td.className = 'nz-vote-cell notion-collection-table__cell';
      td.appendChild(makeBtn(slug, 'pc'));
      row.appendChild(td);

      // 2) Mobile: 상태 셀 안에 버튼 추가 (CSS로 세로 스택 처리)
      var statusCell = row.querySelector('.notion-collection-table__cell.select');
      if (statusCell) {
        var inner = statusCell.querySelector('div') || statusCell;
        inner.appendChild(makeBtn(slug, 'mobile'));
      }
    }
    return { fresh: freshSlugs, all: allSlugs };
  }

  // ── 클릭 리스너 보장 (table에 1번만) ──
  function ensureClickHandler(table) {
    if (table.hasAttribute('data-nz-vote-listener')) return;
    table.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.nz-vote-btn');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      toggleVote(btn);
    });
    table.setAttribute('data-nz-vote-listener', '1');
  }

  // ── Supabase에서 투표 데이터 로드 ──
  function loadVotes(slugs) {
    if (!slugs || slugs.length === 0) return;
    var sessionId = getSessionId();
    var slugList  = slugs.map(function (s) { return '"' + s + '"'; }).join(',');
    supaReq('GET', TABLE + '?nazo_slug=in.(' + slugList + ')&select=nazo_slug,session_id')
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        var counts = {}, mine = {};
        if (Array.isArray(rows)) {
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            counts[r.nazo_slug] = (counts[r.nazo_slug] || 0) + 1;
            if (r.session_id === sessionId) mine[r.nazo_slug] = true;
          }
        }
        for (var j = 0; j < slugs.length; j++) {
          syncBtns(slugs[j], !!mine[slugs[j]], counts[slugs[j]] || 0);
        }
      })
      .catch(function (err) {
        console.warn('[나조토키] 투표 데이터 로딩 실패:', err);
        for (var k = 0; k < slugs.length; k++) syncBtns(slugs[k], false, 0);
      });
  }

  // ── 클릭 핸들러 (낙관적 업데이트 + 실패 시 롤백) ──
  function toggleVote(btn) {
    var slug = btn.getAttribute('data-slug');
    if (!slug) return;
    if (btn.classList.contains('loading')) return;

    var sessionId = getSessionId();
    var wasVoted  = btn.classList.contains('voted');
    var countEl   = btn.querySelector('.nz-vote-count');
    var prevCount = parseInt(countEl && countEl.textContent, 10) || 0;

    setLoading(slug, true);

    if (wasVoted) {
      // 취소: DELETE (낙관적 감소)
      syncBtns(slug, false, Math.max(0, prevCount - 1));
      supaReq('DELETE',
        TABLE + '?nazo_slug=eq.' + encodeURIComponent(slug) +
        '&session_id=eq.' + encodeURIComponent(sessionId))
        .then(function (res) {
          setLoading(slug, false);
          if (!res.ok) throw new Error('DELETE ' + res.status);
        })
        .catch(function (err) {
          console.warn('[나조토키] 투표 취소 실패:', err);
          syncBtns(slug, true, prevCount); // 롤백
          setLoading(slug, false);
        });
    } else {
      // 투표: POST (낙관적 증가)
      syncBtns(slug, true, prevCount + 1);
      supaReq('POST', TABLE, { nazo_slug: slug, session_id: sessionId })
        .then(function (res) {
          setLoading(slug, false);
          if (!res.ok) throw new Error('POST ' + res.status);
        })
        .catch(function (err) {
          console.warn('[나조토키] 투표 등록 실패:', err);
          syncBtns(slug, false, prevCount); // 롤백
          setLoading(slug, false);
        });
    }
  }

  // ── 비-투표 페이지로 전환 시 흔적 제거 ──
  function cleanupVoteUI() {
    document.body.classList.remove(BODY_CLASS);
    var stale = document.querySelector('.nz-vote-banner');
    if (stale) stale.remove();
  }

  // ── 주입 (idempotent) ──
  function injectAll() {
    if (!isVotePage()) {
      cleanupVoteUI();
      return;
    }
    var table = document.querySelector('.notion-collection-table');
    if (!table) return;

    document.body.classList.add(BODY_CLASS);
    ensureBanner(table);
    ensureSelectHeaderText(table);
    ensureHeader(table);
    ensureClickHandler(table);
    var result = ensureRowButtons(table);
    // 신규 행이 있을 때만 데이터 요청 (불필요한 Supabase 호출 방지)
    if (result.fresh.length > 0) loadVotes(result.fresh);
  }

  // ── 테이블 렌더 대기 후 시도 ──
  function tryInject(attempt) {
    attempt = attempt || 0;
    if (!isVotePage()) {
      document.body.classList.remove(BODY_CLASS);
      return;
    }
    if (document.querySelector('.notion-collection-table tbody tr')) {
      injectAll();
    } else if (attempt < 30) {
      setTimeout(function () { tryInject(attempt + 1); }, 300);
    }
  }

  // ── 옵저버: SPA 네비게이션 + 테이블 재렌더 대응 ──
  var voteLastUrl = location.href;
  var voteDebounce = null;
  var voteObserver = new MutationObserver(function () {
    // URL 변경 감지
    if (location.href !== voteLastUrl) {
      voteLastUrl = location.href;
      if (!isVotePage()) {
        cleanupVoteUI();
      } else {
        tryInject();
      }
      return;
    }
    if (!isVotePage()) return;
    if (voteDebounce) return;
    voteDebounce = setTimeout(function () {
      voteDebounce = null;
      var table = document.querySelector('.notion-collection-table');
      if (!table) return;
      // 검사 안 한 행이 하나라도 있으면 재주입 (신규 행, 필터/정렬 등으로 재렌더된 경우 모두 커버)
      if (table.querySelector('tbody tr:not([data-nz-vote-seen])')) injectAll();
    }, 250);
  });
  voteObserver.observe(document.body, { childList: true, subtree: true });

  // ── 초기 시도 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryInject(); });
  } else {
    tryInject();
  }
})();
