<div align="center">

# 🕵️‍♂️ TIN NHẮN ẨN (INV) PROJECT
**Hệ thống mã hóa tin nhắn tàng hình qua ký tự trắng (Zero-Width Steganography)**

[![Version](https://img.shields.io/badge/Version-1.1.0-orange.svg?style=for-the-badge)]()
[![Platform](https://img.shields.io/badge/Platform-Web%20|%20Mobile%20|%20Extension-blue.svg?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)]()

[Khám Phá Ngay](#-hướng-dẫn-sử-dụng) • [Tính Năng](#-tính-năng-nổi-bật) • [Cơ Chế](#-cơ-chế-kỹ-thuật) • [Đóng Góp](#-ủng-hộ-tác-giả)

</div>

---

## 🌟 Tổng quan
**Invisible** là công cụ giúp bạn "giấu" nội dung nhạy cảm ngay trong các tin nhắn bình thường trên Facebook, Zalo, Telegram... mà không ai hay biết. Nội dung ẩn sẽ hoàn toàn tàng hình và chỉ có thể được đọc thông qua hệ thống giải mã của Invisible.

## ✨ Tính năng nổi bật
* **Mã hóa Zero-Width:** Chuyển đổi văn bản thành chuỗi nhị phân bằng các ký tự không hiển thị như `\u200B` và `\u200C`.
* **Cú pháp thông minh:** Sử dụng cấu trúc `Văn bản công khai >Nội dung ẩn<` để tự động mã hóa và copy.
* **Đa nền tảng:** Giao diện Web được tối ưu cho Mobile, có sẵn Browser Extension cho máy tính.
* **Bảo mật tuyệt đối:** Hoàn toàn chạy trên trình duyệt (Client-side), không gửi dữ liệu về server.
* **Quản lý lịch sử:** Hỗ trợ Xuất/Nhập file `.inv` để lưu trữ hoặc khôi phục các cuộc hội thoại cũ.

## 🛠 Cơ chế kỹ thuật
Hệ thống sử dụng cơ chế **Steganography** trên nền tảng Unicode:
1.  Văn bản ẩn được chuyển về hệ nhị phân 16-bit.
2.  Mỗi bit `0` được thay bằng `\u200B` (Zero Width Space).
3.  Mỗi bit `1` được thay bằng `\u200C` (Zero Width Non-Joiner).
4.  Toàn bộ chuỗi được bao bọc bởi Marker `\u2060` (Word Joiner) để định danh.

## 📖 Hướng dẫn sử dụng

### 1. Cách tạo tin nhắn ẩn
Nhập vào ô chat theo cấu trúc: 
`Hello anh em >Tối nay đi nhậu không?<`
Sau khi nhấn gửi (hoặc phím Enter), hệ thống sẽ tự động sao chép chuỗi đã mã hóa vào bộ nhớ tạm.

### 2. Cách xem tin nhắn ẩn
* Cách 1: Nhấn nút **"Dán nội dung"** để hệ thống tự lấy dữ liệu từ Clipboard và giải mã.
* Cách 2: Dán trực tiếp tin nhắn nhận được vào ô nhập liệu, hệ thống sẽ tự nhận diện và hiển thị phần ẩn.

## 💻 Cài đặt Extension (Khuyên dùng trên PC)
Để sử dụng thuận tiện hơn trên máy tính mà không cần mở tab web:
1.  Truy cập [Chrome Web Store](https://chromewebstore.google.com/).
2.  Tìm kiếm từ khóa **"Invisible"**.
3.  Nhấn **Thêm vào Chrome**.

---

## ☕ Ủng hộ tác giả (Nuôi Dev 🐧)
Nếu bạn yêu thích dự án này, hãy mời mình một ly cà phê nhé!
* **Developer:** [@khoi2mai](https://www.facebook.com/khoi2maiii/)
* **MoMo:** `0708209575`

<div align="center">
    <img src="pic/qr.jpg" width="150" alt="QR MoMo">
</div>

---
<p align="center">Built with ❤️ by @khoi2mai</p>
