/** Kiem thu tich hop bo sung: quan tri voucher, vi voucher va cac diem cuoi chat con lai. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      startChat: () => ({
        sendMessage: () => Promise.resolve({ response: { text: () => "Goi y tra loi tu AI" } }),
      }),
      generateContent: () => Promise.resolve({ response: { text: () => "Goi y tra loi tu AI" } }),
      embedContent: () => Promise.resolve({ embedding: { values: [0.1, 0.2, 0.3] } }),
    }),
  })),
}));

const request = require("supertest");
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

describe("VADM - Quan tri voucher", () => {
  let vid;

  test("VADM-001: Quan ly xem toan bo voucher", async () => {
    const res = await request(app).get("/api/vouchers")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    vid = res.body[0].voucher_id;
  });

  test("VADM-001b: khach hang khong xem duoc toan bo voucher", async () => {
    const res = await request(app).get("/api/vouchers")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(res.status).toBe(403);
  });

  test("VADM-002: cap nhat thong tin voucher", async () => {
    const res = await request(app).put(`/api/vouchers/${vid}`)
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ type: "percent", value: 25, min_order_value: 100000,
              max_discount: 60000, quantity: 200,
              start_date: "2026-01-01", end_date: "2030-12-31", status: "active" });
    expect(res.status).toBeLessThan(400);
    const v = await query("SELECT value, quantity FROM vouchers WHERE voucher_id = ?", [vid]);
    expect(Number(v[0].value)).toBe(25);
    expect(v[0].quantity).toBe(200);
  });

  test("VADM-003: bat tat trang thai voucher", async () => {
    const truoc = await query("SELECT status FROM vouchers WHERE voucher_id = ?", [vid]);
    const res = await request(app).put(`/api/vouchers/${vid}/toggle`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBeLessThan(400);
    const sau = await query("SELECT status FROM vouchers WHERE voucher_id = ?", [vid]);
    expect(sau[0].status).not.toBe(truoc[0].status);
  });

  test("VADM-003b: bat tat voucher khong ton tai tra ve 404", async () => {
    const res = await request(app).put("/api/vouchers/999999/toggle")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Không tìm thấy voucher");
  });

  test("VADM-004: vi voucher cua khach hang", async () => {
    const co = await request(app).get("/api/user-vouchers/available")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(co.status).toBe(200);
    const cua = await request(app).get("/api/user-vouchers/my")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(cua.status).toBe(200);
    expect(Array.isArray(cua.body)).toBe(true);
  });
});

describe("CHAT2 - Cac diem cuoi chat con lai", () => {
  let threadId;

  beforeAll(async () => {
    const t = await request(app).get("/api/chat/my-thread")
      .set("Authorization", `Bearer ${T.customer1}`);
    threadId = t.body.id;
  });

  test("CHAT2-001: chuyen hoi thoai sang che do can nhan vien", async () => {
    const res = await request(app).post("/api/chat/switch-to-human")
      .set("Authorization", `Bearer ${T.customer1}`).send({ threadId });
    expect(res.status).toBeLessThan(400);
    const t = await query("SELECT status, is_human_needed FROM threads WHERE id = ?", [threadId]);
    expect(t[0].status).toBe("staff_needed");
    expect(t[0].is_human_needed).toBe(1);
  });

  test("CHAT2-001b: thieu threadId bi tu choi", async () => {
    const res = await request(app).post("/api/chat/switch-to-human")
      .set("Authorization", `Bearer ${T.customer1}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu threadId");
  });

  test("CHAT2-002: nhan vien gui tin nhan vao hoi thoai", async () => {
    const res = await request(app).post(`/api/chat/admin/threads/${threadId}/messages`)
      .set("Authorization", `Bearer ${T.admin}`).send({ content: "Chao ban, minh ho tro ngay" });
    expect(res.status).toBeLessThan(400);
    const m = await query(
      "SELECT sender_role, message FROM chat_messages WHERE thread_id = ? ORDER BY id DESC LIMIT 1", [threadId]);
    expect(m[0].sender_role).toBe("ADMIN");
    expect(m[0].message).toBe("Chao ban, minh ho tro ngay");
  });

  test("CHAT2-002b: noi dung rong bi tu choi", async () => {
    const res = await request(app).post(`/api/chat/admin/threads/${threadId}/messages`)
      .set("Authorization", `Bearer ${T.admin}`).send({ content: "  " });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Nội dung trống");
  });

  test("CHAT2-003: nhan vien xem tin nhan cua mot hoi thoai", async () => {
    const res = await request(app).get(`/api/chat/admin/threads/${threadId}/messages`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("CHAT2-004: AI sinh goi y tra loi cho nhan vien", async () => {
    const res = await request(app).post(`/api/chat/ai/suggest/${threadId}`)
      .set("Authorization", `Bearer ${T.admin}`).send({});
    expect(res.status).toBeLessThan(500);
  });
});
