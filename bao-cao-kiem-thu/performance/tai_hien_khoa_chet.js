/**
 * Tai hien khoa chet (deadlock) cua orderController.createOrder (muc 5.4.7).
 *
 * Kich ban lap lai dung trinh tu cau lenh SQL cua createOrder cho mot don
 * mot mat hang: SELECT users, INSERT orders, INSERT order_items, UPDATE products.
 * Phan 1: hai giao dich dat cung mot san pham, chen nhau co chu dich.
 * Phan 2: 10 ket noi dong thoi (bang connectionLimit cua config/db.js),
 *         moi ket noi dat 1.000 don cho san pham ngau nhien trong 200 san pham,
 *         so sanh trinh tu hien tai voi trinh tu tru ton kho truoc.
 *
 * CANH BAO: kich ban XOA SACH orders, order_items va products cua co so du lieu
 * duoc chi dinh. Chi chay tren mot co so du lieu rieng da nap schema_full.sql,
 * KHONG chay tren ecommerce hay ecommerce_test.
 *
 * Chay (trong thu muc backend de dung mysql2 cua du an):
 *   DB_NAME=perf_khoachet node ../bao-cao-kiem-thu/performance/tai_hien_khoa_chet.js
 */
const path = require("path");
let mysql;
try { mysql = require("mysql2/promise"); }
catch { mysql = require(path.join(__dirname, "..", "..", "backend", "node_modules", "mysql2", "promise")); }

const CFG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  socketPath: process.env.DB_SOCKET || undefined,
};
if (!CFG.database || ["ecommerce", "ecommerce_test"].includes(CFG.database)) {
  console.error("Can DB_NAME tro toi mot co so du lieu rieng (khong phai ecommerce hoac ecommerce_test).");
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function datHang(c, userId, productId, truTonKhoTruoc, nghiMs = 0) {
  await c.beginTransaction();
  try {
    await c.query("SELECT name, phone FROM users WHERE id = ?", [userId]);
    const [r] = await c.query(
      "INSERT INTO orders (user_id, total, status, shipping_address, payment_method) VALUES (?, 150000, 'pending', '123 Nguyen Trai', 'cod')",
      [userId]
    );
    const item = () => c.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price, product_name) VALUES (?, ?, 1, 150000, 'SP tai')",
      [r.insertId, productId]
    );
    const tonKho = async () => {
      const [u] = await c.query("UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1", [productId]);
      if (u.affectedRows === 0) throw new Error("Het hang");
    };
    if (truTonKhoTruoc) { await tonKho(); await sleep(nghiMs); await item(); }
    else { await item(); await sleep(nghiMs); await tonKho(); }
    await c.commit();
    return "COMMIT";
  } catch (e) {
    await c.rollback();
    return e.code || e.message;
  }
}

async function chuanBi(c, soSanPham) {
  await c.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const t of ["order_items", "orders", "products"]) await c.query(`TRUNCATE TABLE ${t}`);
  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  const rows = Array.from({ length: soSanPham }, (_, i) => [`SP ${i + 1}`, 150000, 999, "active"]);
  await c.query("INSERT INTO products (name, price, stock, status) VALUES ?", [rows]);
  const [[{ n }]] = await c.query("SELECT COUNT(*) n FROM users");
  if (n === 0) await c.query("INSERT INTO users (name, email, password) VALUES ('Khach tai 1','tai1@perf.test','x'),('Khach tai 2','tai2@perf.test','x')");
  const [u] = await c.query("SELECT id FROM users ORDER BY id LIMIT 5");
  return u.map((x) => x.id);
}

(async () => {
  const a = await mysql.createConnection(CFG);
  const b = await mysql.createConnection(CFG);
  const users = await chuanBi(a, 200);

  console.log("Phan 1: hai giao dich cung dat san pham 1");
  for (const truoc of [false, true]) {
    await chuanBi(a, 200);
    const pA = datHang(a, users[0], 1, truoc, 500);
    await sleep(100);
    const pB = datHang(b, users[users.length > 1 ? 1 : 0], 1, truoc, 500);
    const [kA, kB] = await Promise.all([pA, pB]);
    console.log(`  ${truoc ? "Tru ton kho truoc" : "Trinh tu hien tai"}: giao dich A ${kA}, giao dich B ${kB}`);
    if (!truoc) {
      // Trich nhat ky khoa chet gan nhat cua InnoDB (can quyen PROCESS)
      try {
        const [[st]] = await a.query("SHOW ENGINE INNODB STATUS");
        const doan = st.Status.split("LATEST DETECTED DEADLOCK")[1] || "";
        doan.split("\n").filter((d) => /HOLDS THE LOCK|WAITING FOR THIS LOCK|lock.mode|WE ROLL BACK/.test(d))
          .forEach((d) => console.log("    " + d.trim().slice(0, 140)));
      } catch (e) { console.log("    (khong doc duoc nhat ky InnoDB: " + e.code + ")"); }
    }
  }
  await a.end(); await b.end();

  console.log("Phan 2: 10 ket noi dong thoi, moi ket noi 1.000 don");
  for (const truoc of [false, true]) {
    const c0 = await mysql.createConnection(CFG);
    const ids = await chuanBi(c0, 200);
    const conns = await Promise.all(Array.from({ length: 10 }, () => mysql.createConnection(CFG)));
    const dem = {};
    const t = Date.now();
    await Promise.all(conns.map(async (c) => {
      for (let i = 0; i < 1000; i++) {
        const k = await datHang(c, ids[Math.floor(Math.random() * ids.length)], 1 + Math.floor(Math.random() * 200), truoc);
        dem[k] = (dem[k] || 0) + 1;
      }
    }));
    const [[s]] = await c0.query("SELECT (SELECT COUNT(*) FROM orders) don, (SELECT COUNT(*) FROM order_items) dong, (SELECT SUM(999 - stock) FROM products) da_tru");
    console.log(`  ${truoc ? "Tru ton kho truoc" : "Trinh tu hien tai"}: ${JSON.stringify(dem)}, ti le khoa chet ${((dem.ER_LOCK_DEADLOCK || 0) / 100).toFixed(2)}%, ${((Date.now() - t) / 1000).toFixed(1)} s; kiem tra nhat quan: ${JSON.stringify(s)}`);
    await Promise.all(conns.map((c) => c.end())); await c0.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
