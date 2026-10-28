#!/bin/bash
# Kiem tra moi truong demo, ghi ket qua ra file (khong in gia tri bi mat)
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/../minh-chung-moi/_chan-doan.txt"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
{
echo "== $(date)"; sw_vers 2>/dev/null | tr '\n' ' '; echo; uname -m
echo "== node"; ls -la /usr/local/bin/node 2>&1; /usr/local/bin/node --version 2>&1; which node npm python3 java jmeter brew docker orb 2>&1
echo "== docker"; docker version --format '{{.Server.Version}}' 2>&1 | head -2; docker ps -a --format '{{.Names}} {{.Status}} {{.Image}}' 2>&1 | head
echo "== databases"; docker exec tigershop-mysql mysql -uroot -N -e "show databases" 2>&1 | tr '\n' ' '; echo
RT=$(/usr/local/bin/node -e 'console.log(require(process.argv[1]).runtime)' "$DIR/demo-config.json" 2>&1)
echo "== runtime $RT"; ls -la "$RT" 2>&1 | head -20
echo "-- backend"; ls "$RT/backend" 2>&1 | tr '\n' ' '; echo
echo "-- env keys"; grep -o '^[A-Z_]*=' "$RT/backend/.env" 2>&1 | tr '\n' ' '; echo; grep -E '^(PORT|DB_NAME|DB_HOST)=' "$RT/backend/.env" 2>&1
echo "-- node_modules"; ls -d "$RT/backend/node_modules" "$RT/frontend/node_modules" 2>&1
echo "-- frontend api url"; grep -rhoE "http://(localhost|127\.0\.0\.1):[0-9]+" "$RT/frontend/src" 2>/dev/null | sort | uniq -c
echo "-- tests setup"; grep -h "DB_NAME" "$RT/backend/tests/setup/env.js" "$RT/backend/tests/setup/db.js" 2>&1
echo "-- runtime bao-cao"; ls "$RT/bao-cao-kiem-thu" 2>&1 | tr '\n' ' '; echo
echo "== ports"; for p in 3001 5101 5001 5120 3306; do printf "$p: "; lsof -nP -iTCP:$p -sTCP:LISTEN 2>/dev/null | tail -n +2 | awk '{print $1,$2}' | tr '\n' ' '; echo; done
echo "== curl"; curl -s -o /dev/null -w "api %{http_code}\n" http://127.0.0.1:5101/api/categories; curl -s -o /dev/null -w "ui %{http_code}\n" http://127.0.0.1:3001/
echo "== apps"; ls -d /Applications/*.app 2>/dev/null | grep -iE "excel|word|powerpoint|keynote|chrome|orbstack|docker|jmeter|zap|code|obs" 
echo "== jmeter"; ls /opt/homebrew/bin/jmeter /usr/local/bin/jmeter 2>&1; ls -d /opt/homebrew/Cellar/jmeter* /usr/local/Cellar/jmeter* 2>&1
echo "== python"; P=$(/usr/local/bin/node -e 'console.log(require(process.argv[1]).python)' "$DIR/demo-config.json"); ls -la "$P" 2>&1
echo "== done"
} > "$OUT" 2>&1
echo "Da ghi $OUT"
