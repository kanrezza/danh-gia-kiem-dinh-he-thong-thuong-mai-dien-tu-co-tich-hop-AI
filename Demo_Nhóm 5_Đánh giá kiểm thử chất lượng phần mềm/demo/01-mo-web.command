#!/bin/bash
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
demo_heading
docker start tigershop-mysql >/dev/null
if ! curl -fsS http://127.0.0.1:5101/api/products >/dev/null; then
  cd "$DEMO_BACKEND"
  nohup "$DEMO_NODE" server.js > "$DEMO_EVIDENCE/web-api.log" 2>&1 < /dev/null &
fi
if ! curl -fsS http://127.0.0.1:3001/ >/dev/null; then
  cd "$DEMO_FRONTEND"
  BROWSER=none HOST=127.0.0.1 PORT=3001 DISABLE_ESLINT_PLUGIN=true nohup "$DEMO_NODE" node_modules/react-scripts/scripts/start.js > "$DEMO_EVIDENCE/web-ui.log" 2>&1 < /dev/null &
fi
printf 'Web: http://127.0.0.1:3001/login\nAPI: http://127.0.0.1:5101/api/products\n'
printf 'Neu frontend vua khoi dong, doi khoang 20-40 giay.\n'
printf 'Mo Chrome va truy cap URL web o tren. Khong dung cong3000/5000.\n'
demo_wait
