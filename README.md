# Đánh giá và kiểm định chất lượng hệ thống Tiger Shop

## Giới thiệu

Nhóm không xây dựng Tiger Shop mà đóng vai trò một đội đảm bảo chất lượng độc lập. Hoạt động kiểm định đi qua bảy bước, tương ứng bảy chương của báo cáo: đặc tả lại yêu cầu để có thước đo đúng sai, lập kế hoạch kiểm thử, thiết kế và thực hiện test case, xây dựng bộ kiểm thử tự động, kiểm thử hiệu năng, kiểm thử bảo mật, rồi tổng hợp khiếm khuyết và đánh giá chất lượng.

**Kết luận:** Tiger Shop có nền tảng nghiệp vụ và độ tin cậy tốt. Giao dịch đặt hàng hoàn tác đúng khi lỗi, chống tranh chấp tồn kho đúng, chống chèn mã SQL tuyệt đối và đáp ứng vượt yêu cầu ở mức 100 người dùng đồng thời. Tuy vậy hệ thống **chưa đủ điều kiện nghiệm thu** vì còn 4 lỗ hổng bảo mật mức Nghiêm trọng về kiểm soát truy cập, chỉ 3 trên 10 tiêu chí kết thúc kiểm thử đạt và đặc tính Bảo mật chỉ được 1 trên 5 điểm.

## Hệ thống được kiểm thử

| Thành phần | Mô tả |
|---|---|
| Kiến trúc | Ứng dụng web ba tầng: trình bày, nghiệp vụ, dữ liệu |
| Giao diện | React 19, chạy ở cổng 3000 |
| Máy chủ | Node.js 22.16.0 và Express 4.22, cổng 5000 (cổng 5001 khi kiểm thử) |
| Cơ sở dữ liệu | MySQL 8.0.46, 23 bảng, truy cập bằng mysql2 với câu lệnh tham số hóa |
| Thời gian thực | Socket.IO 4.8 cho kênh chat giữa khách hàng và nhân viên |
| Trợ lý ảo | Tiger AI dùng Google Gemini, mô hình gemini-2.5-flash |
| Xác thực | JWT hiệu lực 1 giờ, mật khẩu băm bằng bcrypt, giới hạn 10 yêu cầu mỗi 60 giây cho nhóm `/api/auth` |
| Vai trò | ADMIN, MANAGER, STAFF, CUSTOMER |
| Chức năng | 25 Use Case chia 6 nhóm: Quản lý tài khoản, Bán hàng, Vận hành, Nhân sự, Hỗ trợ khách hàng, Quản trị |
| Quy mô | 24.317 dòng mã; 123 điểm cuối API khai báo, 118 điểm cuối hoạt động |
| Phiên bản được kiểm thử | Commit 7c27203 của kho gốc (nhánh `nang-cap-giao-dien-va-chatbox`) cộng các thay đổi chưa commit liệt kê ở Bảng H.2 của báo cáo |

## Phương pháp và công cụ

Kế hoạch kiểm thử dựa trên IEEE 829, IEEE 730 và ISO/IEC/IEEE 29119-3. Chất lượng được đánh giá theo mô hình ISO/IEC 25010 bản 2011; kiểm thử bảo mật theo OWASP Top 10 phiên bản 2021. Vì hệ thống viết bằng JavaScript, nhóm dùng các công cụ tương đương trong hệ sinh thái Node.js thay cho bộ công cụ Java: Jest thay JUnit, `jest.mock()` thay Mockito, Supertest thay MockMvc, Istanbul thay JaCoCo, Playwright thay Selenium; Apache JMeter và OWASP ZAP được giữ nguyên.

