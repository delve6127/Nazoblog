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
// Super가 만들었던 행 페이지 슬러그 대응표 (기대돼요 투표 데이터 보존용).
// 여기 없는 새 행은 행 ID를 슬러그로 쓴다 (새 행에는 기존 투표가 없으므로 안전).
const SLUG_MAP_PATH = path.join(DATA_DIR, 'slug-map.json');

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
 * JPEG에서 EXIF 등 메타데이터 세그먼트를 제거한다 (이미지 화질은 그대로).
 * 아이폰 사진의 GPS 위치정보가 공개 저장소에 올라가는 것을 막기 위함.
 */
function stripJpegMetadata(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return buffer;
  const parts = [buffer.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buffer.length) {
    if (buffer[i] !== 0xff) break;
    const marker = buffer[i + 1];
    if (marker === 0xda) { // 이미지 데이터 시작 — 이후 전부 유지
      parts.push(buffer.subarray(i));
      return Buffer.concat(parts);
    }
    const segLen = buffer.readUInt16BE(i + 2);
    // APP1~APP15(EXIF/XMP 등)와 코멘트 세그먼트만 제거
    if (!((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe)) {
      parts.push(buffer.subarray(i, i + 2 + segLen));
    }
    i += 2 + segLen;
  }
  return buffer; // 구조가 예상과 다르면 원본 유지
}

// HEIC(아이폰 사진 형식)는 대부분의 브라우저가 표시하지 못하므로 JPEG로 변환한다.
// 워크플로가 heic-convert 패키지를 설치해 준다. 없으면 변환을 생략하고 경고만 남긴다.
let heicConvert = null;
try { heicConvert = require('heic-convert'); } catch (_) {}

// 목록 썸네일 용도이므로 긴 변 480px로 줄인다 (용량 절감 + 페이지 로딩 속도).
// sharp는 회전 보정 후 메타데이터 없이 다시 인코딩한다. 없으면 원본 크기 유지.
let sharp = null;
try { sharp = require('sharp'); } catch (_) {}

async function resizeIfLarge(filename) {
  if (!sharp) return;
  const p = path.join(IMAGES_DIR, filename);
  try {
    const meta = await sharp(p).metadata();
    if (Math.max(meta.width || 0, meta.height || 0) <= 480) return;
    const buf = await sharp(p).rotate().resize(480, 480, { fit: 'inside' }).toBuffer();
    fs.writeFileSync(p, buf);
    console.log(`  리사이즈: ${filename} (${meta.width}x${meta.height} → 긴 변 480px)`);
  } catch (err) {
    console.error(`  경고: ${filename} 리사이즈 실패 — ${err.message}`);
  }
}

async function toJpegIfHeic(filename) {
  if (!/\.(heic|heif)$/i.test(filename)) return filename;
  if (!heicConvert) {
    console.error(`  경고: heic-convert 미설치 — ${filename} 변환 생략 (브라우저에서 안 보일 수 있음)`);
    return filename;
  }
  const src = path.join(IMAGES_DIR, filename);
  const jpgName = filename.replace(/\.[^.]+$/, '.jpg');
  const out = await heicConvert({ buffer: fs.readFileSync(src), format: 'JPEG', quality: 0.9 });
  fs.writeFileSync(path.join(IMAGES_DIR, jpgName), Buffer.from(out));
  fs.unlinkSync(src);
  console.log(`  HEIC → JPEG 변환: ${jpgName}`);
  return jpgName;
}

/**
 * 이미지를 data/images/<행ID>.<확장자> 로 다운로드.
 * 같은 행 ID의 파일이 이미 있으면 재다운로드하지 않는다.
 * 반환값: 저장소 루트 기준 상대 경로 (예: "data/images/xxx.png")
 */
async function downloadImage(rowId, fileInfo, existingFiles) {
  // 이미 받아둔 파일이 있으면 그대로 사용 (HEIC로 남아있다면 변환만 수행)
  const existing = existingFiles.get(rowId);
  if (existing) {
    const converted = await toJpegIfHeic(existing);
    await resizeIfLarge(converted);
    existingFiles.set(rowId, converted);
    return `data/images/${converted}`;
  }

  const res = await fetch(fileInfo.url);
  if (!res.ok) {
    throw new Error(`이미지 다운로드 실패 (${res.status}): ${fileInfo.url}`);
  }

  let ext = extFromUrl(fileInfo.url);
  if (!ext) {
    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
    ext = EXT_BY_CONTENT_TYPE[contentType] || '.jpg';
  }

  let filename = `${rowId}${ext}`;
  let buffer = Buffer.from(await res.arrayBuffer());
  // sharp가 있으면 리사이즈 과정에서 메타데이터가 제거되므로, 없을 때만 직접 제거
  if (!sharp && /\.(jpg|jpeg)$/i.test(filename)) buffer = stripJpegMetadata(buffer);
  fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);
  console.log(`  이미지 저장: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
  filename = await toJpegIfHeic(filename);
  await resizeIfLarge(filename);
  existingFiles.set(rowId, filename);
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

  let slugMap = {};
  try {
    slugMap = JSON.parse(fs.readFileSync(SLUG_MAP_PATH, 'utf8'));
  } catch (_) {
    console.log('slug-map.json 없음 — 행 ID를 슬러그로 사용');
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

    items.push({ id: rowId, name, maker, status, image, slug: slugMap[rowId] || rowId });
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
