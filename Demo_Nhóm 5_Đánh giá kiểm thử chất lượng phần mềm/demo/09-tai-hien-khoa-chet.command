#!/bin/bash
# DEMO PERF-01: tai hien khoa chet cua giao dich dat hang tren CSDL rieng (xoa sach du lieu cua CSDL rieng nay)
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
DB=tigershop_video_khoachet
RUN="$DEMO_EVIDENCE/$(date '+%Y%m%d-%H%M%S')-khoa-chet"; mkdir -p "$RUN"
demo_heading | tee "$RUN/moi-truong.txt"
echo "Dung CSDL rieng $DB (khong dung CSDL web hay CSDL test)" | tee "$RUN/terminal.log"
docker exec tigershop-mysql mysql -uroot -e "DROP DATABASE IF EXISTS $DB; CREATE DATABASE $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
docker exec -i tigershop-mysql mysql -uroot $DB < "$DEMO_PROJECT_DIR/database/schema_full.sql"
DB_NAME=$DB NODE_PATH="$DEMO_BACKEND/node_modules" "$DEMO_NODE" "$DEMO_PROJECT_DIR/bao-cao-kiem-thu/performance/tai_hien_khoa_chet.js" 2>&1 | tee -a "$RUN/terminal.log"
demo_wait
