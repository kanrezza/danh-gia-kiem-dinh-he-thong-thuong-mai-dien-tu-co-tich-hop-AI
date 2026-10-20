# -*- coding: utf-8 -*-
"""Phan tich dien bien trong tung luot do JMeter (phuc vu muc 5.4.3, 5.4.4 va 5.4.7).
Doc cac tep results/*.jtl.gz, xuat results/dien_bien.json:
  phases : 5 giai doan bang nhau theo thoi gian cua moi muc tai
  buckets: cua so 5 giay cua moi muc tai
  login  : thoi diem bat dau, hoan thanh va ma trang thai cua 200 yeu cau dang nhap
  errors : so byte va thoi diem cua cac yeu cau loi
Chay: python3 phan_tich_dien_bien.py (trong thu muc performance)."""
import csv, gzip, json, os, statistics as st, collections
HERE = os.path.dirname(os.path.abspath(__file__)); RES = os.path.join(HERE, "results")
def load(n):
    with gzip.open(os.path.join(RES, n), "rt", encoding="utf-8") as f: return list(csv.DictReader(f))
out = {"phases": {}, "buckets": {}, "errors": {}, "kb4_points": {}}
for u in (50, 100, 200):
    rows = load(f"load_{u}.jtl.gz")
    t0 = min(int(r["timeStamp"]) for r in rows); t1 = max(int(r["timeStamp"]) + int(r["elapsed"]) for r in rows)
    D = t1 - t0
    def grp(K):
        g = collections.defaultdict(lambda: collections.defaultdict(list))
        for r in rows:
            te = int(r["timeStamp"]) + int(r["elapsed"]); g[min(K - 1, int((te - t0) / D * K))][r["label"][:3]].append(r)
        return g
    # 5 giai doan
    g = grp(5); ph = []; ok5 = 0
    for i in range(5):
        d = g[i]; n = sum(len(v) for v in d.values())
        ok5 += sum(r["success"] == "true" for r in d["KB5"])
        ph.append({"phase": i + 1, "n": n, "tput": n / (D / 5 / 1000),
                   "kb4_kb": st.mean(int(r["bytes"]) for r in d["KB4"]) / 1024,
                   **{f"{k}_ms": st.mean(int(r["elapsed"]) for r in d[k]) for k in ("KB1", "KB2", "KB3", "KB4", "KB5")},
                   "orders_per_account_end": ok5 / 5, "kb5_err": sum(r["success"] != "true" for r in d["KB5"])})
    out["phases"][u] = ph
    # cua so 5 giay
    B = 5000; nb = D // B + 1; bk = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in rows:
        te = int(r["timeStamp"]) + int(r["elapsed"]); bk[(te - t0) // B][r["label"][:3]].append(int(r["elapsed"]))
    out["buckets"][u] = [{"t": (i + 1) * B / 1000, "n": sum(len(v) for v in bk[i].values()),
                          **{k: (st.mean(bk[i][k]) if bk[i][k] else None) for k in ("KB1", "KB2", "KB3", "KB4", "KB5")}} for i in range(nb)]
    k4 = sorted((int(r["timeStamp"]) + int(r["elapsed"]) - t0, int(r["bytes"]), int(r["elapsed"])) for r in rows if r["label"].startswith("KB4"))
    out["kb4_points"][u] = k4[::20]
    out["errors"][u] = [(int(r["timeStamp"]) - t0, int(r["bytes"]), r["responseCode"]) for r in rows if r["success"] != "true"]
lg = load("login_50.jtl.gz"); t0 = min(int(r["timeStamp"]) for r in lg)
out["login"] = [(int(r["timeStamp"]) - t0, int(r["timeStamp"]) + int(r["elapsed"]) - t0, r["responseCode"]) for r in lg]
json.dump(out, open(os.path.join(RES, "dien_bien.json"), "w"), ensure_ascii=False)
for u in (50, 100, 200):
    print("== muc", u)
    for p in out["phases"][u]:
        print("  GD%d n=%d tput=%.1f KB4=%.0fKB KB1=%.0f KB2=%.0f KB3=%.0f KB4=%.0f KB5=%.0f don/tk=%.0f loi=%d" % (p["phase"], p["n"], p["tput"], p["kb4_kb"], p["KB1_ms"], p["KB2_ms"], p["KB3_ms"], p["KB4_ms"], p["KB5_ms"], p["orders_per_account_end"], p["kb5_err"]))
print("Da ghi results/dien_bien.json")
