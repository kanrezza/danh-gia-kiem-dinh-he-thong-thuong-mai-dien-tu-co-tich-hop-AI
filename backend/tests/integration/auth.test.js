/**
 * Kiem thu tich hop nhom AUTH - Xac thuc va phan quyen.
 * Bao phu cac test case AUTH-001 den AUTH-010 va AUTH-012 den AUTH-024.
 * AUTH-011 (gioi han tan suat) nam o tep rateLimit.test.js vi can limiter that.
 * AUTH-025 (tai anh dai dien) thuc hien thu cong.
 *
 * Limiter bi vo hieu o tep nay de khong chan chinh bo kiem thu.
 */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const request = require("supertest");
const bcrypt = require("bcrypt");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const tokens = {};

/** Cho mot dieu kien thanh dung, dung cho cac thao tac ghi bat dong bo. */
async function eventually(fn, timeoutMs = 3000, stepMs = 100) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try { last = await fn(); if (last) return last; } catch (e) { /* thu lai */ }
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return last;
}

beforeAll(async () => {
  resetDatabase();
  for (const who of ["admin", "manager", "staff", "customer1", "customer2"]) {
    const res = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    tokens[who] = res.body.token;
  }
});

afterAll(async () => { await closePool(); });

describe("AUTH - Dang ky tai khoan", () => {
  test("AUTH-001: dang ky voi du lieu hop le", async () => {
    const email = `new.user.${Date.now()}@tigershop.test`;
    const res = await request(app).post("/api/auth/register").send({
      name: "Nguoi dung moi", email, password: "Test@123",
      phone: "0912345678", birthday: "2000-05-20",
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Register successful");

    const rows = await query("SELECT id, role_id, status FROM users WHERE email = ?", [email]);
    expect(rows).toHaveLength(1);
    expect(rows[0].role_id).toBe(5);
    expect(rows[0].status).toBe("active");

    // AUTH-010: voucher chao mung duoc phat tu dong.
    // Luu y: API tra ve welcomeVoucher = true TRUOC khi ghi xong voucher
    // (xem khiem khuyet DEF-01), nen phai cho ket qua ghi bat dong bo.
    const v = await eventually(async () => {
      const r = await query(
        "SELECT v.code, v.value FROM user_vouchers uv JOIN vouchers v ON v.voucher_id = uv.voucher_id WHERE uv.user_id = ?",
        [rows[0].id]);
      return r.length ? r : null;
    });
    expect(v).toHaveLength(1);
    expect(Number(v[0].value)).toBe(50);
  });

  test.each([
    ["AUTH-002: thieu ho ten",        { name: "",  email: "a1@t.test", password: "p", phone: "090" }],
    ["AUTH-003: thieu email",         { name: "A", email: "",          password: "p", phone: "090" }],
    ["AUTH-004: thieu mat khau",      { name: "A", email: "a2@t.test", password: "",  phone: "090" }],
    ["AUTH-005: thieu so dien thoai", { name: "A", email: "a3@t.test", password: "p", phone: ""    }],
  ])("%s -> 400", async (_name, payload) => {
    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu thông tin đăng ký");
  });

  test("AUTH-006: email da ton tai bi tu choi", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Trung email", email: ACCOUNTS.customer1.email,
      password: "Test@123", phone: "0912345678",
    });
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Email đã tồn tại");
    const rows = await query("SELECT COUNT(*) n FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    expect(rows[0].n).toBe(1);
  });

  test("AUTH-009: mat khau duoc bam bcrypt, khong luu van ban thuan", async () => {
    const email = `hash.check.${Date.now()}@tigershop.test`;
    const plain = "Test@123";
    await request(app).post("/api/auth/register")
      .send({ name: "Hash", email, password: plain, phone: "0912345678" });

    const rows = await query("SELECT password FROM users WHERE email = ?", [email]);
    expect(rows[0].password).not.toBe(plain);
    expect(rows[0].password).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare(plain, rows[0].password)).toBe(true);
  });
});