| Loại kiểm thử | Cấp độ | Kỹ thuật chính | Công cụ | Chương |
|---|---|---|---|---|
| Chức năng | Hệ thống | Phân vùng tương đương, giá trị biên, bảng quyết định, chuyển trạng thái, theo luồng Use Case, đoán lỗi | Excel, Jest, Supertest, thủ công | III |
| Đơn vị | Đơn vị | Hộp trắng theo nhánh điều kiện, giả lập phụ thuộc | Jest, `jest.mock()` | IV |
| Tích hợp và API | Tích hợp | Từ dưới lên, qua middleware tới cơ sở dữ liệu thật; kiểm tra phản hồi và trạng thái bảng | Jest, Supertest | IV |
| Cơ sở dữ liệu | Tích hợp | Ràng buộc dữ liệu, giao dịch, xóa mềm | Jest, truy vấn mysql2 | IV |
| Độ bao phủ mã | Đơn vị, tích hợp | Câu lệnh, nhánh, hàm, dòng | Istanbul | IV |
| Hiệu năng | Hệ thống | Kiểm thử tải ở 50, 100, 200 luồng | Apache JMeter 5.6.3 | V |
| Bảo mật | Hệ thống | Quét tự động, kiểm chứng theo kịch bản, rà soát mã | OWASP ZAP 2.17.0, `security_probe.js` | VI |
| Đánh giá tổng thể | Hệ thống | Hợp nhất khiếm khuyết, chấm điểm tám đặc tính chất lượng, đối chiếu tiêu chí kết thúc | ISO/IEC 25010 | VII |

## Cấu trúc kho

Kho chỉ gồm ba phần: mã nguồn hệ thống, minh chứng kiểm thử và báo cáo.

| Đường dẫn | Nội dung |
|---|---|
| `backend/` | Mã nguồn máy chủ Tiger Shop |
| `backend/tests/` | 18 tệp kiểm thử: 2 tệp đơn vị, 14 tệp tích hợp, 2 tệp thiết lập |
| `backend/jest.config.js` | Cấu hình Jest: môi trường node, chạy tuần tự, thời gian chờ 20 giây |
| `backend/scripts/seed_test_data.js` | Nạp bộ dữ liệu kiểm thử chuẩn |
| `backend/.env.example` | Mẫu biến môi trường của máy chủ |
| `frontend/` | Mã nguồn giao diện React, kèm `frontend/.env.example` |
| `database/schema_full.sql` | Lược đồ đủ 23 bảng do nhóm dựng lại (FIX-01, FIX-02) |
| `database/migrations/` | Các tệp migration gốc của nhóm phát triển |
| `bao-cao/` | Báo cáo chính thức (7 chương, phụ lục A đến H, 203 bảng, 75 hình, 27 tài liệu tham khảo) |
| `bao-cao-kiem-thu/` | Minh chứng kiểm thử và hướng dẫn môi trường (xem mục bên dưới) |

## Minh chứng kiểm thử

| Minh chứng | Vị trí | Phần liên quan trong báo cáo |
|---|---|---|
| 135 test case và kết quả thực hiện | `bao-cao-kiem-thu/Tiger_Shop_TestCases.xlsx` | Chương III, Phụ lục A |
| 222 kịch bản kiểm thử tự động | `backend/tests/` | Chương IV, Phụ lục B |
| Kết quả lượt chạy Jest ngày 25/09/2026 | `bao-cao-kiem-thu/jest-results.json` | Chương IV |
| Báo cáo độ bao phủ của Istanbul | `bao-cao-kiem-thu/coverage/` (mở `index.html`) | Chương IV, Phụ lục C |
| Kế hoạch JMeter, kịch bản phụ trợ, kết quả `.jtl` nén, `summary.json`, `dien_bien.json` | `bao-cao-kiem-thu/performance/` | Chương V, Phụ lục D |
| Kịch bản 47 phép kiểm chứng và kết quả, đặc tả OpenAPI, báo cáo OWASP ZAP | `bao-cao-kiem-thu/security/` | Chương VI, Phụ lục E |
| 20 sơ đồ PlantUML của Chương I | `bao-cao-kiem-thu/diagrams/` | Chương I |
| Hướng dẫn dựng môi trường kiểm thử | `bao-cao-kiem-thu/HUONG_DAN_MOI_TRUONG.md` | Chương II, Phụ lục G |

