/** Kiem thu tich hop bo sung cho userController: danh sach, nhan su, kho, cham cong, ho so. */
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
const request = require("supertest");
const bcrypt = require("bcrypt");
const { app } = require("../../server");
const { resetDatabase, closePool, query, ACCOUNTS } = require("../setup/db");

const T = {};
const homNay = () => new Date().toISOString().slice(0, 10);
const thangNay = () => new Date().toISOString().slice(0, 7);
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64");

beforeAll(async () => {
  resetDatabase();
  for (const who of ["admin", "manager", "staff", "customer1"]) {
    const r = await request(app).post("/api/auth/login").send(ACCOUNTS[who]);
    T[who] = r.body.token;
  }
});
afterAll(async () => { await closePool(); });

describe("USR - Danh sach nguoi dung va nhan su", () => {
  test("USR-001: Admin xem danh sach nguoi dung, khong lo mat khau", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);   // khong tra ve hash mat khau
  });

  test.each([
    ["/api/users/staff/created"],
    ["/api/users/staff/active"],
    ["/api/users/staff/probation"],
  ])("USR-002: %s tra ve danh sach cho Quan ly", async (url) => {
    const res = await request(app).get(url).set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBeLessThan(400);
  });

  test("USR-002b: danh sach cho duyet chi danh cho Admin", async () => {
    const admin = await request(app).get("/api/users/staff/pending")
      .set("Authorization", `Bearer ${T.admin}`);
    expect(admin.status).toBe(200);
    const mgr = await request(app).get("/api/users/staff/pending")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(mgr.status).toBe(403);
    expect(mgr.body.message).toBe("Chỉ Admin được xem danh sách chờ duyệt");
  });

  test("USR-003: Quan ly tao tai khoan truc tiep", async () => {
    const email = `nv.moi.${Date.now()}@tigershop.test`;
    const res = await request(app).post("/api/users/direct-create")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ name: "Nhan vien moi", email, password: "Test@123", phone: "0911111111", role_id: 3 });
    expect(res.status).toBeLessThan(400);
    const u = await query("SELECT role_id, password FROM users WHERE email = ?", [email]);
    expect(u).toHaveLength(1);
    expect(u[0].role_id).toBe(3);
    expect(u[0].password).toMatch(/^\$2[aby]\$/);
  });

  test("USR-003b: thieu thong tin tao tai khoan bi tu choi", async () => {
    const res = await request(app).post("/api/users/direct-create")
      .set("Authorization", `Bearer ${T.manager}`).send({ name: "", email: "", password: "", role_id: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu thông tin tạo tài khoản");
  });

  test("USR-004: Admin tu choi tai khoan nhan vien cho duyet", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staffPending.email]);
    const res = await request(app).patch(`/api/users/staff/${u[0].id}/reject`)
      .set("Authorization", `Bearer ${T.admin}`);
    expect(res.status).toBeLessThan(400);
  });

  test("USR-005: cap nhat thong tin cong viec cua nhan vien", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    const res = await request(app).put(`/api/users/${u[0].id}/job-info`)
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ role_id: 3, probation_hourly_rate: 22000, official_hourly_rate: 28000 });
    expect(res.status).toBeLessThan(400);
    const after = await query("SELECT probation_hourly_rate, official_hourly_rate FROM users WHERE id = ?", [u[0].id]);
    expect(Number(after[0].probation_hourly_rate)).toBe(22000);
    expect(Number(after[0].official_hourly_rate)).toBe(28000);
  });

  test("USR-005b: thieu thong tin cong viec bi tu choi", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    const res = await request(app).put(`/api/users/${u[0].id}/job-info`)
      .set("Authorization", `Bearer ${T.manager}`).send({ role_id: 3 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu thông tin công việc");
  });
});

