// Xoa don hang phat sinh tu lan chay truoc va dat lai ton kho,
// bao dam ba muc tai duoc do trong cung dieu kien.
const path = require("path");
const m = require(path.join(__dirname, "..", "..", "backend", "node_modules", "mysql2", "promise"));
(async () => {
  const c = await m.createConnection({ host: "localhost", user: "root", password: "", database: "ecommerce" });
  await c.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const t of ["order_items", "order_logs", "return_requests", "orders", "chat_messages"]) {
    await c.query(`TRUNCATE TABLE ${t}`);
  }
  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  await c.query("UPDATE products SET stock = 999");
  const [[{ n }]] = await c.query("SELECT COUNT(*) n FROM products");
  console.log(`Da dat lai: 0 don hang, ${n} san pham ton kho 999`);
  await c.end();
})();