## Kết quả chính

### Test case

135 test case chia 9 nhóm, bao phủ 25 trên 25 Use Case. Tỉ lệ thực hiện 83,7% (113 trên 135); tỉ lệ đạt tính trên số đã thực hiện là 94,7% (107 trên 113). Không có test case ở trạng thái Blocked.

| Nhóm | Chức năng | Số TC | Đã thực hiện | Pass | Fail | Chưa thực hiện |
|---|---|---|---|---|---|---|
| AUTH | Xác thực và phân quyền | 25 | 20 | 19 | 1 | 5 |
| PROD | Sản phẩm và tồn kho | 22 | 19 | 18 | 1 | 3 |
| ORD | Giỏ hàng và đơn hàng | 22 | 15 | 14 | 1 | 7 |
| VOUC | Voucher | 12 | 12 | 12 | 0 | 0 |
| REV | Đánh giá sản phẩm | 8 | 8 | 8 | 0 | 0 |
| CHAT | Chat hỗ trợ và thông báo | 11 | 6 | 5 | 1 | 5 |
| AI | Trợ lý ảo Tiger AI | 10 | 9 | 8 | 1 | 1 |
| HR | Ca làm, chấm công, lương | 15 | 14 | 14 | 0 | 1 |
| ADM | Quản trị hệ thống | 10 | 10 | 9 | 1 | 0 |
| **Tổng** | | **135** | **113** | **107** | **6** | **22** |

Sáu test case không đạt: CHAT-009 (DEF-08), ADM-005 (DEF-06), PROD-008 (DEF-02), ORD-022 (DEF-11), AI-008 (PERF-03), AUTH-006 (DEF-12). Trạng thái test case được đánh giá theo đặc tả chứ không suy ra từ màu của kịch bản Jest: 12 kịch bản được viết để khẳng định hành vi sai đang quan sát được, nên chúng chạy thành công trong khi test case tương ứng vẫn là Fail.

### Kiểm thử tự động

| Chỉ tiêu | Kết quả |
|---|---|
| Kịch bản | 222 trong 16 tệp (17 đơn vị, 205 tích hợp), 222 thành công, chạy khoảng 33 giây |
| Điểm cuối API được gọi tới | 104 trên 118 (88,1%) |
| Độ bao phủ câu lệnh | 70,85% (ngưỡng 70%, đạt) |
| Độ bao phủ nhánh | 56,46% (ngưỡng 60%, chưa đạt) |
| Độ bao phủ hàm và dòng | 83,15% và 78,45% |
| Ràng buộc dữ liệu | 20 ràng buộc: 9 đạt, 3 đạt một phần, 1 không đạt, 1 bị vi phạm lúc tạo sản phẩm, 6 chưa kiểm chứng |
| Giao dịch | 5 trên 5 luồng có kiểm chứng đạt, gồm hoàn tác (ORD-013) và chống tranh chấp (ORD-014) |

### Hiệu năng

Ba mức tải, mỗi mức 50.000 mẫu, tổng 150.000 mẫu.

| Mức tải | Thông lượng (yêu cầu mỗi giây) | Trung bình (ms) | Phân vị 95 (ms) | Tỉ lệ lỗi |
|---|---|---|---|---|
| 50 luồng | 524,7 | 93,3 | 240 | 0,06% |
| 100 luồng | 494,7 | 199,0 | 461 | 0,08% |
| 200 luồng | 385,9 | 508,9 | 1.215 | 0,06% |

Đạt 5 trên 7 chỉ tiêu: thời gian phản hồi của trợ lý ảo không đạt (trung bình 5.017 ms trên 6 lượt, ngưỡng 5.000 ms) và thời gian tải trang lần đầu chưa đo. Toàn bộ 104 lỗi ở kịch bản đặt hàng là khóa chết InnoDB do `createOrder` ghi `order_items` trước khi trừ tồn kho (PERF-01); thí nghiệm tái hiện cho thấy đổi trình tự câu lệnh đưa số khóa chết về 0.

