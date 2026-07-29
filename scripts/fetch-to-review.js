#!/usr/bin/env node
/**
 * 리뷰 예정 목록 동기화 스크립트
 *
 * Notion API로 '리뷰 예정 목록' 데이터베이스 전체를 읽어서
 *   - data/to-review.json  (목록 데이터)
 *   - data/images/         (각 행의 사진 다운로드본)
 * 을 생성/갱신한다.
 *
 * Notion에 업로드된 이미지 URL은 약 1시간 뒤 만료되는 서명 URL이라
 * JSON에 그대로 쓸 수 없다. 그래서 이미지를 저장소로 내려받고
 * JSON에는 저장소 내 상대 경로(data/images/...)를 기록한다.
 *
 * 필요한 환경변수: NOTION_TOKEN, NOTION_DB_ID
 * 실행: node scripts/fetch-to-review.js
 */

const fs = require('fs');
const path = require('path');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = process.env.NOTION_DB_ID;

if (!NOTION_TOKEN || !NOTION_DB_ID) {
  console.error('오류: NOTION_TOKEN / NOTION_DB_ID 환경변수가 필요합니다.');
  process.exit(1);
}

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const JSON_PATH = path.join(DATA_DIR, 'to-review.json');

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// content-type → 확장자 (URL에서 확장자를 못 얻을 때의 대비책)
const EXT_BY_CONTENT_TYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/avif': '.avif',
};

/** DB 전체 행을 페이지네이션 처리하며 조회 (생성 일시 오름차순 = 추가한 순서) */
async function fetchAllRows() {
  const rows = [];
  let cursor = undefined;

  do {
    const res = await fetch(`${NOTION_API}/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Notion API 오류 (${res.status}): ${body}`);
    }

    const data = await res.json();
    rows.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return rows;
}

/** title 속성 → 문자열 */
function getTitle(prop) {
  if (!prop || !Array.isArray(prop.title)) return '';
  return prop.title.map((t) => t.plain_text).join('').trim();
}

/** multi_select 속성 → "A, B" 형태 문자열 */
function getMultiSelect(prop) {
  if (!prop || !Array.isArray(prop.multi_select)) return '';
  return prop.multi_select.map((o) => o.name).join(', ');
}

/** select 속성 → 문자열 */
function getSelect(prop) {
  if (!prop || !prop.select) return '';
  return prop.select.name || '';
}

/** files 속성에서 첫 번째 파일의 URL과 종류를 얻는다 */
function getFirstFile(prop) {
  if (!prop || !Array.isArray(prop.files) || prop.files.length === 0) return null;
  const f = prop.files[0];
  if (f.type === 'file' && f.file) return { url: f.file.url, uploaded: true };
  if (f.type === 'external' && f.external) return { url: f.external.url, uploaded: false };
  return null;
}

/** URL 경로에서 확장자 추출 (쿼리스트링 제외) */
function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    if (ext && ext.length <= 6) return ext;
  } catch (_) {
    /* URL 파싱 실패 시 무시 */
  }
  return '';
}

/**
 * 이미지를 data/images/<행ID>.<확장자> 로 다운로드.
 * 같은 행 ID의 파일이 이미 있으면 재다운로드하지 않는다.
 * 반환값: 저장소 루트 기준 상대 경로 (예: "data/images/xxx.png")
 */
async function downloadImage(rowId, fileInfo, existingFiles) {
  // 이미 받아둔 파일이 있으면 그대로 사용
  const existing = existingFiles.get(rowId);
  if (existing) return `data/images/${existing}`;

  const res = await fetch(fileInfo.url);
  if (!res.ok) {
    throw new Error(`이미지 다운로드 실패 (${res.status}): ${fileInfo.url}`);
  }

  let ext = extFromUrl(fileInfo.url);
  if (!ext) {
    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
    ext = EXT_BY_CONTENT_TYPE[contentType] || '.jpg';
  }

  const filename = `${rowId}${ext}`;
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);
  existingFiles.set(rowId, filename);
  console.log(`  이미지 저장: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
  return `data/images/${filename}`;
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // 현재 data/images/ 에 있는 파일 목록 (행ID → 파일명)
  const existingFiles = new Map();
  for (const f of fs.readdirSync(IMAGES_DIR)) {
    const base = f.slice(0, f.length - path.extname(f).length);
    existingFiles.set(base, f);
  }

  console.log('Notion DB 조회 중...');
  const rows = await fetchAllRows();
  console.log(`총 ${rows.length}행 조회 완료`);

  const items = [];
  for (const row of rows) {
    const rowId = row.id.replace(/-/g, '');
    const props = row.properties;

    const name = getTitle(props['나조토키 제목']);
    const maker = getMultiSelect(props['제작사']);
    const status = getSelect(props['상태']);

    let image = null;
    const fileInfo = getFirstFile(props['사진']);
    if (fileInfo) {
      try {
        image = await downloadImage(rowId, fileInfo, existingFiles);
      } catch (err) {
        // 이미지 하나가 실패해도 전체 동기화는 계속한다
        console.error(`  경고: "${name}" 이미지 처리 실패 — ${err.message}`);
      }
    }

    items.push({ id: rowId, name, maker, status, image });
  }

  // DB에서 삭제된 행의 이미지 정리
  const currentIds = new Set(items.map((it) => it.id));
  for (const [base, filename] of existingFiles) {
    if (!currentIds.has(base)) {
      fs.unlinkSync(path.join(IMAGES_DIR, filename));
      console.log(`  삭제된 행의 이미지 제거: ${filename}`);
    }
  }

  const output = {
    updatedAt: new Date().toISOString(),
    count: items.length,
    items,
  };
  fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`완료: data/to-review.json (${items.length}건)`);
}

main().catch((err) => {
  console.error('동기화 실패:', err);
  process.exit(1);
});
