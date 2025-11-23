# SMAX - Phần mềm quản lý học sinh

Hệ thống quản lý học sinh với các chức năng:
- ✅ Quản lý thông tin học sinh
- ✅ Quản lý giáo viên
- ✅ Quản lý môn học
- ✅ Phân công giảng dạy (giáo viên dạy ngày nào, tiết nào)
- ✅ Nhập và quản lý điểm số

## Cài đặt

1. Cài đặt Node.js (nếu chưa có): https://nodejs.org/

2. Cài đặt các thư viện cần thiết:
```bash
npm install
```

## Chạy ứng dụng

```bash
npm start
```

Sau đó mở trình duyệt và truy cập: http://localhost:3000

## Công nghệ sử dụng

- Backend: Node.js + Express
- Database: SQLite
- Frontend: HTML, CSS, JavaScript

## Cấu trúc dự án

```
smax/
├── server.js          # Server backend
├── package.json       # Cấu hình npm
├── smax.db           # Database (tự động tạo khi chạy)
└── public/           # Frontend
    ├── index.html    # Giao diện chính
    ├── style.css     # CSS
    └── app.js        # JavaScript
```

## Hướng dẫn sử dụng

### Đăng nhập

**Tài khoản mặc định:**
- Hiệu trưởng: `hieu_truong` / `123456`
- Hiệu phó: `hieu_pho` / `123456`
- Giáo viên: Sử dụng mã giáo viên / mật khẩu (mặc định: `123456`)

### Phân quyền

**Hiệu trưởng/Hiệu phó:**
- ✅ Quản lý toàn bộ học sinh
- ✅ Quản lý giáo viên (thêm, xóa, đặt mật khẩu)
- ✅ Quản lý môn học
- ✅ Phân công giảng dạy
- ✅ Nhập và quản lý điểm số

**Giáo viên:**
- ✅ Xem danh sách học sinh của lớp được phân công
- ✅ Xem điểm của học sinh trong lớp được phân công
- ✅ Xem lịch phân công của mình
- ❌ Không được thêm/xóa học sinh
- ❌ Không được nhập/xóa điểm
- ❌ Không được xem thông tin giáo viên khác

### Chức năng chính

1. **Quản lý học sinh**: Thêm, xem, xóa thông tin học sinh
2. **Quản lý giáo viên**: Thêm thông tin giáo viên, môn dạy và mật khẩu
3. **Quản lý môn học**: Thêm các môn học
4. **Phân công**: Phân công giáo viên dạy lớp nào, thứ mấy, tiết mấy
5. **Nhập điểm**: Nhập điểm cho học sinh theo môn, loại điểm, học kỳ
