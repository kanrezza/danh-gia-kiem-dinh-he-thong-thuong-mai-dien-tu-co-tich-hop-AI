/**
 * Tien ich dung chung cho cac bo kiem thu tich hop.
 */
const { execFileSync } = require("child_process");
const path = require("path");
const db = require("../../config/db");

/** Nap lai toan bo du lieu mau, dua CSDL ve trang thai goc. */
function resetDatabase() {
  execFileSync("node", [path.join(__dirname, "..", "..", "scripts", "seed_test_data.js")], {
    env: { ...process.env, DB_NAME: "ecommerce_test" },
    stdio: "ignore",
  });
}

/** Dong pool ket noi de Jest thoat sach. */
async function closePool() {
  await new Promise((resolve) => db.end(() => resolve()));
}

/** Truy van truc tiep CSDL de xac minh trang thai sau thao tac. */
function query(sql, params = []) {
  return db.promise().query(sql, params).then(([rows]) => rows);
}

const ACCOUNTS = {
  admin:            { email: "admin@tigershop.test",            password: "Test@123" },
  manager:          { email: "manager@tigershop.test",          password: "Test@123" },
  staff:            { email: "staff@tigershop.test",            password: "Test@123" },
  staffProbation:   { email: "staff.probation@tigershop.test",  password: "Test@123" },
  staffPending:     { email: "staff.pending@tigershop.test",    password: "Test@123" },
  customer1:        { email: "customer1@tigershop.test",        password: "Test@123" },
  customer2:        { email: "customer2@tigershop.test",        password: "Test@123" },
  customerLocked:   { email: "customer.locked@tigershop.test",  password: "Test@123" },
};

/** Dang nhap va tra ve token. */
async function login(request, app, who) {
  const acc = ACCOUNTS[who];
  const res = await request(app).post("/api/auth/login").send(acc);
  return res.body.token;
}

module.exports = { resetDatabase, closePool, query, ACCOUNTS, login };
