const path = require("path");
const mysql = require("mysql2");

// Nạp .env phòng trường hợp module này được require trực tiếp
// (ví dụ từ script hoặc từ bộ kiểm thử) mà chưa qua server.js
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const db = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "", // nếu XAMPP có mật khẩu thì điền vào .env
  database: process.env.DB_NAME ?? "ecommerce",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
