// Tom tat bao cao OWASP ZAP cua luot quet vua chay
const r = require(process.argv[2]);
for (const s of r.site) {
  console.log('\nDICH QUET (site @name): ' + s['@name'] + '   <-- phai la may chu Tiger Shop cong 5001');
  const dem = {};
  for (const a of s.alerts) { const m = a.riskdesc.split(' ')[0]; dem[m] = (dem[m] || 0) + 1; }
  console.log('So canh bao theo muc rui ro:', JSON.stringify(dem));
  console.table(s.alerts.map(a => ({ muc: a.riskdesc.split(' ')[0], plugin: a.pluginid, ten: a.name, so_lan: a.count })));
}
console.log('Phien ban ZAP: ' + r['@version'] + ', thoi diem tao: ' + r['@generated']);
