# Hướng dẫn dựng môi trường kiểm thử

Tài liệu này ghi lại các bước đã thực hiện để đưa hệ thống Tiger Shop từ trạng thái **không chạy được** sang trạng thái **sẵn sàng kiểm thử**, ứng với giai đoạn 4 trong Bảng 2.23 của Chương II. Báo cáo trích tài liệu này ở mục [27]; Bảng 2.7 và Bảng G.3 tóm tắt cùng các bước.

## 1. Cơ sở dữ liệu MySQL trong Docker

MySQL được chạy trong container (Docker trên OrbStack) thay vì cài trực tiếp lên máy, nhằm tránh thay đổi cấu hình hệ thống và cho phép xóa sạch dễ dàng khi không dùng nữa.

```bash
docker run -d --name tigershop-mysql \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=ecommerce \
  -p 3306:3306 \
  -v tigershop-mysql-data:/var/lib/mysql \
  --restart unless-stopped \
  mysql:8.0 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

Phiên bản thực tế đang chạy: **MySQL 8.0.46**.

Container được cấu hình khớp với giá trị mặc định trong `backend/config/db.js` (host `localhost`, user `root`, mật khẩu rỗng, cơ sở dữ liệu `ecommerce`). Ban đầu tệp này ghi cứng thông tin kết nối; nhóm đã sửa để đọc biến môi trường và giữ các giá trị cũ làm dự phòng (FIX-03), nhờ đó tách được cơ sở dữ liệu kiểm thử riêng.

Tạo cơ sở dữ liệu kiểm thử `ecommerce_test`, tách biệt với cơ sở dữ liệu phát triển `ecommerce`:

```bash
docker exec -i tigershop-mysql mysql -uroot -e "CREATE DATABASE ecommerce_test CHARACTER SET utf8mb4"
```

Các lệnh quản lý container:

```bash
docker start tigershop-mysql
docker stop tigershop-mysql
docker exec -it tigershop-mysql mysql -uroot ecommerce_test
```

## 2. Dựng lược đồ 23 bảng

Kho mã nguồn chỉ định nghĩa đầy đủ 14 trên 23 bảng (Bảng 2.6):

| Nơi định nghĩa | Số bảng |
|----------------|---------|
| `database/migrations/*.sql` | 12 |
| `database/ecommerce.sql` | 2 |
| Mã JavaScript tạo bảng lúc chạy (`notifications`, `return_requests`) | 2 |
| Không được định nghĩa ở đâu | 7 |
| **Tổng** | **23** |

Tệp `database/schema_full.sql` được viết mới để hợp nhất toàn bộ 23 bảng (FIX-01) và bổ sung bốn cột mã nguồn đang dùng nhưng lược đồ không có: `orders.cancel_reason`, `chat_messages.sentiment`, `staff_requests.order_id`, `threads.is_human_needed` (FIX-02). Nạp lược đồ vào cả hai cơ sở dữ liệu:

```bash
docker exec -i tigershop-mysql mysql -uroot ecommerce < database/schema_full.sql
docker exec -i tigershop-mysql mysql -uroot ecommerce_test < database/schema_full.sql
```

> **Lưu ý.** Bảy bảng `categories`, `product_variants`, `vouchers`, `user_vouchers`, `threads`, `chat_messages`, `user_activity_logs` cùng nhiều cột của `users`, `products`, `orders`, `order_items` không có định nghĩa gốc ở bất kỳ đâu trong kho mã nguồn. Kiểu dữ liệu và ràng buộc của chúng được **suy ra từ các câu truy vấn** trong `backend/controllers` và `backend/models`. Lược đồ này đã được kiểm chứng là chạy đúng với toàn bộ luồng nghiệp vụ trong các kịch bản kiểm tra nhanh ở mục 4, nhưng vẫn nên đối chiếu với cơ sở dữ liệu gốc trên máy nhóm phát triển trước khi dùng chính thức.

## 3. Cấu hình và nạp dữ liệu kiểm thử

### Biến môi trường

Tạo tệp `backend/.env` với các biến của Bảng G.2. Tệp này không được đưa vào kho mã nguồn; không chép giá trị khóa thật vào tài liệu hay báo cáo.

| Biến | Ý nghĩa | Giá trị mặc định trong mã |
|------|---------|---------------------------|
| `DB_HOST` | Địa chỉ máy chủ MySQL | `localhost` |
| `DB_PORT` | Cổng MySQL | `3306` |
| `DB_USER` | Tài khoản MySQL | `root` |
| `DB_PASSWORD` | Mật khẩu MySQL | chuỗi rỗng |
| `DB_NAME` | Tên cơ sở dữ liệu; kiểm thử tự động luôn dùng `ecommerce_test` | `ecommerce` |
| `JWT_SECRET` | Khóa ký mã thông báo JWT | không có, bắt buộc khai báo |
| `GEMINI_API_KEY` | Khóa dịch vụ Google Gemini; thiếu khóa thì trợ lý ảo báo bảo trì như AI-007 | không có |
| `PORT` | Cổng của máy chủ | `5000` |

### Nạp dữ liệu

```bash
cd backend
npm ci
npm run seed:test
```

Lệnh `npm run seed:test` chạy `scripts/seed_test_data.js` với `DB_NAME=ecommerce_test`. Kịch bản xóa sạch 22 bảng rồi nạp lại từ đầu, bảo đảm mỗi vòng kiểm thử bắt đầu từ cùng một trạng thái. Dữ liệu nạp đúng theo Bảng 2.8 và Bảng 2.9 của Chương II: 8 tài khoản cho 4 vai trò với mật khẩu chung `Test@123`; 4 danh mục; 21 sản phẩm gồm 15 đang bán, 3 chờ duyệt, 2 tồn kho thấp và 1 sản phẩm tồn kho bằng 1; 9 biến thể của 3 sản phẩm đầu; 4 voucher (một giảm theo phần trăm, một giảm theo số tiền, một hết lượt, một hết hạn); 5 đơn hàng ở 5 trạng thái khác nhau.

> **Cảnh báo (rủi ro R14).** Nếu chạy thẳng `node scripts/seed_test_data.js` mà không đặt `DB_NAME`, kịch bản sẽ xóa dữ liệu của cơ sở dữ liệu `ecommerce`. Luôn dùng `npm run seed:test`.

| Vai trò | Tài khoản |
|---------|-----------|
| ADMIN | admin@tigershop.test |
| MANAGER | manager@tigershop.test |
| STAFF chính thức | staff@tigershop.test |
| STAFF thử việc | staff.probation@tigershop.test |
| STAFF chờ duyệt | staff.pending@tigershop.test |
| CUSTOMER | customer1@tigershop.test |
| CUSTOMER | customer2@tigershop.test |
| CUSTOMER bị khóa | customer.locked@tigershop.test |

## 4. Khởi chạy và kiểm chứng

### Vấn đề cổng 5000

Trên macOS, cổng 5000 bị **AirPlay Receiver** chiếm sẵn (tiến trình `ControlCenter`, máy chủ `AirTunes`), nên khởi chạy máy chủ ở cổng mặc định sẽ báo lỗi `EADDRINUSE` (rủi ro R11).

Khi kiểm thử API, hiệu năng và bảo mật, máy chủ được chạy ở cổng 5001:

```bash
cd backend && PORT=5001 node server.js
```

Khi cần chạy giao diện, máy chủ bắt buộc phải chạy ở cổng 5000: mã giao diện ghi cứng địa chỉ `http://localhost:5000` ở nhiều tệp, kể cả `services/api.js`, nên cấu hình `proxy` trong `frontend/package.json` không có tác dụng. Trường hợp này cần tắt AirPlay Receiver trong System Settings, mục General, phần AirDrop & Handoff. Ngoài ra `frontend/package-lock.json` không còn khớp với `package.json`, nên cài thư viện giao diện bằng `npm install` thay cho `npm ci` (Phụ lục G.3).

### Kết quả kiểm tra nhanh

Sau khi dựng xong môi trường, 16 kịch bản kiểm tra nhanh đã được chạy để xác nhận lược đồ suy ra là đúng. Kết quả: **16 trên 16 hành vi đúng như mong đợi**.

| Nhóm | Kịch bản | Kết quả |
|------|----------|---------|
| Xác thực | Đăng nhập CUSTOMER, đăng nhập ADMIN, sai mật khẩu bị chặn 401, gọi API không token bị chặn 401 | Đúng |
| Sản phẩm | Danh sách công khai trả 18 sản phẩm active, chi tiết sản phẩm, id không tồn tại trả 404 | Đúng |
| Voucher | SALE20 cho đơn 300.000đ giảm đúng 50.000đ (bị chặn bởi `max_discount`), đơn 150.000đ bị từ chối, voucher hết hạn bị từ chối | Đúng |
| Đặt hàng | Đặt hàng thành công, tồn kho giảm từ 50 xuống 48, sinh đúng tin nhắn hệ thống | Đúng |
| Giao dịch | Đặt 2 sản phẩm khi tồn kho chỉ còn 1 bị từ chối và **hoàn tác sạch**: tồn kho vẫn bằng 1, không sinh bản ghi `order_items` | Đúng |
| Phân quyền | CUSTOMER bị chặn 403 ở nhật ký hệ thống và danh sách sản phẩm chờ duyệt, ADMIN truy cập được | Đúng |

Kiểm tra bảng mã: tin nhắn tiếng Việt kèm emoji được lưu và đọc lại chính xác qua `mysql2`, xác nhận cấu hình `utf8mb4` hoạt động đúng.

## 5. Trạng thái các rủi ro môi trường

Trạng thái theo Bảng 2.24 tại thời điểm hoàn thành báo cáo:

| Mã | Rủi ro | Trạng thái |
|----|--------|------------|
| R01 | MySQL chưa cài, hệ thống không chạy được | **Đã xử lý**: container MySQL 8.0.46 |
| R02 | Lược đồ chỉ định nghĩa đầy đủ 14 trên 23 bảng | **Đã xử lý**: `database/schema_full.sql` (FIX-01, FIX-02) |
| R03 | Chưa có bộ kiểm thử tự động | **Đã xử lý**: 222 kịch bản Jest trong 16 tệp |
| R04 | `config/db.js` ghi cứng thông tin kết nối | **Đã xử lý**: đọc biến môi trường, giữ giá trị cũ làm dự phòng (FIX-03) |
| R11 | Cổng 5000 bị AirPlay Receiver của macOS chiếm | **Đã xử lý**: chạy máy chủ ở cổng 5001 bằng biến `PORT` |
| R14 | `reset_orders.js` và `seed_test_data.js` mặc định trỏ vào `ecommerce` và xóa dữ liệu | **Chưa xử lý**: luôn dùng `npm run seed:test`; chỉ chạy `reset_orders.js` khi chủ đích đo hiệu năng trên `ecommerce` |

## 6. Chạy kiểm thử

```bash
cd backend && npm test                  # 222 kịch bản, chạy tuần tự
cd backend && npm run test:coverage     # kèm báo cáo độ bao phủ ở backend/coverage
cd backend && PORT=5001 node server.js  # máy chủ cho kiểm thử hiệu năng và bảo mật
```

Lượt chạy ngày 25/09/2026 cho 222 trên 222 kịch bản thành công trong 33,0 giây. Lệnh tái lập kiểm thử hiệu năng và bảo mật nằm ở Phụ lục D.4 và Phụ lục E.4 của báo cáo, cũng như trong `README.md`.

Kiểm thử API độc lập bằng Postman, Newman và kiểm thử giao diện bằng Playwright (giai đoạn 6 của Bảng 2.23) chưa được thực hiện; 22 test case giao diện và thời gian thực vẫn ở trạng thái chưa thực hiện như Bảng 3.38.
