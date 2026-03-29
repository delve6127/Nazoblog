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
    purchase:     'property-48527e3b'
  };

  // ── 값 읽기 헬퍼 ─────────────────────────────────────

  // 속성 ID로 notion-property 엘리먼트 가져오기
  function getEl(id) {
    return document.querySelector('.' + id);
  }

  // 텍스트 속성값 읽기 (M번째나조, 제작사, 소요시간)
  function getTextVal(id) {
    var el = getEl(id);
    if (!el) return '';
    // 텍스트 속성은 notion-property div 안에 값이 바로 있거나 자식 span에 있음
    var inner = el.querySelector('span, p, div:not([class*="notion-page__property-icon"])');
    var val = inner ? inner.textContent.trim() : el.textContent.trim();
    return val;
  }

  // 날짜 속성값 읽기 → "2026년 3월 22일" 형식으로 변환
  var MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6,
                 Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };

  function getDateVal(id) {
    var el = getEl(id);
    if (!el) return '';
    var timeEl = el.querySelector('time');
    var raw = timeEl
      ? (timeEl.getAttribute('datetime') || timeEl.textContent.trim())
      : (el.querySelector('span') || el).textContent.trim();
    // ISO 형식: 2026-03-22
    var isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return isoMatch[1] + '년 ' + parseInt(isoMatch[2]) + '월 ' + parseInt(isoMatch[3]) + '일';
    }
    // "Mar 25, 2026" 형식
    var engMatch = raw.match(/([A-Za-z]+)\s+(\d+),\s*(\d{4})/);
    if (engMatch && MONTHS[engMatch[1]]) {
      return engMatch[3] + '년 ' + MONTHS[engMatch[1]] + '월 ' + parseInt(engMatch[2]) + '일';
    }
    return raw;
  }

  // Select 속성값 읽기 (텍스트 + 색상 클래스)
  function getSelectVal(id) {
    var el = getEl(id);
    if (!el) return { text: '', cls: '' };
    var pill = el.querySelector('.notion-pill');
    if (!pill) return { text: '', cls: '' };
    return { text: pill.textContent.trim(), cls: pill.className };
  }

  // Multi-select 속성값 읽기 (배열로 반환)
  function getMultiSelectVals(id) {
    var el = getEl(id);
    if (!el) return [];
    return Array.from(el.querySelectorAll('.notion-pill')).map(function (pill) {
      return { text: pill.textContent.trim(), cls: pill.className };
    });
  }

  // 숫자 속성값 읽기 (점수 1~5)
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
    return 'badge-gray';
  }

  // ── badge 색상 클래스 → 실제 색상값 ──────────────────
  var BADGE_COLORS = {
    'badge-red':    { bg: '#F5C4B3', color: '#993C1D' },
    'badge-blue':   { bg: '#B5D4F4', color: '#185FA5' },
    'badge-green':  { bg: '#C0DD97', color: '#3B6D11' },
    'badge-purple': { bg: '#EEEDFE', color: '#3C3489' },
    'badge-orange': { bg: '#FDDCB5', color: '#9A4500' },
    'badge-yellow': { bg: '#FDF3C0', color: '#8A6A00' },
    'badge-pink':   { bg: '#F9D0E0', color: '#8A2044' },
    'badge-gray':   { bg: '#f1efe8', color: '#5F5E5A' }
  };

  // ── O/X 사용여부 뱃지 생성 ───────────────────────────
  function usageBadge(type, val) {
    if (!val.text) return '';
    var isO = val.text.trim() === 'O';
    var color = isO ? 'badge-blue' : 'badge-red';
    var label = type === 'line'    ? (isO ? 'LINE 사용'   : 'LINE 미사용')
              : type === 'web'     ? (isO ? 'WEB 사용'    : 'WEB 미사용')
              : type === 'audio'   ? (isO ? '음성 듣기 필요'   : '음성 듣기 불필요')
              :                      (isO ? '재활용 가능' : '재활용 불가');
    return '<span class="badge ' + color + '">' + label + '</span>';
  }

  // ── 체감 난이도 5단계 인디케이터 ────────────────────
  var DIFF_STEPS = ['아주 쉬움', '쉬움', '보통', '어려움', '아주 어려움'];

  function buildDiffSteps(selected, badgeColorCls) {
    var c = BADGE_COLORS[badgeColorCls] || BADGE_COLORS['badge-purple'];
    return DIFF_STEPS.map(function (s) {
      var isActive = s === selected;
      var label = s === '아주 쉬움'   ? '아주<br>쉬움'
                : s === '아주 어려움' ? '아주<br>어려움'
                : s;
      var style = isActive
        ? ' style="background:' + c.bg + ';color:' + c.color + ';font-weight:600;"'
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

    // 배경 또는 닫기 버튼 클릭 시 닫기
    document.getElementById('nz-lightbox-backdrop').addEventListener('click', nzLightboxClose);
    document.getElementById('nz-lightbox-close').addEventListener('click', nzLightboxClose);

    // ESC 키로 닫기
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

      // JS rAF 애니메이션 (CSS keyframe 캐시 문제 없음)
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
    var company      = getTextVal(ID.company);
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

    // HTML 조립
    var html = ''
      + '<div class="nz-review-wrap"><div class="nz-card">'
      + '<div class="nz-pc-layout">'

      // ── 왼쪽 컬럼 (헤더 + 난이도) ──
      + '<div class="nz-col-left">'

      // 헤더
      + '<div class="nz-header">'
      +   '<div class="nz-title-row">'
      +     '<span class="nz-title-main">' + nazoTitle + '</span>'
      +     (mNum ? '<span class="nz-title-sub">' + mNum + '</span>' : '')
      +   '</div>'
      +   '<div class="nz-badges">'
      +     (company ? '<span class="badge badge-red">' + company + '</span>' : '')
      +     (recommend.text ? '<span class="badge ' + pillToColor(recommend.cls) + '">' + recommend.text + '</span>' : '')
      +   '</div>'
      + '</div>'

      // 난이도
      + '<div class="nz-section">'
      +   '<p class="nz-section-title">난이도</p>'
      +   '<div class="nz-grid2">'
      +     '<div class="nz-cell nz-cell-center">'
      +       '<p class="nz-cell-label">공식 난이도</p>'
      +       (officialDiffs.length
               ? '<div class="nz-official-diff-wrap' + (officialDiffs.length > 1 ? ' nz-official-diff-wrap--multi' : '') + '">'
                 + officialDiffs.map(function (d) {
                     return '<span class="badge badge-lg ' + pillToColor(d.cls) + '">' + d.text + '</span>';
                   }).join('')
                 + '</div>'
               : '<span class="nz-cell-value">-</span>')
      +     '</div>'
      +     '<div class="nz-cell">'
      +       '<p class="nz-cell-label">체감 난이도</p>'
      +       '<div class="nz-diff-steps">' + buildDiffSteps(personalDiff.text, pillToColor(personalDiff.cls)) + '</div>'
      +     '</div>'
      +   '</div>'
      + '</div>'

      // 플레이 기록
      + '<div class="nz-section">'
      +   '<p class="nz-section-title">플레이 기록</p>'
      +   '<div class="nz-grid2">'
      +     '<div class="nz-cell"><p class="nz-cell-label">플레이 날짜</p><p class="nz-cell-value">' + (playDate || '-') + '</p></div>'
      +     '<div class="nz-cell"><p class="nz-cell-label">참여 인원</p><p class="nz-cell-value">' + (players || '-') + '</p></div>'
      +     '<div class="nz-cell"><p class="nz-cell-label">공식 소요시간</p><p class="nz-cell-value">' + (officialTime || '-') + '</p></div>'
      +     '<div class="nz-cell"><p class="nz-cell-label">실제 소요시간</p><p class="nz-cell-value">' + (actualTime || '-') + '</p></div>'
      +   '</div>'
      + '</div>'

      + '</div>' // nz-col-left

      // ── 오른쪽 컬럼 (점수 분석 + 추가 정보) ──
      + '<div class="nz-col-right">'

      // 점수 분석
      + '<div class="nz-section">'
      +   '<p class="nz-section-title">점수 분석</p>'
      +   buildRadar(scores)
      + '</div>'

      // 추가 정보
      + '<div class="nz-section">'
      +   '<p class="nz-section-title">추가 정보</p>'
      +   '<div class="nz-badges">'
      +     usageBadge('line', line)
      +     usageBadge('web', web)
      +     usageBadge('audio', audio)
      +     usageBadge('recycle', recycle)
      +   '</div>'
      + '</div>'

      // 구입처
      + '<div class="nz-section">'
      +   '<p class="nz-section-title">구입처</p>'
      +   '<div class="nz-badges">'
      +     (purchase.text ? '<span class="badge ' + pillToColor(purchase.cls) + '">' + purchase.text + '</span>' : '<span class="nz-cell-value">-</span>')
      +   '</div>'
      + '</div>'

      + '</div>' // nz-col-right
      + '</div>' // nz-pc-layout
      + '</div></div>'; // nz-card / nz-review-wrap

    // 속성 컨테이너 찾기
    var propsContainer = document.querySelector(
      '.notion-page__properties, [class*="notion-page__properties"]'
    );
    if (!propsContainer) {
      console.warn('[나조토키] 속성 컨테이너를 찾을 수 없습니다.');
      return;
    }

    // 커스텀 카드 삽입
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    propsContainer.parentNode.insertBefore(wrapper, propsContainer);

    // 기본 속성 목록 숨기기
    propsContainer.style.display = 'none';

    // 원본 타이틀 숨기기 (카드 헤더에 포함됐으므로)
    if (titleEl) titleEl.style.display = 'none';

    // 나조 설명 (콜아웃) → 카드 안으로 이동
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

    // 플레이 사진
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

    // 라이트박스 초기화 (한 번만)
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

  // ── Super.so hydration 이후에도 레이아웃 유지 ──────────
  var nzObserver = null;
  var nzRendering = false;
  var nzDebounceTimer = null;

  function startObserver() {
    if (nzObserver) nzObserver.disconnect();

    nzObserver = new MutationObserver(function () {
      // 디바운스: 마지막 DOM 변경 후 200ms 뒤에 한 번만 실행
      if (nzDebounceTimer) clearTimeout(nzDebounceTimer);
      nzDebounceTimer = setTimeout(function () {
        // 우리 레이아웃이 사라졌고, Notion 속성이 다시 나타난 경우 → 재적용
        if (!document.querySelector('.nz-review-wrap') &&
            document.querySelector('.' + ID.satisfaction) &&
            !nzRendering) {
          nzRendering = true;
          nzObserver.disconnect();
          render();
          wrapDiary();
          nzRendering = false;
          startObserver(); // 다시 감시 시작
        }
      }, 200);
    });

    nzObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ── 초기 실행 ─────────────────────────────────────────
  function tryRender(attempt) {
    attempt = attempt || 0;
    if (document.querySelector('.' + ID.satisfaction)) {
      render();
      wrapDiary();
      startObserver();
    } else if (attempt < 30) {
      setTimeout(function () { tryRender(attempt + 1); }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryRender(); });
  } else {
    tryRender();
  }

})();

// ── 갤러리 검색 ───────────────────────────────────────
(function () {
  'use strict';

  var GALLERY_SEL = '.notion-collection-gallery';
  var CARD_SEL    = '.notion-collection-card.gallery';
  var TITLE_SEL   = '.notion-property__title';
  var COMPANY_SEL = '.property-5667463f';

  // 외국어 나조 한국어 발음 맵핑
  var PHONETIC_MAP = {
    'one operation':     ['원 오퍼레이션', '원오페', '원오퍼'],
    'twelve trick tiles':['트웰브 트릭 타일즈', '트웰브 트릭 타일스', '12 타일즈', '12 tiles', '12 타일스'],
    '26':                ['twenty six', '이십육', '트웬티 식스']
  };

  // 브랜드 한국어/영어 발음 맵핑
  var COMPANY_MAP = {
    'tumbleweed': ['텀블위드', '탐블위도', '탐블위드'],
    '키이스케이프': ['keyescape']
  };

  function runSearch(q) {
    var cards = document.querySelectorAll(CARD_SEL);
    var visible = 0;
    cards.forEach(function (card) {
      var title   = (card.querySelector(TITLE_SEL)   || { textContent: '' }).textContent.trim().toLowerCase();
      var company = (card.querySelector(COMPANY_SEL) || { textContent: '' }).textContent.toLowerCase();
      var phonetics = PHONETIC_MAP[title] || [];
      var companyPhonetics = COMPANY_MAP[company.trim()] || [];
      var match = !q
        || title.indexOf(q) > -1
        || company.indexOf(q) > -1
        || phonetics.some(function (p) { return p.indexOf(q) > -1; })
        || companyPhonetics.some(function (p) { return p.indexOf(q) > -1; });
      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    var countEl = document.getElementById('nz-search-count');
    if (countEl) countEl.textContent = q ? visible + '개' : '';
  }

  function buildSearch() {
    if (document.getElementById('nz-search-wrap')) return;
    var gallery = document.querySelector(GALLERY_SEL);
    if (!gallery) return;

    var wrap = document.createElement('div');
    wrap.id = 'nz-search-wrap';
    wrap.innerHTML =
      '<span id="nz-search-icon">🔍</span>'
      + '<input id="nz-search" type="text" placeholder="나조 이름 또는 브랜드로 검색">'
      + '<span id="nz-search-count"></span>';
    gallery.parentNode.insertBefore(wrap, gallery);

    document.getElementById('nz-search').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      runSearch(this.value.trim().toLowerCase());
    });
  }

  // 갤러리 등장을 MutationObserver로 감지 (초기 로드 + SPA 재진입)
  var searchObserver = new MutationObserver(function () {
    if (document.querySelector(GALLERY_SEL) && !document.getElementById('nz-search-wrap')) {
      buildSearch();
    }
  });
  searchObserver.observe(document.body, { childList: true, subtree: true });

  if (document.querySelector(GALLERY_SEL)) buildSearch();
})();
