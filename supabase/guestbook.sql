-- 다락방 방명록(nz-gb) 서버 (2026-11-22)
-- 규칙 근거: 방명록_핸드오프/방명록_핸드오프.md (2·3·4·7·8·9장)
-- 실행: Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 Run.
--       여러 번 실행해도 안전하다(이미 있는 표·글은 그대로 두고 함수만 최신으로 바꾼다).
-- 기존 좋아요·기대돼요(Likes, ReviewRequests, nz_like_*, nz_expect_*)는 건드리지 않는다.
-- 방문자는 표를 직접 보지 못하고 맨 아래 함수 네 개로만 접근한다(likes-rpc.sql과 같은 방식).
-- 화면(JS) 쪽 주의: nickname·content·reply는 방문자가 쓴 원문 그대로다. 반드시 textContent/esc()로 그릴 것.


-- ───────────────────────────────────────────────────────────────
-- 1. 표 · 번호표 · 설정
-- ───────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;  -- 비밀번호 변환(crypt)용

create table if not exists public.nz_gb_posts (
  id         bigint generated always as identity primary key,
  nickname   text not null,
  content    text not null,
  created_at timestamptz not null default now(),   -- 분 단위 이상으로 저장, 화면에는 날짜만
  pw_hash    text not null,                        -- 변환된 비밀번호. 노션으로 복사하지 않는다
  entry_no   integer unique,                       -- 응모 번호. 이벤트 기간에 쓴 글만
  hidden     boolean not null default false,       -- 운영자 숨김
  reply      text,                                 -- 운영자 답글
  reply_date date,
  deleted_at timestamptz,   -- 방문자가 지운 글. 줄을 남겨 두는 이유: 지우고 바로 다시 쓰는 1분 제한 우회 방지 + 노션 연동이 지울 줄을 알아야 함
  ip_hash    text,          -- 접속 주소 변환값. 1분 제한용, 하루 뒤 비운다
  fail_count integer not null default 0,           -- 비밀번호 틀린 횟수 (글 기준)
  fail_at    timestamptz                           -- 마지막으로 틀린 시각
);

-- 설정은 한 줄만 존재한다. 날짜는 한국 날짜 기준, 시작일·종료일·발표일 모두 "그날 포함".
create table if not exists public.nz_gb_settings (
  id            boolean primary key default true check (id),
  event_start   date not null,
  event_end     date not null,
  announce_date date not null,
  ip_salt       text not null default gen_random_uuid()::text  -- 접속 주소 변환에 섞는 비밀값
);
insert into public.nz_gb_settings (event_start, event_end, announce_date)
values ('2026-11-30', '2026-12-13', '2026-12-20')
on conflict (id) do nothing;

-- 응모 번호표. 한 번 뽑힌 번호는 글을 지워도 다시 나오지 않는다.
create sequence if not exists public.nz_gb_entry_seq;

-- 표 직접 접근 차단: RLS를 켜고 정책을 두지 않으며, 방문자 역할의 권한도 거둔다.
-- (2026-10-30 이후 새 표는 권한이 자동으로 안 붙지만 확실히 해 둔다. 방문자는 아래 함수만 쓰므로 anon 권한이 필요 없다.)
alter table public.nz_gb_posts    enable row level security;
alter table public.nz_gb_settings enable row level security;
revoke all on table public.nz_gb_posts, public.nz_gb_settings from anon, authenticated;
revoke all on sequence public.nz_gb_entry_seq from anon, authenticated;
grant all on table public.nz_gb_posts, public.nz_gb_settings to service_role;  -- 3단계 노션 연동용(비밀 키 전용)
grant all on sequence public.nz_gb_entry_seq to service_role;


-- ───────────────────────────────────────────────────────────────
-- 2. 서버 함수
-- security definer = 함수 주인 권한으로 실행 → 방문자에게 표 권한이 없어도 함수는 동작
-- 결과는 항상 json. 실패하면 {"ok": false, "error": "<이유>"} — 화면이 이유에 맞는 문구를 보여 준다.
-- ───────────────────────────────────────────────────────────────

