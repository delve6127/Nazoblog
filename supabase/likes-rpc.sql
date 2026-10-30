-- 좋아요(Likes)·기대돼요(ReviewRequests) 서버 함수 전환 (A안, 2026-10-30)
-- 실행: Supabase 대시보드 → SQL Editor. 단계별로 한 블록씩 복사해 Run.
-- 순서: 1단계 → 2단계 → (사이트 JS 배포, 10분 이상 대기) → 5단계. 문제 생기면 "되돌리기".
-- 배경: 두 표의 RLS 정책이 SELECT/INSERT/DELETE 모두 true라, 공개 키만으로 남의 session_id 조회와
--       아무 줄 삭제가 가능했다. 방문자는 아래 함수 창구만 쓰고, 표 직접 접근은 닫는다.


-- ───────────────────────────────────────────────────────────────
-- 1단계: 확인 + 백업 (기존 동작 영향 없음)
-- ───────────────────────────────────────────────────────────────

-- 1-a) RLS가 켜져 있는지 확인. 두 줄 모두 relrowsecurity = true 여야 5단계가 효과가 있다.
select relname, relrowsecurity from pg_class where relname in ('Likes', 'ReviewRequests');

-- 1-b) 백업 표. RLS를 켜고 정책을 두지 않아 사이트(API)에서는 보이지 않는다.
create table public."Likes_backup_20261030" as select * from public."Likes";
create table public."ReviewRequests_backup_20261030" as select * from public."ReviewRequests";
alter table public."Likes_backup_20261030" enable row level security;
alter table public."ReviewRequests_backup_20261030" enable row level security;
select (select count(*) from public."Likes_backup_20261030") as likes_backup,
       (select count(*) from public."ReviewRequests_backup_20261030") as requests_backup;


-- ───────────────────────────────────────────────────────────────
-- 2단계: 창구(함수) 만들기 (기존 동작 영향 없음 — 사이트는 아직 표를 직접 쓴다)
-- security definer = 함수 주인 권한으로 실행 → 5단계에서 표 정책을 지워도 함수는 동작
-- ───────────────────────────────────────────────────────────────

-- 좋아요: 이 글의 개수 + 내가 눌렀는지
create or replace function public.nz_like_status(p_slug text, p_sid text)
returns json
language sql stable security definer set search_path = public
as $$
  select json_build_object(
    'count', (select count(*) from "Likes" where page_slug = p_slug),
    'mine',  exists (select 1 from "Likes" where page_slug = p_slug and session_id = p_sid)
  );
$$;

-- 좋아요 누르기(p_on = true) / 취소(false). 내 session_id 줄만 건드린다
create or replace function public.nz_like_set(p_slug text, p_sid text, p_on boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_sid !~ '^nz_[0-9]+_[a-z0-9]*$'
     or p_slug !~ '^/(nazotoki-reviews|darakbang-note)/'
     or length(p_slug) > 300 then
    raise exception 'invalid input';
  end if;
  if p_on then
    insert into "Likes" (page_slug, session_id)
    select p_slug, p_sid
    where not exists (select 1 from "Likes" where page_slug = p_slug and session_id = p_sid);
  else
    delete from "Likes" where page_slug = p_slug and session_id = p_sid;
  end if;
end;
$$;

-- 기대돼요: 작품별 개수 + 내가 누른 작품 목록 (요청한 작품들만)
create or replace function public.nz_expect_status(p_slugs text[], p_sid text)
returns json
language sql stable security definer set search_path = public
as $$
  select json_build_object(
    'counts', coalesce((select json_object_agg(nazo_slug, n) from (
                 select nazo_slug, count(*) as n from "ReviewRequests"
                 where nazo_slug = any (p_slugs) group by nazo_slug) t), '{}'::json),
    'mine',   coalesce((select json_agg(nazo_slug) from "ReviewRequests"
                 where session_id = p_sid and nazo_slug = any (p_slugs)), '[]'::json)
  );
$$;

-- 기대돼요 누르기 / 취소. 내 session_id 줄만 건드린다
create or replace function public.nz_expect_set(p_slug text, p_sid text, p_on boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_sid !~ '^nz_[0-9]+_[a-z0-9]*$' or length(p_slug) = 0 or length(p_slug) > 200 then
    raise exception 'invalid input';
  end if;
  if p_on then
    insert into "ReviewRequests" (nazo_slug, session_id)
    select p_slug, p_sid
    where not exists (select 1 from "ReviewRequests" where nazo_slug = p_slug and session_id = p_sid);
  else
    delete from "ReviewRequests" where nazo_slug = p_slug and session_id = p_sid;
  end if;
end;
$$;

-- 실행 권한: 기본값(모두)을 거두고 사이트 방문자 역할에만 명시적으로 준다
revoke all on function public.nz_like_status(text, text) from public;
revoke all on function public.nz_like_set(text, text, boolean) from public;
revoke all on function public.nz_expect_status(text[], text) from public;
revoke all on function public.nz_expect_set(text, text, boolean) from public;
grant execute on function public.nz_like_status(text, text) to anon, authenticated;
grant execute on function public.nz_like_set(text, text, boolean) to anon, authenticated;
grant execute on function public.nz_expect_status(text[], text) to anon, authenticated;
grant execute on function public.nz_expect_set(text, text, boolean) to anon, authenticated;

-- 확인: 이 글의 개수가 숫자로 나오면 성공
select public.nz_like_status('/nazotoki-reviews/26', 'nz_0_check');


-- ───────────────────────────────────────────────────────────────
-- (3·4단계는 사이트 쪽: 함수를 쓰는 JS 배포 → 예전 JS 캐시가 빠지도록 10분 이상 대기)
-- ───────────────────────────────────────────────────────────────


-- ───────────────────────────────────────────────────────────────
-- 5단계: 표 직접 접근 닫기 (이후 방문자는 위 함수로만 접근)
-- ───────────────────────────────────────────────────────────────
drop policy "allow read"   on public."Likes";
drop policy "allow insert" on public."Likes";
drop policy "allow delete" on public."Likes";
drop policy "Allow public read"   on public."ReviewRequests";
drop policy "Allow public insert" on public."ReviewRequests";
drop policy "Allow public delete" on public."ReviewRequests";

-- 확인: 빈 결과(0줄)면 성공
select tablename, policyname from pg_policies where tablename in ('Likes', 'ReviewRequests');


-- ───────────────────────────────────────────────────────────────
-- 되돌리기 (5단계 이후 문제가 생기면 이것만 실행 → 예전과 똑같이 열림)
-- ───────────────────────────────────────────────────────────────
-- create policy "allow read"   on public."Likes" for select using (true);
-- create policy "allow insert" on public."Likes" for insert with check (true);
-- create policy "allow delete" on public."Likes" for delete using (true);
-- create policy "Allow public read"   on public."ReviewRequests" for select using (true);
-- create policy "Allow public insert" on public."ReviewRequests" for insert with check (true);
-- create policy "Allow public delete" on public."ReviewRequests" for delete using (true);
