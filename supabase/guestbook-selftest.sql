-- 방명록 서버 자가 점검 (guestbook.sql을 실행한 뒤에 돌린다)
-- ★오픈 전에만 실행★ — 실제 방문자가 글을 쓰는 중에는 실행 금지(끝에서 응모 번호표를 시험 전 위치로 되감기 때문).
-- 실행: Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 Run.
-- 성공: 맨 아래 결과에 "방명록 자가 점검 통과"가 나온다.
-- 실패: 빨간 오류에 어느 규칙이 틀렸는지 한글로 나온다. 그 문구를 그대로 알려 주면 된다.
-- 시험 글과 바꾼 날짜는 마지막의 rollback으로 모두 원래대로 돌아간다.

begin;

do $$
declare
  j        json;
  a        bigint;   -- 첫 시험 글
  b        bigint;   -- 둘째 시험 글
  c        bigint;   -- 마감 뒤에 쓴 글
  n1       integer;
  n2       integer;
  t0       integer;
  cnt      bigint;
  i        integer;
  v_last   bigint;
  v_called boolean;
  v_today  date := (now() at time zone 'Asia/Seoul')::date;
  v_read   boolean;
  v_call   boolean;
begin
  select last_value, is_called into v_last, v_called from public.nz_gb_entry_seq;

  -- 이벤트 기간 한가운데로 맞춘다. 기존 글의 접속 주소 기록은 비워 1분 제한에 걸리지 않게 한다.
  update public.nz_gb_settings set event_start = v_today - 1, event_end = v_today + 1, announce_date = v_today + 2;
  update public.nz_gb_posts set ip_hash = null;

  -- 1) 정상 등록: 공백 정리, 줄바꿈 통일, 비밀번호 변환, 응모 번호 발급
  j := public.nz_gb_post('  시험이  ', '1234', E'첫 줄\r\n둘째 줄\t끝  \n');
  assert (j->>'ok')::boolean, '정상 등록이 실패함: ' || j::text;
  a  := (j->>'id')::bigint;
  n1 := (j->>'entry_no')::integer;
  assert n1 is not null and (j->>'has_ticket')::boolean, '이벤트 기간인데 응모 번호가 없음';
  assert j->>'nickname' = '시험이', '닉네임 앞뒤 공백이 지워지지 않음';
  assert (select content from public.nz_gb_posts where id = a) = E'첫 줄\n둘째 줄 끝',
         '내용 정리가 예상과 다름: ' || (select content from public.nz_gb_posts where id = a);
  assert (select pw_hash from public.nz_gb_posts where id = a) like '$2%', '비밀번호가 변환되지 않고 저장됨';

  -- 2) 1분 연속 등록 제한
  j := public.nz_gb_post('시험이', '1234', '바로 또 씁니다');
  assert j->>'error' = 'cooldown', '1분 제한이 걸리지 않음: ' || j::text;
  update public.nz_gb_posts set ip_hash = null;

  -- 3) 입력 검사 (거부된 글은 저장되지 않으므로 1분 제한과 무관)
  assert public.nz_gb_post('', '1234', '내용')->>'error' = 'nick', '빈 닉네임이 통과함';
  assert public.nz_gb_post(E' ​ㅤ ', '1234', '내용')->>'error' = 'nick', '안 보이는 글자뿐인 닉네임이 통과함';
  assert public.nz_gb_post(repeat('가', 21), '1234', '내용')->>'error' = 'nick', '21자 닉네임이 통과함';
  assert public.nz_gb_post('닉', '123', '내용')->>'error' = 'pw', '3자리 비밀번호가 통과함';
  assert public.nz_gb_post('닉', '12a4', '내용')->>'error' = 'pw', '숫자가 아닌 비밀번호가 통과함';
  assert public.nz_gb_post('닉', '12345', '내용')->>'error' = 'pw', '5자리 비밀번호가 통과함';
  assert public.nz_gb_post('닉', '1234', E' \n \n')->>'error' = 'content', '빈 내용이 통과함';
  j := public.nz_gb_post('닉', '1234', repeat('가', 503));
  assert j->>'error' = 'too_long' and (j->>'over')::integer = 3, '글자 수 초과 계산이 틀림: ' || j::text;
  assert public.nz_gb_post('닉', '1234', '여기 보세요 https://example.com/a')->>'error' = 'link', 'https 링크가 통과함';
  assert public.nz_gb_post('닉', '1234', 'WWW.Example.Com 놀러오세요')->>'error' = 'link', 'www 링크가 통과함';
  assert public.nz_gb_post('닉', '1234', '구경 오세요 abc-shop.co.kr')->>'error' = 'link', '도메인만 쓴 링크가 통과함';
  assert public.nz_gb_post('닉', '1234', '문의는 t.me/abcd')->>'error' = 'link', '짧은 주소가 통과함';
  assert (select count(*) from public.nz_gb_posts where id > a) = 0, '거부된 글이 저장됨';

  -- 링크가 아닌 글은 통과해야 한다 (마침표·빗금이 있어도)
  j := public.nz_gb_post('둘째', '0000', '재밌었어요.다음에 또 올게요! ver.2 기대, 별점 4.5/5 🍋');
  assert (j->>'ok')::boolean, '링크가 없는 글이 거부됨: ' || j::text;
  b  := (j->>'id')::bigint;
  n2 := (j->>'entry_no')::integer;
  assert n2 > n1, '응모 번호가 순서대로 늘지 않음';
  update public.nz_gb_posts set ip_hash = null;

  -- 500자 꽉 채운 글은 통과
  j := public.nz_gb_post('긴글', '5555', repeat('가', 500));
  assert (j->>'ok')::boolean, '500자 글이 거부됨: ' || j::text;
  update public.nz_gb_posts set ip_hash = null, deleted_at = now() where id = (j->>'id')::bigint;

  -- 4) 함정 칸: 성공한 척하고 저장하지 않는다
  select count(*) into cnt from public.nz_gb_posts;
  j := public.nz_gb_post('봇', '1234', '광고입니다', 'filled');
  assert (j->>'ok')::boolean and j->>'id' is null, '함정 칸 응답이 예상과 다름: ' || j::text;
  assert (select count(*) from public.nz_gb_posts) = cnt, '함정 칸에 걸린 글이 저장됨';

  -- 5) 목록: 최신순, 응모 번호·비밀번호 미포함, 더 보기
  j  := public.nz_gb_list();
  t0 := (j->>'total')::integer;
  assert j->>'phase' = 'event', '이벤트 중인데 phase가 ' || (j->>'phase');
  assert (j->'posts'->0->>'id')::bigint = b, '최신 글이 맨 위가 아님';
  assert (j->'posts'->0->>'has_ticket')::boolean, '이벤트 글인데 has_ticket이 아님';
  assert j->'posts'->0->>'date' = to_char(v_today, 'YYYY. MM. DD'), '날짜 형식이 다름: ' || (j->'posts'->0->>'date');
  assert j::text not like '%entry_no%' and j::text not like '%pw_hash%' and j::text not like '%ip_hash%',
         '목록에 숨겨야 할 값이 들어 있음';
  j := public.nz_gb_list(null, 1);
  assert json_array_length(j->'posts') = 1 and (j->>'has_more')::boolean, '한 개씩 불러오기가 틀림';
  j := public.nz_gb_list(b, 1);
  assert (j->'posts'->0->>'id')::bigint = a, '글 더 보기의 다음 글이 틀림';

  -- 6) 비밀번호: 4번까지 남은 횟수 안내, 5번째에 잠금, 잠긴 동안은 맞아도 거부, 10분 뒤 풀림
  for i in 1..4 loop
    j := public.nz_gb_ticket(a, '0000');
    assert j->>'error' = 'wrong' and (j->>'left')::integer = 5 - i, i || '번째 틀림 응답이 다름: ' || j::text;
  end loop;
  j := public.nz_gb_ticket(a, '0000');
  assert j->>'error' = 'locked', '5번 틀렸는데 잠기지 않음: ' || j::text;
  assert public.nz_gb_ticket(a, '1234')->>'error' = 'locked', '잠긴 동안 맞는 비밀번호가 통함(응모권)';
  assert public.nz_gb_delete(a, '1234')->>'error' = 'locked', '잠긴 동안 맞는 비밀번호가 통함(삭제)';
  update public.nz_gb_posts set fail_at = now() - interval '9 minutes' where id = a;
  assert public.nz_gb_ticket(a, '1234')->>'error' = 'locked', '10분이 되기 전에 잠금이 풀림';
  update public.nz_gb_posts set fail_at = now() - interval '11 minutes' where id = a;
  j := public.nz_gb_ticket(a, '1234');
  assert (j->>'ok')::boolean and (j->>'entry_no')::integer = n1 and j->>'nickname' = '시험이',
         '잠금이 풀린 뒤 응모권 보기가 실패함: ' || j::text;
  -- 맞히면 횟수가 초기화된다
  assert (public.nz_gb_ticket(a, '0000')->>'left')::integer = 4, '맞힌 뒤에 틀린 횟수가 초기화되지 않음';
  assert (public.nz_gb_ticket(a, '1234')->>'ok')::boolean, '횟수 초기화 확인 실패';

  -- 7) 숨김: 목록·개수에서 빠지고, 풀면 돌아온다
  update public.nz_gb_posts set hidden = true where id = b;
  j := public.nz_gb_list();
  assert (j->>'total')::integer = t0 - 1 and (j->'posts'->0->>'id')::bigint = a, '숨긴 글이 목록에 남아 있음';
  assert public.nz_gb_ticket(b, '0000')->>'error' = 'gone', '숨긴 글의 응모권이 보임';
  update public.nz_gb_posts set hidden = false where id = b;
  j := public.nz_gb_list();
  assert (j->>'total')::integer = t0 and (j->'posts'->0->>'id')::bigint = b, '숨김을 풀어도 돌아오지 않음';

  -- 8) 삭제: 틀린 비밀번호는 거부, 지우면 목록에서 사라지고 번호는 재사용되지 않는다
  assert public.nz_gb_delete(a, '9999')->>'error' = 'wrong', '틀린 비밀번호로 삭제됨';
  j := public.nz_gb_delete(a, '1234');
  assert (j->>'ok')::boolean, '맞는 비밀번호인데 삭제 실패: ' || j::text;
  assert (public.nz_gb_list()->>'total')::integer = t0 - 1, '지운 글이 개수에 남아 있음';
  assert public.nz_gb_delete(a, '1234')->>'error' = 'gone', '이미 지운 글이 또 지워짐';
  assert public.nz_gb_ticket(a, '1234')->>'error' = 'gone', '지운 글의 응모권이 보임';
  j := public.nz_gb_post('셋째', '2222', '지운 뒤에 쓴 글');
  assert (j->>'entry_no')::integer > n2, '지운 글의 응모 번호가 재사용됨: ' || j::text;
  update public.nz_gb_posts set ip_hash = null;

  -- 9) 마감 후 발표 전: 새 글에는 번호가 없고, 이벤트 글의 응모권은 계속 볼 수 있다
  update public.nz_gb_settings set event_start = v_today - 10, event_end = v_today - 1, announce_date = v_today;
  j := public.nz_gb_post('늦은이', '1111', '마감 뒤에 쓴 글');
  assert (j->>'ok')::boolean and j->>'entry_no' is null and not (j->>'has_ticket')::boolean,
         '마감 뒤 글에 응모 번호가 나옴: ' || j::text;
  c := (j->>'id')::bigint;
  assert public.nz_gb_list()->>'phase' = 'closed', '발표일 당일인데 phase가 closed가 아님';
  assert public.nz_gb_ticket(c, '1111')->>'error' = 'no_ticket', '번호 없는 글의 응모권이 보임';
  assert (public.nz_gb_ticket(b, '0000')->>'ok')::boolean, '발표일 당일인데 이벤트 글의 응모권이 안 보임';

  -- 10) 발표일 다음 날부터: 응모권 보기가 모두 사라진다
  update public.nz_gb_settings set announce_date = v_today - 1;
  j := public.nz_gb_list(null, 50);
  assert j->>'phase' = 'post', '발표일이 지났는데 phase가 post가 아님';
  assert not exists (select 1 from json_array_elements(j->'posts') e where (e->>'has_ticket')::boolean),
         '발표일이 지났는데 응모권 보기가 남아 있음';
  assert public.nz_gb_ticket(b, '0000')->>'error' = 'no_ticket', '발표일이 지났는데 응모권이 보임';

  -- 11) 이벤트 전
  update public.nz_gb_settings set event_start = v_today + 1, event_end = v_today + 2, announce_date = v_today + 3;
  assert public.nz_gb_list()->>'phase' = 'pre', '이벤트 전인데 phase가 pre가 아님';

  -- 12) 방문자(anon) 권한: 창구 함수는 쓸 수 있고, 표와 내부 함수는 쓸 수 없다
  set local role anon;
  j := public.nz_gb_list();
  begin
    perform 1 from public.nz_gb_posts limit 1;
    v_read := true;
  exception when insufficient_privilege then
    v_read := false;
  end;
  begin
    perform public.nz_gb_check_pw(b, '0000');
    v_call := true;
  exception when insufficient_privilege then
    v_call := false;
  end;
  reset role;
  assert not v_read, '방문자가 글 표를 직접 읽을 수 있음';
  assert not v_call, '방문자가 내부 함수(nz_gb_check_pw)를 직접 부를 수 있음';

  -- 응모 번호표를 시험 전 위치로 되감는다 (rollback은 번호표를 되돌리지 않으므로 직접)
  perform setval('public.nz_gb_entry_seq', v_last, v_called);
end;
$$;

rollback;

select '방명록 자가 점검 통과' as result;
