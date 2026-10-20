# -*- coding: utf-8 -*-
"""Gop 7 tep Markdown cua 7 chuong thanh mot tep bao cao duy nhat.

Chay:  cd bao-cao-kiem-thu/scripts && python3 gop_bao_cao.py
Ket qua: BAO_CAO_DAY_DU.md dat cung thu muc voi cac chuong,
nho do moi duong dan anh dang diagrams/... van tro dung.
"""
import os, re, unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "BAO_CAO_DAY_DU.md")

CHUONG = [
    "Chuong_1_Dac_ta_yeu_cau.md",
    "Chuong_2_SQA_Test_Plan.md",
    "Chuong_3_Thiet_ke_Test_Case.md",
    "Chuong_4_Kiem_thu_tu_dong.md",
    "Chuong_5_Kiem_thu_hieu_nang.md",
    "Chuong_6_Kiem_thu_bao_mat.md",
    "Chuong_7_Ket_luan.md",
]

BIA = """# ĐÁNH GIÁ VÀ KIỂM THỬ HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ TIGER SHOP TÍCH HỢP AI CHATBOT TƯ VẤN VÀ QUẢN LÝ NHÂN SỰ

**Học phần:** Đánh giá và Kiểm định chất lượng phần mềm

---

## Tóm tắt

Báo cáo trình bày một chu trình đánh giá và kiểm định chất lượng hoàn chỉnh cho Hệ thống thương mại điện tử Tiger Shop, một ứng dụng web ba tầng xây dựng trên nền Node.js, Express, React và MySQL với khoảng 100 điểm cuối API, 23 bảng dữ liệu và bốn vai trò người dùng.

Phạm vi công việc gồm bảy giai đoạn: đặc tả yêu cầu với 25 Use Case và 20 sơ đồ UML; xây dựng kế hoạch đảm bảo chất lượng và kiểm thử; thiết kế 135 trường hợp kiểm thử bao phủ toàn bộ Use Case; xây dựng và thực thi 222 test tự động bằng Jest và Supertest đạt độ bao phủ câu lệnh 70,85%; kiểm thử hiệu năng với 150.000 mẫu Apache JMeter qua ba mức tải; kiểm thử bảo mật bằng OWASP ZAP kết hợp 47 phép kiểm chứng thủ công; và tổng hợp đánh giá theo mô hình chất lượng ISO/IEC 25010.

Kết quả xác định 23 khiếm khuyết còn tồn đọng, trong đó 3 ở mức Nghiêm trọng và 4 ở mức Cao. Hệ thống đạt điểm trung bình 3,3 trên 5 theo ISO/IEC 25010, mạnh về độ tin cậy và tính phù hợp chức năng nhưng yếu về tính bảo mật. Kết luận là hệ thống chưa đủ điều kiện đưa vào vận hành thực tế cho tới khi các lỗ hổng kiểm soát truy cập được khắc phục.

**Bảng 0.1. Thông tin chung về báo cáo**

| Hạng mục | Thông tin |
|----------|-----------|
| Hệ thống được kiểm thử | Tiger Shop – thương mại điện tử tích hợp AI Chatbot và quản lý nhân sự |
| Nền tảng công nghệ | Node.js 22.16, Express 4.22, React 19.2, MySQL 8.0, Socket.IO, Google Gemini |
| Quy mô mã nguồn | Khoảng 7.100 dòng phía máy chủ, 18.700 dòng phía giao diện |
| Số Use Case đặc tả | 25 |
| Số trường hợp kiểm thử thiết kế | 135 |
| Số test tự động | 222 |
| Độ bao phủ câu lệnh | 70,85% |
| Số mẫu kiểm thử hiệu năng | 150.000 |
| Số khiếm khuyết phát hiện | 23 còn tồn đọng, 3 đã khắc phục |
| Công cụ sử dụng | Jest, Supertest, Apache JMeter, OWASP ZAP, PlantUML, Istanbul |

---
"""

def slug(text):
    """Tao ma neo tuong thich voi GitHub va pandoc."""
    t = text.strip().lower()
    t = re.sub(r"[`*_\[\]()]", "", t)
    t = unicodedata.normalize("NFC", t)
    t = re.sub(r"[^\w\sÀ-ỹ-]", "", t, flags=re.UNICODE)
    t = re.sub(r"\s+", "-", t.strip())
    return t

def main():
    noi_dung = []
    muc_luc = []

    for tep in CHUONG:
        duong_dan = os.path.join(BASE, tep)
        if not os.path.exists(duong_dan):
            raise SystemExit(f"Khong tim thay {tep}")
        s = open(duong_dan, encoding="utf-8").read().rstrip()

        for dong in s.split("\n"):
            m = re.match(r"^(#{1,3})\s+(.+)$", dong)
            if m:
                cap, tieu_de = len(m.group(1)), m.group(2).strip()
                thut = {1: "", 2: "  ", 3: "    "}[cap]
                muc_luc.append(f"{thut}- [{tieu_de}](#{slug(tieu_de)})")
        noi_dung.append(s)

    ket_qua = (
        BIA
        + "\n## Mục lục\n\n"
        + "\n".join(muc_luc)
        + "\n\n---\n\n"
        + "\n\n---\n\n".join(noi_dung)
        + "\n"
    )
    open(OUT, "w", encoding="utf-8").write(ket_qua)

    so_tu = len(ket_qua.split())
    so_bang = len(re.findall(r"^\*\*Bảng [0-9]+\.", ket_qua, re.M))
    so_hinh = len(re.findall(r"^\*Hình [0-9]+\.", ket_qua, re.M))
    print(f"Da tao: {OUT}")
    print(f"  {len(CHUONG)} chuong | {so_tu} tu | {so_bang} bang | {so_hinh} hinh")
    print(f"  {len(muc_luc)} muc trong muc luc")

if __name__ == "__main__":
    main()
