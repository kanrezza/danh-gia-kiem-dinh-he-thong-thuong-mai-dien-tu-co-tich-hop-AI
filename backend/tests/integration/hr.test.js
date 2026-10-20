/** Kiem thu tich hop nhom HR - Ca lam, cham cong va luong. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
const request = require("supertest");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
const ngayMai = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

beforeAll(async () => {
  resetDatabase();
  for (const who of ["manager", "staff", "staffProbation", "customer1"]) {
    const r = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = r.body.token;
  }
});
afterAll(async () => { await closePool(); });

describe("HR - Cham cong", () => {
  test("HR-001: nhan vien check-in thanh cong, luu dung wage_rate", async () => {
    const res = await request(app).post("/api/users/attendance/clock-in")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(201);
    expect(typeof res.body.session_id).toBe("number");

    const s = await query("SELECT status, wage_rate, check_out_at FROM attendance_sessions WHERE id = ?",
      [res.body.session_id]);
    expect(s[0].status).toBe("open");
    expect(s[0].check_out_at).toBeNull();
    expect(Number(s[0].wage_rate)).toBe(25000);   // nhan vien chinh thuc
  });

  test("HR-002: check-in lan hai khi con ca mo bi tu choi", async () => {
    const res = await request(app).post("/api/users/attendance/clock-in")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Bạn đang có ca làm chưa check-out");
  });

  test("HR-003: tai khoan khong phai Staff khong duoc cham cong", async () => {
    for (const who of ["customer1", "manager"]) {
      const res = await request(app).post("/api/users/attendance/clock-in")
        .set("Authorization", `Bearer ${T[who]}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Chỉ Staff được chấm công");
    }
  });

  test("HR-004: nhan vien chua duoc duyet khong cham cong duoc", async () => {
    const login = await request(app).post("/api/auth/login").send(ACCOUNTS.staffPending);
    if (login.status !== 200) return;   // tai khoan pending co the bi chan tu buoc dang nhap
    const res = await request(app).post("/api/users/attendance/clock-in")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Staff chưa active");
  });

  test("HR-007: nhan vien thu viec dung don gia thu viec", async () => {
    const res = await request(app).post("/api/users/attendance/clock-in")
      .set("Authorization", `Bearer ${T.staffProbation}`);
    expect(res.status).toBe(201);
    const s = await query("SELECT wage_rate FROM attendance_sessions WHERE id = ?", [res.body.session_id]);
    expect(Number(s[0].wage_rate)).toBe(20000);
  });

  test("HR-005: check-out dong phien va tinh worked_seconds", async () => {
    const res = await request(app).post("/api/users/attendance/clock-out")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(200);

    const s = await query(`SELECT status, check_out_at, worked_seconds FROM attendance_sessions
                           WHERE staff_id = (SELECT id FROM users WHERE email = ?)
                           ORDER BY id DESC LIMIT 1`, [ACCOUNTS.staff.email]);
    expect(s[0].status).toBe("closed");
    expect(s[0].check_out_at).not.toBeNull();
    expect(s[0].worked_seconds).toBeGreaterThanOrEqual(0);
  });

  test("HR-006: check-out khi khong co ca dang mo bi tu choi", async () => {
    const res = await request(app).post("/api/users/attendance/clock-out")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Không có ca làm đang mở để check-out");
  });
});

describe("HR - Ca lam viec", () => {
  let shiftId;

  test("HR-008: nhan vien dang ky ca lam", async () => {
    const res = await request(app).post("/api/shifts/register")
      .set("Authorization", `Bearer ${T.staff}`)
      .send({ shift_date: ngayMai(), start_time: "08:00", end_time: "17:00", note: "Ca sang" });
    expect(res.status).toBeLessThan(400);

    const s = await query(`SELECT id, status FROM shift_registrations
                           WHERE staff_id = (SELECT id FROM users WHERE email = ?)
                           ORDER BY id DESC LIMIT 1`, [ACCOUNTS.staff.email]);
    expect(s[0].status).toBe("pending");
    shiftId = s[0].id;
  });

  test("HR-008b: thieu thong tin ca lam bi tu choi", async () => {
    const res = await request(app).post("/api/shifts/register")
      .set("Authorization", `Bearer ${T.staff}`)
      .send({ shift_date: "", start_time: "", end_time: "" });
    expect(res.status).toBe(400);
  });

  test("HR-010: Quan ly duyet ca lam", async () => {
    const res = await request(app).patch(`/api/shifts/${shiftId}/status`)
      .set("Authorization", `Bearer ${T.manager}`).send({ status: "approved" });
    expect(res.status).toBeLessThan(400);
    const s = await query("SELECT status, manager_id FROM shift_registrations WHERE id = ?", [shiftId]);
    expect(s[0].status).toBe("approved");
    expect(s[0].manager_id).not.toBeNull();
  });

  test("HR-010b: nhan vien khong duoc tu duyet ca cua minh", async () => {
    const res = await request(app).patch(`/api/shifts/${shiftId}/status`)
      .set("Authorization", `Bearer ${T.staff}`).send({ status: "approved" });
    expect(res.status).toBe(403);
  });

  test("HR-008c: nhan vien xem duoc ca cua chinh minh", async () => {
    const res = await request(app).get("/api/shifts/mine")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("HR - Don tu", () => {
  test("HR-011: gui don xin di muon", async () => {
    const res = await request(app).post("/api/users/staff/requests")
      .set("Authorization", `Bearer ${T.staff}`)
      .send({ request_type: "late", request_date: ngayMai(), minutes_late: 30, reason: "Tac duong" });
    expect(res.status).toBeLessThan(400);

    const r = await query(`SELECT request_type, minutes_late, status FROM staff_requests
                           WHERE staff_id = (SELECT id FROM users WHERE email = ?)
                           ORDER BY id DESC LIMIT 1`, [ACCOUNTS.staff.email]);
    expect(r[0].request_type).toBe("late");
    expect(r[0].minutes_late).toBe(30);
    expect(r[0].status).toBe("pending");
  });

  test("HR-012: gui don thieu ly do bi tu choi", async () => {
    const res = await request(app).post("/api/users/staff/requests")
      .set("Authorization", `Bearer ${T.staff}`)
      .send({ request_type: "leave", request_date: ngayMai(), reason: "" });
    expect(res.status).toBe(400);
  });

  test("HR-012b: Quan ly duyet don tu cua nhan vien", async () => {
    const r = await query("SELECT id FROM staff_requests WHERE status='pending' ORDER BY id DESC LIMIT 1");
    if (!r.length) return;
    const res = await request(app).patch(`/api/users/staff/requests/${r[0].id}/decision`)
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ decision: "approved", manager_note: "Dong y" });
    expect(res.status).toBeLessThan(400);
    const after = await query("SELECT status FROM staff_requests WHERE id = ?", [r[0].id]);
    expect(after[0].status).toBe("approved");
  });
});

describe("HR - Bang luong", () => {
  const THANG = new Date().toISOString().slice(0, 7);   // YYYY-MM

  test("HR-013: Quan ly xem bang luong toan bo nhan vien", async () => {
    const res = await request(app).get(`/api/users/staff/payroll?month=${THANG}`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(200);
  });

  test("HR-013b: thieu tham so month bi tu choi", async () => {
    const res = await request(app).get("/api/users/staff/payroll")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("month phải theo định dạng YYYY-MM");
  });

  test("HR-014: nhan vien xem bang luong ca nhan", async () => {
    const res = await request(app).get(`/api/users/staff/payroll/me?month=${THANG}`)
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(200);
  });

  test("HR-015: nhan vien khong xem duoc bang luong toan bo", async () => {
    const res = await request(app).get(`/api/users/staff/payroll?month=${THANG}`)
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(403);
  });
});
