# Hồ sơ kiểm thử hệ thống Tiger Shop

Thư mục này đi kèm báo cáo đồ án học phần **Đánh giá và Kiểm định chất lượng phần mềm**, lớp học phần CSE703010-1-1-26, giảng viên hướng dẫn TS. Trịnh Thanh Bình.

**Đề tài:** Đánh giá và kiểm định chất lượng hệ thống thương mại điện tử có tích hợp AI Chatbot tư vấn.

**Nhóm thực hiện:** Trần Đình Danh (nhóm trưởng), Lê Đình Đức Anh, Lê Quang Thắng.

Báo cáo chính thức là tệp Word nộp riêng cho giảng viên, không đưa lên kho. Số liệu trong tệp này lấy từ bản Word đó và từ các tệp kết quả trong thư mục; nếu có khác biệt, bản Word là bản chuẩn.

## Nội dung báo cáo

| Phần | Nội dung | Số bảng | Số hình | Số liệu chính |
|------|----------|---------|---------|---------------|
| Chương I | Đặc tả yêu cầu phần mềm | 36 | 20 | 25 Use Case, 118 điểm cuối API hoạt động, cơ sở dữ liệu 23 bảng |
| Chương II | Xây dựng SQA và Test Plan | 31 | 6 | 10 giai đoạn, 15 rủi ro, 10 tiêu chí kết thúc kiểm thử |
| Chương III | Thiết kế và thực hiện test case | 38 | 3 | 135 test case: 107 Pass, 6 Fail, 22 chưa thực hiện |
| Chương IV | Kiểm thử tự động | 29 | 5 | 222 kịch bản Jest đều thành công, độ bao phủ câu lệnh 70,85% |
| Chương V | Kiểm thử hiệu năng | 25 | 9 | Ba mức tải với 150.000 mẫu, đạt 5 trên 7 chỉ tiêu |
| Chương VI | Kiểm thử bảo mật | 18 | 5 | 47 phép kiểm chứng theo kịch bản, 119 quy tắc ZAP, 16 lỗ hổng |
| Chương VII | Kết luận | 10 | 3 | 36 khiếm khuyết tồn đọng, điểm ISO/IEC 25010 trung bình 3,0/5 |
| Phụ lục A đến H | Test case, mã kiểm thử, độ bao phủ, JMeter, ZAP, giao diện, môi trường, kho mã | 16 | 24 | |

Toàn báo cáo có 203 bảng, 75 hình và 27 tài liệu tham khảo theo chuẩn IEEE.

## Các tệp trong thư mục

| Tệp hoặc thư mục | Nội dung |
|------------------|----------|
| `README.md` | Tệp này |
| `HUONG_DAN_MOI_TRUONG.md` | Cách dựng lại môi trường kiểm thử, tài liệu [27] của báo cáo |
| `Tiger_Shop_TestCases.xlsx` | 135 test case trong 12 sheet, có kết quả lượt chạy ngày 25/09/2026 (Phụ lục A) |
| `jest-results.json` | Kết quả lượt chạy Jest ngày 25/09/2026: 16 tệp, 222 kịch bản |
| `coverage/` | Báo cáo độ bao phủ của Istanbul từ lượt đo chính thức, mở `index.html` (Phụ lục C) |
| `diagrams/` | 20 tệp nguồn PlantUML và 20 ảnh của Chương I |
| `performance/` | Kế hoạch JMeter, kịch bản phụ trợ và kết quả `.jtl` (Phụ lục D) |
| `security/` | Kịch bản kiểm chứng bảo mật, đặc tả OpenAPI và báo cáo ZAP (Phụ lục E) |
| `scripts/` | Kịch bản sinh và đối chiếu dữ liệu test case |

Các bản nháp markdown và tệp Excel bản cũ dùng trong quá trình làm việc không thuộc hồ sơ nộp nên không được đưa vào kho; bản Word cuối cùng là bản chuẩn.

Ngoài thư mục này, các thành phần liên quan tới kiểm thử nằm ở:

