# -*- coding: utf-8 -*-
"""Sinh phan bang test case cho Chuong III tu tc_data.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tc_data import NHOM, AUTH, PROD, ORD, VOUC, REV, CHAT, AI, HR, ADM

GROUPS = [("AUTH",AUTH),("PROD",PROD),("ORD",ORD),("VOUC",VOUC),("REV",REV),
          ("CHAT",CHAT),("AI",AI),("HR",HR),("ADM",ADM)]
LOAI = {"P":"Positive","N":"Negative","B":"Boundary","S":"Security"}

# Mo ta dan nhap cho tung nhom
INTRO = {
"AUTH": "Nhóm Xác thực và phân quyền là nhóm chức năng nền tảng, quyết định khả năng kiểm soát truy cập của toàn hệ thống. Các trường hợp kiểm thử được thiết kế nhằm xác minh ba khía cạnh: tính đúng đắn của luồng đăng ký và đăng nhập, độ chính xác của cơ chế điều hướng theo bốn vai trò, và độ bền của lớp bảo vệ JSON Web Token trước các tình huống token thiếu, sai định dạng, hết hạn hoặc thuộc về tài khoản đã bị khóa. Nhóm này cũng bao gồm các trường hợp kiểm thử chức năng quản lý hồ sơ cá nhân.",
"PROD": "Nhóm Quản lý sản phẩm và tồn kho bao phủ toàn bộ vòng đời của một sản phẩm trong hệ thống: từ khi Quản lý tạo mới, qua bước phê duyệt của Quản trị viên, tới khi hiển thị trên gian hàng và được khách hàng tra cứu. Các trường hợp kiểm thử đặc biệt chú trọng vào quy trình duyệt hai cấp, cơ chế xóa mềm và khôi phục, việc kiểm soát tệp tải lên và tính chính xác của nhật ký nhập kho.",
"ORD":  "Nhóm Giỏ hàng và đơn hàng là nhóm chức năng cốt lõi và cũng phức tạp nhất của hệ thống do toàn bộ nghiệp vụ đặt hàng được bao bọc trong một giao dịch cơ sở dữ liệu. Ngoài các trường hợp kiểm thử chức năng thông thường, nhóm còn thiết kế các trường hợp chuyên biệt nhằm xác minh tính nguyên tử của giao dịch, hành vi hoàn tác khi trừ tồn kho thất bại và khả năng chống tranh chấp khi nhiều khách hàng cùng đặt một sản phẩm sắp hết hàng.",
"VOUC": "Nhóm Voucher kiểm thử toàn bộ vòng đời của một mã khuyến mại: từ khi Quản lý tạo lập, khách hàng nhận vào ví, áp dụng khi thanh toán cho tới khi mã được đánh dấu đã sử dụng. Do logic tính giảm giá có hai nhánh theo phần trăm và theo số tiền cố định kèm ràng buộc giá trị đơn tối thiểu và mức giảm tối đa, nhóm này tập trung nhiều vào kỹ thuật phân tích giá trị biên.",
"REV":  "Nhóm Đánh giá sản phẩm kiểm thử khả năng chấm điểm, viết nhận xét và đính kèm ảnh của khách hàng. Trọng tâm kiểm thử nằm ở hai ràng buộc nghiệp vụ: chỉ khách hàng đã mua sản phẩm mới được đánh giá, và mỗi khách hàng chỉ có một đánh giá duy nhất cho mỗi sản phẩm nhờ ràng buộc UNIQUE ở mức lược đồ cơ sở dữ liệu.",
"CHAT": "Nhóm Chat hỗ trợ thời gian thực kiểm thử kênh trao đổi hai chiều giữa khách hàng và nhân viên thông qua Socket.IO, cùng với hệ thống thông báo. Do đặc thù giao tiếp bất đồng bộ, phần lớn các trường hợp trong nhóm này được thực hiện thủ công với hai trình duyệt song song nhằm quan sát trực tiếp hành vi đẩy dữ liệu theo thời gian thực.",
"AI":   "Nhóm Trợ lý ảo Tiger AI kiểm thử phần tích hợp giữa hệ thống và mô hình ngôn ngữ lớn Gemini. Cần nhấn mạnh rằng nhóm không kiểm thử chất lượng nội tại của mô hình, mà tập trung vào bốn khía cạnh thuộc trách nhiệm của hệ thống: tính đúng đắn của dữ liệu nền được nạp vào ngữ cảnh, khả năng duy trì lịch sử hội thoại, việc lưu trữ tin nhắn, và đặc biệt là hành vi suy giảm an toàn khi dịch vụ bên ngoài không khả dụng.",
"HR":   "Nhóm Ca làm, chấm công và lương kiểm thử phân hệ quản trị nhân sự. Trọng tâm kiểm thử là tính chính xác của phép tính giờ công và tiền lương, cùng với các ràng buộc nghiệp vụ chặt chẽ: chỉ nhân viên ở trạng thái hoạt động mới được chấm công, không được mở phiên mới khi phiên cũ chưa đóng, và đơn giá giờ công phải được lưu tại thời điểm chấm công thay vì tra cứu lại khi tính lương.",
"ADM":  "Nhóm Quản trị hệ thống kiểm thử các chức năng đặc quyền cao nhất gồm quản lý người dùng, phân quyền, duyệt nhân sự, xem thống kê và tra cứu nhật ký. Do đây là nhóm chức năng nhạy cảm nhất, phần lớn các trường hợp kiểm thử thuộc loại Security nhằm xác minh rằng việc phân quyền được thực thi ở phía máy chủ chứ không chỉ dựa vào việc ẩn hiện phần tử trên giao diện.",
}


def esc(s):
    return s.replace("\n", "<br>").replace("|", "\\|")


def main():
    out = []
    w = out.append
    all_rows = [r for _, rows in GROUPS for r in rows]
    total = len(all_rows)

    w("# CHƯƠNG III. THIẾT KẾ VÀ THỰC HIỆN TEST CASE\n")

    w("## 3.1 Giới thiệu\n")
    w("Sau khi hoàn thành việc phân tích yêu cầu ở Chương I và xây dựng kế hoạch kiểm thử ở Chương II, nhóm tiến hành thiết kế bộ trường hợp kiểm thử nhằm đánh giá tính đúng đắn của các chức năng trong Hệ thống thương mại điện tử Tiger Shop. Toàn bộ test case được xây dựng dựa trên 25 Use Case đã đặc tả, bảo đảm mỗi Use Case đều có ít nhất một trường hợp kiểm thử tương ứng.\n")
    w(f"Bộ test case gồm **{total} trường hợp kiểm thử** được phân thành chín nhóm chức năng. Mỗi trường hợp được thiết kế theo một cấu trúc thống nhất gồm mã định danh, Use Case liên quan, mục tiêu kiểm thử, điều kiện tiên quyết, dữ liệu đầu vào, các bước thực hiện, kết quả mong đợi, loại kiểm thử, mức độ ưu tiên và phương pháp thực hiện. Cách tổ chức này cho phép truy vết hai chiều giữa yêu cầu và kết quả kiểm thử, đồng thời tạo cơ sở cho hoạt động kiểm thử hồi quy khi hệ thống được cập nhật.\n")
    w("Chi tiết đầy đủ của toàn bộ test case được trình bày trong tệp `Tiger_Shop_TestCases.xlsx` đính kèm báo cáo. Trong chương này, mỗi trường hợp được rút gọn còn tám cột chính để bảo đảm tính dễ đọc trên khổ giấy A4.\n")

    w("## 3.2 Phương pháp thiết kế Test Case\n")
    w("### 3.2.1 Các kỹ thuật thiết kế được áp dụng\n")
    w("Nhóm áp dụng kết hợp bốn kỹ thuật thiết kế trường hợp kiểm thử hộp đen:\n")
    w("**Phân vùng tương đương (Equivalence Partitioning)**: chia miền dữ liệu đầu vào thành các lớp tương đương, mỗi lớp chỉ cần một đại diện. Ví dụ với trường số lượng đặt hàng, ba lớp tương đương được xác định là số lượng nhỏ hơn hoặc bằng 0, số lượng nằm trong khoảng tồn kho, và số lượng vượt tồn kho.\n")
    w("**Phân tích giá trị biên (Boundary Value Analysis)**: tập trung vào các giá trị tại ranh giới của mỗi phân vùng, nơi lỗi thường xuất hiện nhất. Kỹ thuật này được áp dụng đậm nét trong nhóm Voucher với các mốc giá trị đơn tối thiểu và mức giảm tối đa, trong nhóm Đánh giá sản phẩm với thang điểm từ 1 đến 5, và trong nhóm Đơn hàng với ngưỡng tồn kho.\n")
    w("**Kiểm thử luồng nghiệp vụ (Use Case Testing)**: mỗi luồng chính và luồng thay thế trong đặc tả Use Case ở mục 1.2.5 được chuyển thành ít nhất một trường hợp kiểm thử tương ứng.\n")
    w("**Kiểm thử dựa trên rủi ro bảo mật (Risk-based Security Testing)**: với mỗi chức năng có kiểm soát truy cập, nhóm thiết kế thêm trường hợp kiểm thử tiêu cực trong đó một vai trò thấp hơn cố truy cập tài nguyên của vai trò cao hơn, hoặc một người dùng cố truy cập dữ liệu của người dùng khác.\n")

    w("### 3.2.2 Quy ước mã hóa Test Case\n")
    w("Mã test case có dạng `<MÃ NHÓM>-<SỐ THỨ TỰ BA CHỮ SỐ>`. Quy ước mã nhóm được trình bày trong Bảng 3.1.\n")
    w("**Bảng 3.1. Quy ước mã hóa test case theo nhóm chức năng**\n")
    w("| Mã nhóm | Nhóm chức năng | Khoảng mã | Số lượng |")
    w("|---------|----------------|-----------|----------|")
    for key, rows in GROUPS:
        w(f"| {key} | {NHOM[key]} | {rows[0][0]} – {rows[-1][0]} | {len(rows)} |")
    w(f"| | **Tổng cộng** | | **{total}** |\n")

    w("### 3.2.3 Phân loại Test Case\n")
    w("Mỗi trường hợp kiểm thử được gán một trong bốn loại, theo bản chất của dữ liệu đầu vào và mục tiêu kiểm thử.\n")
    w("**Bảng 3.2. Phân bố test case theo loại kiểm thử**\n")
    w("| Loại kiểm thử | Ý nghĩa | Số lượng | Tỉ lệ |")
    w("|---------------|---------|----------|-------|")
    ynghia = {
        "P": "Kiểm thử với dữ liệu hợp lệ, xác minh hệ thống hoạt động đúng theo kỳ vọng",
        "N": "Kiểm thử với dữ liệu không hợp lệ, xác minh hệ thống xử lý lỗi đúng cách",
        "B": "Kiểm thử tại các giá trị ranh giới của miền dữ liệu hợp lệ",
        "S": "Kiểm thử các kịch bản vi phạm kiểm soát truy cập và an toàn dữ liệu",
    }
    for code, name in LOAI.items():
        n = sum(1 for x in all_rows if x[7] == code)
        w(f"| {name} | {ynghia[code]} | {n} | {n/total*100:.1f}% |")
    w(f"| **Tổng cộng** | | **{total}** | **100%** |\n")

    w("**Bảng 3.3. Phân bố test case theo phương pháp thực hiện**\n")
    w("| Phương pháp | Số lượng | Tỉ lệ | Ghi chú |")
    w("|-------------|----------|-------|---------|")
    n_auto = sum(1 for x in all_rows if x[9] == "Tự động")
    n_man = total - n_auto
    w(f"| Tự động | {n_auto} | {n_auto/total*100:.1f}% | Thực thi bằng Jest, Supertest, Playwright và Newman ở Chương IV |")
    w(f"| Thủ công | {n_man} | {n_man/total*100:.1f}% | Chủ yếu là các kịch bản thời gian thực, đánh giá chất lượng phản hồi AI và đối chiếu số liệu thống kê |")
    w(f"| **Tổng cộng** | **{total}** | **100%** | |\n")

    w("### 3.2.4 Tiêu chí đánh giá Pass / Fail\n")
    w("Một trường hợp kiểm thử được đánh giá **Pass** khi kết quả thực tế trùng khớp hoàn toàn với kết quả mong đợi, bao gồm cả mã trạng thái HTTP, nội dung thông báo và trạng thái dữ liệu trong cơ sở dữ liệu sau khi thực hiện. Trường hợp được đánh giá **Fail** khi có bất kỳ sai khác nào so với kết quả mong đợi. Trường hợp được đánh giá **Blocked** khi không thể thực hiện do phụ thuộc vào một trường hợp khác đang lỗi hoặc do môi trường kiểm thử chưa sẵn sàng.\n")

    # ---- Cac muc test case theo nhom ----
    idx = 2
    table_no = 4
    for key, rows in GROUPS:
        idx += 1
        w(f"## 3.{idx} Test Case nhóm {NHOM[key]}\n")
        w(INTRO[key] + "\n")
        ucs = sorted(set(r[1] for r in rows), key=lambda x: int(x[2:]))
        w(f"Nhóm gồm {len(rows)} trường hợp kiểm thử, bao phủ các Use Case: {', '.join(ucs)}.\n")
        w(f"**Bảng 3.{table_no}. Test Case nhóm {NHOM[key]}**\n")
        w("| Mã TC | UC | Mục tiêu kiểm thử | Các bước thực hiện | Kết quả mong đợi | Loại | Kết quả thực tế | Trạng thái |")
        w("|-------|----|-------------------|--------------------|------------------|------|-----------------|------------|")
        for (ma, uc, tieu_de, tien_de, du_lieu, buoc, ket_qua, loai, uu_tien, pp) in rows:
            w(f"| {ma} | {uc} | {esc(tieu_de)} | {esc(buoc)} | {esc(ket_qua)} | {LOAI[loai]} | | Chưa thực hiện |")
        w("")
        table_no += 1

    # ---- Ma tran truy vet ----
    idx += 1
    w(f"## 3.{idx} Ma trận truy vết giữa Use Case và Test Case\n")
    w("Ma trận truy vết cho phép xác minh rằng mọi yêu cầu đã đặc tả trong Chương I đều được kiểm thử, đồng thời hỗ trợ xác định phạm vi kiểm thử hồi quy khi một Use Case bị thay đổi.\n")
    w(f"**Bảng 3.{table_no}. Ma trận truy vết Use Case – Test Case**\n")
    w("| Mã UC | Tên Use Case | Số TC | Danh sách Test Case |")
    w("|-------|--------------|-------|---------------------|")
    ten_uc = {
        "UC01":"Đăng ký tài khoản","UC02":"Đăng nhập","UC03":"Đăng xuất",
        "UC04":"Quản lý hồ sơ cá nhân","UC05":"Tra cứu sản phẩm","UC06":"Quản lý giỏ hàng",
        "UC07":"Đặt hàng","UC08":"Theo dõi đơn hàng","UC09":"Đánh giá sản phẩm",
        "UC10":"Quản lý voucher","UC11":"Xử lý đơn hàng","UC12":"Quản lý sản phẩm",
        "UC13":"Duyệt sản phẩm","UC14":"Quản lý tồn kho","UC15":"Chấm công",
        "UC16":"Đăng ký ca làm","UC17":"Gửi đơn từ","UC18":"Duyệt nhân sự",
        "UC19":"Tính lương","UC20":"Chat với AI Chatbot","UC21":"Chat với nhân viên",
        "UC22":"Nhận thông báo","UC23":"Quản lý người dùng","UC24":"Xem thống kê – báo cáo",
        "UC25":"Xem nhật ký hệ thống",
    }
    mapping = {}
    for r in all_rows:
        mapping.setdefault(r[1], []).append(r[0])
    for i in range(1, 26):
        uc = f"UC{i:02d}"
        tcs = mapping.get(uc, [])
        w(f"| {uc} | {ten_uc[uc]} | {len(tcs)} | {', '.join(tcs)} |")
    w(f"| | **Tổng cộng** | **{total}** | |\n")
    w(f"Ma trận cho thấy **25/25 Use Case đều được bao phủ**, đạt độ bao phủ yêu cầu 100%. Use Case có số lượng test case lớn nhất là UC07 Đặt hàng, phản ánh đúng mức độ phức tạp và rủi ro nghiệp vụ của chức năng này.\n")
    table_no += 1

    # ---- Tong ket ----
    idx += 1
    w(f"## 3.{idx} Tổng hợp kết quả Test Case\n")
    w(f"**Bảng 3.{table_no}. Tổng hợp kết quả thực hiện test case**\n")
    w("| STT | Nhóm chức năng | Tổng số TC | Pass | Fail | Not Run | Tỉ lệ Pass |")
    w("|-----|----------------|------------|------|------|---------|------------|")
    for i, (key, rows) in enumerate(GROUPS, 1):
        w(f"| {i} | {NHOM[key]} | {len(rows)} | | | {len(rows)} | |")
    w(f"| | **Tổng cộng** | **{total}** | | | **{total}** | |\n")
    w("> **Lưu ý về trạng thái hiện tại.** Bảng trên mới là bộ test case đã *thiết kế*, chưa phải kết quả *thực thi*. Cột Pass, Fail và Tỉ lệ Pass sẽ được điền sau khi bộ kiểm thử được thực thi ở Chương IV. Nhóm chủ trương không điền sẵn kết quả khi chưa chạy thực tế, vì một báo cáo ghi nhận tỉ lệ đạt tuyệt đối mà không kèm bằng chứng thực thi sẽ không phản ánh trung thực chất lượng phần mềm.\n")
    w("Sau khi hoàn tất thực thi, các trường hợp không đạt sẽ được phân tích nguyên nhân, phân loại theo mức độ nghiêm trọng và chuyển cho nhóm phát triển xử lý. Các trường hợp này sẽ được kiểm thử lại theo quy trình kiểm thử hồi quy và kết quả cuối cùng được tổng hợp tại Chương VII.\n")

    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        "Chuong_3_Thiet_ke_Test_Case.md")
    open(path, "w", encoding="utf-8").write("\n".join(out))
    print("Đã tạo:", path)
    print("Tổng test case:", total)


if __name__ == "__main__":
    main()