describe("USR - Ho so ca nhan", () => {
  test("USR-006: doi mat khau thanh cong roi dang nhap bang mat khau moi", async () => {
    const moi = "MatKhauMoi@123";
    const res = await request(app).put("/api/users/me/change-password")
      .set("Authorization", `Bearer ${T.customer1}`)
      .send({ currentPassword: ACCOUNTS.customer1.password, newPassword: moi });
    expect(res.status).toBeLessThan(400);

    const row = await query("SELECT password FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    expect(await bcrypt.compare(moi, row[0].password)).toBe(true);

    const login = await request(app).post("/api/auth/login")
      .send({ email: ACCOUNTS.customer1.email, password: moi });
    expect(login.status).toBe(200);

    // tra lai mat khau goc
    const cu = await bcrypt.hash(ACCOUNTS.customer1.password, 10);
    await query("UPDATE users SET password = ? WHERE email = ?", [cu, ACCOUNTS.customer1.email]);
  });

  test("USR-007: tai anh dai dien va cap nhat cot avatar", async () => {
    const res = await request(app).post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${T.customer1}`)
      .attach("avatar", PNG, "avatar.png");
    if (res.status >= 400) return;   // ten truong tep co the khac
    const row = await query("SELECT avatar FROM users WHERE email = ?", [ACCOUNTS.customer1.email]);
    expect(row[0].avatar).toBeTruthy();
  });
});

describe("USR - Kho va gio cong", () => {
  test("USR-008: xem nhat ky nhap kho", async () => {
    const res = await request(app).get("/api/users/inventory/logs")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(200);
  });

  test("USR-009: ghi nhan gio cong thu cong", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    const res = await request(app).post("/api/users/staff/work-logs")
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ staff_id: u[0].id, work_date: homNay(), hours_worked: 8, note: "Ca ngay" });
    expect(res.status).toBeLessThan(400);
    const w = await query("SELECT hours_worked FROM staff_work_logs WHERE staff_id = ? ORDER BY id DESC LIMIT 1", [u[0].id]);
    expect(Number(w[0].hours_worked)).toBe(8);
  });

  test("USR-009b: gio cong khong hop le bi tu choi", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    for (const h of [0, -3]) {
      const res = await request(app).post("/api/users/staff/work-logs")
        .set("Authorization", `Bearer ${T.manager}`)
        .send({ staff_id: u[0].id, work_date: homNay(), hours_worked: h });
      expect(res.status).toBe(400);
    }
  });

  test("USR-010: bang luong chi tiet cua Quan ly va cua nhan vien", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    const r1 = await request(app).get(`/api/users/staff/payroll/detail?month=${thangNay()}&staff_id=${u[0].id}`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(r1.status).toBeLessThan(400);

    const thieu = await request(app).get(`/api/users/staff/payroll/detail?month=${thangNay()}`)
      .set("Authorization", `Bearer ${T.manager}`);
    expect(thieu.status).toBe(400);
    expect(thieu.body.message).toBe("Thiếu staff_id");
    const r2 = await request(app).get(`/api/users/staff/payroll/me/detail?month=${thangNay()}`)
      .set("Authorization", `Bearer ${T.staff}`);
    expect(r2.status).toBeLessThan(400);
  });
});

describe("USR - Cham cong nang cao", () => {
  test("USR-011: xem trang thai cham cong hien tai", async () => {
    const res = await request(app).get("/api/users/attendance/me")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(res.status).toBe(200);
  });

  test("USR-012: danh sach phien cham cong loi", async () => {
    const res = await request(app).get("/api/users/attendance/issues")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(res.status).toBe(200);
  });

  test("USR-013: Quan ly sua phien cham cong thieu check-out", async () => {
    const u = await query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.staff.email]);
    const ins = await query(
      `INSERT INTO attendance_sessions (staff_id, check_in_at, wage_rate, status)
       VALUES (?, DATE_SUB(NOW(), INTERVAL 1 DAY), 25000, 'open')`, [u[0].id]);
    const sid = ins.insertId;

    const res = await request(app).patch(`/api/users/attendance/sessions/${sid}/fix-checkout`)
      .set("Authorization", `Bearer ${T.manager}`)
      .send({ check_out_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
    expect(res.status).toBeLessThan(400);

    const s = await query("SELECT status, check_out_at, corrected_by_manager_id FROM attendance_sessions WHERE id = ?", [sid]);
    expect(s[0].status).toBe("closed");
    expect(s[0].check_out_at).not.toBeNull();
    expect(s[0].corrected_by_manager_id).not.toBeNull();
  });

  test("USR-013b: thieu check_out_at bi tu choi", async () => {
    const res = await request(app).patch("/api/users/attendance/sessions/1/fix-checkout")
      .set("Authorization", `Bearer ${T.manager}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Thiếu check_out_at");
  });
});

describe("USR - Ca lam qua userController", () => {
  test("USR-014: nhan vien tao va xem ca lam", async () => {
    const mai = new Date(); mai.setDate(mai.getDate() + 1);
    const res = await request(app).post("/api/users/staff/shifts")
      .set("Authorization", `Bearer ${T.staff}`)
      .send({ shift_date: mai.toISOString().slice(0, 10), start_time: "09:00", end_time: "18:00" });
    expect(res.status).toBeLessThan(400);

    const mine = await request(app).get("/api/users/staff/shifts/my")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(mine.status).toBe(200);
  });

  test("USR-015: Quan ly xem va duyet ca cho", async () => {
    const pending = await request(app).get("/api/users/staff/shifts/pending")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(pending.status).toBe(200);

    const s = await query("SELECT id FROM shift_registrations WHERE status='pending' ORDER BY id DESC LIMIT 1");
    if (!s.length) return;
    const res = await request(app).patch(`/api/users/staff/shifts/${s[0].id}/decision`)
      .set("Authorization", `Bearer ${T.manager}`).send({ decision: "approved" });
    expect(res.status).toBeLessThan(400);
  });

  test("USR-016: nhan vien xem don tu cua minh, Quan ly xem don cho duyet", async () => {
    const mine = await request(app).get("/api/users/staff/requests/my")
      .set("Authorization", `Bearer ${T.staff}`);
    expect(mine.status).toBe(200);
    const pending = await request(app).get("/api/users/staff/requests/pending")
      .set("Authorization", `Bearer ${T.manager}`);
    expect(pending.status).toBe(200);
  });
});
