#!/bin/bash
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
printf 'Chi nap lai DU LIEU MAU trong tigershop_video_demo.\n'
DB_NAME=tigershop_video_demo "$DEMO_NODE" scripts/seed_test_data.js > "$DEMO_EVIDENCE/seed-web.log" 2>&1
printf 'Da nap lai8tai khoan,21san pham va voucher co ngay tuong doi.\n'
printf 'Chi chay truoc khi quay. Web3001vaAPI5101giu nguyen.\n'
demo_wait
