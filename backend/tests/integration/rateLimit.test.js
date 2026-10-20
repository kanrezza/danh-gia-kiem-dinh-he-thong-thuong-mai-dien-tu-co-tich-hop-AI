/**
 * AUTH-011: gioi han tan suat tren nhom API xac thuc.
 * Tep nay KHONG mock express-rate-limit de kiem thu limiter that.
 * Cau hinh trong server.js: toi da 10 yeu cau moi 60 giay tren moi dia chi IP.
 */
const request = require("supertest");
const { app } = require("../../server");
const { closePool } = require("../setup/db");

afterAll(async () => { await closePool(); });

describe("AUTH - Gioi han tan suat", () => {
  test("AUTH-011: tu yeu cau thu 11 tro di bi tra ve 429", async () => {
    const codes = [];
    for (let i = 0; i < 13; i++) {
      const res = await request(app).post("/api/auth/login")
        .send({ email: "khongtontai@tigershop.test", password: "x" });
      codes.push(res.status);
    }

    const first10 = codes.slice(0, 10);
    const rest = codes.slice(10);

    expect(first10.every((c) => c !== 429)).toBe(true);
    expect(rest.every((c) => c === 429)).toBe(true);
  });

  test("AUTH-011b: phan hoi 429 co thong bao tieng Viet ro rang", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "khongtontai@tigershop.test", password: "x" });
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/quá nhanh/i);
  });
});
