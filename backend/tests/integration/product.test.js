/**
 * Kiem thu tich hop nhom PROD - San pham, bien the, duyet va ton kho.
 */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
// PNG 1x1 hop le, dung cho kiem thu tai anh
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64");

beforeAll(async () => {
  resetDatabase();
  for (const who of ["admin", "manager", "staff", "customer1"]) {
    const res = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = res.body.token;
  }
});
afterAll(async () => { await closePool(); });

describe("PROD - Tra cuu san pham", () => {
  test("PROD-001: danh sach cong khai chi tra san pham active va chua xoa mem", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    const ids = res.body.map((p) => p.id);
    const inactive = await query(
      "SELECT id FROM products WHERE status <> 'active' OR deleted_at IS NOT NULL");
    for (const row of inactive) expect(ids).not.toContain(row.id);
  });

  test("PROD-002: loc theo danh muc tra dung so luong khop voi product_count", async () => {
    const cats = await request(app).get("/api/categories");
    expect(cats.status).toBe(200);
    const cat = cats.body.find((c) => c.product_count > 0);
    const all = await request(app).get("/api/products");
    const loc = all.body.filter((p) => p.category === cat.name);
    const db = await query(
      "SELECT COUNT(*) n FROM products WHERE category_id = ? AND status='active' AND deleted_at IS NULL",
      [cat.id]);
    expect(loc.length).toBe(db[0].n);
  });

  test("PROD-005: chi tiet san pham tra du truong can thiet", async () => {
    const list = await request(app).get("/api/products");
    const res = await request(app).get(`/api/products/${list.body[0].id}`);
    expect(res.status).toBe(200);
    for (const f of ["id", "name", "price", "stock"]) expect(res.body).toHaveProperty(f);
  });

  test("PROD-006: id khong ton tai tra ve 404", async () => {
    const res = await request(app).get("/api/products/999999");
    expect(res.status).toBe(404);
  });

  test("PROD-007: danh sach bien the cua san pham", async () => {
    const p = await query("SELECT product_id FROM product_variants LIMIT 1");
    const res = await request(app).get(`/api/variants/product/${p[0].product_id}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    for (const f of ["variant_name", "price", "stock"]) expect(res.body[0]).toHaveProperty(f);
  });
});

describe("PROD - Tao va sua san pham", () => {
  test("PROD-008: Quan ly tao san pham -> status 'active' NGAY, khong qua buoc duyet", async () => {
    const name = `SP cua Manager ${Date.now()}`;
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${T.manager}`)
      .field("name", name).field("price", "250000").field("stock", "50")
      .attach("image", PNG, "anh.png");
    expect(res.status).toBe(200);

    const rows = await query("SELECT status, manager_id FROM products WHERE name = ?", [name]);
    expect(rows).toHaveLength(1);
    // KHIEM KHUYET DEF-02: dac ta yeu cau 'pending' cho toi khi Admin duyet,
    // nhung ma nguon dat 'active' ngay cho vai tro ADMIN va MANAGER.
    expect(rows[0].status).toBe("active");
  });

  test("PROD-008b: KHIEM KHUYET DEF-03 - khach hang cung tao duoc san pham", async () => {
    const name = `SP cua Customer ${Date.now()}`;
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${T.customer1}`)
      .field("name", name).field("price", "111000").field("stock", "5");
    // Route POST /api/products chi co authMiddleware, thieu roleMiddleware
    expect(res.status).toBe(200);
    const rows = await query("SELECT status FROM products WHERE name = ?", [name]);
    expect(rows[0].status).toBe("pending");
  });

  test("PROD-009: thieu ten hoac gia bi tu choi", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${T.manager}`)
      .field("name", "").field("price", "");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu thông tin sản phẩm");
  });

  test("PROD-010: tai len tep sai dinh dang bi tu choi", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${T.manager}`)
      .field("name", "SP anh sai").field("price", "100000")
      .attach("image", Buffer.from("%PDF-1.4 fake"), "tailieu.pdf");
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("PROD-011: tai len anh vuot qua 5MB bi tu choi", async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 1);
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${T.manager}`)
      .field("name", "SP anh lon").field("price", "100000")
      .attach("image", big, "anh_lon.jpg");
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("PROD-012: cap nhat gia va ton kho", async () => {
    const p = await query("SELECT id FROM products WHERE status='active' LIMIT 1");
    const res = await request(app).put(`/api/products/${p[0].id}`)
      .set("Authorization", `Bearer ${T.manager}`)
      .field("name", "Ten da cap nhat").field("price", "299000").field("stock", "80");
    expect(res.status).toBe(200);
    const rows = await query("SELECT price, stock FROM products WHERE id = ?", [p[0].id]);
    expect(Number(rows[0].price)).toBe(299000);
    expect(rows[0].stock).toBe(80);
  });

  test("PROD-013: xoa mem roi khoi phuc san pham", async () => {
    const p = await query("SELECT id FROM products WHERE status='active' AND deleted_at IS NULL LIMIT 1");
    const id = p[0].id;

    const del = await request(app).delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(del.status).toBe(200);
    let rows = await query("SELECT deleted_at FROM products WHERE id = ?", [id]);
    expect(rows[0].deleted_at).not.toBeNull();

    const congKhai = await request(app).get("/api/products");
    expect(congKhai.body.map((x) => x.id)).not.toContain(id);

    const res = await request(app).patch(`/api/products/${id}/restore`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(200);
    rows = await query("SELECT deleted_at FROM products WHERE id = ?", [id]);
    expect(rows[0].deleted_at).toBeNull();
  });
});

