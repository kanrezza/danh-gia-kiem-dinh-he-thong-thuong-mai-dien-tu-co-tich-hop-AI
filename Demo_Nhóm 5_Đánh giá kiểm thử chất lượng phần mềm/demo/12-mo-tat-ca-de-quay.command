#!/bin/bash
# Mo cung luc moi thu can cho buoi quay: web, slide, kich ban, Excel, cac tab Chrome
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
P="$DEMO_PROJECT_DIR"
docker start tigershop-mysql >/dev/null
if ! curl -fsS http://127.0.0.1:5101/api/products >/dev/null 2>&1; then
  cd "$DEMO_BACKEND"; nohup "$DEMO_NODE" server.js > "$DEMO_EVIDENCE/web-api.log" 2>&1 < /dev/null &
fi
if ! curl -fsS http://127.0.0.1:3001/ >/dev/null 2>&1; then
  cd "$DEMO_FRONTEND"; BROWSER=none HOST=127.0.0.1 PORT=3001 DISABLE_ESLINT_PLUGIN=true nohup "$DEMO_NODE" node_modules/react-scripts/scripts/start.js > "$DEMO_EVIDENCE/web-ui.log" 2>&1 < /dev/null &
  echo "Dang khoi dong giao dien, cho khoang 30 giay..."; sleep 30
fi
open -a "Microsoft PowerPoint" "$P/bo-thuyet-trinh/Slide_thuyet_trinh_Tiger_Shop.pptx"
open -a "Microsoft Word" "$P/bo-thuyet-trinh/Kich_ban_thuyet_trinh_Tiger_Shop.docx"
open -a "Microsoft Excel" "$P/bao-cao-kiem-thu/Tiger_Shop_TestCases.xlsx"
open -a "Google Chrome" "http://127.0.0.1:3001/login"
ZAP=$(ls -d "$DEMO_EVIDENCE"/*-quet-zap 2>/dev/null | tail -1)
if [ -n "$ZAP" ] && [ -f "$ZAP/zap_api_report.html" ]; then open -a "Google Chrome" "$ZAP/zap_api_report.html"; else echo "Chua co bao cao ZAP: hay chay 11-quet-zap.command"; fi
DEMO_NO_WAIT=1 bash "$DEMO_TOOLS_DIR/07-mo-coverage.command" < /dev/null || echo "Chua mo duoc coverage: hay chay 06 roi 07."
open -na "Google Chrome" --args --incognito "http://127.0.0.1:3001/login"
open "$DEMO_TOOLS_DIR"
printf '\nDa mo: slide, kich ban Word, Excel test case, Chrome (Tab 1 dang nhap, Tab 3 bao cao ZAP, Tab 4 coverage), cua so an danh (Tab 2), thu muc demo.\n'
printf 'Web: http://127.0.0.1:3001/login   API: http://127.0.0.1:5101\n'
demo_wait
