# Hướng dẫn chia sẻ phần mềm SMAX

## ✅ Cách 1: Chia sẻ trong mạng LAN (Khuyến nghị)

**Bước 1:** Khởi động server trên máy bạn
```bash
npm start
```

**Bước 2:** Kiểm tra địa chỉ IP của máy bạn
- IP máy bạn: **192.168.1.29**

**Bước 3:** Người khác trong cùng mạng WiFi truy cập:
```
http://192.168.1.29:3000
```

**Lưu ý:**
- Máy bạn và người dùng phải cùng mạng WiFi/LAN
- Tắt Firewall hoặc cho phép cổng 3000
- Server phải luôn chạy trên máy bạn

---

## 📦 Cách 2: Chia sẻ mã nguồn

**Gửi toàn bộ thư mục `smax` cho người khác:**

1. Nén thư mục `smax` thành file ZIP
2. Gửi qua email, USB, hoặc Google Drive
3. Người nhận giải nén và làm theo:

```bash
# Cài đặt Node.js từ https://nodejs.org/
# Sau đó chạy:
npm install
npm start
```

4. Truy cập: http://localhost:3000

---

## 🌐 Cách 3: Deploy lên Internet (Miễn phí)

### Option A: Render.com (Khuyến nghị)

1. Tạo tài khoản tại: https://render.com
2. Tạo file `render.yaml`:

```yaml
services:
  - type: web
    name: smax
    env: node
    buildCommand: npm install
    startCommand: npm start
```

3. Push code lên GitHub
4. Kết nối Render với GitHub repo
5. Deploy tự động

### Option B: Railway.app

1. Tạo tài khoản: https://railway.app
2. Tạo project mới
3. Deploy từ GitHub
4. Nhận link public: `https://smax-xxx.railway.app`

### Option C: Glitch.com

1. Truy cập: https://glitch.com
2. Import từ GitHub
3. Tự động deploy và có link public

---

## 🔒 Cách 4: Cài đặt trên máy chủ riêng

Nếu có VPS/Server:

```bash
# SSH vào server
ssh user@your-server.com

# Clone code
git clone <repo-url>
cd smax

# Cài đặt
npm install

# Chạy với PM2 (tự động khởi động lại)
npm install -g pm2
pm2 start server.js --name smax
pm2 startup
pm2 save

# Cấu hình Nginx (nếu cần)
# Truy cập qua domain: https://smax.yourdomain.com
```

---

## 🔥 Cách 5: Đóng gói thành ứng dụng Desktop

Sử dụng Electron để tạo file .exe:

```bash
npm install -g electron-packager
electron-packager . SMAX --platform=win32 --arch=x64
```

Gửi file .exe cho người khác, họ chỉ cần click chạy.

---

## 📱 Khuyến nghị

**Cho trường học nhỏ:**
- Dùng **Cách 1** (LAN) - Đơn giản, nhanh, miễn phí

**Cho nhiều người dùng:**
- Dùng **Cách 3** (Deploy online) - Truy cập mọi lúc mọi nơi

**Cho bảo mật cao:**
- Dùng **Cách 4** (Server riêng) - Kiểm soát hoàn toàn

---

## ⚠️ Lưu ý bảo mật

1. Đổi mật khẩu mặc định của hiệu trưởng/hiệu phó
2. Sử dụng HTTPS khi deploy online
3. Backup database `smax.db` thường xuyên
4. Không chia sẻ file database chứa thông tin nhạy cảm
