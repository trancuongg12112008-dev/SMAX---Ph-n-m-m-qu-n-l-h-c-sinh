# Hướng dẫn Deploy SMAX lên Cloud

## Cách 1: Deploy lên Render.com (MIỄN PHÍ - Khuyến nghị)

### Bước 1: Chuẩn bị
1. Tạo tài khoản GitHub: https://github.com
2. Tạo tài khoản Render: https://render.com

### Bước 2: Đẩy code lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[username]/smax.git
git push -u origin main
```

### Bước 3: Deploy trên Render
1. Đăng nhập Render.com
2. Nhấn "New +" → "Web Service"
3. Kết nối GitHub repository
4. Cấu hình:
   - Name: smax
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
5. Nhấn "Create Web Service"
6. Đợi 5-10 phút để deploy

### Bước 4: Truy cập
- URL: https://smax-[random].onrender.com
- Chia sẻ link này cho mọi người!

**Ưu điểm:**
- ✅ Miễn phí 100%
- ✅ Chạy 24/7
- ✅ Tắt máy vẫn dùng được
- ✅ Có SSL (https)

**Nhược điểm:**
- ⚠️ Sau 15 phút không dùng sẽ ngủ, lần đầu mở lại hơi chậm (30s)

---

## Cách 2: Deploy lên Railway.app (Miễn phí 500 giờ/tháng)

### Bước 1: Đẩy code lên GitHub (như trên)

### Bước 2: Deploy trên Railway
1. Đăng nhập Railway.app
2. Nhấn "New Project" → "Deploy from GitHub repo"
3. Chọn repository smax
4. Railway tự động detect và deploy
5. Nhấn "Generate Domain" để có link

**Ưu điểm:**
- ✅ Nhanh hơn Render
- ✅ Không ngủ
- ✅ 500 giờ miễn phí/tháng

---

## Cách 3: Chạy trên VPS (Có phí)

### VPS giá rẻ:
- Vultr: $2.5/tháng
- DigitalOcean: $4/tháng
- Contabo: €3.99/tháng

### Cài đặt trên VPS:
```bash
# Cài Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone code
git clone https://github.com/[username]/smax.git
cd smax

# Cài đặt
npm install

# Chạy với PM2 (tự động khởi động lại)
npm install -g pm2
pm2 start server.js --name smax
pm2 startup
pm2 save
```

---

## Cách 4: Chạy trên máy tính khác (Miễn phí)

Nếu có máy tính khác (laptop cũ, PC cũ):
1. Cài Node.js trên máy đó
2. Copy thư mục smax sang
3. Chạy `npm start`
4. Để máy đó bật 24/7
5. Dùng ngrok hoặc localtunnel để chia sẻ

---

## So sánh các cách

| Cách | Giá | Tốc độ | Độ ổn định | Khó |
|------|-----|--------|------------|-----|
| Render.com | Miễn phí | Trung bình | Tốt | Dễ ⭐ |
| Railway.app | Miễn phí | Nhanh | Rất tốt | Dễ ⭐ |
| VPS | $2.5-4/tháng | Rất nhanh | Rất tốt | Trung bình |
| Máy khác | Miễn phí | Nhanh | Tùy | Dễ |

**Khuyến nghị: Dùng Render.com hoặc Railway.app**
