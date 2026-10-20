/** Kiem thu tich hop nhom VOUC - Voucher va vi voucher. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
beforeAll(async () => {
  resetDatabase();
  for (const who of ["manager", "customer1", "customer2"]) {
    const r = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = r.body.token;
  }
});
afterAll(async () => { await closePool(); });

describe("VOUC - Tao va xem voucher", () => {
  test("VOUC-001: Quan ly tao voucher giam theo phan tram", async () => {
    const code = `SALE${Date.now() % 100000}`;
    const res = await request(app).post("/api/vouchers")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ code, type: "percent", value: 20, min_order_value: 200000,
              max_discount: 50000, quantity: 100,
              start_date: "2026-01-01", end_date: "2030-12-31" });
    expect(res.status).toBeLessThan(400);
    const v = await query("SELECT status, used FROM vouchers WHERE code = ?", [code]);
    expect(v).toHaveLength(1);
    expect(v[0].status).toBe("active");
    expect(v[0].used).toBe(0);
  });

  test("VOUC-002: ma voucher trung bi tu choi boi rang buoc UNIQUE", async () => {
    const res = await request(app).post("/api/vouchers")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ code: "SALE20", type: "percent", value: 10, quantity: 5,
              start_date: "2026-01-01", end_date: "2030-12-31" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const v = await query("SELECT COUNT(*) n FROM vouchers WHERE code = 'SALE20'");
    expect(v[0].n).toBe(1);
  });

  test("VOUC-003: danh sach cong khai chi gom voucher active con hieu luc", async () => {
    const res = await request(app).get("/api/vouchers/public")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(res.status).toBe(200);
    const codes = res.body.map((v) => v.code);
    expect(codes).not.toContain("HETHAN");
    expect(codes).not.toContain("HETLUOT");
  });
});

describe("VOUC - Nhan voucher vao vi", () => {
  test("VOUC-004: nhan voucher hop le", async () => {
    const v = await query("SELECT voucher_id FROM vouchers WHERE code = 'GIAM50K'");
    await query("DELETE FROM user_vouchers WHERE voucher_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [v[0].voucher_id, ACCOUNTS.customer2.email]);

    const res = await request(app).post(`/api/user-vouchers/receive/${v[0].voucher_id}`)
      .set("Authorization", `Bearer ${T.customer2}`);
    expect(res.status).toBeLessThan(400);

    const uv = await query(
      "SELECT used FROM user_vouchers WHERE voucher_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [v[0].voucher_id, ACCOUNTS.customer2.email]);
    expect(uv).toHaveLength(1);
    expect(uv[0].used).toBe(0);
  });

  test("VOUC-005: nhan lai voucher da co khong tao ban ghi trung", async () => {
    const v = await query("SELECT voucher_id FROM vouchers WHERE code = 'SALE20'");
    await request(app).post(`/api/user-vouchers/receive/${v[0].voucher_id}`)
      .set("Authorization", `Bearer ${T.customer1}`);
    const uv = await query(
      "SELECT COUNT(*) n FROM user_vouchers WHERE voucher_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [v[0].voucher_id, ACCOUNTS.customer1.email]);
    expect(uv[0].n).toBe(1);
  });

  test("VOUC-006: voucher da het luot bi tu choi", async () => {
    const v = await query("SELECT voucher_id FROM vouchers WHERE code = 'HETLUOT'");
    const res = await request(app).post(`/api/user-vouchers/receive/${v[0].voucher_id}`)
      .set("Authorization", `Bearer ${T.customer2}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Voucher không hợp lệ hoặc đã hết");
  });

  test("VOUC-007: voucher het han bi tu choi", async () => {
    const v = await query("SELECT voucher_id FROM vouchers WHERE code = 'HETHAN'");
    const res = await request(app).post(`/api/user-vouchers/receive/${v[0].voucher_id}`)
      .set("Authorization", `Bearer ${T.customer2}`);
    expect(res.status).toBe(400);
  });
});

describe("VOUC - Ap dung voucher", () => {
  test("VOUC-008: giam gia bi chan boi max_discount", async () => {
    const res = await request(app).post("/api/vouchers/apply")
      .send({ code: "SALE20", total: 300000 });
    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(50000);   // 20% cua 300k = 60k, bi chan con 50k
    expect(res.body.finalTotal).toBe(250000);
  });

  test("VOUC-008b: don vua du gia tri toi thieu van ap dung duoc", async () => {
    const res = await request(app).post("/api/vouchers/apply")
      .send({ code: "SALE20", total: 200000 });
    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(40000);
  });

  test("VOUC-009: don duoi gia tri toi thieu bi tu choi", async () => {
    const res = await request(app).post("/api/vouchers/apply")
      .send({ code: "SALE20", total: 150000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Đơn tối thiểu/);
  });

  test("VOUC-009b: voucher theo so tien co dinh giam dung gia tri", async () => {
    const res = await request(app).post("/api/vouchers/apply")
      .send({ code: "GIAM50K", total: 400000 });
    expect(res.status).toBe(200);
    expect(Number(res.body.discount)).toBe(50000);
    expect(res.body.finalTotal).toBe(350000);
  });

  test("VOUC-009c: KHIEM KHUYET DEF-04 - kieu du lieu discount khong nhat quan", async () => {
    const pc = await request(app).post("/api/vouchers/apply").send({ code: "SALE20", total: 300000 });
    const fx = await request(app).post("/api/vouchers/apply").send({ code: "GIAM50K", total: 400000 });
    // Voucher percent tra ve so, voucher fixed tra ve chuoi do DECIMAL cua MySQL
    expect(typeof pc.body.discount).toBe("number");
    expect(typeof fx.body.discount).toBe("string");
  });

  test("VOUC-010b: QUAN SAT BAO MAT - diem cuoi apply khong yeu cau xac thuc", async () => {
    // POST /api/vouchers/apply khong co authMiddleware, cho phep do ma voucher
    // ma khong can dang nhap va khong bi gioi han tan suat.
    const res = await request(app).post("/api/vouchers/apply")
      .send({ code: "SALE20", total: 300000 });
    expect(res.status).toBe(200);
  });

  test("VOUC-010: ma khong ton tai bi tu choi", async () => {
    const res = await request(app).post("/api/vouchers/apply")
      .send({ code: "MAKHONGTONTAI", total: 500000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Voucher không hợp lệ");
  });
});

describe("VOUC - Su dung voucher khi dat hang", () => {
  test("VOUC-011: voucher duoc danh dau da dung va tang bo dem", async () => {
    const v = await query("SELECT voucher_id, used FROM vouchers WHERE code = 'SALE20'");
    const vid = v[0].voucher_id, usedTruoc = v[0].used;
    const p = await query("SELECT id, price FROM products WHERE status='active' AND stock > 5 LIMIT 1");

    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ items: [{ product_id: p[0].id, quantity: 1, price: Number(p[0].price), name: "x" }],
              total: Number(p[0].price), shipping_address: "123 NT",
              payment_method: "cod", voucher_ids: [vid] });
    expect(res.status).toBe(200);

    const uv = await query(
      "SELECT used FROM user_vouchers WHERE voucher_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [vid, ACCOUNTS.customer1.email]);
    expect(uv[0].used).toBe(1);
    const after = await query("SELECT used FROM vouchers WHERE voucher_id = ?", [vid]);
    expect(after[0].used).toBe(usedTruoc + 1);
  });

  test("VOUC-012: dung lai voucher da tieu bi hoan tac toan bo don", async () => {
    const v = await query("SELECT voucher_id FROM vouchers WHERE code = 'SALE20'");
    const p = await query("SELECT id, price, stock FROM products WHERE status='active' AND stock > 5 LIMIT 1");
    const khoTruoc = p[0].stock;
    const [{ n: donTruoc }] = await query("SELECT COUNT(*) n FROM orders");

    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ items: [{ product_id: p[0].id, quantity: 1, price: Number(p[0].price), name: "x" }],
              total: Number(p[0].price), shipping_address: "123 NT",
              payment_method: "cod", voucher_ids: [v[0].voucher_id] });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/Voucher không khả dụng/);

    const sau = await query("SELECT stock FROM products WHERE id = ?", [p[0].id]);
    const [{ n: donSau }] = await query("SELECT COUNT(*) n FROM orders");
    expect(sau[0].stock).toBe(khoTruoc);  // ton kho khong bi tru
    expect(donSau).toBe(donTruoc);        // khong tao don
  });
});
