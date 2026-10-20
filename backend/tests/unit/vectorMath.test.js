/**
 * Kiem thu don vi: utils/vectorMath.js
 * Ham thuan, khong co tac dung phu -> kiem thu duoc day du cac truong hop bien.
 */
const { cosineSimilarity } = require("../../utils/vectorMath");

describe("cosineSimilarity", () => {
  test("hai vector giong het nhau tra ve 1", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  test("hai vector vuong goc tra ve 0", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  test("hai vector nguoc chieu tra ve -1", () => {
    expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1, 10);
  });

  test("vector cung huong nhung khac do lon van tra ve 1", () => {
    expect(cosineSimilarity([1, 1], [5, 5])).toBeCloseTo(1, 10);
  });

  test("khac do dai tra ve 0", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  test("vector khong tra ve 0 thay vi NaN", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
  });

  test("dau vao null hoac undefined tra ve 0", () => {
    expect(cosineSimilarity(null, [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], undefined)).toBe(0);
    expect(cosineSimilarity(null, null)).toBe(0);
  });

  test("hai mang rong tra ve 0", () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  test("gia tri nam trong doan [-1, 1] voi du lieu ngau nhien", () => {
    for (let i = 0; i < 50; i++) {
      const a = Array.from({ length: 16 }, () => Math.random() * 2 - 1);
      const b = Array.from({ length: 16 }, () => Math.random() * 2 - 1);
      const s = cosineSimilarity(a, b);
      expect(s).toBeGreaterThanOrEqual(-1.000001);
      expect(s).toBeLessThanOrEqual(1.000001);
    }
  });
});
