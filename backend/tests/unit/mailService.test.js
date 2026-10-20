/**
 * Kiem thu don vi: services/mailService.js
 * Nodemailer duoc gia lap hoan toan, khong gui thu that.
 */
const mockSendMail = jest.fn();
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: (...args) => mockSendMail(...args),
  })),
}));

const { sendInvoice } = require("../../services/mailService");

const donHang = {
  id: 123,
  receiver_name: "Nguyen Van A",
  email: "khach@tigershop.test",
  total: 540000,
  status: "completed",
  created_at: "2026-09-20T10:00:00Z",
  items: [
    { name: "Áo thun Tiger", quantity: 2, price: 120000 },
    { name: "Quần jean",     quantity: 1, price: 300000 },
  ],
};

beforeEach(() => {
  mockSendMail.mockReset();
  mockSendMail.mockResolvedValue({ messageId: "test-message-id" });
});

describe("mailService.sendInvoice", () => {
  test("gui thu toi dung dia chi khach hang", async () => {
    await sendInvoice(donHang);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail.mock.calls[0][0].to).toBe("khach@tigershop.test");
  });

  test("tieu de thu chua ma don hang", async () => {
    await sendInvoice(donHang);
    expect(mockSendMail.mock.calls[0][0].subject).toContain("123");
  });

  test("noi dung thu liet ke day du cac mat hang", async () => {
    await sendInvoice(donHang);
    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain("Áo thun Tiger");
    expect(html).toContain("Quần jean");
    expect(html).toContain("Nguyen Van A");
  });

  test("dinh dang tien te theo chuan Viet Nam", async () => {
    await sendInvoice(donHang);
    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain("540,000 đ");
    expect(html).toContain("120,000 đ");
  });

  test("don hang khong co mat hang van tao duoc thu", async () => {
    await sendInvoice({ ...donHang, items: [] });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail.mock.calls[0][0].html).toContain("TỔNG THANH TOÁN");
  });

  test("gia tri tien null duoc quy ve 0 thay vi NaN", async () => {
    await sendInvoice({ ...donHang, total: null, items: [{ name: "X", quantity: 1, price: null }] });
    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain("0 đ");
    expect(html).not.toContain("NaN");
  });

  test("tra ve ket qua cua nodemailer", async () => {
    const info = await sendInvoice(donHang);
    expect(info).toEqual({ messageId: "test-message-id" });
  });

  test("loi tu nodemailer duoc day len cho ben goi xu ly", async () => {
    mockSendMail.mockRejectedValue(new Error("SMTP khong phan hoi"));
    await expect(sendInvoice(donHang)).rejects.toThrow("SMTP khong phan hoi");
  });
});