-- 목록: 최신순. p_before = 지금까지 본 마지막 글 id("글 더 보기"), 처음엔 비운다.
-- 숨김·삭제 글은 응답에 아예 넣지 않는다. 응모 번호·비밀번호도 넣지 않는다(has_ticket 여부만).
-- phase: pre(이벤트 전) / event(이벤트 중) / closed(마감 후 발표 전) / post(발표일 다음 날부터)
create or replace function public.nz_gb_list(p_before bigint default null, p_limit integer default 20)
returns json
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  s       nz_gb_settings;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_lim   integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_posts json;
  v_more  boolean;
begin
  select * into s from nz_gb_settings;

  select coalesce(json_agg(json_build_object(
           'id',         t.id,
           'nickname',   t.nickname,
           'content',    t.content,
           'date',       to_char(t.created_at at time zone 'Asia/Seoul', 'YYYY. MM. DD'),
           'has_ticket', t.entry_no is not null and v_today <= s.announce_date,
           'reply',      nullif(btrim(t.reply), ''),
           'reply_date', to_char(t.reply_date, 'YYYY. MM. DD')
         ) order by t.id desc) filter (where t.rn <= v_lim), '[]'::json),
         count(*) > v_lim
    into v_posts, v_more
    from (
      select p.*, row_number() over (order by p.id desc) as rn
        from nz_gb_posts p
       where p.deleted_at is null and not p.hidden
         and (p_before is null or p.id < p_before)
       order by p.id desc
       limit v_lim + 1
    ) t;

  return json_build_object(
    'phase', case when v_today <  s.event_start   then 'pre'
                  when v_today <= s.event_end     then 'event'
                  when v_today <= s.announce_date then 'closed'
                  else 'post' end,
    'total', (select count(*) from nz_gb_posts p where p.deleted_at is null and not p.hidden),
    'posts', v_posts,
    'has_more', v_more
  );
end;
$$;

-- 글쓰기. p_trap = 화면에 안 보이는 함정 칸(채워져 있으면 저장하지 않고 성공한 척한다).
-- error: nick / pw / content / too_long(over = 넘친 글자 수) / link / cooldown
create or replace function public.nz_gb_post(p_nick text, p_pw text, p_content text, p_trap text default '')
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  -- 닉네임: 줄바꿈 등 제어 문자를 공백으로 바꾸고 앞뒤 공백 제거
  v_nick    text := btrim(regexp_replace(coalesce(p_nick, ''), '[\x01-\x1F\x7F]', ' ', 'g'));
  -- 내용: 줄바꿈은 \n 하나로 통일, 그 밖의 제어 문자(탭 포함)는 공백으로, 앞뒤 공백·빈 줄 제거
  v_content text := btrim(regexp_replace(
                      replace(replace(coalesce(p_content, ''), E'\r\n', E'\n'), E'\r', E'\n'),
                      '[\x01-\x09\x0B-\x1F\x7F]', ' ', 'g'), E' \n');
  -- 눈에 안 보이는 글자만으로 채운 입력을 빈 칸으로 보기 위한 패턴
  c_blank   constant text := '[\s​-‍⁠﻿ㅤ　]';
  s         nz_gb_settings;
  v_today   date := (now() at time zone 'Asia/Seoul')::date;
  v_head    json;
  v_ip      text;
  v_iph     text;
  v_entry   integer;
  v_id      bigint;
