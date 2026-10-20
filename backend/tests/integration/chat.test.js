/** Kiem thu tich hop nhom CHAT - Chat ho tro va thong bao. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
beforeAll(async () => {
  resetDatabase();
  for (const who of ["admin", "staff", "customer1", "customer2"]) {
    const r = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = r.body.token;
  }
});
afterAll(async () => { await closePool(); });

describe("CHAT - Hoi thoai ho tro", () => {
  let thread1;

  test("CHAT-001: tu dong tao hoi thoai va tai su dung o lan sau", async () => {
    const r1 = await request(app).get("/api/chat/my-thread")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(r1.status).toBe(200);
    expect(r1.body).toHaveProperty("id");
    thread1 = r1.body.id;

    const r2 = await request(app).get("/api/chat/my-thread")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(r2.body.id).toBe(thread1);

    const n = await query(
      "SELECT COUNT(*) n FROM threads WHERE user_id = (SELECT id FROM users WHERE email = ?)",
      [ACCOUNTS.customer1.email]);
    expect(n[0].n).toBe(1);
  });

  test("CHAT-002: khach hang gui tin nhan, luu dung sender_role", async () => {
    const res = await request(app).post("/api/chat/messages")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ threadId: thread1, content: "Cho minh hoi ve don hang" });
    expect(res.status).toBeLessThan(400);

    const m = await query(
      "SELECT sender_role, message FROM chat_messages WHERE thread_id = ? ORDER BY id DESC LIMIT 1",
      [thread1]);
    expect(m[0].sender_role).toBe("USER");
    expect(m[0].message).toBe("Cho minh hoi ve don hang");
  });

  test("CHAT-002b: tin nhan rong bi tu choi", async () => {
    const res = await request(app).post("/api/chat/messages")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ threadId: thread1, content: "   " });
    expect(res.status).toBe(400);
  });

  test("CHAT-007: nhan vien xem danh sach hoi thoai", async () => {
    const res = await request(app).get("/api/chat/admin/threads")
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length) {
      for (const f of ["threadId", "userId", "email"]) expect(res.body[0]).toHaveProperty(f);
    }
  });

  test("CHAT-008: nhan vien xem don hang cua khach trong khung hoi thoai", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    const res = await request(app).get(`/api/chat/admin/users/${u[0].id}/orders`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
  });

  test("CHAT-009: LO HONG BAO MAT - doc duoc hoi thoai cua nguoi khac", async () => {
    // Tao hoi thoai cho khach hang 2 va gui mot tin rieng tu
    const t2 = await request(app).get("/api/chat/my-thread")
      .set("Authorization", `Bearer ${T.customer2}`);
    const thread2 = t2.body.id;
    await request(app).post("/api/chat/messages")
      .set("Authorization", `Bearer ${T.customer2}`)
      .send({ threadId: thread2, content: "Thong tin rieng tu cua khach hang 2" });

    // Khach hang 1 doc hoi thoai cua khach hang 2 bang chinh token cua minh
    const res = await request(app).get(`/api/chat/messages/${thread2}`)
      .set("Authorization", `Bearer ${T.customer1}`);

    // Diem cuoi khong kiem tra quyen so huu thread -> IDOR
    expect(res.status).toBe(200);
    const noiDung = JSON.stringify(res.body);
    expect(noiDung).toContain("Thong tin rieng tu cua khach hang 2");
  });
});

describe("CHAT - Thong bao", () => {
  test("CHAT-011: dem thong bao chua doc va danh dau da doc", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    await query(
      "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, 'Don hang', 'Don dang giao', 'order', 0), (?, 'Kho', 'Ton kho thap', 'low_stock', 0)",
      [u[0].id, u[0].id]);

    const unread = await request(app).get("/api/notifications/unread")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(unread.status).toBe(200);
    // Loai low_stock khong duoc tinh vao so chua doc
    expect(unread.body.count).toBe(1);

    const ds = await request(app).get("/api/notifications")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(ds.status).toBe(200);

    const mark = await request(app).put("/api/notifications/mark-read")
      .set("Authorization", `Bearer ${T.customer1}`).send({});
    expect(mark.status).toBeLessThan(400);

    const sau = await request(app).get("/api/notifications/unread")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(sau.body.count).toBe(0);
  });

  test("CHAT-011b: chi xem duoc thong bao cua chinh minh", async () => {
    const u2 = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.customer2.email]);
    await query(
      "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, 'Rieng tu', 'Chi cua khach 2', 'order', 0)",
      [u2[0].id]);

    const res = await request(app).get("/api/notifications")
      .set("Authorization", `Bearer ${T.customer1}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("Chi cua khach 2");
  });
});
