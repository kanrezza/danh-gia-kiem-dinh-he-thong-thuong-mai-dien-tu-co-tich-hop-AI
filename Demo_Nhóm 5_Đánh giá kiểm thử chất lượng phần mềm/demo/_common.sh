#!/bin/bash
set -euo pipefail
DEMO_TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_PROJECT_DIR="$(cd "$DEMO_TOOLS_DIR/../.." && pwd)"
DEMO_NODE='/usr/local/bin/node'
DEMO_RUNTIME="$($DEMO_NODE -e 'console.log(require(process.argv[1]).runtime)' "$DEMO_TOOLS_DIR/demo-config.json")"
DEMO_BACKEND="$DEMO_RUNTIME/backend"
DEMO_FRONTEND="$DEMO_RUNTIME/frontend"
DEMO_EVIDENCE="$DEMO_PROJECT_DIR/bo-thuyet-trinh/minh-chung-moi"
export TZ='Asia/Ho_Chi_Minh'
export PATH="/usr/local/bin:$PATH"
mkdir -p "$DEMO_EVIDENCE"
cd "$DEMO_BACKEND"
"$DEMO_NODE" -e 'const f=require("fs"); for(const p of ["tests/setup/env.js","tests/setup/db.js"]){if(!f.readFileSync(p,"utf8").includes("tigershop_video_test")) throw new Error("Cau hinh test chua cach ly: "+p)}'
demo_heading() {
  printf '\nTIGER SHOP - KIEM THU TRUC TIEP\n'
  date '+Thoi diem: %d/%m/%Y %H:%M:%S %Z'
  printf 'Node: '; "$DEMO_NODE" --version
  printf 'Database test: tigershop_video_test\n'
  printf 'Database web:  tigershop_video_demo (rieng)\n\n'
}
demo_wait() {
 if [ -t 0 ] && [ "${DEMO_NO_WAIT:-0}" != '1' ]; then
   printf '\nNhan Enter khi da xem xong... '; read -r _demo_reply
 fi
}
demo_run_jest() {
  local demo_label="$1"; shift
  DEMO_CURRENT_RUN="$DEMO_EVIDENCE/$(date '+%Y%m%d-%H%M%S')-$demo_label"
  mkdir -p "$DEMO_CURRENT_RUN"
  demo_heading | tee "$DEMO_CURRENT_RUN/moi-truong.txt"
  GEMINI_API_KEY=jest-mock-placeholder-only "$DEMO_NODE" node_modules/jest/bin/jest.js --runInBand --colors --verbose --json --outputFile "$DEMO_CURRENT_RUN/results.json" "$@" 2>&1 | tee "$DEMO_CURRENT_RUN/terminal.log"
  "$DEMO_NODE" "$DEMO_TOOLS_DIR/summarize.cjs" "$DEMO_CURRENT_RUN/results.json" | tee "$DEMO_CURRENT_RUN/tom-tat.txt"
}
