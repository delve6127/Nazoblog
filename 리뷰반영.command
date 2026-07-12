#!/bin/zsh
# 🍋 노션 리뷰 데이터를 사이트에 반영 (더블클릭용)
cd "$(dirname "$0")"

echo "🍋 나조 데이터 동기화를 시작합니다..."
echo ""

# 이전 실행이 남긴 엑셀 재저장 노이즈 정리 (내용 변화 없는 재저장)
git checkout -- 검색어_맵핑.xlsx 2>/dev/null

python3 sync_nazo_data.py

if [[ -n "$(git status --porcelain nazo_data.json 검색어_맵핑.xlsx)" ]]; then
  echo ""
  echo "📤 사이트에 배포 중..."
  git add nazo_data.json 검색어_맵핑.xlsx
  git commit -m "리뷰 데이터 동기화 ($(date '+%Y-%m-%d %H:%M'))"
  git push origin main
  echo ""
  echo "✅ 배포 완료! 몇 분 안에 사이트에 반영됩니다."
else
  echo ""
  echo "✅ 변경사항이 없습니다 — 이미 최신 상태예요."
fi

echo ""
read -k 1 "?아무 키나 누르면 창이 닫힙니다."
