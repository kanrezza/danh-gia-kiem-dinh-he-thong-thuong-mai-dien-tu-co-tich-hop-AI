#!/bin/bash
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
demo_run_jest toan-bo --coverage
cp coverage/coverage-summary.json "$DEMO_CURRENT_RUN/coverage-summary.json"
"$DEMO_NODE" -e 'const j=require(process.argv[1]).total; console.table(Object.fromEntries(Object.entries(j).filter(([k])=>["statements","branches","functions","lines"].includes(k)).map(([k,v])=>[k,{covered:v.covered,total:v.total,pct:v.pct}])));' "$DEMO_CURRENT_RUN/coverage-summary.json"
printf 'Mo coverage moi: http://127.0.0.1:5120/\n'
demo_wait
