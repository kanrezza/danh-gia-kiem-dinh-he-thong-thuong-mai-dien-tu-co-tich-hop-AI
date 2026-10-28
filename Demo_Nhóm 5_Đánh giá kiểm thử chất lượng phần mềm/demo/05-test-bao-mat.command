#!/bin/bash
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
demo_run_jest bao-mat --runTestsByPath tests/integration/chat.test.js --testNamePattern 'CHAT-009:'
printf '\nASSERTION THUC CUA CHAT-009\n'
sed -n '74,91p' tests/integration/chat.test.js
printf '\nTEST XANH O TREN DANG XAC NHAN HANH VI LOI. DOI CHIEU HTTP THUC:\n'
"$DEMO_NODE" "$DEMO_TOOLS_DIR/proof-chat.cjs" "$DEMO_CURRENT_RUN/http-proof.json" 2>&1 | tee "$DEMO_CURRENT_RUN/http-proof.txt"
printf '\nDOAN ROUTE DANG KIEM TRA (KHONG SUA NGHIEP VU)\n'
sed -n '68,78p' routes/chatRoutes.js
demo_wait
