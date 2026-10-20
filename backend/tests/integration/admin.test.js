/** Kiem thu tich hop nhom ADM - Quan tri he thong. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
const request = require("supertest");
const bcrypt = require("bcrypt");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
beforeAll(async () => {
  resetDatabase();
  for (const who of ["admin", "manager", "staff", "customer1"]) {
    const r = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = r.body.token;
  }
});
afterAll(async () => { await closePool(); });

describe("ADM - Duyet nhan su", () => {
  test("ADM-001: Quan tri vien duyet tai khoan nhan vien cho", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staffPending.email]);
    const res = await request(app).patch(`/api/users/staff/${u[0].id}/approve`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBeLessThan(400);
    const after = await query("SELECT status FROM users WHERE id = ?", [u[0].id]);
    expect(after[0].status).toBe("active");
  });

  test("ADM-001b: KHIEM KHUYET DEF-05 - hai lop phan quyen mau thuan nhau", async () => {
    // Route cho phep ADMIN va MANAGER qua roleMiddleware,
    // nhung ham approveUser lai chan cung actor.role_id !== 1.
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    const res = await request(app).patch(`/api/users/staff/${u[0].id}/approve`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Chỉ Admin mới được duyệt tài khoản");
  });

  test("ADM-002: chuyen nhan vien thu viec sang chinh thuc", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staffProbation.email]);
    const res = await request(app).patch(`/api/users/staff/${u[0].id}/official`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBeLessThan(400);
    const after = await query("SELECT employment_status, official_at FROM users WHERE id = ?", [u[0].id]);
    expect(after[0].employment_status).toBe("official");
    expect(after[0].official_at).not.toBeNull();
  });
});

describe("ADM - Quan ly nguoi dung", () => {
  test("ADM-003: doi vai tro nguoi dung", async () => {
    const u = await query("SELECT id, role_id FROM users WHERE email = ?", [ACCOUNTS.customer2.email]);
    const res = await request(app).put(`/api/users/${u[0].id}/role`)
      .set("Authorization", `Bearer ${T.admin}`).send({ role_id: 3 });
    expect(res.status).toBeLessThan(400);
    const after = await query("SELECT role_id FROM users WHERE id = ?", [u[0].id]);
    expect(after[0].role_id).toBe(3);
    await query("UPDATE users SET role_id = ? WHERE id = ?", [u[0].role_id, u[0].id]);
  });

  test("ADM-004: khoa tai khoan, token cu bi vo hieu ngay", async () => {
    const login = await request(app).post("/api/auth/login").send(ACCOUNTS.customer1);
    const token = login.body.token;
    expect((await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`)).status).toBe(200);

    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    const res = await request(app).put(`/api/users/${u[0].id}/status`)
      .set("Authorization", `Bearer ${T.admin}`).send({ is_active: 0 });
    expect(res.status).toBeLessThan(400);

    const after = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(403);

    await query("UPDATE users SET is_active = 1 WHERE id = ?", [u[0].id]);
  });

  test("ADM-005: dat lai mat khau luu duoi dang bam bcrypt", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer2.email]);
    const res = await request(app).post(`/api/users/${u[0].id}/reset-password`)
      .set("Authorization", `Bearer ${T.admin}`).send({ newPassword: "MatKhauMoi@123" });
    expect(res.status).toBeLessThan(400);

    const row = await query("SELECT password FROM users WHERE id = ?", [u[0].id]);
    expect(row[0].password).toMatch(/^\$2[aby]\$/);          // co bam bcrypt
    expect(row[0].password).not.toBe("MatKhauMoi@123");
  });

  test("ADM-005b: KHIEM KHUYET DEF-06 - reset ve mat khau cung va lo trong phan hoi", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer2.email]);
    const res = await request(app).post(`/api/users/${u[0].id}/reset-password`)
      .set("Authorization", `Bearer ${T.admin}`).send({ newPassword: "KhachHangTuChon@123" });
    expect(res.status).toBeLessThan(400);

    const row = await query("SELECT password FROM users WHERE id = ?", [u[0].id]);
    // Body bi bo qua hoan toan, mat khau luon la hang so "tiger@123"
    expect(await bcrypt.compare("tiger@123", row[0].password)).toBe(true);
    expect(await bcrypt.compare("KhachHangTuChon@123", row[0].password)).toBe(false);
    // Va mat khau bi tra ve nguyen van trong phan hoi API
    expect(res.body.message).toContain("tiger@123");
  });

  test("ADM-006: xoa mem roi khoi phuc tai khoan", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer2.email]);
    const del = await request(app).delete(`/api/users/${u[0].id}`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(del.status).toBeLessThan(400);
    let row = await query("SELECT deleted_at FROM users WHERE id = ?", [u[0].id]);
    expect(row[0].deleted_at).not.toBeNull();

    const res = await request(app).patch(`/api/users/${u[0].id}/restore`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBeLessThan(400);
    row = await query("SELECT deleted_at FROM users WHERE id = ?", [u[0].id]);
    expect(row[0].deleted_at).toBeNull();
  });

  test("ADM-007: khach hang bi chan o cac diem cuoi quan tri nguoi dung", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    const ds = await request(app).get("/api/users").set("Authorization", `Bearer ${T.customer1}`);
    expect(ds.status).toBe(403);
    const doi = await request(app).put(`/api/users/${u[0].id}/role`)
      .set("Authorization", `Bearer ${T.customer1}`).send({ role_id: 1 });
    expect(doi.status).toBe(403);
    const sau = await query("SELECT role_id FROM users WHERE id = ?", [u[0].id]);
    expect(sau[0].role_id).toBe(3);   // khong bi leo thang dac quyen
  });
});

describe("ADM - Thong ke va nhat ky", () => {
  test("ADM-008: thong ke chi tinh don da hoan tat", async () => {
    const res = await request(app).get("/api/orders/admin/best-selling")
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const db = await query(`
      SELECT p.id, SUM(oi.quantity) AS totalSold
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed' GROUP BY p.id ORDER BY totalSold DESC LIMIT 5`);
    expect(res.body.map((r) => r.id)).toEqual(db.map((r) => r.id));
  });

  test("ADM-008b: Staff khong xem duoc thong ke doanh thu", async () => {
    const res = await request(app).get("/api/orders/admin/stats")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(403);
  });

  test("ADM-009: Quan tri vien xem nhat ky thao tac", async () => {
    const res = await request(app).get("/api/users/logs")
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
  });

  test("ADM-010: nguoi dung khong du quyen bi chan o nhat ky he thong", async () => {
    for (const who of ["customer1", "staff"]) {
      const res = await request(app).get("/api/users/logs")
        .set("Authorization", `Bearer ${T[who]}`);
      expect(res.status).toBe(403);
      expect(Array.isArray(res.body)).toBe(false);
    }
  });
});