### Bảo mật

| Chỉ tiêu | Kết quả |
|---|---|
| Quét chủ động OWASP ZAP qua đặc tả OpenAPI | 179 địa chỉ, 119 quy tắc, 115 đạt, 0 cảnh báo mức Cao |
| Kiểm chứng theo kịch bản | 47 phép trên 7 nhóm: 28 đạt, 10 cảnh báo, 9 thất bại |
| Lỗ hổng | 16: 4 Nghiêm trọng, 3 Cao, 6 Trung bình, 3 Thấp |
| Chèn mã SQL | Không phát hiện, 13 trên 13 phép kiểm chứng đạt |

ZAP không báo lỗ hổng mức Cao, nhưng kiểm chứng theo kịch bản và rà soát mã nguồn tìm ra 4 lỗ hổng Nghiêm trọng về kiểm soát truy cập. Đây là vùng mù của công cụ quét tự động vì nó không hiểu nghiệp vụ.

### Khiếm khuyết

Sau khi khử trùng lặp các mã kép, còn **36 khiếm khuyết tồn đọng**: 4 Nghiêm trọng, 4 Cao, 14 Trung bình, 14 Thấp; theo loại gồm 16 lỗ hổng bảo mật, 9 khiếm khuyết chức năng, 6 khiếm khuyết chất lượng mã và 5 khiếm khuyết hiệu năng.

| Mã | Mức độ | Mô tả |
|---|---|---|
| VUL-01 (DEF-08) | Nghiêm trọng | Đọc được hội thoại hỗ trợ của người dùng khác do không kiểm tra quyền sở hữu |
| VUL-02 (DEF-06) | Nghiêm trọng | Đặt lại mật khẩu về một hằng số cố định và trả nguyên văn trong phản hồi |
| VUL-12 | Nghiêm trọng | Tuyến sửa sản phẩm thiếu kiểm soát vai trò, khách hàng sửa được mọi sản phẩm |
| VUL-13 | Nghiêm trọng | Quản lý tự nâng vai trò của mình lên ADMIN |
| VUL-04 (DEF-03) | Cao | Tuyến tạo sản phẩm thiếu kiểm soát vai trò |
| VUL-14 | Cao | Trợ lý ảo đọc đơn hàng theo mã mà không kiểm tra quyền sở hữu |
| VUL-15 | Cao | Sự kiện `join_thread` của Socket.IO không xác thực người tham gia |
| DEF-02 | Cao | Sản phẩm do Quản lý tạo được kích hoạt ngay, bỏ qua bước duyệt |

### Đánh giá theo ISO/IEC 25010

| Đặc tính | Điểm |
|---|---|
| Tính phù hợp chức năng | 3/5 |
| Hiệu quả hiệu năng | 4/5 |
| Tính tương thích | 3/5 |
| Tính khả dụng | Chưa đánh giá |
| Độ tin cậy | 4/5 |
| Tính bảo mật | 1/5 |
| Khả năng bảo trì | 3/5 |
| Tính khả chuyển | 3/5 |
| **Trung bình 7 đặc tính có điểm** | **3,0/5** |

Đối chiếu 10 tiêu chí kết thúc kiểm thử, chỉ 3 tiêu chí đạt: độ bao phủ câu lệnh, không có cảnh báo ZAP mức High và 100% Use Case có test case.

## Hướng dẫn chạy lại

### Phần mềm cần có