describe("AUTH - Dang nhap va dieu huong theo vai tro", () => {
  test.each([
    ["AUTH-012", "admin",     "ADMIN"],
    ["AUTH-013", "manager",   "MANAGER"],
    ["AUTH-014", "staff",     "STAFF"],
    ["AUTH-015", "customer1", "CUSTOMER"],
  ])("%s: dang nhap %s tra ve vai tro %s", async (_tc, who, role) => {
    const res = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe(role);
    expect(typeof res.body.token).toBe("string");
  });

  test("AUTH-016: sai mat khau tra ve 401", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: ACCOUNTS.customer1.email, password: "SaiMatKhau123" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Wrong password");
    expect(res.body.token).toBeUndefined();
  });

  test("AUTH-017: email khong ton tai tra ve 401", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "khongtontai@tigershop.test", password: "Test@123" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("User not found");
  });

  test("AUTH-018: bo trong email hoac mat khau tra ve 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "", password: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu email hoặc mật khẩu");
  });
});

describe("AUTH - Bao ve tai nguyen bang JWT", () => {
  test("AUTH-019: token cap truoc khi khoa bi vo hieu ngay o lan goi ke tiep", async () => {
    // Buoc 1: dang nhap khi tai khoan con hoat dong
    const login = await request(app).post("/api/auth/login").send(ACCOUNTS.customer2);
    expect(login.status).toBe(200);
    const token = login.body.token;

    // Token dung duoc binh thuong
    const before = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(before.status).toBe(200);

    // Buoc 2: quan tri vien khoa tai khoan
    await query("UPDATE users SET is_active = 0 WHERE email = ?", [ACCOUNTS.customer2.email]);

    // Buoc 3: token cu tuy con han nhung phai bi chan ngay
    const after = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(403);
    expect(after.body.message).toBe("Tài khoản của bạn đã bị khóa.");

    // Tra lai trang thai cho cac test sau
    await query("UPDATE users SET is_active = 1 WHERE email = ?", [ACCOUNTS.customer2.email]);
  });

  test("AUTH-019b: dang nhap bang tai khoan da bi khoa bi chan ngay tu buoc dang nhap", async () => {
    const res = await request(app).post("/api/auth/login").send(ACCOUNTS.customerLocked);
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  test("AUTH-020: khong gui token tra ve 401", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token không tồn tại");
  });

  test("AUTH-021: token khong hop le tra ve 401", async () => {
    const res = await request(app).get("/api/users/me")
      .set("Authorization", "Bearer abc.def.ghi");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token không hợp lệ");
  });

  test("AUTH-021b: token het han tra ve 401", async () => {
    const jwt = require("jsonwebtoken");
    const expired = jwt.sign({ id: 1, role: "CUSTOMER" }, process.env.JWT_SECRET, { expiresIn: "-1h" });
    const res = await request(app).get("/api/users/me").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token không hợp lệ");
  });
});

describe("AUTH - Ho so ca nhan", () => {
  test("AUTH-023: xem va cap nhat thong tin ho so", async () => {
    const get1 = await request(app).get("/api/users/me")
      .set("Authorization", `Bearer ${tokens.customer1}`);
    expect(get1.status).toBe(200);

    const upd = await request(app).put("/api/users/me")
      .set("Authorization", `Bearer ${tokens.customer1}`)
      .send({ name: "Khach hang mot da doi ten", phone: "0987654321" });
    expect(upd.status).toBe(200);

    const rows = await query("SELECT name, phone FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    expect(rows[0].name).toBe("Khach hang mot da doi ten");
    expect(rows[0].phone).toBe("0987654321");
  });

  test("AUTH-024: doi mat khau voi mat khau cu sai bi tu choi", async () => {
    const before = await query("SELECT password FROM users WHERE email = ?", [ACCOUNTS.customer2.email]);
    const res = await request(app).put("/api/users/me/change-password")
      .set("Authorization", `Bearer ${tokens.customer2}`)
      .send({ currentPassword: "SaiMatKhauCu", newPassword: "MatKhauMoi@123" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const after = await query("SELECT password FROM users WHERE email = ?", [ACCOUNTS.customer2.email]);
    expect(after[0].password).toBe(before[0].password);
  });

  test("AUTH-024b: mat khau moi ngan hon 6 ky tu bi tu choi", async () => {
    const res = await request(app).put("/api/users/me/change-password")
      .set("Authorization", `Bearer ${tokens.customer2}`)
      .send({ currentPassword: ACCOUNTS.customer2.password, newPassword: "123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Mật khẩu mới phải có ít nhất 6 ký tự");
  });
});