| Vị trí | Nội dung |
|--------|----------|
| `backend/tests/` | 18 tệp: 2 tệp kiểm thử đơn vị, 14 tệp kiểm thử tích hợp, 2 tệp thiết lập |
| `backend/jest.config.js` | Cấu hình Jest |
| `backend/scripts/seed_test_data.js` | Nạp bộ dữ liệu kiểm thử (Bảng 2.8 và Bảng 2.9) |
| `database/schema_full.sql` | Lược đồ đầy đủ 23 bảng do nhóm dựng lại (FIX-01, FIX-02) |

## Bộ test case

135 test case chia 9 nhóm, bao phủ đủ 25 trên 25 Use Case. Kết quả theo Bảng 3.34:

| Mã nhóm | Nhóm chức năng | Số TC | Đã thực hiện | Pass | Fail | Chưa thực hiện |
|---------|----------------|-------|--------------|------|------|----------------|
| AUTH | Xác thực và phân quyền | 25 | 20 | 19 | 1 | 5 |
| PROD | Quản lý sản phẩm và tồn kho | 22 | 19 | 18 | 1 | 3 |
| ORD | Giỏ hàng và đơn hàng | 22 | 15 | 14 | 1 | 7 |
| VOUC | Voucher và ví voucher | 12 | 12 | 12 | 0 | 0 |
| REV | Đánh giá sản phẩm | 8 | 8 | 8 | 0 | 0 |
| CHAT | Chat hỗ trợ thời gian thực | 11 | 6 | 5 | 1 | 5 |
| AI | Trợ lý ảo Tiger AI | 10 | 9 | 8 | 1 | 1 |
| HR | Ca làm, chấm công và lương | 15 | 14 | 14 | 0 | 1 |
| ADM | Quản trị hệ thống | 10 | 10 | 9 | 1 | 0 |
| | **Tổng cộng** | **135** | **113** | **107** | **6** | **22** |

Tỉ lệ thực hiện là 83,7% và tỉ lệ đạt trên số đã thực hiện là 94,7%. Không có test case nào ở trạng thái Blocked.

Phân bố theo loại: Positive 70, Negative 34, Security 22, Boundary 9. Theo mức ưu tiên: Cao 110, Trung bình 25. Theo phương pháp thiết kế: 119 thực thi bằng mã, 16 thủ công; thực tế có 112 test case thực hiện qua kịch bản Jest và 1 test case (AI-008) thực hiện bằng phép đo riêng.

Sáu test case không đạt và khiếm khuyết tương ứng (Bảng 3.36): CHAT-009 (DEF-08), ADM-005 (DEF-06), PROD-008 (DEF-02), ORD-022 (DEF-11), AI-008 (PERF-03), AUTH-006 (DEF-12). 22 test case chưa thực hiện chủ yếu là kịch bản giao diện và thời gian thực qua Socket.IO, dự kiến làm bằng Playwright hoặc thủ công (Bảng 3.38).

### Kịch bản trong thư mục scripts

`import_results.py` đối chiếu tệp Excel với `jest-results.json`:

```bash
cd backend && npx jest --runInBand --json --outputFile=../bao-cao-kiem-thu/jest-results.json
cd bao-cao-kiem-thu/scripts && python3 import_results.py              # chỉ đối chiếu, không sửa Excel
cd bao-cao-kiem-thu/scripts && python3 import_results.py --ghi-ngay   # đối chiếu và ghi ngày chạy Jest
```

Trạng thái Pass, Fail trong Excel được đánh giá theo đặc tả (Bảng 2.25), không suy ra từ việc kịch bản Jest chạy thành công, nên `import_results.py` không ghi cột Trạng thái và Kết quả thực tế. Kịch bản in danh sách test case cần đánh giá lại và ghi báo cáo ra `doi_chieu_jest.txt`.

