#!/bin/bash
# DEMO ZAP: quet chu dong OWASP ZAP qua dac ta OpenAPI vao may chu kiem thu rieng (cong 5001)
# Nen chay TRUOC khi quay (mat vai phut), khi quay chi mo bao cao vua sinh ra.
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
SEC_PORT=5001; SEC_DB=tigershop_video_test
RUN="$DEMO_EVIDENCE/$(date '+%Y%m%d-%H%M%S')-quet-zap"; mkdir -p "$RUN"
demo_heading | tee "$RUN/moi-truong.txt"
echo "BUOC 1. Nap lai du lieu mau vao $SEC_DB va khoi dong may chu o cong $SEC_PORT" | tee "$RUN/terminal.log"
DB_NAME=$SEC_DB "$DEMO_NODE" scripts/seed_test_data.js > "$RUN/seed.log" 2>&1
OLD=$(lsof -ti tcp:$SEC_PORT -sTCP:LISTEN 2>/dev/null || true); if [ -n "$OLD" ]; then kill $OLD 2>/dev/null || true; sleep 1; fi
DB_NAME=$SEC_DB PORT=$SEC_PORT nohup "$DEMO_NODE" server.js > "$RUN/server.log" 2>&1 < /dev/null &
SPID=$!
for i in $(seq 1 30); do curl -fsS "http://127.0.0.1:$SEC_PORT/api/categories" >/dev/null 2>&1 && break; sleep 1; done
echo "BUOC 2. OWASP ZAP quet chu dong 56 duong dan GET trong dac ta OpenAPI (vai phut)" | tee -a "$RUN/terminal.log"
cp "$DEMO_PROJECT_DIR/bao-cao-kiem-thu/security/openapi_tigershop.json" "$RUN/"
chmod 777 "$RUN"
docker run --rm -v "$RUN:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py -t /zap/wrk/openapi_tigershop.json -f openapi -r zap_api_report.html -J zap_api_report.json -I 2>&1 | tee -a "$RUN/terminal.log" || true
kill $SPID 2>/dev/null || true
"$DEMO_NODE" "$DEMO_TOOLS_DIR/tom-tat-zap.cjs" "$RUN/zap_api_report.json" | tee "$RUN/tom-tat.txt" || true
open -a "Google Chrome" "$RUN/zap_api_report.html" || true
demo_wait
