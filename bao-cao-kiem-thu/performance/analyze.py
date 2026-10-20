# -*- coding: utf-8 -*-
"""Phan tich tep ket qua .jtl cua JMeter, xuat bang thong ke theo kich ban."""
import csv, sys, os, json
from collections import defaultdict

def pct(vals, p):
    if not vals: return 0
    s = sorted(vals)
    k = max(0, min(len(s) - 1, int(round(p / 100 * len(s) + 0.5)) - 1))
    return s[k]

def analyze(path):
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    by = defaultdict(list)
    for r in rows: by[r["label"]].append(r)
    t0 = min(int(r["timeStamp"]) for r in rows)
    t1 = max(int(r["timeStamp"]) + int(r["elapsed"]) for r in rows)
    duration = (t1 - t0) / 1000

    out = {"file": os.path.basename(path), "total": len(rows), "duration": duration,
           "throughput": len(rows) / duration if duration else 0, "scenarios": {}, "errors": defaultdict(int)}
    for r in rows:
        if r["success"] != "true":
            out["errors"][f'{r["label"]} | HTTP {r["responseCode"]} | {r["responseMessage"][:40]}'] += 1

    for label, rs in sorted(by.items()):
        el = [int(x["elapsed"]) for x in rs]
        ok = sum(1 for x in rs if x["success"] == "true")
        out["scenarios"][label] = {
            "n": len(rs), "avg": sum(el) / len(el), "min": min(el), "max": max(el),
            "med": pct(el, 50), "p90": pct(el, 90), "p95": pct(el, 95), "p99": pct(el, 99),
            "err_pct": (len(rs) - ok) / len(rs) * 100,
            "tps": len(rs) / duration if duration else 0,
        }
    return out

results = {}
for u in [50, 100, 200]:
    p = f"results/load_{u}.jtl"
    if os.path.exists(p): results[u] = analyze(p)

for u, d in results.items():
    print(f"\n{'='*104}")
    print(f"MỨC TẢI {u} NGƯỜI DÙNG ĐỒNG THỜI — {d['total']} mẫu trong {d['duration']:.1f}s — {d['throughput']:.1f} req/s")
    print(f"{'='*104}")
    print(f"{'Kịch bản':<28}{'Số mẫu':>8}{'TB':>7}{'Trung vị':>10}{'p90':>7}{'p95':>7}{'p99':>7}{'Max':>8}{'Lỗi %':>8}{'req/s':>8}")
    for k, v in d["scenarios"].items():
        print(f"{k:<28}{v['n']:>8}{v['avg']:>7.0f}{v['med']:>10}{v['p90']:>7}{v['p95']:>7}{v['p99']:>7}{v['max']:>8}{v['err_pct']:>8.2f}{v['tps']:>8.1f}")
    if d["errors"]:
        print("  Lỗi ghi nhận:")
        for e, n in sorted(d["errors"].items(), key=lambda x: -x[1]):
            print(f"    {n:5d}x  {e}")

json.dump({str(k): {**v, "errors": dict(v["errors"])} for k, v in results.items()},
          open("results/summary.json", "w"), indent=2, ensure_ascii=False)
print("\nĐã lưu results/summary.json")
