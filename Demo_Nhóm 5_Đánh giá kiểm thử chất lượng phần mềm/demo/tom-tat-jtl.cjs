// Tom tat tep ket qua JMeter (.jtl dang CSV) cua luot chay vua thuc hien
const fs = require('fs');
const text = fs.readFileSync(process.argv[2], 'utf8');
// Doc CSV co ho tro truong trong dau ngoac kep chua xuong dong
const rows = []; let row = [], cur = '', q = false;
for (let i = 0; i < text.length; i++) {
  const ch = text[i];
  if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
  else if (ch === '"') q = true;
  else if (ch === ',') { row.push(cur); cur = ''; }
  else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
  else cur += ch;
}
if (cur || row.length) { row.push(cur); rows.push(row); }
const head = rows.shift(); const ix = (n) => head.indexOf(n);
const by = {}; let t0 = Infinity, t1 = 0; const loiBytes = {};
for (const r of rows) {
  if (r.length < head.length) continue;
  const lab = r[ix('label')], el = +r[ix('elapsed')], ok = r[ix('success')] === 'true', ts = +r[ix('timeStamp')];
  t0 = Math.min(t0, ts); t1 = Math.max(t1, ts + el);
  const v = (by[lab] = by[lab] || { n: 0, err: 0, t: [], codes: {} });
  v.n++; v.t.push(el);
  if (!ok) { v.err++; const c = r[ix('responseCode')]; v.codes[c] = (v.codes[c] || 0) + 1; const b = r[ix('bytes')]; loiBytes[b] = (loiBytes[b] || 0) + 1; }
}
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]; };
const avg = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
const table = {}; let all = [], errAll = 0;
for (const [k, v] of Object.entries(by).sort()) {
  all = all.concat(v.t); errAll += v.err;
  table[k] = { mau: v.n, tb_ms: avg(v.t), p95_ms: pct(v.t, 95), loi: v.err, ti_le_loi: (v.err / v.n * 100).toFixed(2) + '%', ma_loi: Object.keys(v.codes).length ? JSON.stringify(v.codes) : '' };
}
table['TONG'] = { mau: all.length, tb_ms: avg(all), p95_ms: pct(all, 95), loi: errAll, ti_le_loi: (errAll / all.length * 100).toFixed(2) + '%', ma_loi: '' };
const dur = (t1 - t0) / 1000;
console.log('\nKET QUA LUOT DO VUA CHAY');
console.table(table);
console.log(`Thoi gian do: ${dur.toFixed(1)} giay, thong luong: ${(all.length / dur).toFixed(1)} yeu cau moi giay`);
if (errAll) console.log('Kich thuoc cac phan hoi loi (byte: so lan):', JSON.stringify(loiBytes));