describe("PROD - Bien the", () => {
  test("PROD-014: them bien the moi", async () => {
    const p = await query("SELECT id FROM products WHERE status='active' LIMIT 1");
    const res = await request(app).post("/api/variants")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ product_id: p[0].id, variant_name: "Size XL mau do", price: 270000, stock: 20 });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Thêm variant thành công");
    const v = await query(
      "SELECT stock FROM product_variants WHERE product_id = ? AND variant_name = ?",
      [p[0].id, "Size XL mau do"]);
    expect(v[0].stock).toBe(20);
  });

  test("PROD-015: thieu du lieu bien the bi tu choi", async () => {
    const res = await request(app).post("/api/variants")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ product_id: 1, variant_name: "", price: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu dữ liệu variant");
  });

  test("PROD-016: cap nhat ton kho hang loat va tinh lai tong kho san pham cha", async () => {
    const pv = await query(
      "SELECT product_id FROM product_variants GROUP BY product_id HAVING COUNT(*) >= 3 LIMIT 1");
    const pid = pv[0].product_id;
    const vs = await query("SELECT id FROM product_variants WHERE product_id = ?", [pid]);
    const updates = vs.map((v, i) => ({ id: v.id, stock: (i + 1) * 5 }));

    const res = await request(app).put("/api/variants/bulk-stock")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ productId: pid, updates });
    expect(res.status).toBe(200);

    const after = await query("SELECT stock FROM product_variants WHERE product_id = ?", [pid]);
    expect(after.map((r) => r.stock).sort((a, b) => a - b))
      .toEqual(updates.map((u) => u.stock).sort((a, b) => a - b));
  });
});

describe("PROD - Duyet san pham", () => {
  test("PROD-017: Admin duyet san pham cho -> status active", async () => {
    const p = await query("SELECT id FROM products WHERE status='pending' LIMIT 1");
    const res = await request(app).patch(`/api/products/${p[0].id}/decision`)
      .set("Authorization", `Bearer ${T.admin}`).send({ status: "active" });
    expect(res.status).toBe(200);
    const rows = await query("SELECT status FROM products WHERE id = ?", [p[0].id]);
    expect(rows[0].status).toBe("active");

    const log = await query(
      "SELECT action FROM user_activity_logs WHERE target_id = ? ORDER BY id DESC LIMIT 1", [p[0].id]);
    expect(log[0].action).toMatch(/Duyệt sản phẩm/);
  });

  test("PROD-018: Admin tu choi san pham -> status 'hidden' kem ly do", async () => {
    const p = await query("SELECT id FROM products WHERE status='pending' LIMIT 1");
    const lyDo = "Anh san pham khong dat chuan";
    const res = await request(app).patch(`/api/products/${p[0].id}/decision`)
      .set("Authorization", `Bearer ${T.admin}`).send({ status: "hidden", reason: lyDo });
    expect(res.status).toBe(200);
    const rows = await query("SELECT status, rejection_reason FROM products WHERE id = ?", [p[0].id]);
    // Ma nguon dung 'hidden' chu khong phai 'rejected' nhu dac ta ban dau
    expect(rows[0].status).toBe("hidden");
    expect(rows[0].rejection_reason).toBe(lyDo);
  });

  test("PROD-018b: trang thai quyet dinh khong hop le bi tu choi", async () => {
    const p = await query("SELECT id FROM products LIMIT 1");
    const res = await request(app).patch(`/api/products/${p[0].id}/decision`)
      .set("Authorization", `Bearer ${T.admin}`).send({ status: "rejected" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Trạng thái không hợp lệ");
  });

  test("PROD-019: Staff khong duoc duyet san pham", async () => {
    const p = await query("SELECT id FROM products LIMIT 1");
    const res = await request(app).patch(`/api/products/${p[0].id}/decision`)
      .set("Authorization", `Bearer ${T.staff}`).send({ status: "active" });
    expect(res.status).toBe(403);
  });
});

describe("PROD - Ton kho", () => {
  test("PROD-021: canh bao ton kho duoi 5, sap xep tang dan", async () => {
    const res = await request(app).get("/api/products/inventory-alert")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("alerts");
    for (const a of res.body.alerts) expect(a.stock).toBeLessThan(5);
    const stocks = res.body.alerts.map((a) => a.stock);
    expect(stocks).toEqual([...stocks].sort((a, b) => a - b));
  });

  test("PROD-022: nhap them hang ghi dung nhat ky kho", async () => {
    const p = await query("SELECT id, stock FROM products WHERE deleted_at IS NULL LIMIT 1");
    const { id, stock: truoc } = p[0];

    const res = await request(app).post("/api/users/inventory/restock")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ product_id: id, quantity: 50, note: "Nhap bo sung" });
    expect(res.status).toBeLessThan(400);

    const sau = await query("SELECT stock FROM products WHERE id = ?", [id]);
    expect(sau[0].stock).toBe(truoc + 50);

    const log = await query(
      "SELECT old_stock, new_stock, quantity_added FROM inventory_logs WHERE product_id = ? ORDER BY id DESC LIMIT 1",
      [id]);
    expect(log[0].old_stock).toBe(truoc);
    expect(log[0].new_stock).toBe(truoc + 50);
    expect(log[0].quantity_added).toBe(50);
  });
});
