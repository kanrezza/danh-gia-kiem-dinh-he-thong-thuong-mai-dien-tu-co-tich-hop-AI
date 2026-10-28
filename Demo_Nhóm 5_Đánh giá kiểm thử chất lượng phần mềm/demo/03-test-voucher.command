#!/bin/bash
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
demo_run_jest voucher --runTestsByPath tests/integration/voucher.test.js --testNamePattern 'VOUC-008:|VOUC-008b:|VOUC-009:'
printf '\nMO ASSERTION THUC CUA FILE TEST\n'
sed -n '94,117p' tests/integration/voucher.test.js
demo_wait
