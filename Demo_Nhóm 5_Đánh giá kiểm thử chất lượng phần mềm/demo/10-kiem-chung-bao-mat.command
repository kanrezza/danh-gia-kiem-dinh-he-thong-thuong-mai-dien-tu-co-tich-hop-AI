#!/bin/bash
# DEMO BAO MAT: chay 47 phep kiem chung bao mat tren may chu kiem thu rieng (cong 5001, CSDL test)
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
SEC_PORT=5001; SEC_DB=tigershop_video_test
RUN="$DEMO_EVIDENCE/$(date '+%Y%m%d-%H%M%S')-kiem-chung-bao-mat"; mkdir -p "$RUN"
demo_heading | tee "$RUN/moi-truong.txt"
echo "BUOC 1. Nap lai du lieu mau vao $SEC_DB va khoi dong may chu o cong $SEC_PORT" | tee "$RUN/terminal.log"
DB_NAME=$SEC_DB "$DEMO_NODE" scripts/seed_test_data.js > "$RUN/seed.log" 2>&1
OLD=$(lsof -ti tcp:$SEC_PORT -sTCP:LISTEN 2>/dev/null || true); if [ -n "$OLD" ]; then kill $OLD 2>/dev/null || true; sleep 1; fi
DB_NAME=$SEC_DB PORT=$SEC_PORT nohup "$DEMO_NODE" server.js > "$RUN/server.log" 2>&1 < /dev/null &
SPID=$!
for i in $(seq 1 30); do curl -fsS "http://127.0.0.1:$SEC_PORT/api/categories" >/dev/null 2>&1 && break; sleep 1; done
echo "BUOC 2. Chay security_probe.js (7 nhom rui ro OWASP)" | tee -a "$RUN/terminal.log"
mkdir -p "$DEMO_RUNTIME/bao-cao-kiem-thu/security"
cp "$DEMO_PROJECT_DIR/bao-cao-kiem-thu/security/security_probe.js" "$DEMO_RUNTIME/bao-cao-kiem-thu/security/"
echo "   Dang chay 47 phep kiem chung, mat khoang 2 phut (co cho het han muc dang nhap 60 giay)..."
echo "   Chi tiet tung phep thu duoc ghi vao $RUN/terminal.log"
BASE="http://127.0.0.1:$SEC_PORT" "$DEMO_NODE" "$DEMO_RUNTIME/bao-cao-kiem-thu/security/security_probe.js" >> "$RUN/terminal.log" 2>&1
grep -E "^TONG:" "$RUN/terminal.log" || true
cp "$DEMO_RUNTIME/bao-cao-kiem-thu/security/ket_qua_bao_mat.json" "$RUN/ket_qua_bao_mat.json"
"$DEMO_NODE" "$DEMO_TOOLS_DIR/tom-tat-bao-mat.cjs" "$RUN/ket_qua_bao_mat.json" | tee "$RUN/tom-tat.txt"
kill $SPID 2>/dev/null || true
demo_wait