Các kịch bản `tc_data.py`, `gen_excel.py`, `gen_chuong3.py` và `gop_bao_cao.py` thuộc giai đoạn soạn bản nháp markdown; `gen_chuong3.py` và `gop_bao_cao.py` sinh lại chính các bản nháp đó nên không cần chạy. `tc_data.py` vẫn mang nội dung thiết kế cũ, vì vậy **không chạy `gen_excel.py`**: lệnh này dựng lại tệp Excel từ đầu và làm mất phần đã đồng bộ với Chương III.

## Sơ đồ Chương I

| Hình | Nội dung | Tệp trong `diagrams/` |
|------|----------|-----------------------|
| 1.1 | Biểu đồ Use Case tổng quát phân hệ Khách hàng | `hinh_1_1_usecase_tongquat_khachhang` |
| 1.2 | Biểu đồ Use Case tổng quát phân hệ Vận hành và Quản trị | `hinh_1_2_usecase_tongquat_quantri` |
| 1.3 | Biểu đồ Use Case chi tiết cho tác nhân Khách hàng | `hinh_1_3_usecase_customer` |
| 1.4 | Biểu đồ Use Case chi tiết cho tác nhân Nhân viên | `hinh_1_4_usecase_staff` |
| 1.5 | Biểu đồ Use Case chi tiết cho tác nhân Quản lý | `hinh_1_5_usecase_manager` |
| 1.6 | Biểu đồ Use Case chi tiết cho tác nhân Quản trị viên | `hinh_1_6_usecase_admin` |
| 1.7 | Sơ đồ tuần tự chức năng Đăng ký tài khoản | `hinh_1_7_sequence_dang_ky` |
| 1.8 | Sơ đồ tuần tự chức năng Đăng nhập và phân quyền | `hinh_1_8_sequence_dang_nhap` |
| 1.9 | Sơ đồ tuần tự chức năng Đặt hàng có áp dụng voucher | `hinh_1_9_sequence_dat_hang` |
| 1.10 | Sơ đồ tuần tự chức năng Tư vấn sản phẩm bằng AI Chatbot | `hinh_1_10_sequence_chat_ai` |
| 1.11 | Sơ đồ tuần tự chức năng Chấm công vào ca và kết thúc ca | `hinh_1_11_sequence_cham_cong` |
| 1.12 | Sơ đồ hoạt động quy trình Đặt hàng | `hinh_1_12_activity_dat_hang` |
| 1.13 | Sơ đồ hoạt động quy trình Đăng và duyệt sản phẩm | `hinh_1_13_activity_duyet_san_pham` |
| 1.14 | Sơ đồ hoạt động quy trình Đăng ký và duyệt ca làm việc | `hinh_1_14_activity_ca_lam` |
| 1.15 | Sơ đồ lớp miền nghiệp vụ của hệ thống | `hinh_1_15_class_diagram` |
| 1.16 | Mô hình kiến trúc ba tầng của hệ thống Tiger Shop | `hinh_1_16_kien_truc_3tier` |
| 1.17 | Sơ đồ ERD phân hệ Bán hàng | `hinh_1_17_erd_ban_hang` |
| 1.18 | Sơ đồ ERD phân hệ Nhân sự | `hinh_1_18_erd_nhan_su` |
| 1.19 | Sơ đồ ERD phân hệ Hỗ trợ khách hàng và Nhật ký hệ thống | `hinh_1_19_erd_hotro_nhatky` |
| 1.20 | Sơ đồ triển khai hệ thống và môi trường kiểm thử | `hinh_1_20_deployment` |

Các hình được vẽ bằng PlantUML 1.2022.12; bản PlantUML khác có thể cho kết quả lệch vài điểm ảnh. Lệnh render lại trong thư mục `diagrams/`:

```bash
PLANTUML_LIMIT_SIZE=16384 java -jar plantuml.jar -tpng -charset UTF-8 *.puml
```

Các sơ đồ hoạt động có làn bơi trong bản Word (Hình 1.12, 1.13, 1.14 và các sơ đồ hoạt động ở Chương II, III) được vẽ thêm khung khép kín sau khi render, nên ảnh trong `diagrams/` có thể khác ảnh trong bản Word ở phần khung.

