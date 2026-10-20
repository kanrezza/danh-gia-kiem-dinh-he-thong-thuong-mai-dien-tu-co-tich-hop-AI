/** Kiem thu tich hop nhom REV - Danh gia san pham. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
let SP_DA_MUA, SP_CHUA_MUA;

beforeAll(async () => {
  resetDatabase();
  for (const who of ["customer1", "customer2", "staff"]) {
    const r = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = r.body.token;
  }
  const mua = await query(`
    SELECT DISTINCT oi.product_id FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = (SELECT id FROM users WHERE email = ?) AND o.status = 'completed' LIMIT 1`,
    [ACCOUNTS.customer1.email]);
  SP_DA_MUA = mua[0].product_id;
  const chua = await query(
    "SELECT id FROM products WHERE status='active' AND id NOT IN (SELECT product_id FROM order_items WHERE product_id IS NOT NULL) LIMIT 1");
  SP_CHUA_MUA = chua[0].id;
});
afterAll(async () => { await closePool(); });

describe("REV - Danh gia san pham", () => {
  test("REV-001: danh gia san pham da mua voi du lieu hop le", async () => {
    const res = await request(app).post(`/api/products/${SP_DA_MUA}/reviews`)
      .set("Authorization", `Bearer ${T.customer1}`)
      .field("rating", "5").field("comment", "San pham rat tot");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Đã lưu đánh giá sản phẩm");

    const r = await query(
      "SELECT rating, comment FROM product_reviews WHERE product_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [SP_DA_MUA, ACCOUNTS.customer1.email]);
    expect(r[0].rating).toBe(5);
    expect(r[0].comment).toBe("San pham rat tot");
  });

  test.each([["0", 0], ["6", 6]])("REV-002: rating %s ngoai khoang 1-5 bi tu choi", async (val) => {
    const res = await request(app).post(`/api/products/${SP_DA_MUA}/reviews`)
      .set("Authorization", `Bearer ${T.customer1}`)
      .field("rating", val).field("comment", "x");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Rating phải từ 1 đến 5");
  });

  test("REV-002b: gia tri bien 1 va 5 deu duoc chap nhan", async () => {
    for (const v of ["1", "5"]) {
      const res = await request(app).post(`/api/products/${SP_DA_MUA}/reviews`)
        .set("Authorization", `Bearer ${T.customer1}`)
        .field("rating", v).field("comment", `Diem ${v}`);
      expect(res.status).toBe(200);
    }
  });

  test("REV-003: danh gia san pham chua tung mua bi tu choi", async () => {
    const res = await request(app).post(`/api/products/${SP_CHUA_MUA}/reviews`)
      .set("Authorization", `Bearer ${T.customer2}`)
      .field("rating", "5").field("comment", "Chua mua");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Đánh giá chỉ khả dụng khi đơn đã hoàn tất");
  });

  test("REV-004: danh gia lan hai cap nhat ban ghi cu, khong tao moi", async () => {
    const truoc = await query(
      "SELECT COUNT(*) n FROM product_reviews WHERE product_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [SP_DA_MUA, ACCOUNTS.customer1.email]);

    const res = await request(app).post(`/api/products/${SP_DA_MUA}/reviews`)
      .set("Authorization", `Bearer ${T.customer1}`)
      .field("rating", "3").field("comment", "Dung mot tuan thay binh thuong");
    expect(res.status).toBe(200);

    const sau = await query(
      "SELECT COUNT(*) n FROM product_reviews WHERE product_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [SP_DA_MUA, ACCOUNTS.customer1.email]);
    expect(sau[0].n).toBe(truoc[0].n);   // rang buoc UNIQUE giu nguyen 1 ban ghi

    const r = await query(
      "SELECT rating, comment FROM product_reviews WHERE product_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [SP_DA_MUA, ACCOUNTS.customer1.email]);
    expect(r[0].rating).toBe(3);
    expect(r[0].comment).toBe("Dung mot tuan thay binh thuong");
  });

  test("REV-005: danh gia kem anh luu duong dan vao image_url", async () => {
    const PNG = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64");
    const res = await request(app).post(`/api/products/${SP_DA_MUA}/reviews`)
      .set("Authorization", `Bearer ${T.customer1}`)
      .field("rating", "4").field("comment", "Co anh")
      .attach("image", PNG, "review.png");
    expect(res.status).toBe(200);
    const r = await query(
      "SELECT image_url FROM product_reviews WHERE product_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)",
      [SP_DA_MUA, ACCOUNTS.customer1.email]);
    expect(r[0].image_url).toMatch(/^uploads\//);
  });

  test("REV-006: nhan vien khong duoc danh gia san pham", async () => {
    const res = await request(app).post(`/api/products/${SP_DA_MUA}/reviews`)
      .set("Authorization", `Bearer ${T.staff}`)
      .field("rating", "5").field("comment", "x");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Chỉ khách hàng mới được đánh giá sản phẩm");
  });

  test("REV-007: xem danh sach danh gia cua san pham", async () => {
    const res = await request(app).get(`/api/products/${SP_DA_MUA}/reviews`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("REV-008: don thanh toan QR chua hoan tat VAN danh gia duoc (can doi chieu nghiep vu)", async () => {
    const p = await query("SELECT id, price FROM products WHERE status='active' AND stock > 3 LIMIT 1");
    const don = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer2}`)
      .send({ items: [{ product_id: p[0].id, quantity: 1, price: Number(p[0].price), name: "x" }],
              total: Number(p[0].price), shipping_address: "123 NT", payment_method: "qr" });
    expect(don.status).toBe(200);
    const o = await query("SELECT status FROM orders WHERE id = ?", [don.body.orderId]);
    expect(o[0].status).toBe("pending");   // don CHUA hoan tat

    const res = await request(app).post(`/api/products/${p[0].id}/reviews`)
      .set("Authorization", `Bearer ${T.customer2}`)
      .field("rating", "5").field("comment", "Danh gia khi don QR con pending");
    // Dieu kien trong ma nguon la: payment_method = 'qr' HOAC status = 'completed'
    expect(res.status).toBe(200);
  });
});
