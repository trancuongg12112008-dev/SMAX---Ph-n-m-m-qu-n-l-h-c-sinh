# Hướng dẫn chia sẻ SMAX qua Internet

## Cách 1: Dùng ngrok (Miễn phí, Dễ nhất)

### Bước 1: Tải ngrok
1. Truy cập: https://ngrok.com/download
2. Tải ngrok cho Windows
3. Giải nén file zip

### Bước 2: Đăng ký tài khoản (Miễn phí)
1. Truy cập: https://dashboard.ngrok.com/signup
2. Đăng ký tài khoản miễn phí
3. Lấy authtoken tại: https://dashboard.ngrok.com/get-started/your-authtoken

### Bước 3: Cấu hình ngrok
Mở Command Prompt và chạy:
```bash
ngrok config add-authtoken <your-authtoken>
```

### Bước 4: Chạy SMAX
```bash
npm start
```

### Bước 5: Chạy ngrok (Terminal mới)
Mở terminal mới và chạy:
```bash
ngrok http 3000
```

### Bước 6: Chia sẻ link
Ngrok sẽ hiển thị link dạng:
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
```

**Chia sẻ link này cho người khác!**

---

## Cách 2: Dùng localtunnel (Không cần đăng ký)

### Bước 1: Cài localtunnel
```bash
npm install -g localtunnel
```

### Bước 2: Chạy SMAX
```bash
npm start
```

### Bước 3: Chạy localtunnel (Terminal mới)
```bash
lt --port 3000
```

Sẽ hiển thị link dạng: `https://xyz.loca.lt`

---

## Cách 3: Dùng Cloudflare Tunnel (Miễn phí, Chuyên nghiệp)

### Bước 1: Tải Cloudflared
https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Bước 2: Chạy SMAX
```bash
npm start
```

### Bước 3: Chạy Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:3000
```

---

## Lưu ý quan trọng

⚠️ **Bảo mật:**
- Đổi mật khẩu mặc định trước khi chia sẻ
- Chỉ chia sẻ link cho người tin cậy
- Tắt tunnel khi không dùng

⚠️ **Giới hạn miễn phí:**
- ngrok: 1 tunnel cùng lúc, session 2 giờ
- localtunnel: Không giới hạn nhưng kém ổn định
- Cloudflare: Không giới hạn

⚠️ **Hiệu suất:**
- Tốc độ phụ thuộc vào kết nối Internet
- Máy bạn phải bật và chạy server
