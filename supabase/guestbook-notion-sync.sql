-- =====================================================================
-- 방명록(nz-gb) 3단계: 노션 연동
--
-- 하는 일 (1분마다 자동 실행):
--   1) 새 글을 노션 표에 한 줄씩 복사한다.
--   2) 노션에서 고친 세 칸(숨김 · 답글 · 답글 날짜)을 읽어 방명록에 반영한다.
--      답글을 적었는데 답글 날짜가 비어 있으면 그날 날짜를 노션에 채운다.
--   3) 방문자가 지운 글은 노션 줄을 휴지통으로 보내고, 이쪽 줄도 완전히 지운다.
--
-- 노션으로 보내는 값: 닉네임, 내용, 작성 시각, 응모 번호, 글 번호.
-- 보내지 않는 값: 비밀번호 변환값, 접속 주소 변환값.
--
-- 실행 전 준비: supabase/guestbook.sql (1단계)이 먼저 실행돼 있어야 한다.
-- 이 파일은 통째로 여러 번 실행해도 안전하다. 화면이 쓰는 창구 함수(nz_gb_list 등)는 건드리지 않는다.
-- 노션 토큰과 표 번호는 이 파일에 없다. 맨 아래 "설정" 안내대로 따로 넣는다.
--
-- 방식: Postgres 안에서 바깥 주소를 부르는 http 확장 + 1분 알람 pg_cron + 비밀 금고 Vault.
--   (pg_net은 PATCH를 못 보내서 노션 줄 수정·휴지통에 쓸 수 없다. 2026-11-22 공식 문서 확인)
-- 노션 API 버전은 리뷰 동기화(sync_nazo_data.py)가 매일 쓰고 있는 2025-09-03.
-- =====================================================================

create extension if not exists http with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

alter table public.nz_gb_posts    add column if not exists notion_page_id   text;         -- 노션 줄 주소. 비어 있으면 아직 안 보낸 글
alter table public.nz_gb_settings add column if not exists notion_ds_id     text;         -- 노션 표(데이터 소스) 번호
alter table public.nz_gb_settings add column if not exists notion_synced_at timestamptz;  -- 마지막으로 끝까지 성공한 시각

-- ---------------------------------------------------------------------
-- 노션에 요청 한 번 보내기. 돌려주는 값: {"status": 200, "body": {...}}
-- 연결 실패·시간 초과는 status 0. 주소는 노션으로 고정(다른 곳으로는 못 보낸다).
-- ---------------------------------------------------------------------
create or replace function public.nz_gb_notion(p_method text, p_path text, p_body jsonb, p_token text)
returns jsonb
language plpgsql set search_path = public, extensions
as $$
declare
  r      record;
  v_body jsonb;
begin
  select h.status, h.content into r
    from http((
      p_method,
      'https://api.notion.com/v1/' || p_path,
      array[http_header('Authorization', 'Bearer ' || p_token),
            http_header('Notion-Version', '2025-09-03')],
      'application/json',
      p_body::text
    )::http_request) h;
  begin
    v_body := r.content::jsonb;
  exception when others then
    v_body := jsonb_build_object('message', left(r.content, 200));
  end;
  return jsonb_build_object('status', r.status, 'body', v_body);
exception when others then
  return jsonb_build_object('status', 0, 'body', jsonb_build_object('message', sqlerrm));
end;
$$;

-- ---------------------------------------------------------------------
-- 노션 줄 하나(JSON)에서 반영할 값만 뽑는다. 표는 건드리지 않는다.
--   {"id", "hidden", "reply", "reply_date"}  정상
--   null                                      글 번호가 빈 줄(운영자가 손으로 만든 줄) → 무시
--   {"error": "columns"}                      칸 이름·종류가 바뀜 → 아무것도 반영하지 않는다
--     (칸을 못 찾았을 때 "숨김 아님"으로 읽어 숨긴 글이 되살아나는 사고 방지)
-- ---------------------------------------------------------------------
create or replace function public.nz_gb_parse_row(p_page jsonb)
returns jsonb
language plpgsql immutable
as $$
declare
  p       jsonb := p_page->'properties';
  v_reply text;
