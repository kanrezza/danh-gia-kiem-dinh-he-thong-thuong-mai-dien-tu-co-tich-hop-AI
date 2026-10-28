#!/bin/bash
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
# Neu server coverage cu (cua chinh bo demo) con giu cong 5120 nhung khong tra loi, dung no de mo lai
COV_PIDS=$(lsof -ti tcp:5120 -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$COV_PIDS" ] && ! curl -fsS -m 3 -o /dev/null http://127.0.0.1:5120/ 2>/dev/null; then
  for p in $COV_PIDS; do
    if ps -ww -p "$p" -o command= 2>/dev/null | grep -q "CoverageHandler"; then
      kill "$p" 2>/dev/null || true
      echo "Da dung server coverage cu bi treo (pid $p), dang mo lai."
    fi
  done
  sleep 1
fi
"$DEMO_NODE" - "$DEMO_TOOLS_DIR/demo-config.json" "$DEMO_EVIDENCE" <<'NODE'
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const {spawn} = require('child_process');
const cfg = require(process.argv[2]);
const evidence = process.argv[3];
const root = fs.realpathSync(path.join(cfg.runtime, 'backend', 'coverage'));
const marker = crypto.createHash('sha256').update(root).digest('hex');
const url = 'http://127.0.0.1:5120/';
if (!fs.existsSync(path.join(root, 'index.html'))) {
  throw new Error('Chua co coverage/index.html. Hay chay 06-test-toan-bo.command truoc.');
}
function probe() {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      res.resume();
      resolve({status: res.statusCode, marker: res.headers['x-tigershop-coverage']});
    });
    req.setTimeout(1500, () => req.destroy());
    req.on('error', () => resolve(null));
  });
}
function verify(result) {
  if (result && (result.status !== 200 || result.marker !== marker)) {
    throw new Error('Cong 5120 dang do mot dich vu khac su dung. Khong tu dong dung dich vu do.');
  }
  return !!result;
}
(async () => {
  if (verify(await probe())) {
    console.log('Da tai su dung server coverage dang chay.');
  } else {
    const code = `import functools, http.server, sys
class CoverageHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('X-TigerShop-Coverage', sys.argv[2])
        super().end_headers()
handler = functools.partial(CoverageHandler, directory=sys.argv[1])
http.server.ThreadingHTTPServer(('127.0.0.1', 5120), handler).serve_forever()
`;
    const log = fs.openSync(path.join(evidence, 'coverage-http.log'), 'a');
    const py = fs.existsSync(cfg.python) ? cfg.python : '/opt/homebrew/bin/python3';
    const child = spawn(py, ['-u', '-c', code, root, marker], {
      detached: true, stdio: ['ignore', log, log]
    });
    child.on('error', error => console.error('Khong khoi dong duoc server:', error.message));
    child.unref();
    fs.closeSync(log);
    if (child.pid) fs.writeFileSync(path.join(evidence, 'coverage-http.pid'), String(child.pid) + '\n');
    let ready = false;
    for (let i = 0; i < 25 && !ready; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      ready = verify(await probe());
    }
    if (!ready) throw new Error('Server coverage chua san sang; xem coverage-http.log trong minh-chung-moi.');
    console.log('Da mo server coverage chi tren localhost.');
  }
  console.log('Coverage: ' + url);
  if (process.env.COVERAGE_OPEN !== '0') spawn('open', ['-a', 'Google Chrome', url], {stdio: 'ignore'});
  console.log('Hay mo URL tren bang trinh duyet. So lieu duoc cap nhat khi chay lai tool 06.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
NODE
demo_wait
