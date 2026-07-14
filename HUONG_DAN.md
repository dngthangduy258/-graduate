# 🎓 Thiệp Mời Tốt Nghiệp Online – Hướng Dẫn Sử Dụng

## Cấu trúc thư mục

```
totnghiep/
├── index.html          ← Thiệp mời chính
├── admin.html          ← Trang quản lý khách mời
├── css/
│   ├── style.css
│   └── admin.css
├── js/
│   ├── invitation.js
│   └── admin.js
└── assets/
    └── invitation_bg.png
```

---

## 🚀 Cách mở thiệp

### Cách 1: Mở trực tiếp
Double-click vào file `index.html` để mở trên trình duyệt.

### Cách 2: Dùng Live Server (khuyến nghị)
Nếu dùng VS Code, cài extension **Live Server** và chạy:
```
Right-click index.html → Open with Live Server
```

---

## ✏️ Tuỳ chỉnh thiệp

Mở file `js/invitation.js`, tìm phần **CONFIG** ở đầu file:

```javascript
const CONFIG = {
  name: "Nguyễn Thị A",           // ← Đổi tên của bạn
  eventDate: new Date("2026-08-09T08:00:00"),  // ← Đổi ngày
  eventTime: "08:00 – 11:30",      // ← Đổi giờ
  venue: "Trường Đại học Sài Gòn",
  address: "273 An Dương Vương...",
  rsvpDeadline: "30/07/2026",      // ← Hạn RSVP
  contact: "",                     // ← Số điện thoại (nếu muốn)
};
```

---

## 👥 Thêm khách mời

1. Mở `admin.html` trên trình duyệt
2. Chọn **vai vế** (Kính mời Cô, Kính mời Chú, Mời bạn...)
3. Nhập **họ và tên** khách
4. Nhấn **Thêm vào danh sách**
5. Nhấn **📋 Copy** để sao chép link cá nhân hoá
6. Gửi link qua **Zalo / Facebook / Messenger**

### Ví dụ link cá nhân hoá:
```
index.html?guest=nguyen-thi-b&salutation=kinh-moi-co
→ Thiệp hiển thị: "Kính mời Cô Nguyễn Thị B"

index.html?guest=tran-van-c&salutation=moi-ban
→ Thiệp hiển thị: "Mời bạn Trần Văn C"
```

---

## 🎨 Đổi màu thiệp

Thiệp có **4 theme màu**, nhấn vào các chấm tròn ở góc phải màn hình:
- 🟣 **Tím & Vàng** (mặc định, sang trọng)
- 🩷 **Hồng Pastel** (nhẹ nhàng, nữ tính)
- 🔵 **Xanh Đại Dương** (hiện đại)
- 🟢 **Xanh Ngọc** (tươi mát)

---

## 🎵 Thêm nhạc nền

1. Chuẩn bị file nhạc `.mp3`
2. Đặt vào thư mục `assets/` với tên `music.mp3`
3. Mở `index.html`, tìm dòng:
   ```html
   <!-- Bạn có thể thêm file nhạc: <source src="assets/music.mp3" type="audio/mpeg"> -->
   ```
4. Bỏ comment để bật nhạc

---

## 📤 Chia sẻ online (tuỳ chọn)

Để gửi link qua internet (không cần gửi file), bạn có thể deploy lên:
- **GitHub Pages** (miễn phí, dễ dùng)
- **Netlify** (kéo thả thư mục là xong)
- **Vercel** (miễn phí)

---

## 📥 Xuất danh sách khách

Vào `admin.html` → Nhấn **📥 Xuất CSV** → Mở bằng Excel để quản lý.
