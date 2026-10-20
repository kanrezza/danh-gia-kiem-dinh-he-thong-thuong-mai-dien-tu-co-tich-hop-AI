/**
 * Kiem thu tich hop nhom ORD - Gio hang va don hang.
 * Trong tam: tinh nguyen tu cua giao dich dat hang, tru ton kho co dieu kien,
 * va kiem soat truy cap cheo du lieu don hang giua hai khach hang.
 */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
let SP_DU_HANG;   // san pham ton kho 50
let SP_MOT_CAI;   // san pham ton kho 1

beforeAll(async () => {
  resetDatabase();
  for (const who of ["customer1", "customer2", "staff"]) {
    const res = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = res.body.token;
  }
  const rows = await query("SELECT id, price, stock FROM products WHERE status='active' ORDER BY id ASC");
  SP_DU_HANG = rows.find((p) => p.stock >= 10);
  SP_MOT_CAI = rows.find((p) => p.stock === 1);
});

afterAll(async () => { await closePool(); });

const donHang = (product, qty) => ({
  items: [{ product_id: product.id, quantity: qty, price: Number(product.price), name: "SP kiem thu" }],
  total: Number(product.price) * qty,
  shipping_address: "123 Nguyen Trai, Ha Noi",
  payment_method: "cod",
});

describe("ORD - Dat hang", () => {
  test("ORD-006: dat hang hop le, tru dung ton kho va sinh ngay giao du kien", async () => {
    const [{ stock: truoc }] = await query("SELECT stock FROM products WHERE id = ?", [SP_DU_HANG.id]);

    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send(donHang(SP_DU_HANG, 2));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.orderId).toBe("number");
    expect(res.body.expected_delivery).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const [{ stock: sau }] = await query("SELECT stock FROM products WHERE id = ?", [SP_DU_HANG.id]);
    expect(sau).toBe(truoc - 2);

    const o = await query("SELECT status, payment_method FROM orders WHERE id = ?", [res.body.orderId]);
    expect(o[0].status).toBe("pending");
    expect(o[0].payment_method).toBe("cod");
  });

  test("ORD-007: dat hang bang chuyen khoan QR luu dung phuong thuc", async () => {
    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ ...donHang(SP_DU_HANG, 1), payment_method: "qr" });
    expect(res.status).toBe(200);
    const o = await query("SELECT payment_method FROM orders WHERE id = ?", [res.body.orderId]);
    expect(o[0].payment_method).toBe("qr");
  });

  test("ORD-008: gio hang rong bi tu choi", async () => {
    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ items: [], total: 0, shipping_address: "123 Nguyen Trai" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Giỏ hàng trống");
  });

  test("ORD-009: thieu dia chi nhan hang bi tu choi", async () => {
    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ ...donHang(SP_DU_HANG, 1), shipping_address: "   " });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu địa chỉ nhận hàng");
  });

  test.each([
    ["tong tien am", -50000],
    ["tong tien khong phai so", "abc"],
  ])("ORD-010: %s bi tu choi", async (_n, total) => {
    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ ...donHang(SP_DU_HANG, 1), total });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Tổng tiền không hợp lệ");
  });

  test("ORD-011: khong gui token bi chan 401 va khong tao don", async () => {
    const [{ n: truoc }] = await query("SELECT COUNT(*) n FROM orders");
    const res = await request(app).post("/api/orders").send(donHang(SP_DU_HANG, 1));
    expect(res.status).toBe(401);
    const [{ n: sau }] = await query("SELECT COUNT(*) n FROM orders");
    expect(sau).toBe(truoc);
  });
});

