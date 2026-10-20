/**
 * May chu tinh phuc vu mot trang moi chua lien ket toi moi diem cuoi API,
 * giup spider cua OWASP ZAP bo duoc toan bo be mat API cua he thong.
 * Backend khong co route "/" nen spider khong tim duoc gi neu quet truc tiep.
 */
const http = require("http");
const TARGET = process.env.TARGET || "http://host.docker.internal:5001";

const endpoints = [
  "/api/categories", "/api/products", "/api/products/1", "/api/products/2",
  "/api/products/1/reviews", "/api/variants/product/1", "/api/voucher-stats",
  "/api/users", "/api/users/me", "/api/users/logs",
  "/api/users/staff/pending", "/api/users/staff/active", "/api/users/staff/probation",
  "/api/users/inventory/logs", "/api/users/attendance/me", "/api/users/attendance/issues",
  "/api/users/staff/payroll", "/api/users/staff/payroll/me",
  "/api/users/staff/requests/my", "/api/users/staff/requests/pending",
  "/api/users/staff/shifts/my", "/api/users/staff/shifts/pending",
  "/api/orders/my", "/api/orders/1", "/api/orders/admin",
  "/api/orders/admin/stats", "/api/orders/admin/best-selling",
  "/api/orders/admin/uncompleted", "/api/orders/admin/customer-growth",
  "/api/orders/admin/best-products", "/api/orders/admin/top-profit-products",
  "/api/orders/admin/category-revenue", "/api/orders/admin/monthly-revenue",
  "/api/orders/admin/weekly-revenue",
  "/api/products/pending", "/api/products/decided", "/api/products/inventory-alert",
  "/api/vouchers", "/api/vouchers/public",
  "/api/user-vouchers/available", "/api/user-vouchers/my",
  "/api/chat/my-thread", "/api/chat/messages/1", "/api/chat/ai/history",
  "/api/chat/admin/threads", "/api/chat/admin/threads/1/messages",
  "/api/chat/admin/users/1/orders",
  "/api/shifts/mine", "/api/shifts/all", "/api/shifts/day",
  "/api/notifications", "/api/notifications/unread",
];

const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><title>Tiger Shop - Ban do diem cuoi API</title></head>
<body><h1>Ban do diem cuoi API phuc vu quet bao mat</h1><ul>
${endpoints.map((e) => `<li><a href="${TARGET}${e}">${e}</a></li>`).join("\n")}
</ul></body></html>`;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(8099, () => console.log(`Trang moi chay tai http://127.0.0.1:8099 voi ${endpoints.length} lien ket`));
