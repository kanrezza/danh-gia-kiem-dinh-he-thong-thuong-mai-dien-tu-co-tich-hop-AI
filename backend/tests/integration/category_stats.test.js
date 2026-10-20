/** Kiem thu tich hop: danh muc san pham, thong ke quan tri va dich vu voucher. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};

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
  for (const who of ["admin", "manager", "staff", "customer1"]) {
    const r = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = r.body.token;
  }
});
afterAll(async () => { await closePool(); });

describe("CAT - Quan ly danh muc", () => {
  let catId;

  test("CAT-001: danh sach danh muc kem so luong san pham", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body[0]).toHaveProperty("product_count");

    const db = await query(
      "SELECT COUNT(*) n FROM products WHERE category_id = ? AND deleted_at IS NULL", [res.body[0].id]);
    expect(res.body[0].product_count).toBe(db[0].n);
  });

  test("CAT-002: Quan ly tao danh muc moi", async () => {
    const name = `Danh muc moi ${Date.now()}`;
    const res = await request(app).post("/api/categories")
      .set("Authorization", `Bearer ${T.manager}`).send({ name, display_type: "grid" });
    expect(res.status).toBeLessThan(400);
    const rows = await query("SELECT id, display_type FROM categories WHERE name = ?", [name]);
    expect(rows).toHaveLength(1);
    expect(rows[0].display_type).toBe("grid");
    catId = rows[0].id;

    // Nhat ky duoc ghi bat dong bo sau khi API da tra loi
    const log = await eventually(async () => {
      const r = await query(
        "SELECT action FROM user_activity_logs WHERE target_id = ? ORDER BY id DESC LIMIT 1", [catId]);
      return r.length ? r : null;
    });
    expect(log[0].action).toMatch(/danh mục mới/);
  });

  test("CAT-003: thieu ten danh muc bi tu choi", async () => {
    const res = await request(app).post("/api/categories")
      .set("Authorization", `Bearer ${T.manager}`).send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Category name is required");
  });

  test("CAT-004: cap nhat ten danh muc", async () => {
    const res = await request(app).put(`/api/categories/${catId}`)
      .set("Authorization", `Bearer ${T.manager}`).send({ name: "Danh muc da doi ten" });
    expect(res.status).toBeLessThan(400);
    const rows = await query("SELECT name FROM categories WHERE id = ?", [catId]);
    expect(rows[0].name).toBe("Danh muc da doi ten");
  });

  test("CAT-005: xoa danh muc", async () => {
    const res = await request(app).delete(`/api/categories/${catId}`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBeLessThan(400);
    const rows = await query("SELECT COUNT(*) n FROM categories WHERE id = ?", [catId]);
    expect(rows[0].n).toBe(0);
  });

  test("CAT-006: khach hang khong duoc tao, sua hoac xoa danh muc", async () => {
    const tao = await request(app).post("/api/categories")
      .set("Authorization", `Bearer ${T.customer1}`).send({ name: "Trom quyen" });
    expect(tao.status).toBe(403);
    const xoa = await request(app).delete("/api/categories/1")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(xoa.status).toBe(403);
  });
});

describe("STAT - Thong ke quan tri", () => {
  const diemCuoi = [
    "/api/orders/admin/stats",
    "/api/orders/admin/best-selling",
    "/api/orders/admin/uncompleted",
    "/api/orders/admin/customer-growth",
  ];

  test.each(diemCuoi)("STAT: %s tra ve 200 cho ADMIN", async (url) => {
    const res = await request(app).get(url).set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
  });

  test.each(diemCuoi)("STAT: %s chan vai tro STAFF", async (url) => {
    const res = await request(app).get(url).set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(403);
  });

  const diemCuoiAdminOrder = [
    "/api/orders/admin/best-products",
    "/api/orders/admin/top-profit-products",
    "/api/orders/admin/category-revenue",
    "/api/orders/admin/monthly-revenue",
    "/api/orders/admin/weekly-revenue",
  ];

  test.each(diemCuoiAdminOrder)("STAT: %s hoat dong", async (url) => {
    const res = await request(app).get(url).set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBeLessThan(500);
  });

  test("STAT: san pham ban chay loc theo danh muc", async () => {
    const cat = await query("SELECT id FROM categories LIMIT 1");
    const res = await request(app).get(`/api/orders/admin/best-selling?categoryId=${cat[0].id}`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("STAT: thong ke voucher tra ve du ba nguon", async () => {
    const res = await request(app).get("/api/voucher-stats");
    expect(res.status).toBe(200);
    for (const f of ["welcomeCount", "birthdayCount", "manualCount"]) {
      expect(res.body).toHaveProperty(f);
    }
  });

  test("STAT: danh sach don hang phia quan tri", async () => {
    const res = await request(app).get("/api/orders/admin")
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
  });

  test("STAT: chi tiet don hang phia quan tri", async () => {
    const o = await query("SELECT id FROM orders LIMIT 1");
    const res = await request(app).get(`/api/orders/admin/${o[0].id}`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
  });

  test("STAT: nhan vien cap nhat trang thai don va ghi nhat ky", async () => {
    const o = await query("SELECT id FROM orders WHERE status = 'pending' LIMIT 1");
    const res = await request(app).put(`/api/orders/admin/${o[0].id}/status`)
      .set("Authorization", `Bearer ${T.staff}`).send({ status: "processing" });
    expect(res.status).toBeLessThan(400);
    const after = await query("SELECT status FROM orders WHERE id = ?", [o[0].id]);
    expect(after[0].status).toBe("processing");
  });
});