describe("ORD - Tinh nguyen tu cua giao dich", () => {
  test("ORD-012: dat qua ton kho bi tu choi va hoan tac sach", async () => {
    const [{ n: donTruoc }] = await query("SELECT COUNT(*) n FROM orders");
    const [{ stock: khoTruoc }] = await query("SELECT stock FROM products WHERE id = ?", [SP_MOT_CAI.id]);
    expect(khoTruoc).toBe(1);

    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send(donHang(SP_MOT_CAI, 5));

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/Hết hàng/);

    const [{ stock: khoSau }] = await query("SELECT stock FROM products WHERE id = ?", [SP_MOT_CAI.id]);
    const [{ n: donSau }] = await query("SELECT COUNT(*) n FROM orders");
    const items = await query("SELECT COUNT(*) n FROM order_items WHERE product_id = ?", [SP_MOT_CAI.id]);

    expect(khoSau).toBe(1);        // ton kho khong bi tru
    expect(donSau).toBe(donTruoc); // khong tao don rac
    expect(items[0].n).toBe(0);    // khong tao dong chi tiet don
  });

  test("ORD-013: mot muc hang loi thi ca don bi hoan tac, khong tru ton kho muc truoc do", async () => {
    const [{ stock: duTruoc }] = await query("SELECT stock FROM products WHERE id = ?", [SP_DU_HANG.id]);
    const [{ n: donTruoc }] = await query("SELECT COUNT(*) n FROM orders");

    const res = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({
        items: [
          { product_id: SP_DU_HANG.id, quantity: 1, price: Number(SP_DU_HANG.price), name: "Muc du hang" },
          { product_id: SP_MOT_CAI.id, quantity: 99, price: Number(SP_MOT_CAI.price), name: "Muc thieu hang" },
        ],
        total: 1000,
        shipping_address: "123 Nguyen Trai, Ha Noi",
        payment_method: "cod",
      });

    expect(res.status).toBe(500);

    const [{ stock: duSau }] = await query("SELECT stock FROM products WHERE id = ?", [SP_DU_HANG.id]);
    const [{ n: donSau }] = await query("SELECT COUNT(*) n FROM orders");

    // Muc thu nhat da bi tru truoc khi muc thu hai loi -> phai duoc hoan tac
    expect(duSau).toBe(duTruoc);
    expect(donSau).toBe(donTruoc);
  });

  test("ORD-014: hai yeu cau dong thoi cho san pham con 1 cai, chi mot cai thanh cong", async () => {
    await query("UPDATE products SET stock = 1 WHERE id = ?", [SP_MOT_CAI.id]);

    const [r1, r2] = await Promise.all([
      request(app).post("/api/orders").set("Authorization", `Bearer ${T.customer1}`).send(donHang(SP_MOT_CAI, 1)),
      request(app).post("/api/orders").set("Authorization", `Bearer ${T.customer2}`).send(donHang(SP_MOT_CAI, 1)),
    ]);

    const thanhCong = [r1, r2].filter((r) => r.status === 200).length;
    const [{ stock }] = await query("SELECT stock FROM products WHERE id = ?", [SP_MOT_CAI.id]);

    expect(thanhCong).toBe(1);        // dung mot yeu cau thanh cong
    expect(stock).toBe(0);            // ton kho ve 0
    expect(stock).toBeGreaterThanOrEqual(0); // khong bao gio am
  });
});

describe("ORD - Theo doi va huy don", () => {
  test("ORD-016: chi xem duoc don cua chinh minh", async () => {
    const res = await request(app).get("/api/orders/my")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const cua1 = await query("SELECT id FROM orders WHERE user_id = (SELECT id FROM users WHERE email = ?)",
      [ACCOUNTS.customer1.email]);
    const idTraVe = res.body.map((o) => o.orderId).sort();
    expect(idTraVe).toEqual(cua1.map((o) => o.id).sort());
  });

  test("ORD-018: khong xem duoc don hang cua nguoi khac", async () => {
    const donCua2 = await query(
      "SELECT id FROM orders WHERE user_id = (SELECT id FROM users WHERE email = ?) LIMIT 1",
      [ACCOUNTS.customer2.email]);
    if (!donCua2.length) return; // khong co du lieu de kiem thu

    const res = await request(app).get(`/api/orders/${donCua2[0].id}`)
      .set("Authorization", `Bearer ${T.customer1}`);
    expect([403, 404]).toContain(res.status);
  });

  test("ORD-019: khach hang huy don pending, ton kho duoc hoan tra", async () => {
    const tao = await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${T.customer1}`).send(donHang(SP_DU_HANG, 2));
    expect(tao.status).toBe(200);
    const [{ stock: sauDat }] = await query("SELECT stock FROM products WHERE id = ?", [SP_DU_HANG.id]);

    const huy = await request(app).post(`/api/orders/${tao.body.orderId}/cancel`)
      .set("Authorization", `Bearer ${T.customer1}`).send({});
    expect(huy.status).toBe(200);

    const o = await query("SELECT status FROM orders WHERE id = ?", [tao.body.orderId]);
    expect(o[0].status).toBe("cancelled");

    const [{ stock: sauHuy }] = await query("SELECT stock FROM products WHERE id = ?", [SP_DU_HANG.id]);
    expect(sauHuy).toBe(sauDat + 2);
  });

  test("ORD-020: khach hang khong huy duoc don da hoan tat", async () => {
    const don = await query("SELECT id FROM orders WHERE status = 'completed' LIMIT 1");
    const res = await request(app).post(`/api/orders/${don[0].id}/cancel`)
      .set("Authorization", `Bearer ${T.customer1}`).send({});
    expect(res.status).toBe(400);
    // Voi vai tro CUSTOMER, nhanh kiem tra trang thai pending chay truoc
    expect(res.body.message).toBe("Chỉ có thể hủy đơn hàng ở trạng thái Pending");
    const sau = await query("SELECT status FROM orders WHERE id = ?", [don[0].id]);
    expect(sau[0].status).toBe("completed");
  });

  test("ORD-020b: nhan vien cung khong huy duoc don da hoan tat", async () => {
    const don = await query("SELECT id FROM orders WHERE status = 'completed' LIMIT 1");
    const res = await request(app).post(`/api/orders/staff/${don[0].id}/cancel`)
      .set("Authorization", `Bearer ${T.staff}`).send({ reason: "Khach doi tra" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Không thể hủy đơn hàng đã completed/);
  });

  test("ORD-021: nhan vien huy don ma khong nhap ly do bi tu choi", async () => {
    const don = await query("SELECT id FROM orders WHERE status = 'pending' LIMIT 1");
    const res = await request(app).post(`/api/orders/staff/${don[0].id}/cancel`)
      .set("Authorization", `Bearer ${T.staff}`).send({ reason: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Staff phải nhập lý do hủy đơn");
  });
});