| Phần mềm | Phiên bản đã dùng | Dùng cho |
|---|---|---|
| Node.js và npm | 22.16.0 và 10.9.2 | Máy chủ, giao diện, bộ kiểm thử |
| Docker (OrbStack hoặc Docker Desktop) | Bản cài trên máy | Chạy MySQL và OWASP ZAP |
| MySQL | 8.0.46, ảnh `mysql:8.0` | Cơ sở dữ liệu |
| OpenJDK và Apache JMeter | 21.0.7 và 5.6.3 | Kiểm thử hiệu năng |
| Python | 3.x | Phân tích kết quả JMeter |
| OWASP ZAP | 2.17.0, ảnh `ghcr.io/zaproxy/zaproxy:stable` | Quét bảo mật |

### 1. Dựng cơ sở dữ liệu

```bash
docker run -d --name tigershop-mysql \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=ecommerce \
  -p 3306:3306 mysql:8.0 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
docker exec -i tigershop-mysql mysql -uroot -e "CREATE DATABASE ecommerce_test CHARACTER SET utf8mb4"
docker exec -i tigershop-mysql mysql -uroot ecommerce < database/schema_full.sql
docker exec -i tigershop-mysql mysql -uroot ecommerce_test < database/schema_full.sql
```

### 2. Cấu hình biến môi trường

Sao chép `backend/.env.example` thành `backend/.env` và `frontend/.env.example` thành `frontend/.env`, rồi điền giá trị. `JWT_SECRET` là bắt buộc; thiếu `GEMINI_API_KEY` thì trợ lý ảo chỉ hiển thị thông báo bảo trì. Danh sách biến ở Bảng G.2 của báo cáo. Kho không chứa tệp `.env` thật.

### 3. Chạy kiểm thử tự động

```bash
cd backend
npm ci
npm run seed:test          # nạp lại dữ liệu mẫu vào ecommerce_test
npm test                   # 222 kịch bản, chạy tuần tự
npm run test:coverage      # kèm báo cáo độ bao phủ, sinh ở backend/coverage
```

Bộ kiểm thử luôn dùng cơ sở dữ liệu `ecommerce_test` và tự nạp lại dữ liệu trước mỗi tệp test, nên không ảnh hưởng dữ liệu phát triển. Tài khoản kiểm thử thuộc miền `tigershop.test` (`admin@`, `manager@`, `staff@`, `customer1@`, `customer2@`...), mật khẩu chung `Test@123`; đây là dữ liệu mẫu chỉ tồn tại trong cơ sở dữ liệu kiểm thử.

### 4. Chạy hệ thống

```bash
cd backend && npm start                         # máy chủ ở cổng 5000
cd frontend && npm install && npm start         # giao diện ở cổng 3000
cd backend && PORT=5001 node server.js          # máy chủ cho kiểm thử hiệu năng và bảo mật
```

Trên macOS, cổng 5000 bị AirPlay Receiver chiếm; khi cần chạy giao diện phải tắt AirPlay Receiver vì mã giao diện gọi cố định `http://localhost:5000`.

### 5. Kiểm thử hiệu năng

```bash
cd backend && PORT=5001 node server.js
cd backend && node ../bao-cao-kiem-thu/performance/gen_tokens.js
cd bao-cao-kiem-thu/performance
node reset_orders.js
jmeter -n -t tiger_shop_load.jmx -l results/load_100.jtl -Jusers=100 -Jramp=1 -Jloops=100 -Jport=5001
jmeter -n -t tiger_shop_login.jmx -l results/login_50.jtl -Jusers=50 -Jloops=4
python3 analyze.py
```

Mức 50 luồng dùng 200 vòng, mức 200 luồng dùng 50 vòng; chạy `reset_orders.js` trước mỗi mức. **Cảnh báo:** `reset_orders.js` xóa sạch đơn hàng và tin nhắn của cơ sở dữ liệu `ecommerce`; `tai_hien_khoa_chet.js` cũng xóa dữ liệu và chỉ được chạy trên một máy chủ MySQL riêng.

### 6. Kiểm thử bảo mật