begin
  if coalesce(p_trap, '') <> '' then
    return json_build_object('ok', true, 'id', null, 'entry_no', null);
  end if;

  if regexp_replace(v_nick, c_blank, '', 'g') = '' or char_length(v_nick) > 20 then
    return json_build_object('ok', false, 'error', 'nick');
  end if;
  if coalesce(p_pw, '') !~ '^[0-9]{4}$' then
    return json_build_object('ok', false, 'error', 'pw');
  end if;
  if regexp_replace(v_content, c_blank, '', 'g') = '' then
    return json_build_object('ok', false, 'error', 'content');
  end if;
  if char_length(v_content) > 500 then
    return json_build_object('ok', false, 'error', 'too_long', 'over', char_length(v_content) - 500);
  end if;
  -- 링크: http(s)://, www., 흔한 도메인 끝(.com 등), 그리고 "무엇.영문/"(bit.ly/…, t.me/… 같은 짧은 주소)
  -- shortcut: 경로 없는 드문 도메인(예: abc.me)은 통과한다. 그런 스팸이 실제로 오면 목록에 끝자리를 추가.
  if v_content ~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|kr|jp|xyz|info|shop|site|top|link)(?![a-z0-9])|[a-z0-9-]+\.[a-z]{2,}/)' then
    return json_build_object('ok', false, 'error', 'link');
  end if;

  -- 같은 접속 주소에서 1분 안에 다시 등록 금지. 주소는 원문 대신 비밀값을 섞은 변환값만 다룬다.
  begin
    v_head := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_head := null;
  end;
  v_ip := coalesce(nullif(btrim(v_head->>'cf-connecting-ip'), ''),
                   nullif(btrim(v_head->>'x-real-ip'), ''),
                   nullif(btrim(split_part(v_head->>'x-forwarded-for', ',', 1)), ''),
                   'unknown');
  select * into s from nz_gb_settings;
  v_iph := encode(digest(v_ip || s.ip_salt, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtext(v_iph));  -- 같은 주소의 동시 요청을 한 줄로 세워 둘 다 통과하는 일을 막는다
  if exists (select 1 from nz_gb_posts p
              where p.ip_hash = v_iph and p.created_at > now() - interval '1 minute') then
    return json_build_object('ok', false, 'error', 'cooldown');
  end if;

  -- 이벤트 기간(시작일~종료일, 한국 날짜)에 쓴 글에만 응모 번호. 모든 검사를 통과한 뒤에 뽑아 빈 번호를 줄인다.
  if v_today between s.event_start and s.event_end then
    v_entry := nextval('public.nz_gb_entry_seq')::integer;
  end if;

  insert into nz_gb_posts (nickname, content, pw_hash, entry_no, ip_hash)
  values (v_nick, v_content, crypt(p_pw, gen_salt('bf')), v_entry, v_iph)
  returning id into v_id;

  update nz_gb_posts set ip_hash = null
   where ip_hash is not null and created_at < now() - interval '1 day';

  return json_build_object(
    'ok', true, 'id', v_id, 'nickname', v_nick, 'content', v_content,
    'date', to_char(now() at time zone 'Asia/Seoul', 'YYYY. MM. DD'),
    'has_ticket', v_entry is not null,
    'entry_no', v_entry   -- 등록 직후 응모권 모달용. 이후에는 nz_gb_ticket(비밀번호 필요)으로만 볼 수 있다
  );
end;
$$;

-- (내부용) 비밀번호 확인 + 틀린 횟수 관리. 방문자는 직접 호출할 수 없다.
-- 글 기준으로 센다: 누가 시도하든 한 글은 10분에 5번까지. 5번째에 틀리면 그 시각부터 10분 잠금.
-- error: gone(없는 글·지운 글·숨긴 글) / wrong(left = 남은 횟수) / locked
create or replace function public.nz_gb_check_pw(p_id bigint, p_pw text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  r       nz_gb_posts;
  v_fails integer;
begin
  -- for update: 같은 글에 동시에 여러 번 찔러 보는 요청을 한 줄로 세운다
  select * into r from nz_gb_posts
   where id = p_id and deleted_at is null and not hidden
     for update;
  if not found then
    return json_build_object('ok', false, 'error', 'gone');
  end if;

  -- 마지막으로 틀린 지 10분이 지났으면 처음부터 다시 센다(잠금 해제 포함)
  v_fails := case when r.fail_at is null or r.fail_at <= now() - interval '10 minutes'
                  then 0 else r.fail_count end;
  if v_fails >= 5 then
    return json_build_object('ok', false, 'error', 'locked');  -- 잠긴 동안은 맞는 비밀번호도 받지 않는다
  end if;

  if coalesce(p_pw, '') ~ '^[0-9]{4}$' and r.pw_hash = crypt(p_pw, r.pw_hash) then
    update nz_gb_posts set fail_count = 0, fail_at = null where id = p_id;
    return json_build_object('ok', true);
  end if;

  v_fails := v_fails + 1;
  update nz_gb_posts set fail_count = v_fails, fail_at = now() where id = p_id;
  if v_fails >= 5 then
    return json_build_object('ok', false, 'error', 'locked');
  end if;
  return json_build_object('ok', false, 'error', 'wrong', 'left', 5 - v_fails);
end;
$$;

-- 글 삭제. 목록에서 사라지고(답글 포함) 응모 번호는 그대로 소진된다.
create or replace function public.nz_gb_delete(p_id bigint, p_pw text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  c json := nz_gb_check_pw(p_id, p_pw);
begin
  if (c->>'ok')::boolean then
    update nz_gb_posts set deleted_at = now() where id = p_id;
  end if;
  return c;
end;
$$;

-- 응모권 다시 보기. 발표일까지만. error: gone / no_ticket / wrong / locked
create or replace function public.nz_gb_ticket(p_id bigint, p_pw text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_nick  text;
  v_entry integer;
  c       json;
begin
  select p.nickname, p.entry_no into v_nick, v_entry
    from nz_gb_posts p
   where p.id = p_id and p.deleted_at is null and not p.hidden;
  if not found then
    return json_build_object('ok', false, 'error', 'gone');
  end if;
  -- 응모권이 없는 글이면 비밀번호를 받기 전에 돌려보낸다(틀린 횟수를 세지 않음)
  if v_entry is null or v_today > (select announce_date from nz_gb_settings) then
    return json_build_object('ok', false, 'error', 'no_ticket');
  end if;

  c := nz_gb_check_pw(p_id, p_pw);
  if not (c->>'ok')::boolean then
    return c;
  end if;
  return json_build_object('ok', true, 'nickname', v_nick, 'entry_no', v_entry);
end;
$$;


-- ───────────────────────────────────────────────────────────────
-- 3. 실행 권한: 기본값을 거두고, 방문자에게는 창구 네 개만 준다 (nz_gb_check_pw는 내부용이라 주지 않는다)
-- ───────────────────────────────────────────────────────────────
revoke all on function public.nz_gb_list(bigint, integer)          from public, anon, authenticated;
revoke all on function public.nz_gb_post(text, text, text, text)   from public, anon, authenticated;
revoke all on function public.nz_gb_delete(bigint, text)           from public, anon, authenticated;
revoke all on function public.nz_gb_ticket(bigint, text)           from public, anon, authenticated;
revoke all on function public.nz_gb_check_pw(bigint, text)         from public, anon, authenticated;
grant execute on function public.nz_gb_list(bigint, integer)        to anon, authenticated;
grant execute on function public.nz_gb_post(text, text, text, text) to anon, authenticated;
grant execute on function public.nz_gb_delete(bigint, text)         to anon, authenticated;
grant execute on function public.nz_gb_ticket(bigint, text)         to anon, authenticated;

-- 확인: {"phase" : "pre", "total" : 0, "posts" : [], "has_more" : false} 비슷하게 나오면 성공
select public.nz_gb_list();


-- ───────────────────────────────────────────────────────────────
-- 운영 메모 (필요할 때 해당 줄만 "--"를 떼고 실행)
-- ───────────────────────────────────────────────────────────────

-- 이벤트 날짜 바꾸기 (화면이 날짜에 맞춰 자동으로 바뀐다)
-- update public.nz_gb_settings set event_start = '2026-11-30', event_end = '2026-12-13', announce_date = '2026-12-20';

-- 오픈 직전 초기화: 시험 글 전부 삭제 + 응모 번호 1번부터 + 날짜 원래대로. ★오픈 뒤에는 절대 실행 금지★
-- delete from public.nz_gb_posts;
-- alter sequence public.nz_gb_entry_seq restart with 1;
-- update public.nz_gb_settings set event_start = '2026-11-30', event_end = '2026-12-13', announce_date = '2026-12-20';

-- 전부 없애기 (방명록을 접을 때만. 글이 모두 사라진다)
-- drop function public.nz_gb_list(bigint, integer), public.nz_gb_post(text, text, text, text),
--   public.nz_gb_delete(bigint, text), public.nz_gb_ticket(bigint, text), public.nz_gb_check_pw(bigint, text);
-- drop table public.nz_gb_posts, public.nz_gb_settings;
-- drop sequence public.nz_gb_entry_seq;
