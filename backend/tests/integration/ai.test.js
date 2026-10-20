/**
 * Kiem thu tich hop nhom AI - Tro ly ao Tiger AI.
 * Gemini duoc gia lap hoan toan: khong goi dich vu that, khong phat sinh chi phi.
 * Pham vi kiem thu la phan tich hop thuoc trach nhiem cua he thong:
 * du lieu nen dua vao ngu canh, lich su hoi thoai, luu tru va xu ly loi.
 */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const mockSendMessage = jest.fn();
const mockGetGenerativeModel = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: (...args) => {
      mockGetGenerativeModel(...args);
      return {
        startChat: (cfg) => ({
          sendMessage: (msg) => {
            mockSendMessage(msg, cfg);
            return Promise.resolve({ response: { text: () => "Tiger AI goi y san pham phu hop cho ban." } });
          },
        }),
        embedContent: () => Promise.resolve({ embedding: { values: [0.1, 0.2, 0.3] } }),
      };
    },
  })),
}));

const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
beforeAll(async () => {
  resetDatabase();
  const r = await request(app).post("/api/auth/login").send(ACCOUNTS.customer1);
  T.customer1 = r.body.token;
});
beforeEach(() => { mockSendMessage.mockClear(); mockGetGenerativeModel.mockClear(); });
afterAll(async () => { await closePool(); });

describe("AI - Hoi thoai voi tro ly ao", () => {
  test("AI-001: gui cau hoi hop le va nhan phan hoi", async () => {
    const res = await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ message: "Minh muon tim ao khoac mua dong duoi 500 nghin" });
    expect(res.status).toBe(200);
    expect(typeof res.body.reply).toBe("string");
    expect(res.body.reply.length).toBeGreaterThan(0);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  test("AI-001b: danh muc san pham con hang duoc nap vao chi dan he thong", async () => {
    await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ message: "Shop co gi ban" });

    const cfg = mockGetGenerativeModel.mock.calls[0][0];
    expect(cfg).toHaveProperty("systemInstruction");

    // Chi dan he thong phai chua ten san pham co that trong kho
    const sp = await query(
      "SELECT name FROM products WHERE status='active' AND deleted_at IS NULL AND stock > 0 LIMIT 1");
    expect(cfg.systemInstruction).toContain(sp[0].name);
    expect(cfg.model).toBe("gemini-2.5-flash");
  });

  test("AI-002: tin nhan rong bi tu choi", async () => {
    for (const msg of ["", "   "]) {
      const res = await request(app).post("/api/chat/ai/talk")
        .set("Authorization", `Bearer ${T.customer1}`).send({ message: msg });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Tin nhắn không được để trống.");
    }
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  test("AI-003: luu ca tin nhan nguoi dung va phan hoi cua AI", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    const truoc = await query(
      `SELECT COUNT(*) n FROM ai_chat_messages m
       JOIN ai_chat_sessions s ON s.id = m.session_id WHERE s.user_id = ?`, [u[0].id]);

    await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`).send({ message: "Cau hoi luu lich su" });

    const sau = await query(
      `SELECT m.role, m.message FROM ai_chat_messages m
       JOIN ai_chat_sessions s ON s.id = m.session_id WHERE s.user_id = ?
       ORDER BY m.id DESC LIMIT 2`, [u[0].id]);
    const tong = await query(
      `SELECT COUNT(*) n FROM ai_chat_messages m
       JOIN ai_chat_sessions s ON s.id = m.session_id WHERE s.user_id = ?`, [u[0].id]);

    expect(tong[0].n).toBe(truoc[0].n + 2);
    expect(sau.map((r) => r.role).sort()).toEqual(["AI", "USER"]);
  });

  test("AI-004: moi nguoi dung chi co dung mot phien AI", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    for (let i = 0; i < 3; i++) {
      await request(app).post("/api/chat/ai/talk")
        .set("Authorization", `Bearer ${T.customer1}`).send({ message: `Lan ${i}` });
    }
    const s = await query("SELECT COUNT(*) n FROM ai_chat_sessions WHERE user_id = ?", [u[0].id]);
    expect(s[0].n).toBe(1);
  });

  test("AI-005: lich su hoi thoai duoc nap lam ngu canh da luot", async () => {
    await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`).send({ message: "Cai do con size L khong" });

    const cfg = mockSendMessage.mock.calls[0][1];
    expect(cfg).toHaveProperty("history");
    expect(Array.isArray(cfg.history)).toBe(true);
    expect(cfg.history.length).toBeGreaterThan(0);
    expect(cfg.history[0].role).toBe("user");   // Gemini yeu cau bat dau bang 'user'
    expect(cfg.history.length).toBeLessThanOrEqual(10);
  });

  test("AI-007: thieu khoa API thi suy giam an toan, khong lam sap he thong", async () => {
    const goc = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const res = await request(app).post("/api/chat/ai/talk")
        .set("Authorization", `Bearer ${T.customer1}`).send({ message: "Xin chao" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/bảo trì/);
      expect(mockSendMessage).not.toHaveBeenCalled();
    } finally {
      process.env.GEMINI_API_KEY = goc;
    }
  });

  test("AI-009: tu khoa nhay cam kich hoat goi y voucher", async () => {
    const res = await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ message: "Sản phẩm này hơi đắt so với mình" });
    expect(res.status).toBe(200);
    expect(res.body.voucher).toBe("TIGER_PROMO_10");
  });

  test("AI-009c: HAN CHE - go khong dau thi khong kich hoat goi y voucher", async () => {
    // Bo loc tu khoa so khop chuoi co dau, nen "dat" khong dau khong duoc nhan dien
    const res = await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ message: "San pham nay hoi dat so voi minh" });
    expect(res.status).toBe(200);
    expect(res.body.voucher).toBeNull();
  });

  test("AI-009b: cau hoi binh thuong khong kem voucher", async () => {
    const res = await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ message: "Shop mo cua may gio" });
    expect(res.status).toBe(200);
    expect(res.body.voucher).toBeNull();
  });

  test("AI-010: xoa lich su hoi thoai nhung giu lai phien", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    const res = await request(app).delete("/api/chat/ai/history")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(res.status).toBe(200);

    const m = await query(
      `SELECT COUNT(*) n FROM ai_chat_messages m
       JOIN ai_chat_sessions s ON s.id = m.session_id WHERE s.user_id = ?`, [u[0].id]);
    expect(m[0].n).toBe(0);
    const s = await query("SELECT COUNT(*) n FROM ai_chat_sessions WHERE user_id = ?", [u[0].id]);
    expect(s[0].n).toBe(1);
  });

  test("AI-010b: xem lai lich su hoi thoai", async () => {
    await request(app).post("/api/chat/ai/talk")
      .set("Authorization", `Bearer ${T.customer1}`).send({ message: "Cau hoi moi sau khi xoa" });
    const res = await request(app).get("/api/chat/ai/history")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain("Cau hoi moi sau khi xoa");
  });
});