```bash
cd backend && PORT=5001 node server.js
cd backend && node ../bao-cao-kiem-thu/security/security_probe.js
cd bao-cao-kiem-thu/security
docker run --rm -v "$(pwd):/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t /zap/wrk/openapi_tigershop.json -f openapi \
  -r zap_api_report.html -J zap_api_report.json -I
```

Sau mỗi lượt quét phải mở tệp JSON kiểm tra trường `site @name` là cổng 5001 của hệ thống; nếu khác thì loại bỏ kết quả và quét lại. Các tệp `seed_server.js`, `zap.yaml`, `zap_report.*` thuộc một lượt quét sai đích được giữ lại làm minh chứng.

Hướng dẫn đầy đủ từng bước ở `bao-cao-kiem-thu/HUONG_DAN_MOI_TRUONG.md` và Phụ lục G của báo cáo.

## Thay đổi mã nguồn phục vụ kiểm thử

Nhóm là đội kiểm thử độc lập nên **không sửa khiếm khuyết nào của hệ thống**; các lỗ hổng trong báo cáo vẫn còn nguyên trong mã. Chỉ có các thay đổi dưới đây để hệ thống chạy được và kiểm thử được.

| Tệp | Thay đổi | Ảnh hưởng khi chạy bình thường |
|---|---|---|
| `backend/config/db.js` | Đọc thông tin kết nối từ biến môi trường, giữ giá trị cũ làm mặc định (FIX-03) | Không đổi |
| `backend/server.js` | Chỉ khởi tạo Socket.IO, tác vụ định kỳ và mở cổng khi chạy trực tiếp; xuất `app` cho Supertest | Không đổi |
| `backend/package.json` | Thêm Jest, Supertest và các lệnh `test`, `test:unit`, `test:integration`, `test:coverage`, `seed:test` | Không ảnh hưởng mã chạy thật |
| `database/schema_full.sql` | Tệp mới: lược đồ đủ 23 bảng và 4 cột còn thiếu (FIX-01, FIX-02) | Dùng để dựng cơ sở dữ liệu |
| `backend/tests/`, `jest.config.js`, `scripts/seed_test_data.js`, `bao-cao-kiem-thu/` | Tệp mới của nhóm kiểm thử | Không được mã ứng dụng tham chiếu |

## Hạn chế

1. 22 test case chưa thực hiện, chủ yếu thuộc giao diện và tương tác thời gian thực, nên Tính khả dụng chưa được đánh giá.
2. Kiểm thử hiệu năng chạy cùng một máy với hệ thống; số liệu chỉ dùng để so sánh tương đối giữa các mức tải.
3. Lượt quét ZAP chưa cấu hình xác thực và chỉ gồm phương thức GET.
4. Phép đo trợ lý ảo chỉ có 6 lượt, chưa đủ để kết luận chắc chắn về mặt thống kê.
5. Độ bao phủ nhánh 56,46% chưa đạt ngưỡng 60%, do các nhánh xử lý lỗi cơ sở dữ liệu khó chạm tới khi kiểm thử trên cơ sở dữ liệu thật.

## Tài liệu liên quan

| Tài liệu | Vị trí |
|---|---|
| Báo cáo chính thức | `bao-cao/đánh giá kiểm định (đầy đủ).docx` |
| Hồ sơ kiểm thử chi tiết | `bao-cao-kiem-thu/README.md` |
| Hướng dẫn dựng môi trường | `bao-cao-kiem-thu/HUONG_DAN_MOI_TRUONG.md` |
| Bảng test case | `bao-cao-kiem-thu/Tiger_Shop_TestCases.xlsx` |

## Lưu ý

Kho không chứa tệp `.env`, mã thông báo đăng nhập hay thư mục `node_modules`. Tệp `backend/services/mailService.js` vẫn còn thông tin đăng nhập SMTP ghi cứng, đúng như lỗ hổng VUL-03 mà báo cáo mô tả; không dùng lại thông tin này. Mã nguồn Tiger Shop thuộc nhóm phát triển, kho này chỉ phục vụ mục đích học tập của học phần.
