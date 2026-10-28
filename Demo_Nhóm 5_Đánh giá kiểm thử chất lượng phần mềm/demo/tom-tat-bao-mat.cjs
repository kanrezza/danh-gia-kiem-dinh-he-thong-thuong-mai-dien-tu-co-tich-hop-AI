// Tom tat ket qua 47 phep kiem chung bao mat cua luot chay vua thuc hien
const r = require(process.argv[2]);
const g = {}; const tong = { DAT: 0, CANH_BAO: 0, THAT_BAI: 0, KHAC: 0 };
const loai = (s) => /^DAT/.test(s) ? 'DAT' : /^CANH BAO/.test(s) ? 'CANH_BAO' : /^THAT BAI|^KHONG DAT/.test(s) ? 'THAT_BAI' : 'KHAC';
for (const x of r) { const k = loai(x.danhGia || ''); (g[x.nhom] = g[x.nhom] || { DAT: 0, CANH_BAO: 0, THAT_BAI: 0, KHAC: 0 })[k]++; tong[k]++; }
console.log('\nTONG HOP ' + r.length + ' PHEP KIEM CHUNG CUA LUOT VUA CHAY');
console.table({ ...g, TONG: tong });
console.log('\nCAC PHEP THAT BAI:');
for (const x of r) if (loai(x.danhGia || '') === 'THAT_BAI') console.log(' ', x.ma, '|', x.kichBan, '|', x.ketQua);
