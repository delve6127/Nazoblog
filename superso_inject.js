<script>
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
  var maxWait = setTimeout(hideLoader, 3000);
  var checkReady = setInterval(function() {
    var content = document.querySelector('.notion-collection-gallery') || document.querySelector('.super-content');
    if (content) {
      clearInterval(checkReady);
      clearTimeout(maxWait);
      setTimeout(hideLoader, 200);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryRender(); });
  } else {
    tryRender();
  }

})();

// ── 갤러리 검색 / 필터 / 정렬 ────────────────────────
(function () {
  'use strict';

  var GALLERY_SEL   = '.notion-collection-gallery';
  var CARD_SEL      = '.notion-collection-card.gallery';
  var TITLE_SEL     = '.notion-property__title';
  var COMPANY_SEL   = '.property-5667463f';
  var DIFF_SEL      = '.property-47784163';
  var RECOMMEND_SEL = '.property-646a6749';
  var OFFICIAL_SEL  = '.property-6d44666a';

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

  var PHONETIC_MAP = {
    'one operation':     ['원 오퍼레이션', '원오페', '원오퍼'],
    'twelve trick tiles':['트웰브 트릭 타일즈', '트웰브 트릭 타일스', '12 타일즈', '12 tiles', '12 타일스'],
    '26':                ['twenty six', '이십육', '트웬티 식스'],
    '무비무드 디저트 퍼즐 팩': ['무비무드'],
    'square maze':       ['스퀘어 메이즈', '스퀘어메이즈', '사각 미로', '사각미로'],
    'square maze -another-': ['스퀘어 메이저 어나더', '스퀘어메이즈어나더', '스퀘어메이즈 어나더', '사각 미로', '사각미로', '어나더'],
    'square maze -cosmos-':  ['스퀘어 메이즈 코스모스', '스퀘어메이즈 코스모스', '스퀘어메이즈코스모스', '사각 미로', '사각미로', '코스모스'],
    'hirameki trump gold':   ['히라메키 트럼프 골드', '히라메키트럼프 골드', '히라메키트럼프골드', '히라메키 트럼프골드', '트럼프', '골드', '히라메키'],
    'hirameki trump silver': ['히라메키 트럼프 실버', '히라메키트럼프 실버', '히라메키트럼프실버', '히라메키 트럼프실버', '히라메키', '트럼프', '실버'],
    'アルティメットナゾトキショウ (얼티밋 나조토키쇼)': ['얼티밋 나조토키쇼', '얼티밋나조토키쇼', '궁극의 나조토키쇼', '궁극의나조토키쇼', '얼티밋', '나조토키', '쇼'],
    'quick+lazy':            ['퀵레이지', '퀵앤레이지', '퀵플러스레이지', '퀵 레이지', '퀵 앤 레이지', '퀵 플러스 레이지', '퀵', '레이지'],
    'category':              ['카테고리'],
    'マスターからの挑戦錠':    ['마스터로부터의 도전장', '마스터로부터의 도전자물쇠', '마스터의 도전장', '마스터의 도전자물쇠', '마스터로부터의도전장', '마스터로부터의도전자물쇠', '마스터의도전장', '마스터의도전자물쇠', '마스터', '도전', '자물쇠', '도전장'],
    'white paper':           ['화이트 페이퍼', '화이트페이퍼', '하얀종이', '하얀 종이', '흰종이', '흰 종이', '백지', '페이퍼', '종이', '화이트'],
    '魔法の喫茶 épeler':      ['마법의 찻집', '에프레', '에펠레', '마법의 카페', '마법의찻집', '마법의카페', '카페', '마법']
  };

  var COMPANY_MAP = {
    'tumbleweed': ['텀블위드', '탐블위도', '탐블위드'],
    '키이스케이프': ['keyescape'],
    'nazoxnazo劇団': ['나조x나조극단', '나조x나조 극단', '나조나조극단', '나조x나조게키단', '나조나조게키단', '나조', '극단', '게키단'],
    'michi': ['미치'],
    'ぐずりあ': ['구스리아'],
    '時解き': ['토키토키', 'tokitoki', '토키', 'toki'],
    'mystery lunch': ['미스테리 런치', '미스터리 런치', '미스테리런치', '미스터리런치', '미스터리', '미스테리', '런치', '점심']
  };

  var SORT_DATA = {
    '무비무드 디저트 퍼즐 팩': { num: 1, date: '2026-03-07', diff: 2, satisfaction: 3,   puzzle: 3.5, gimmick: 3,   design: 3,   language: 4.5 },
    'Twelve Trick Tiles':      { num: 2, date: '2026-03-18', diff: 3, satisfaction: 5,   puzzle: 3.5, gimmick: 5,   design: 3.5, language: 2.5 },
    '26':                      { num: 3, date: '2026-03-22', diff: 4, satisfaction: 5,   puzzle: 4.5, gimmick: 5,   design: 3,   language: 2   },
    'ONE OPERATION':           { num: 4, date: '2026-03-25', diff: 3, satisfaction: 5,   puzzle: 4,   gimmick: 5,   design: 4.5, language: 2   },
    'sQuare mAze':             { num: 5, date: '2026-03-27', diff: 2, satisfaction: 4,   puzzle: 4.5, gimmick: 4.5, design: 3.5, language: 3.5 },
    'sQuare mAze -another-':   { num: 6, date: '2026-03-28', diff: 3, satisfaction: 4,   puzzle: 4,   gimmick: 4,   design: 3,   language: 3   },
    'sQuare mAze -cosmos-':    { num: 7, date: '2026-03-28', diff: 5, satisfaction: 4.5, puzzle: 4.5, gimmick: 4.5, design: 3.7, language: 2.5 },
    'HIRAMEKI TRUMP GOLD':     { num: 8, date: '2026-03-29', diff: 4, satisfaction: 4,   puzzle: 4,   gimmick: 4,   design: 3.5, language: 3.5 }
  };

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

  function buildAll() {
    buildSearch();
    buildFilterPanel();
    customizeCards();
    applyVisibility();
  }

  var galleryObserver = new MutationObserver(function () {
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;
    var searchWrap = document.getElementById('nz-search-wrap');
    if (!searchWrap || searchWrap.parentNode !== gallery.parentNode) {
      destroyAll();
      state.originalOrder = null;
      buildAll();
    }
    // 새 카드가 추가된 경우 커스텀 적용 + 페이지네이션 갱신
    var uncustomized = gallery.querySelector(CARD_SEL + ':not(.nz-card-custom)');
    if (uncustomized) {
      customizeCards();
      applyVisibility();
    }
  });
  galleryObserver.observe(document.body, { childList: true, subtree: true });

  if (document.querySelector(GALLERY_SEL)) buildAll();
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
    return decodeURIComponent(location.pathname).indexOf('구매처') !== -1;
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
    return decodeURIComponent(location.pathname).indexOf('리뷰-예정-목록') !== -1;
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

</script>