## Môi trường kiểm thử

Chi tiết ở [HUONG_DAN_MOI_TRUONG.md](HUONG_DAN_MOI_TRUONG.md) và Bảng G.3 của báo cáo. Các lệnh thường dùng:

```bash
docker start tigershop-mysql              # cơ sở dữ liệu MySQL 8.0.46
cd backend && npm run seed:test           # nạp lại dữ liệu mẫu vào ecommerce_test
cd backend && npm test                    # chạy 222 kịch bản
cd backend && PORT=5001 node server.js    # máy chủ cho kiểm thử hiệu năng và bảo mật
```

Tài khoản kiểm thử theo Bảng 2.8: `admin@`, `manager@`, `staff@`, `customer1@`... thuộc miền `tigershop.test`, mật khẩu chung `Test@123`.

Ba vấn đề môi trường đã được nhóm xử lý để kiểm thử tiến hành được (Bảng 7.5):

| Mã | Vấn đề | Cách xử lý |
|----|--------|------------|
| FIX-01 | Chỉ 14 trên 23 bảng có định nghĩa trong kho mã nguồn | Suy ngược lược đồ chín bảng còn lại từ truy vấn trong mã nguồn, hợp nhất thành `database/schema_full.sql` |
| FIX-02 | Bốn cột mã nguồn dùng nhưng lược đồ không có | Bổ sung vào tệp lược đồ và áp dụng cho cả hai cơ sở dữ liệu |
| FIX-03 | `config/db.js` ghi cứng thông tin kết nối | Sửa để đọc biến môi trường, giữ giá trị cũ làm dự phòng |

## Kiểm thử tự động

```bash
cd backend && npm test                 # 222 kịch bản trong 16 tệp, chạy tuần tự
cd backend && npm run test:coverage    # kèm đo độ bao phủ, sinh lại ở backend/coverage
```

Cả 222 kịch bản đều thành công, lượt chạy hết 33,0 giây (Bảng 2.12, Bảng 4.8 và Bảng 4.14):

| Tệp kiểm thử | Thư mục | Số kịch bản |
|--------------|---------|-------------|
| `vectorMath.test.js` | unit | 9 |
| `mailService.test.js` | unit | 8 |
| `voucherService.test.js` | integration | 7 |
| `auth.test.js` | integration | 22 |
| `rateLimit.test.js` | integration | 2 |
| `product.test.js` | integration | 21 |
| `order.test.js` | integration | 16 |
| `voucher.test.js` | integration | 16 |
| `review.test.js` | integration | 10 |
| `hr.test.js` | integration | 19 |
| `admin.test.js` | integration | 13 |
| `user_admin.test.js` | integration | 23 |
| `chat.test.js` | integration | 8 |
| `ai.test.js` | integration | 12 |
| `chat_voucher_admin.test.js` | integration | 12 |
| `category_stats.test.js` | integration | 24 |
| **Tổng cộng** | | **222** |

Độ bao phủ mã nguồn phía máy chủ so với tiêu chí kết thúc ở Bảng 2.27:

| Chỉ số | Đạt được | Ngưỡng | Đánh giá |
|--------|----------|--------|----------|
| Câu lệnh | 70,85% (1296/1829) | Tối thiểu 70% | Đạt |
| Nhánh | 56,46% (712/1261) | Tối thiểu 60% | Chưa đạt |
| Hàm | 83,15% (306/368) | Không đặt ngưỡng | |
| Dòng | 78,45% (1267/1615) | Không đặt ngưỡng | |

## Kiểm thử hiệu năng

Lệnh tái lập theo Phụ lục D.4. Máy chủ chạy trên cơ sở dữ liệu `ecommerce` như mục 5.2.3, và `reset_orders.js` được chạy trước mỗi mức tải:

