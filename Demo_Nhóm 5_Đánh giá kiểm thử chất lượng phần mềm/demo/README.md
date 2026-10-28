# Chạy demo kiểm thử Tiger Shop

Nhấp đúp các file `.command` hoặc chạy bằng Terminal. Các tool dùng Node 22 tại `/usr/local/bin/node` và runtime ghi trong `demo-config.json`.

1. Chạy `01-mo-web.command`: mở API tại `127.0.0.1:5101` và web tại `127.0.0.1:3001/login`.
2. Chạy `02-chuan-bi-web.command` **trước khi quay** để nạp lại dữ liệu mẫu cho web. Không chạy lại trong lúc đang thao tác giỏ hàng, đơn hàng hoặc voucher.
3. Trước khi quay, chạy `06-test-toan-bo.command` để lấy kết quả toàn bộ test và coverage của lượt mới. Giữ cửa sổ kết quả để trình chiếu ở slide 8.
4. Chạy `07-mo-coverage.command`, rồi mở `http://127.0.0.1:5120/`. Server chỉ nghe localhost và được tái sử dụng khi mở tool lần nữa.
5. Khi quay, xen kẽ slide với web và các tool `03-test-voucher.command`, `04-test-giao-dich.command`, `05-test-bao-mat.command` theo kịch bản Word. Tool 05 hiển thị test và HTTP thực: test PASS đang xác nhận hành vi lỗi; cần đọc cả dòng kết luận nghiệp vụ. Chạy từng tool đến khi xong rồi mới chạy tool tiếp theo.

Web và test chạy trên **bản sao runtime**; database web là `tigershop_video_demo`, database test là `tigershop_video_test`. Tool test có nạp lại dữ liệu test riêng; source và database gốc không bị đổi. Kết quả từng lượt được lưu trong `bo-thuyet-trinh/minh-chung-moi` kèm thời điểm, JSON và log Terminal. Kết quả cũ trong `lan-chay-toan-bo-da-kiem-tra` chỉ dùng đối chiếu, không thay thế lượt chạy đang quay.

15 tên ảnh `sample-1.jpg` đến `sample-15.jpg` trong seed được bổ sung vào bản sao demo để web hiển thị ảnh. Nguồn và danh sách có trong `anh-mau-manifest.json`; dữ liệu tên, giá, tồn kho và quy tắc kiểm thử được giữ nguyên.

Khi chạy Jest, `GEMINI_API_KEY=jest-mock-placeholder-only` chỉ là giá trị giả cho các test mock Gemini, không phải khóa API thật và không chứng minh có gọi AI thật. Không quay nội dung `.env`, token đăng nhập hoặc thông tin bí mật.


## Các công cụ bổ sung ngày 27/10/2026

Các tệp dưới đây chạy trên bản sao runtime như trên, mỗi lượt lưu kết quả vào `bo-thuyet-trinh/minh-chung-moi` kèm thời điểm chạy.

| Tệp | Việc làm | Thời gian |
|-----|----------|-----------|
| `00-chan-doan.command` | Kiểm tra môi trường (Node, Docker, cơ sở dữ liệu, JMeter, cổng), ghi ra `minh-chung-moi/_chan-doan.txt` | vài giây |
| `08-hieu-nang-jmeter.command` | Dựng cơ sở dữ liệu tải riêng `tigershop_video_perf` (200 sản phẩm), máy chủ cổng 5201, chạy JMeter 100 người dùng x 20 vòng, tóm tắt kết quả, đối chiếu kích thước phản hồi lỗi 469 byte, mở báo cáo HTML của JMeter | khoảng 40 giây |
| `09-tai-hien-khoa-chet.command` | Tái hiện khóa chết của giao dịch đặt hàng (PERF-01) trên cơ sở dữ liệu riêng `tigershop_video_khoachet` | khoảng 20 giây |
| `10-kiem-chung-bao-mat.command` | Nạp lại `tigershop_video_test`, máy chủ cổng 5001, chạy 47 phép kiểm chứng của `security_probe.js` (bản sao, không ghi đè tệp kết quả gốc), in bảng tổng hợp | khoảng 2 phút |
| `11-quet-zap.command` | Quét chủ động OWASP ZAP qua đặc tả OpenAPI vào máy chủ cổng 5001, tóm tắt cảnh báo, mở báo cáo HTML | khoảng 2 phút, nên chạy trước khi quay |

Không chạy 10 và 11 cùng lúc vì cùng dùng cổng 5001. Nên chạy 06 trước 10 và 11. Kịch bản đọc khi quay: `bo-thuyet-trinh/Kich_ban_thuyet_trinh_Tiger_Shop.docx`; slide: `bo-thuyet-trinh/Slide_thuyet_trinh_Tiger_Shop.pptx`.

Cập nhật 19:16 ngày 27/10/2026: tool 07 tự dừng server coverage cũ của bộ demo nếu nó giữ cổng 5120 mà không trả lời, mở lại server và tự mở trang coverage trong Chrome. Tool 12 gọi tool 07 thay vì chỉ mở địa chỉ 5120.
