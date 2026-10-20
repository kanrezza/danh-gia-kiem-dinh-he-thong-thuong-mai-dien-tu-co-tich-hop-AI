/**
 * Sinh tep CSV chua ma thong bao JWT cho JMeter.
 * Can thiet vi diem cuoi /api/auth bi gioi han 10 yeu cau moi 60 giay,
 * neu de JMeter tu dang nhap thi toan bo luong tai se bi tra ve 429.
 */
const path = require("path");
const BACKEND = path.join(__dirname, "..", "..", "backend");
const fs = require("fs");

const BASE = process.env.BASE || "http://127.0.0.1:5001";
const accounts = [
  "customer1@tigershop.test", "customer2@tigershop.test",
  "staff@tigershop.test", "manager@tigershop.test", "admin@tigershop.test",
];

(async () => {
  const rows = [];
  for (const email of accounts) {
    // Cho giua cac lan de khong cham gioi han tan suat
    let r, tok;
    for (let i = 0; i < 5; i++) {
      r = await fetch(BASE + "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "Test@123" }),
      });
      const d = await r.json();
      if (r.status === 200) { tok = d.token; break; }
      await new Promise((res) => setTimeout(res, 8000));
    }
    if (!tok) { console.error("Khong lay duoc token cho", email); process.exit(1); }
    rows.push(`${email},${tok}`);
    console.log("OK", email);
  }
  const out = path.join(__dirname, "tokens.csv");
  fs.writeFileSync(out, rows.join("\n") + "\n", "utf8");
  console.log("Da ghi", rows.length, "ma thong bao vao", out);
})();
