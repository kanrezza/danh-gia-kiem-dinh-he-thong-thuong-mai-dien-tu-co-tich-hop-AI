#!/bin/bash
# DEMO HIEU NANG: chay JMeter truc tiep tren CSDL tai rieng, khong dung du lieu web
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
export PATH="/opt/homebrew/bin:$PATH"
PERF_DB=tigershop_video_perf; PERF_PORT=5201
USERS=${USERS:-100}; LOOPS=${LOOPS:-20}
SRC="$DEMO_PROJECT_DIR/bao-cao-kiem-thu/performance"
RUN="$DEMO_EVIDENCE/$(date '+%Y%m%d-%H%M%S')-hieu-nang"; mkdir -p "$RUN"
demo_heading | tee "$RUN/moi-truong.txt"
echo "BUOC 1. Dung CSDL tai rieng $PERF_DB: tai khoan mau va 200 san pham ton kho 999" | tee -a "$RUN/terminal.log"
docker exec tigershop-mysql mysql -uroot -e "DROP DATABASE IF EXISTS $PERF_DB; CREATE DATABASE $PERF_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
docker exec -i tigershop-mysql mysql -uroot $PERF_DB < "$DEMO_PROJECT_DIR/database/schema_full.sql"
DB_NAME=$PERF_DB "$DEMO_NODE" scripts/seed_test_data.js > "$RUN/seed.log" 2>&1
{ for i in $(seq 22 200); do echo "INSERT INTO products (name, price, original_price, description, stock, category_id, manager_id, status, display_type) VALUES ('San pham tai $i', 150000, 180000, 'Du lieu kiem thu tai', 999, (SELECT id FROM categories ORDER BY id LIMIT 1), (SELECT id FROM users WHERE email='manager@tigershop.test'), 'active', 'general');"; done
  echo "UPDATE products SET stock = 999, status = 'active';"; } | docker exec -i tigershop-mysql mysql -uroot $PERF_DB
docker exec tigershop-mysql mysql -uroot -N $PERF_DB -e "SELECT CONCAT('   So san pham: ', COUNT(*), ', ton kho nho nhat: ', MIN(stock)) FROM products" | tee -a "$RUN/terminal.log"
echo "BUOC 2. Khoi dong may chu kiem thu tai o cong $PERF_PORT" | tee -a "$RUN/terminal.log"
OLD=$(lsof -ti tcp:$PERF_PORT -sTCP:LISTEN 2>/dev/null || true); if [ -n "$OLD" ]; then kill $OLD 2>/dev/null || true; sleep 1; fi
DB_NAME=$PERF_DB PORT=$PERF_PORT nohup "$DEMO_NODE" server.js > "$RUN/server.log" 2>&1 < /dev/null &
SPID=$!
for i in $(seq 1 30); do curl -fsS "http://127.0.0.1:$PERF_PORT/api/categories" >/dev/null 2>&1 && break; sleep 1; done
echo "BUOC 3. Lay ma dang nhap cho 5 tai khoan" | tee -a "$RUN/terminal.log"
cp "$SRC/tiger_shop_load.jmx" "$SRC/gen_tokens.js" "$RUN/"
BASE="http://127.0.0.1:$PERF_PORT" "$DEMO_NODE" "$RUN/gen_tokens.js" 2>&1 | tee -a "$RUN/terminal.log"
echo "BUOC 4. JMeter: $USERS nguoi dung dong thoi x $LOOPS vong x 5 kich ban" | tee -a "$RUN/terminal.log"
cd "$RUN"
jmeter -n -t tiger_shop_load.jmx -Jhost=127.0.0.1 -Jport=$PERF_PORT -Jusers=$USERS -Jramp=1 -Jloops=$LOOPS -l ket-qua.jtl -j jmeter.log -e -o dashboard 2>&1 | tee -a "$RUN/terminal.log"
"$DEMO_NODE" "$DEMO_TOOLS_DIR/tom-tat-jtl.cjs" "$RUN/ket-qua.jtl" | tee "$RUN/tom-tat.txt"
echo "BUOC 5. Doi chieu kich thuoc phan hoi loi voi tung thong bao loi co the co cua createOrder" | tee -a "$RUN/tom-tat.txt"
mkdir -p "$DEMO_RUNTIME/bao-cao-kiem-thu/performance"
cp "$SRC/kiem_tra_kich_thuoc_loi.js" "$DEMO_RUNTIME/bao-cao-kiem-thu/performance/"
"$DEMO_NODE" "$DEMO_RUNTIME/bao-cao-kiem-thu/performance/kiem_tra_kich_thuoc_loi.js" 2>&1 | tee -a "$RUN/tom-tat.txt"
kill $SPID 2>/dev/null || true
rm -f "$RUN/tokens.csv"
echo "Bao cao HTML cua JMeter: $RUN/dashboard/index.html"
open -a "Google Chrome" "$RUN/dashboard/index.html"
demo_wait
