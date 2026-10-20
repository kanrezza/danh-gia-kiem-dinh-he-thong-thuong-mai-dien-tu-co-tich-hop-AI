/**
 * Nap bo du lieu kiem thu co dinh cho he thong Tiger Shop.
 * Tuong ung Bang 2.7 (bo tai khoan) va Bang 2.8 (du lieu nghiep vu)
 * trong Chuong II - SQA & Test Plan.
 *
 * Chay:  cd backend && node scripts/seed_test_data.js
 * Script nay XOA SACH du lieu cu truoc khi nap lai, bao dam tinh tai lap.
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const CFG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ecommerce",
  multipleStatements: true,
};

const PASS = "Test@123";

const TABLES_IN_TRUNCATE_ORDER = [
  "ai_chat_messages", "ai_chat_sessions", "chat_messages", "threads",
  "notifications", "user_activity_logs", "inventory_logs",
  "staff_work_logs", "attendance_sessions", "staff_requests", "shift_registrations",
  "return_requests", "order_logs", "order_items", "orders",
  "user_vouchers", "vouchers", "product_reviews", "product_variants",
  "products", "categories", "users",
];

const d = (offset) => {
  const x = new Date();
  x.setDate(x.getDate() + offset);
  return x.toISOString().slice(0, 10);
};

async function main() {
  const c = await mysql.createConnection(CFG);
  console.log("Da ket noi", CFG.database, "tai", CFG.host);

  await c.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const t of TABLES_IN_TRUNCATE_ORDER) await c.query(`TRUNCATE TABLE \`${t}\``);
  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("Da xoa sach", TABLES_IN_TRUNCATE_ORDER.length, "bang");

  const hash = await bcrypt.hash(PASS, 10);

  // ---------------- Bang 2.7 - Bo tai khoan kiem thu ----------------
  const users = [
    // [name, email, role_id, status, is_active, employment_status]
    ["Quan tri vien",      "admin@tigershop.test",             1, "active",  1, "official"],
    ["Quan ly kho",        "manager@tigershop.test",           2, "active",  1, "official"],
    ["Nhan vien chinh thuc","staff@tigershop.test",            3, "active",  1, "official"],
    ["Nhan vien thu viec", "staff.probation@tigershop.test",   3, "active",  1, "probation"],
    ["Nhan vien cho duyet","staff.pending@tigershop.test",     3, "pending", 1, "probation"],
    ["Khach hang mot",     "customer1@tigershop.test",         5, "active",  1, "official"],
    ["Khach hang hai",     "customer2@tigershop.test",         5, "active",  1, "official"],
    ["Khach hang bi khoa", "customer.locked@tigershop.test",   5, "active",  0, "official"],
  ];
  const uid = {};
  for (const [name, email, role_id, status, is_active, emp] of users) {
    const [r] = await c.query(
      `INSERT INTO users (name, email, password, phone, role_id, status, is_active,
                          employment_status, probation_hourly_rate, official_hourly_rate, birthday)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 20000, 25000, ?)`,
      [name, email, hash, "0900000000", role_id, status, is_active, emp, "2000-01-15"]
    );
    uid[email] = r.insertId;
  }
  console.log("Da tao", users.length, "tai khoan (mat khau chung:", PASS + ")");

  // ---------------- Bang 2.8 - Danh muc ----------------
  const cats = ["Ao thun", "Ao khoac", "Quan", "Phu kien"];
  const cid = {};
  for (const n of cats) {
    const [r] = await c.query(
      "INSERT INTO categories (name, display_type) VALUES (?, 'general')", [n]);
    cid[n] = r.insertId;
  }

  const MGR = uid["manager@tigershop.test"];

  // 15 san pham active
  const pid = [];
  for (let i = 1; i <= 15; i++) {
    const cat = cats[(i - 1) % 4];
    const [r] = await c.query(
      `INSERT INTO products (name, price, original_price, description, stock, image,
                             category_id, manager_id, status, display_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'general')`,
      [`San pham kiem thu ${i}`, 100000 + i * 20000, 150000 + i * 20000,
       `Mo ta cua san pham kiem thu so ${i}`, 50, `uploads/sample-${i}.jpg`, cid[cat], MGR]
    );
    pid.push(r.insertId);
  }

  // 3 san pham cho duyet
  for (let i = 1; i <= 3; i++) {
    await c.query(
      `INSERT INTO products (name, price, description, stock, category_id, manager_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [`San pham cho duyet ${i}`, 300000, `Cho quan tri vien phe duyet`, 20, cid["Quan"], MGR]
    );
  }

  // 2 san pham ton kho thap (< 5) + 1 san pham ton kho = 1
  const [lowA] = await c.query(
    `INSERT INTO products (name, price, description, stock, category_id, manager_id, status)
     VALUES ('San pham ton kho thap A', 250000, 'Ton kho duoi nguong canh bao', 3, ?, ?, 'active')`,
    [cid["Phu kien"], MGR]);
  const [lowB] = await c.query(
    `INSERT INTO products (name, price, description, stock, category_id, manager_id, status)
     VALUES ('San pham ton kho thap B', 180000, 'Ton kho duoi nguong canh bao', 2, ?, ?, 'active')`,
    [cid["Phu kien"], MGR]);
  const [one] = await c.query(
    `INSERT INTO products (name, price, description, stock, category_id, manager_id, status)
     VALUES ('San pham chi con mot cai', 500000, 'Dung cho kiem thu tranh chap dat hang', 1, ?, ?, 'active')`,
    [cid["Ao khoac"], MGR]);

  // 3 san pham dau tien co bien the
  for (let i = 0; i < 3; i++) {
    for (const [nm, pr, st] of [["Size S", 0, 10], ["Size M", 10000, 15], ["Size L", 20000, 8]]) {
      await c.query(
        `INSERT INTO product_variants (product_id, sku, variant_name, price, stock)
         VALUES (?, ?, ?, ?, ?)`,
        [pid[i], `SKU-${pid[i]}-${nm.replace(/\s/g, "")}`, nm, 100000 + (i + 1) * 20000 + pr, st]);
    }
  }
  console.log("Da tao 4 danh muc, 21 san pham (15 active, 3 pending, 2 ton thap, 1 con mot cai), 9 bien the");

  // ---------------- Voucher ----------------
  const vouchers = [
    // code, type, value, min_order, max_discount, quantity, used, start, end, status
    ["SALE20",     "percent", 20,     200000, 50000,  100, 0,  d(-7), d(30),  "active"],
    ["GIAM50K",    "fixed",   50000,  300000, null,   50,  0,  d(-7), d(30),  "active"],
    ["HETLUOT",    "percent", 10,     0,      20000,  5,   5,  d(-7), d(30),  "active"],
    ["HETHAN",     "percent", 15,     0,      30000,  100, 0,  d(-60), d(-1), "active"],
  ];
  const vid = {};
  for (const v of vouchers) {
    const [r] = await c.query(
      `INSERT INTO vouchers (code, type, value, min_order_value, max_discount, quantity, used,
                             start_date, end_date, status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SEED')`, v);
    vid[v[0]] = r.insertId;
  }
  // Khach hang 1 nhan SALE20 va GIAM50K vao vi
  const C1 = uid["customer1@tigershop.test"];
  await c.query("INSERT INTO user_vouchers (user_id, voucher_id, used) VALUES (?, ?, 0), (?, ?, 0)",
    [C1, vid["SALE20"], C1, vid["GIAM50K"]]);
  console.log("Da tao 4 voucher (1 con hieu luc theo %, 1 theo so tien, 1 het luot, 1 het han)");

  // ---------------- 5 don hang o 5 trang thai ----------------
  const statuses = ["pending", "processing", "shipping", "completed", "cancelled"];
  for (let i = 0; i < statuses.length; i++) {
    const p = pid[i];
    const [rows] = await c.query("SELECT price, name, image FROM products WHERE id = ?", [p]);
    const pr = Number(rows[0].price);
    const [o] = await c.query(
      `INSERT INTO orders (user_id, total, status, receiver_name, receiver_phone,
                           shipping_address, expected_delivery, payment_method)
       VALUES (?, ?, ?, 'Khach hang mot', '0900000000', '123 Nguyen Trai, Ha Noi', ?, 'cod')`,
      [C1, pr * 2, statuses[i], d(3)]);
    await c.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price, product_name, product_image)
       VALUES (?, ?, 2, ?, ?, ?)`,
      [o.insertId, p, pr, rows[0].name, rows[0].image]);
  }
  console.log("Da tao 5 don hang o 5 trang thai khac nhau");

  // ---------------- Kiem tra lai ----------------
  const [summary] = await c.query(`
    SELECT 'users' t, COUNT(*) n FROM users
    UNION ALL SELECT 'categories', COUNT(*) FROM categories
    UNION ALL SELECT 'products', COUNT(*) FROM products
    UNION ALL SELECT 'product_variants', COUNT(*) FROM product_variants
    UNION ALL SELECT 'vouchers', COUNT(*) FROM vouchers
    UNION ALL SELECT 'user_vouchers', COUNT(*) FROM user_vouchers
    UNION ALL SELECT 'orders', COUNT(*) FROM orders
    UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
  `);
  console.log("\nTong ket du lieu da nap:");
  for (const r of summary) console.log(`  ${r.t.padEnd(18)} ${r.n}`);

  await c.end();
}

main().catch((e) => { console.error("LOI:", e.message); process.exit(1); });