begin
  if p is null
     or not (p ?& array['글 번호', '숨김', '답글', '답글 날짜'])
     or not (p->'글 번호' ? 'number')
     or not (p->'답글 날짜' ? 'date')
     or jsonb_typeof(p->'숨김'->'checkbox') is distinct from 'boolean'
     or jsonb_typeof(p->'답글'->'rich_text') is distinct from 'array' then
    return jsonb_build_object('error', 'columns');
  end if;
  if jsonb_typeof(p->'글 번호'->'number') is distinct from 'number' then
    return null;
  end if;
  select string_agg(t.value->>'plain_text', '' order by t.ord) into v_reply
    from jsonb_array_elements(p->'답글'->'rich_text') with ordinality as t(value, ord);
  return jsonb_build_object(
    'id',         (p->'글 번호'->>'number')::numeric::bigint,
    'hidden',     (p->'숨김'->'checkbox')::boolean,
    'reply',      nullif(btrim(v_reply, E' \n\t'), ''),
    'reply_date', left(p->'답글 날짜'->'date'->>'start', 10)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 연동 한 바퀴. 돌려주는 값:
--   {"ok", "sent"(노션으로 보낸 글), "removed"(지운 글 정리), "read"(노션에서 읽은 줄),
--    "changed"(방명록에 반영된 글), "errors"[...]}
--   {"ok": false, "error": "not_set"}  토큰이나 표 번호가 아직 없음
--   {"ok": false, "error": "busy"}     다른 한 바퀴가 도는 중
--
-- 노션을 기다리는 동안 글 줄을 붙잡고 있으면 그 사이 방문자의 삭제·응모권 보기가 멈추므로,
-- 노션과의 통신을 먼저 다 끝내고 표에 적는 일은 맨 끝에 한꺼번에 한다.
--
-- shortcut: 새 글은 한 바퀴에 20개까지만 보낸다, 1분에 20개 넘게 몰리면 다음 분에 이어서 보냄(순서 유지).
-- shortcut: 노션 응답이 10초 넘게 걸려 끊기면 같은 글이 노션에 두 줄 생길 수 있다
--           (읽어 올 때 글 번호로 찾으므로 어느 줄을 고쳐도 반영되지만, 방문자가 글을 지우면 한 줄은 남는다).
--           자주 보이면 보내기 전에 글 번호로 먼저 찾아보도록 바꿀 것.
-- ---------------------------------------------------------------------
create or replace function public.nz_gb_sync()
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  s            nz_gb_settings;
  v_token      text;
  v_start      timestamptz := clock_timestamp();
  v_stop       timestamptz := clock_timestamp() + interval '20 seconds';
  v_today      date := (now() at time zone 'Asia/Seoul')::date;
  v_err        jsonb := '[]'::jsonb;
  r            record;
  v_res        jsonb;
  v_res2       jsonb;
  v_status     integer;
  v_sent_ids   bigint[] := '{}';
  v_sent_pages text[]   := '{}';
  v_gone       bigint[] := '{}';
  v_apply      jsonb := '{}'::jsonb;   -- 글 번호 → 노션에서 읽은 값 (같은 글이 두 번 나오면 나중에 고친 줄이 이긴다)
  v_page       jsonb;
  v_row        jsonb;
  v_query      jsonb;
  v_cursor     text;
  v_read       integer := 0;
  v_changed    integer := 0;
  v_done       boolean := false;       -- 노션에서 읽어 오기를 끝까지 마쳤는가
  v_bad        boolean := false;
begin
  if not pg_try_advisory_xact_lock(hashtext('nz_gb_sync')) then
    return jsonb_build_object('ok', false, 'error', 'busy');
  end if;
  select * into s from nz_gb_settings;
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'nz_gb_notion_token';
  if v_token is null or s.notion_ds_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_set');
  end if;
  begin  -- 요청 하나의 제한 시간을 기본 5초에서 10초로 (http 확장 버전에 따라 이 설정이 없을 수 있어 실패해도 넘어간다)
    perform set_config('http.curlopt_timeout_ms', '10000', true);
  exception when others then null;
  end;

  -- 1) 방문자가 지운 글: 노션 줄을 휴지통으로. 1분 연속 등록 제한이 끝난 뒤에 정리한다.
  for r in select p.id, p.notion_page_id from nz_gb_posts p
            where p.deleted_at is not null and p.created_at < now() - interval '1 minute'
            order by p.id limit 20
  loop
    exit when clock_timestamp() > v_stop;
    if r.notion_page_id is null then
      v_gone := array_append(v_gone, r.id);
      continue;
    end if;
    v_res := nz_gb_notion('PATCH', 'pages/' || r.notion_page_id, '{"in_trash": true}', v_token);
    v_status := (v_res->>'status')::integer;
    if v_status in (200, 404) then   -- 404: 노션에서 이미 완전히 지워진 줄
      v_gone := array_append(v_gone, r.id);
    else
      v_err := v_err || jsonb_build_object('step', 'remove', 'id', r.id, 'status', v_status,
                                           'message', left(v_res->'body'->>'message', 200));
      exit when v_status <> 400;
    end if;
  end loop;

  -- 2) 새 글을 노션으로
  for r in select p.id, p.nickname, p.content, p.created_at, p.entry_no from nz_gb_posts p
            where p.notion_page_id is null and p.deleted_at is null
            order by p.id limit 20
  loop
    exit when clock_timestamp() > v_stop;
    v_res := nz_gb_notion('POST', 'pages', jsonb_build_object(
      'parent', jsonb_build_object('type', 'data_source_id', 'data_source_id', s.notion_ds_id),
      'properties', jsonb_build_object(
        '닉네임',    jsonb_build_object('title',
                       jsonb_build_array(jsonb_build_object('text', jsonb_build_object('content', r.nickname)))),
        '내용',      jsonb_build_object('rich_text',
                       jsonb_build_array(jsonb_build_object('text', jsonb_build_object('content', r.content)))),
        '작성 시각', jsonb_build_object('date', jsonb_build_object('start',
                       to_char(r.created_at at time zone 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS') || '+09:00')),
        '응모 번호', jsonb_build_object('number', r.entry_no),
        '글 번호',   jsonb_build_object('number', r.id)
      )), v_token);
    v_status := (v_res->>'status')::integer;
    if v_status = 200 then
      v_sent_ids   := array_append(v_sent_ids, r.id);
      v_sent_pages := array_append(v_sent_pages, v_res->'body'->>'id');
    else
      v_err := v_err || jsonb_build_object('step', 'send', 'id', r.id, 'status', v_status,
                                           'message', left(v_res->'body'->>'message', 200));
      exit when v_status <> 400;   -- 400은 그 글만의 문제일 수 있어 다음 글로, 나머지(권한·한도·장애)는 다음 바퀴에 다시
    end if;
  end loop;

  -- 3) 노션에서 고친 줄 읽어 오기: 지난번 성공 시각 3분 전부터(노션의 수정 시각은 분 단위라 겹치게 읽는다)
  loop
    exit when clock_timestamp() > v_stop;
    v_query := jsonb_build_object('page_size', 100, 'sorts', jsonb_build_array(
                 jsonb_build_object('timestamp', 'last_edited_time', 'direction', 'ascending')));
    if s.notion_synced_at is not null then
      v_query := v_query || jsonb_build_object('filter', jsonb_build_object(
        'timestamp', 'last_edited_time',
        'last_edited_time', jsonb_build_object('on_or_after',
          to_char((s.notion_synced_at - interval '3 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))));
    end if;
    if v_cursor is not null then
      v_query := v_query || jsonb_build_object('start_cursor', v_cursor);
    end if;
    v_res := nz_gb_notion('POST', 'data_sources/' || s.notion_ds_id || '/query', v_query, v_token);
    v_status := (v_res->>'status')::integer;
    if v_status <> 200 then
      v_err := v_err || jsonb_build_object('step', 'read', 'status', v_status,
                                           'message', left(v_res->'body'->>'message', 200));
      exit;
    end if;
    for v_page in select e.value from jsonb_array_elements(coalesce(v_res->'body'->'results', '[]'::jsonb)) e
    loop
      v_read := v_read + 1;
      v_row := nz_gb_parse_row(v_page);
      continue when v_row is null;
      if v_row ? 'error' then
        v_err := v_err || jsonb_build_object('step', 'read',
                   'message', '노션 표의 칸 이름이나 종류가 바뀌었습니다 (글 번호·숨김·답글·답글 날짜)');
        v_bad := true;
        exit;
      end if;
      if v_row->>'reply' is not null and v_row->>'reply_date' is null then
        v_row := v_row || jsonb_build_object('reply_date', v_today);
        v_res2 := nz_gb_notion('PATCH', 'pages/' || (v_page->>'id'), jsonb_build_object('properties',
                    jsonb_build_object('답글 날짜', jsonb_build_object('date', jsonb_build_object('start', v_today)))),
                    v_token);
        if (v_res2->>'status')::integer <> 200 then
          v_err := v_err || jsonb_build_object('step', 'reply_date', 'id', v_row->'id',
                     'status', v_res2->'status', 'message', left(v_res2->'body'->>'message', 200));
        end if;
      end if;
      v_apply := v_apply || jsonb_build_object(v_row->>'id', v_row);
    end loop;
    exit when v_bad;
    if coalesce((v_res->'body'->>'has_more')::boolean, false) then
      v_cursor := v_res->'body'->>'next_cursor';
    else
      v_done := true;
      exit;
    end if;
  end loop;

  -- 4) 표에 적기 (여기부터는 노션을 기다리지 않는다)
  update nz_gb_posts p set notion_page_id = x.page
    from unnest(v_sent_ids, v_sent_pages) as x(id, page)
   where p.id = x.id;
  delete from nz_gb_posts where id = any(v_gone);
  update nz_gb_posts p
     set hidden     = (e.value->>'hidden')::boolean,
         reply      = e.value->>'reply',
         reply_date = (e.value->>'reply_date')::date
    from jsonb_each(v_apply) e
   where p.id = e.key::bigint and p.deleted_at is null
     and (p.hidden, p.reply, p.reply_date) is distinct from
         ((e.value->>'hidden')::boolean, e.value->>'reply', (e.value->>'reply_date')::date);
  get diagnostics v_changed = row_count;
  if v_done and jsonb_array_length(v_err) = 0 then
    update nz_gb_settings set notion_synced_at = v_start;   -- 오류가 있었으면 그대로 둬서 다음 바퀴가 같은 구간을 다시 읽는다
  end if;
  return jsonb_build_object(
    'ok',      jsonb_array_length(v_err) = 0,
    'sent',    coalesce(array_length(v_sent_ids, 1), 0),
    'removed', coalesce(array_length(v_gone, 1), 0),
    'read',    v_read,
    'changed', v_changed,
    'errors',  v_err
  );
end;
$$;

-- 방문자(브라우저)는 세 함수 모두 부를 수 없다. 1분 알람(postgres)만 부른다.
revoke all on function public.nz_gb_notion(text, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.nz_gb_parse_row(jsonb)                from public, anon, authenticated;
revoke all on function public.nz_gb_sync()                          from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 자가 점검: 노션 줄 읽기 규칙. 하나라도 틀리면 여기서 멈추고 이 파일 전체가 적용되지 않는다.
-- ---------------------------------------------------------------------
do $$
declare
  ok jsonb := '{"id": "page-1", "properties": {
    "글 번호":   {"number": 12},
    "숨김":      {"checkbox": true},
    "답글":      {"rich_text": [{"plain_text": "고마워요 "}, {"plain_text": "또 오세요"}]},
    "답글 날짜": {"date": {"start": "2026-12-01"}}}}';
begin
  assert public.nz_gb_parse_row(ok)
         = '{"id": 12, "hidden": true, "reply": "고마워요 또 오세요", "reply_date": "2026-12-01"}'::jsonb, '기본 읽기';
  assert public.nz_gb_parse_row(jsonb_set(ok, array['properties', '숨김', 'checkbox'], 'false'))->>'hidden' = 'false', '숨김 풀기';
  assert public.nz_gb_parse_row(jsonb_set(ok, array['properties', '답글', 'rich_text'], '[]'))->>'reply' is null, '답글 비우기';
  assert public.nz_gb_parse_row(jsonb_set(ok, array['properties', '답글', 'rich_text'], '[{"plain_text": "  "}]'))->>'reply' is null, '빈칸뿐인 답글';
  assert public.nz_gb_parse_row(jsonb_set(ok, array['properties', '답글 날짜', 'date'], 'null'))->>'reply_date' is null, '빈 답글 날짜';
  assert public.nz_gb_parse_row(jsonb_set(ok, array['properties', '답글 날짜', 'date'],
           '{"start": "2026-12-01T09:00:00.000+09:00"}'))->>'reply_date' = '2026-12-01', '시간이 붙은 답글 날짜';
  assert public.nz_gb_parse_row(jsonb_set(ok, array['properties', '글 번호', 'number'], 'null')) is null, '손으로 만든 줄은 무시';
  assert public.nz_gb_parse_row(ok #- array['properties', '숨김']) = '{"error": "columns"}'::jsonb, '칸이 없으면 오류';
  assert public.nz_gb_parse_row(jsonb_set(ok, array['properties', '숨김'], '{"select": null}'))
         = '{"error": "columns"}'::jsonb, '칸 종류가 바뀌면 오류';
  assert public.nz_gb_parse_row('{}'::jsonb) = '{"error": "columns"}'::jsonb, '빈 줄';
end $$;

-- ---------------------------------------------------------------------
-- 1분 알람. (같은 알람이 겹쳐 돌지는 않는다. 앞 바퀴가 끝나야 다음 바퀴가 시작된다)
-- ---------------------------------------------------------------------
select cron.unschedule(jobid) from cron.job where jobname in ('nz-gb-notion-sync', 'nz-gb-cron-cleanup');
select cron.schedule('nz-gb-notion-sync', '* * * * *', 'select public.nz_gb_sync()');
-- 알람 실행 기록은 저절로 지워지지 않아(하루 1,440줄) 사흘 지난 것은 하루 한 번 지운다.
select cron.schedule('nz-gb-cron-cleanup', '17 4 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '3 days'$$);

-- 실행하면 아래 결과로 알람 두 줄(nz-gb-cron-cleanup, nz-gb-notion-sync)이 보여야 한다.
select jobname, schedule, active from cron.job where jobname like 'nz-gb-%' order by jobname;

-- =====================================================================
-- 설정 (이 파일을 실행한 뒤 딱 한 번, SQL Editor 새 탭에서. 토큰은 이 파일에 적지 않는다)
--
--   update public.nz_gb_settings set notion_ds_id = '노션 표 번호';
--   select vault.create_secret('노션 토큰', 'nz_gb_notion_token', '방명록 노션 연동');
--
-- 토큰을 바꿀 때:
--   select vault.update_secret((select id from vault.secrets where name = 'nz_gb_notion_token'), '새 토큰');
--
-- 운영 메모
--   지금 바로 한 바퀴 돌려 결과 보기:  select public.nz_gb_sync();
--   최근 알람 기록:  select status, return_message, start_time from cron.job_run_details
--                    where jobid = (select jobid from cron.job where jobname = 'nz-gb-notion-sync')
--                    order by start_time desc limit 10;
--   잠깐 멈추기:  select cron.unschedule(jobid) from cron.job where jobname = 'nz-gb-notion-sync';
--   다시 켜기:    이 파일을 다시 실행
--   노션의 모든 줄을 처음부터 다시 읽게 하기:  update public.nz_gb_settings set notion_synced_at = null;
--
-- 노션에서 지킬 것
--   칸 이름(글 번호·숨김·답글·답글 날짜·닉네임·내용·작성 시각·응모 번호)과 칸 종류는 바꾸지 않는다.
--   글 번호 칸은 고치지 않는다(이 번호로 어느 글인지 찾는다).
--   글을 내리려면 줄을 지우지 말고 "숨김"에 체크한다. 줄을 휴지통에 넣어도 방명록 글은 그대로 남는다.
--
-- 오픈 직전 초기화 (guestbook.sql 맨 아래 순서에 더해서)
--   1) 노션 표의 시험 줄을 전부 선택해 삭제
--   2) delete from public.nz_gb_posts;  (글 번호는 1번으로 되돌리지 않는다: 노션에 남은 옛 줄과 번호가 겹치면 안 됨)
--   3) update public.nz_gb_settings set notion_synced_at = null;
--
-- 전부 없애기
--   select cron.unschedule(jobid) from cron.job where jobname like 'nz-gb-%';
--   drop function if exists public.nz_gb_sync(), public.nz_gb_parse_row(jsonb), public.nz_gb_notion(text, text, jsonb, text);
--   select vault.delete_secret(id) from vault.secrets where name = 'nz_gb_notion_token';   -- 안 되면 대시보드 Vault에서 삭제
-- =====================================================================
