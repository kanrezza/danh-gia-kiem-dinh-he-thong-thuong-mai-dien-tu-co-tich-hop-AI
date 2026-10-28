#!/bin/bash
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
demo_run_jest giao-dich --runTestsByPath tests/integration/order.test.js --testNamePattern 'ORD-013:|ORD-014:'
printf '\nASSERTION HOAN TAC VA TRANH CHAP (FILE TEST GOC)\n'
sed -n '124,163p' tests/integration/order.test.js
demo_wait
