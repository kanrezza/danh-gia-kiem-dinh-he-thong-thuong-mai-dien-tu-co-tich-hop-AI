/**
 * Kiem thu tich hop: services/voucherService.js
 * Chay truc tiep tren co so du lieu kiem thu thay vi gia lap,
 * de kiem chung ca cau lenh SQL that.
 */
const voucherService = require("../../services/voucherService");
const { resetDatabase, closePool, query } = require("../setup/db");

const goi = (fn, ...args) => new Promise((resolve, reject) => {
  fn(...args, (err, data) => (err ? reject(err) : resolve(data)));
});

beforeAll(() => { resetDatabase(); });
afterAll(async () => { await closePool(); });

describe("voucherService.giftWelcomeVoucher", () => {
  test("tao voucher WELCOME va gan vao vi nguoi dung", async () => {
    const u = await query("SELECT id FROM users WHERE email = 'customer2@tigershop.test'");
    const userId = u[0].id;

    const kq = await goi(voucherService.giftWelcomeVoucher, userId);
    expect(kq).toHaveProperty("voucherId");
    expect(kq.code).toBe(`WELCOME_${userId}`);

    const v = await query("SELECT type, value, max_discount, source, status FROM vouchers WHERE code = ?", [kq.code]);
    expect(v[0].type).toBe("percent");
    expect(Number(v[0].value)).toBe(10);
    expect(Number(v[0].max_discount)).toBe(50000);
    expect(v[0].source).toBe("WELCOME");
    expect(v[0].status).toBe("active");

    const uv = await query(
      "SELECT used FROM user_vouchers WHERE user_id = ? AND voucher_id = ?", [userId, kq.voucherId]);
    expect(uv).toHaveLength(1);
    expect(uv[0].used).toBe(0);
  });

  test("goi lan hai voi cung nguoi dung bi chan boi rang buoc UNIQUE ma voucher", async () => {
    const u = await query("SELECT id FROM users WHERE email = 'customer2@tigershop.test'");
    await expect(goi(voucherService.giftWelcomeVoucher, u[0].id)).rejects.toBeDefined();
  });
});

describe("voucherService.giftBirthdayVouchers", () => {
  test("tang voucher cho khach co sinh nhat DUNG 3 ngay nua", async () => {
    // Luu y ngu nghia: truy van so khop MONTH va DAY cua ngay hien tai cong 3,
    // tuc la dung 3 ngay nua chu khong phai trong khoang 3 ngay toi.
    const sapToi = new Date();
    sapToi.setDate(sapToi.getDate() + 3);
    const mmdd = `2000-${String(sapToi.getMonth() + 1).padStart(2, "0")}-${String(sapToi.getDate()).padStart(2, "0")}`;
    await query("UPDATE users SET birthday = ? WHERE email = 'customer1@tigershop.test'", [mmdd]);

    const soLuong = await goi(voucherService.giftBirthdayVouchers);
    expect(typeof soLuong).toBe("number");
    expect(soLuong).toBeGreaterThanOrEqual(1);

    const u = await query("SELECT id FROM users WHERE email = 'customer1@tigershop.test'");
    const v = await query(
      `SELECT v.code, v.value, v.source FROM user_vouchers uv
       JOIN vouchers v ON v.voucher_id = uv.voucher_id
       WHERE uv.user_id = ? AND v.source = 'BIRTHDAY'`, [u[0].id]);
    expect(v.length).toBeGreaterThanOrEqual(1);
    expect(Number(v[0].value)).toBe(15);
    expect(v[0].code).toMatch(/^BDAY_/);
  });

  test("sinh nhat ngay mai KHONG kich hoat vi truy van so khop dung ngay thu ba", async () => {
    const mai = new Date();
    mai.setDate(mai.getDate() + 1);
    const mmdd = `2000-${String(mai.getMonth() + 1).padStart(2, "0")}-${String(mai.getDate()).padStart(2, "0")}`;
    await query("UPDATE users SET birthday = ? WHERE email = 'customer2@tigershop.test'", [mmdd]);

    const u = await query("SELECT id FROM users WHERE email = 'customer2@tigershop.test'");
    await goi(voucherService.giftBirthdayVouchers);
    const v = await query(
      `SELECT COUNT(*) n FROM user_vouchers uv JOIN vouchers v ON v.voucher_id = uv.voucher_id
       WHERE uv.user_id = ? AND v.source = 'BIRTHDAY'`, [u[0].id]);
    expect(v[0].n).toBe(0);
  });

  test("chay lai khong tao voucher trung cho cung nguoi dung", async () => {
    const u = await query("SELECT id FROM users WHERE email = 'customer1@tigershop.test'");
    const truoc = await query(
      `SELECT COUNT(*) n FROM user_vouchers uv JOIN vouchers v ON v.voucher_id = uv.voucher_id
       WHERE uv.user_id = ? AND v.source = 'BIRTHDAY'`, [u[0].id]);

    await goi(voucherService.giftBirthdayVouchers);

    const sau = await query(
      `SELECT COUNT(*) n FROM user_vouchers uv JOIN vouchers v ON v.voucher_id = uv.voucher_id
       WHERE uv.user_id = ? AND v.source = 'BIRTHDAY'`, [u[0].id]);
    expect(sau[0].n).toBe(truoc[0].n);
  });

  test("khong co ai sinh nhat thi tra ve 0", async () => {
    await query("UPDATE users SET birthday = '2000-01-01' WHERE birthday IS NOT NULL");
    const thang = new Date().getMonth() + 1;
    if (thang === 1) return;   // bo qua neu dang la thang 1
    const soLuong = await goi(voucherService.giftBirthdayVouchers);
    expect(soLuong).toBe(0);
  });
});

describe("voucherService.getVoucherStats", () => {
  test("dem dung so voucher theo tung nguon", async () => {
    const stats = await goi(voucherService.getVoucherStats);
    for (const f of ["welcomeCount", "birthdayCount", "manualCount"]) {
      expect(stats).toHaveProperty(f);
      expect(typeof stats[f]).toBe("number");
    }
    const db = await query("SELECT COUNT(*) n FROM vouchers WHERE source = 'WELCOME'");
    expect(stats.welcomeCount).toBe(db[0].n);
  });
});