```bash
cd backend && PORT=5001 node server.js
cd backend && node ../bao-cao-kiem-thu/performance/gen_tokens.js
cd bao-cao-kiem-thu/performance
node reset_orders.js
jmeter -n -t tiger_shop_load.jmx -l results/load_50.jtl -Jusers=50 -Jramp=1 -Jloops=200 -Jport=5001
node reset_orders.js
jmeter -n -t tiger_shop_load.jmx -l results/load_100.jtl -Jusers=100 -Jramp=1 -Jloops=100 -Jport=5001
node reset_orders.js
jmeter -n -t tiger_shop_load.jmx -l results/load_200.jtl -Jusers=200 -Jramp=1 -Jloops=50 -Jport=5001
jmeter -n -t tiger_shop_login.jmx -l results/login_50.jtl -Jusers=50 -Jloops=4
python3 analyze.py
python3 phan_tich_dien_bien.py
```

**Lưu ý an toàn dữ liệu:** `reset_orders.js` xóa sạch đơn hàng, tin nhắn và đặt lại tồn kho của cơ sở dữ liệu `ecommerce` bằng TRUNCATE (rủi ro R14). `tai_hien_khoa_chet.js` cũng xóa dữ liệu, chỉ chạy trên một cơ sở dữ liệu riêng.

Kết quả ba mức tải (Bảng 5.9), mỗi mức 50.000 mẫu:

| Mức tải | Thông lượng | Thời gian phản hồi trung bình | Tỉ lệ lỗi |
|---------|-------------|-------------------------------|-----------|
| 50 luồng | 524,7 yêu cầu mỗi giây | 93,3 ms | 0,06% |
| 100 luồng | 494,7 yêu cầu mỗi giây | 199,0 ms | 0,08% |
| 200 luồng | 385,9 yêu cầu mỗi giây | 508,9 ms | 0,06% |

Đối chiếu với 7 chỉ tiêu của Bảng 1.31 (Bảng 5.22): 5 chỉ tiêu đạt; thời gian phản hồi của trợ lý ảo không đạt (trung bình 5.017 ms trên 6 lượt, ngưỡng 5.000 ms, PERF-03); thời gian tải trang lần đầu chưa đo. Kịch bản Đơn hàng của tôi (KB4) đạt ở mức 100 luồng nhưng vượt ngưỡng 500 ms ở mức 200 luồng (934,4 ms).

Năm khiếm khuyết hiệu năng (Bảng 5.24):

| Mã | Mức độ | Mô tả |
|----|--------|-------|
| PERF-01 | Trung bình | `createOrder` ghi `order_items` trước khi trừ tồn kho nên hai đơn đồng thời gây khóa chết; đây là nguồn của 104 lỗi HTTP 500 ở kịch bản Đặt hàng qua ba mức tải |
| PERF-02 | Trung bình | `GET /api/orders/my` không phân trang, phản hồi lớn dần theo số đơn và kéo chậm cả máy chủ |
| PERF-03 | Trung bình | Trợ lý ảo phản hồi trung bình 5.017 ms, vượt ngưỡng 5.000 ms |
| PERF-05 | Trung bình | 7 lời gọi bcrypt đồng bộ, mỗi lời gọi chặn vòng lặp sự kiện khoảng 68 ms |
| PERF-04 | Thấp | Trợ lý ảo trả mã 200 kèm `success = false` khi lời gọi Gemini thất bại |

## Kiểm thử bảo mật

Lệnh tái lập theo Phụ lục E.4:

```bash
cd backend && PORT=5001 node server.js
cd backend && node ../bao-cao-kiem-thu/security/security_probe.js   # 47 phép kiểm chứng
cd bao-cao-kiem-thu/security
docker run --rm -v "$(pwd):/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t /zap/wrk/openapi_tigershop.json -f openapi \
  -r zap_api_report.html -J zap_api_report.json -I
```

Lượt quét ZAP phải nạp đặc tả OpenAPI và trỏ thẳng vào cổng 5001. Lượt quét qua trang mồi ở cổng 8099 (`seed_server.js`, `zap.yaml`, `zap_report.*`) đã quét sai đích như mục 6.2.2 phân tích; các tệp này chỉ được giữ làm bằng chứng, không dùng để lấy số liệu.

| Kết quả | Số lượng |
|---------|----------|
| Phép kiểm chứng theo kịch bản | 47: 28 đạt, 10 cảnh báo, 9 thất bại |
| Quy tắc ZAP, quét chủ động qua OpenAPI | 119: 115 đạt, 4 sinh cảnh báo |
| Số điểm cuối ZAP ghi nhận | 179 |
| Cảnh báo ZAP mức High | 0 |
| Lỗ hổng xác định (Bảng 6.15) | 16: 4 Nghiêm trọng, 3 Cao, 6 Trung bình, 3 Thấp |

ZAP không báo cảnh báo mức High nào, nhưng kiểm thử theo kịch bản và rà soát mã nguồn xác định 4 lỗ hổng mức Nghiêm trọng, đều thuộc nhóm kiểm soát truy cập hoặc thiết kế (OWASP A01, A04). Mục 6.7 so sánh ba nguồn phát hiện và cho thấy quét tự động không phát hiện được lỗi kiểm soát truy cập theo logic nghiệp vụ.

Tệp kết quả: `security/ket_qua_bao_mat.json`, `security/zap_api_report.html`, `security/zap_api_report.json`, `security/zap_rules.txt`.

## Khiếm khuyết

Sau khi khử trùng lặp giữa các mã DEF, VUL, PERF và QUA, báo cáo ghi nhận **36 khiếm khuyết còn tồn đọng** (Bảng 7.3 và Bảng 7.4): 4 Nghiêm trọng, 4 Cao, 14 Trung bình, 14 Thấp. Theo loại có 16 lỗ hổng bảo mật, 9 khiếm khuyết chức năng chỉ mang mã DEF, 6 khiếm khuyết chất lượng mã và 5 khiếm khuyết hiệu năng.

Tám khiếm khuyết mức Nghiêm trọng và Cao:

| Mã | Mức độ | Mô tả |
|----|--------|-------|
| VUL-01 (DEF-08) | Nghiêm trọng | Tuyến đọc tin nhắn theo mã hội thoại không kiểm tra quyền sở hữu, đọc được hội thoại của người khác |
| VUL-02 (DEF-06) | Nghiêm trọng | `resetUserPassword` đặt mật khẩu về một hằng số và trả nguyên văn trong phản hồi |
| VUL-12 | Nghiêm trọng | Tuyến sửa sản phẩm thiếu kiểm soát vai trò |
| VUL-13 | Nghiêm trọng | Tuyến đổi vai trò cho phép Quản lý tự nâng lên ADMIN |
| VUL-04 (DEF-03) | Cao | Tuyến tạo sản phẩm thiếu kiểm soát vai trò, khách hàng tạo được sản phẩm |
| VUL-14 | Cao | Trợ lý ảo đọc đơn hàng theo mã mà không kiểm tra quyền sở hữu |
| VUL-15 | Cao | Sự kiện `join_thread` của Socket.IO không xác thực |
| DEF-02 | Cao | Sản phẩm do Quản lý tạo được đặt `active` ngay, bỏ qua bước duyệt |

## Kết luận

Đánh giá theo ISO/IEC 25010 (Bảng 7.7), trung bình 7 đặc tính có điểm là **3,0/5**:

| Đặc tính | Điểm |
|----------|------|
| Tính phù hợp chức năng | 3/5 |
| Hiệu quả hiệu năng | 4/5 |
| Tính tương thích | 3/5 |
| Tính khả dụng | Chưa đánh giá |
| Độ tin cậy | 4/5 |
| Tính bảo mật | 1/5 |
| Khả năng bảo trì | 3/5 |
| Tính khả chuyển | 3/5 |

Đối chiếu với 10 tiêu chí kết thúc kiểm thử (Bảng 7.8), chỉ 3 tiêu chí đạt: độ bao phủ câu lệnh, không có cảnh báo ZAP mức High và 100% Use Case có test case. Hệ thống chưa đủ điều kiện nghiệm thu, lý do chính là bốn lỗ hổng bảo mật mức Nghiêm trọng.
