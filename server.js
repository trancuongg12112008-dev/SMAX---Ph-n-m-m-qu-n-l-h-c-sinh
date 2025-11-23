const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Khởi tạo database
const db = new sqlite3.Database('./smax.db', (err) => {
  if (err) {
    console.error('Lỗi kết nối database:', err);
  } else {
    console.log('Đã kết nối database SQLite');
    initDatabase();
  }
});

// Tạo các bảng
function initDatabase() {
  db.serialize(() => {
    // Bảng tài khoản
    db.run(`CREATE TABLE IF NOT EXISTS tai_khoan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      vai_tro TEXT NOT NULL,
      giao_vien_id INTEGER,
      ho_ten TEXT NOT NULL,
      FOREIGN KEY (giao_vien_id) REFERENCES giao_vien(id)
    )`, () => {
      // Tạo tài khoản mặc định cho hiệu trưởng
      db.run(`INSERT OR IGNORE INTO tai_khoan (username, password, vai_tro, ho_ten) 
              VALUES ('hieu_truong', '123456', 'hieu_truong', 'Hiệu trưởng')`);
      db.run(`INSERT OR IGNORE INTO tai_khoan (username, password, vai_tro, ho_ten) 
              VALUES ('hieu_pho', '123456', 'hieu_pho', 'Hiệu phó')`);
    });

    // Bảng học sinh
    db.run(`CREATE TABLE IF NOT EXISTS hoc_sinh (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_hs TEXT UNIQUE NOT NULL,
      ho_ten TEXT NOT NULL,
      ngay_sinh DATE,
      gioi_tinh TEXT,
      lop TEXT,
      dia_chi TEXT,
      sdt_phu_huynh TEXT
    )`);

    // Bảng giáo viên
    db.run(`CREATE TABLE IF NOT EXISTS giao_vien (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_gv TEXT UNIQUE NOT NULL,
      ho_ten TEXT NOT NULL,
      mon_day TEXT NOT NULL,
      sdt TEXT,
      email TEXT,
      mat_khau TEXT DEFAULT '123456',
      chu_nhiem_lop TEXT
    )`, () => {
      // Migration: Thêm cột chu_nhiem_lop nếu chưa có
      db.all("PRAGMA table_info(giao_vien)", [], (err, columns) => {
        if (!err) {
          const hasChuNhiem = columns.some(col => col.name === 'chu_nhiem_lop');
          if (!hasChuNhiem) {
            db.run("ALTER TABLE giao_vien ADD COLUMN chu_nhiem_lop TEXT", (err) => {
              if (err) {
                console.log('Cột chu_nhiem_lop đã tồn tại hoặc lỗi:', err.message);
              } else {
                console.log('Đã thêm cột chu_nhiem_lop vào bảng giao_vien');
              }
            });
          }
        }
      });
    });

    // Bảng môn học
    db.run(`CREATE TABLE IF NOT EXISTS mon_hoc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_mon TEXT UNIQUE NOT NULL,
      ten_mon TEXT NOT NULL,
      so_tiet INTEGER
    )`, () => {
      // Thêm các môn học mặc định theo chương trình THPT 2018
      const monHocMacDinh = [
        // Môn bắt buộc
        { ma_mon: 'VAN', ten_mon: 'Ngữ văn', so_tiet: 5 },
        { ma_mon: 'TOAN', ten_mon: 'Toán', so_tiet: 5 },
        { ma_mon: 'ANH', ten_mon: 'Ngoại ngữ 1 (Tiếng Anh)', so_tiet: 3 },
        { ma_mon: 'SU', ten_mon: 'Lịch sử', so_tiet: 2 },
        { ma_mon: 'TD', ten_mon: 'Giáo dục thể chất', so_tiet: 2 },
        { ma_mon: 'GDQP', ten_mon: 'Giáo dục Quốc phòng và An ninh', so_tiet: 1 },
        { ma_mon: 'HDTN', ten_mon: 'Hoạt động trải nghiệm, hướng nghiệp', so_tiet: 2 },
        { ma_mon: 'GDĐP', ten_mon: 'Nội dung giáo dục địa phương', so_tiet: 1 },
        
        // Môn học chọn (Khoa học tự nhiên)
        { ma_mon: 'VATLY', ten_mon: 'Vật lí', so_tiet: 3 },
        { ma_mon: 'HOA', ten_mon: 'Hóa học', so_tiet: 3 },
        { ma_mon: 'SINH', ten_mon: 'Sinh học', so_tiet: 2 },
        
        // Môn học chọn (Khoa học xã hội)
        { ma_mon: 'DIA', ten_mon: 'Địa lí', so_tiet: 2 },
        { ma_mon: 'GDKT', ten_mon: 'Giáo dục Kinh tế và Pháp luật', so_tiet: 2 },
        
        // Môn học chọn (Nghệ thuật & Công nghệ)
        { ma_mon: 'CN', ten_mon: 'Công nghệ', so_tiet: 2 },
        { ma_mon: 'TIN', ten_mon: 'Tin học', so_tiet: 2 },
        { ma_mon: 'AMNHAC', ten_mon: 'Âm nhạc', so_tiet: 1 },
        { ma_mon: 'MTHUAT', ten_mon: 'Mĩ thuật', so_tiet: 1 }
      ];
      
      monHocMacDinh.forEach(mon => {
        db.run(
          `INSERT OR IGNORE INTO mon_hoc (ma_mon, ten_mon, so_tiet) VALUES (?, ?, ?)`,
          [mon.ma_mon, mon.ten_mon, mon.so_tiet],
          (err) => {
            if (err && !err.message.includes('UNIQUE constraint')) {
              console.log(`Lỗi thêm môn ${mon.ten_mon}:`, err.message);
            }
          }
        );
      });
      
      console.log('Đã khởi tạo danh sách môn học THPT 2018');
    });

    // Bảng phân công giảng dạy
    db.run(`CREATE TABLE IF NOT EXISTS phan_cong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      giao_vien_id INTEGER,
      mon_hoc_id INTEGER,
      lop TEXT,
      thu INTEGER,
      tiet INTEGER,
      so_tiet INTEGER DEFAULT 1,
      phong TEXT,
      FOREIGN KEY (giao_vien_id) REFERENCES giao_vien(id),
      FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id)
    )`, () => {
      // Migration: Thêm cột so_tiet nếu chưa có
      db.all("PRAGMA table_info(phan_cong)", [], (err, columns) => {
        if (!err) {
          const hasSoTiet = columns.some(col => col.name === 'so_tiet');
          if (!hasSoTiet) {
            db.run("ALTER TABLE phan_cong ADD COLUMN so_tiet INTEGER DEFAULT 1", (err) => {
              if (err) {
                console.log('Cột so_tiet đã tồn tại hoặc lỗi:', err.message);
              } else {
                console.log('Đã thêm cột so_tiet vào bảng phan_cong');
              }
            });
          }
        }
      });
    });

    // Bảng điểm danh tiết dạy
    db.run(`CREATE TABLE IF NOT EXISTS diem_danh_tiet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phan_cong_id INTEGER,
      ngay_day DATE,
      trang_thai TEXT DEFAULT 'chua_day',
      ghi_chu TEXT,
      FOREIGN KEY (phan_cong_id) REFERENCES phan_cong(id)
    )`);

    // Bảng điểm
    db.run(`CREATE TABLE IF NOT EXISTS diem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hoc_sinh_id INTEGER,
      mon_hoc_id INTEGER,
      loai_diem TEXT,
      diem REAL,
      hoc_ky INTEGER,
      nam_hoc TEXT,
      ghi_chu TEXT,
      FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
      FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id)
    )`);
  });
}

// ===== API ENDPOINTS =====

// --- ĐĂNG NHẬP ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Kiểm tra tài khoản hiệu trưởng/hiệu phó
  db.get('SELECT * FROM tai_khoan WHERE username=? AND password=?', [username, password], (err, account) => {
    if (account) {
      return res.json({
        success: true,
        user: {
          id: account.id,
          username: account.username,
          vai_tro: account.vai_tro,
          ho_ten: account.ho_ten,
          giao_vien_id: account.giao_vien_id
        }
      });
    }
    
    // Kiểm tra tài khoản giáo viên
    db.get('SELECT * FROM giao_vien WHERE ma_gv=? AND mat_khau=?', [username, password], (err, teacher) => {
      if (teacher) {
        return res.json({
          success: true,
          user: {
            id: teacher.id,
            username: teacher.ma_gv,
            vai_tro: 'giao_vien',
            ho_ten: teacher.ho_ten,
            giao_vien_id: teacher.id
          }
        });
      }
      
      res.json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    });
  });
});

// --- HỌC SINH ---
app.get('/api/hoc-sinh', (req, res) => {
  const { giao_vien_id } = req.query;
  let query = 'SELECT * FROM hoc_sinh';
  const params = [];
  
  // Nếu là giáo viên, chỉ xem học sinh của lớp được phân công
  if (giao_vien_id) {
    query += ` WHERE lop IN (
      SELECT DISTINCT lop FROM phan_cong WHERE giao_vien_id = ?
    )`;
    params.push(giao_vien_id);
  }
  
  query += ' ORDER BY ho_ten';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/hoc-sinh', (req, res) => {
  let { ma_hs, ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh } = req.body;
  
  // Nếu không có mã HS, tự động tạo
  if (!ma_hs || ma_hs.trim() === '') {
    db.get('SELECT COUNT(*) as count FROM hoc_sinh', [], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const nextNumber = (row.count + 1).toString().padStart(4, '0');
      const year = new Date().getFullYear();
      ma_hs = `HS${year}${nextNumber}`;
      
      insertStudent(ma_hs, ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh, res);
    });
  } else {
    insertStudent(ma_hs, ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh, res);
  }
});

function insertStudent(ma_hs, ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh, res) {
  db.run(
    `INSERT INTO hoc_sinh (ma_hs, ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ma_hs, ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, ma_hs: ma_hs, message: 'Thêm học sinh thành công' });
    }
  );
}

app.put('/api/hoc-sinh/:id', (req, res) => {
  const { ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh } = req.body;
  db.run(
    `UPDATE hoc_sinh SET ho_ten=?, ngay_sinh=?, gioi_tinh=?, lop=?, dia_chi=?, sdt_phu_huynh=? WHERE id=?`,
    [ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt_phu_huynh, req.params.id],
    (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: 'Cập nhật học sinh thành công' });
    }
  );
});

app.delete('/api/hoc-sinh/:id', (req, res) => {
  db.run('DELETE FROM hoc_sinh WHERE id=?', [req.params.id], (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Xóa học sinh thành công' });
  });
});

// --- GIÁO VIÊN ---
app.get('/api/giao-vien', (req, res) => {
  db.all('SELECT * FROM giao_vien ORDER BY ho_ten', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/giao-vien', (req, res) => {
  const { ma_gv, ho_ten, mon_day, sdt, email, mat_khau, chu_nhiem_lop } = req.body;
  const password = mat_khau || '123456'; // Mật khẩu mặc định
  db.run(
    `INSERT INTO giao_vien (ma_gv, ho_ten, mon_day, sdt, email, mat_khau, chu_nhiem_lop) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ma_gv, ho_ten, mon_day, sdt, email, password, chu_nhiem_lop],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Thêm giáo viên thành công' });
    }
  );
});

app.put('/api/giao-vien/:id', (req, res) => {
  const { ho_ten, mon_day, chu_nhiem_lop, sdt, email, mat_khau } = req.body;
  
  let query = 'UPDATE giao_vien SET ho_ten=?, mon_day=?, chu_nhiem_lop=?, sdt=?, email=?';
  let params = [ho_ten, mon_day, chu_nhiem_lop, sdt, email];
  
  // Chỉ cập nhật mật khẩu nếu có giá trị mới
  if (mat_khau) {
    query += ', mat_khau=?';
    params.push(mat_khau);
  }
  
  query += ' WHERE id=?';
  params.push(req.params.id);
  
  db.run(query, params, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Cập nhật giáo viên thành công' });
  });
});

app.get('/api/giao-vien/:id', (req, res) => {
  db.get('SELECT * FROM giao_vien WHERE id=?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy giáo viên' });
      return;
    }
    res.json(row);
  });
});

app.delete('/api/giao-vien/:id', (req, res) => {
  db.run('DELETE FROM giao_vien WHERE id=?', [req.params.id], (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Xóa giáo viên thành công' });
  });
});

// --- MÔN HỌC ---
app.get('/api/mon-hoc', (req, res) => {
  const { giao_vien_id } = req.query;
  
  let query = 'SELECT * FROM mon_hoc';
  const params = [];
  
  // Nếu là giáo viên, chỉ xem môn được phân công
  if (giao_vien_id) {
    query = `
      SELECT DISTINCT mh.* 
      FROM mon_hoc mh
      JOIN phan_cong pc ON mh.id = pc.mon_hoc_id
      WHERE pc.giao_vien_id = ?
    `;
    params.push(giao_vien_id);
  }
  
  query += ' ORDER BY ten_mon';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/mon-hoc', (req, res) => {
  const { ma_mon, ten_mon, so_tiet } = req.body;
  db.run(
    `INSERT INTO mon_hoc (ma_mon, ten_mon, so_tiet) VALUES (?, ?, ?)`,
    [ma_mon, ten_mon, so_tiet],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Thêm môn học thành công' });
    }
  );
});

app.put('/api/mon-hoc/:id', (req, res) => {
  const { ten_mon, so_tiet } = req.body;
  db.run(
    `UPDATE mon_hoc SET ten_mon=?, so_tiet=? WHERE id=?`,
    [ten_mon, so_tiet, req.params.id],
    (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: 'Cập nhật môn học thành công' });
    }
  );
});

app.delete('/api/mon-hoc/:id', (req, res) => {
  db.run('DELETE FROM mon_hoc WHERE id=?', [req.params.id], (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Xóa môn học thành công' });
  });
});

// --- PHÂN CÔNG ---
app.get('/api/phan-cong', (req, res) => {
  const { giao_vien_id } = req.query;
  let query = `
    SELECT pc.*, gv.ho_ten as ten_giao_vien, mh.ten_mon 
    FROM phan_cong pc
    JOIN giao_vien gv ON pc.giao_vien_id = gv.id
    JOIN mon_hoc mh ON pc.mon_hoc_id = mh.id
    WHERE 1=1
  `;
  const params = [];
  
  // Nếu là giáo viên, chỉ xem phân công của mình
  if (giao_vien_id) {
    query += ' AND pc.giao_vien_id = ?';
    params.push(giao_vien_id);
  }
  
  query += ' ORDER BY pc.thu, pc.tiet';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/phan-cong', (req, res) => {
  const { giao_vien_id, mon_hoc_id, lop, thu, tiet, so_tiet, phong } = req.body;
  const soTiet = so_tiet || 1;
  
  db.run(
    `INSERT INTO phan_cong (giao_vien_id, mon_hoc_id, lop, thu, tiet, so_tiet, phong) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [giao_vien_id, mon_hoc_id, lop, thu, tiet, soTiet, phong],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Phân công thành công' });
    }
  );
});

app.put('/api/phan-cong/:id', (req, res) => {
  const { giao_vien_id, mon_hoc_id, lop, thu, tiet, so_tiet, phong } = req.body;
  const soTiet = so_tiet || 1;
  
  db.run(
    `UPDATE phan_cong SET giao_vien_id=?, mon_hoc_id=?, lop=?, thu=?, tiet=?, so_tiet=?, phong=? WHERE id=?`,
    [giao_vien_id, mon_hoc_id, lop, thu, tiet, soTiet, phong, req.params.id],
    (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: 'Cập nhật phân công thành công' });
    }
  );
});

app.delete('/api/phan-cong/:id', (req, res) => {
  db.run('DELETE FROM phan_cong WHERE id=?', [req.params.id], (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Xóa phân công thành công' });
  });
});

// --- ĐIỂM DANH TIẾT DẠY ---
app.get('/api/diem-danh-tiet', (req, res) => {
  const { phan_cong_id, ngay_day } = req.query;
  
  let query = 'SELECT * FROM diem_danh_tiet WHERE 1=1';
  const params = [];
  
  if (phan_cong_id) {
    query += ' AND phan_cong_id = ?';
    params.push(phan_cong_id);
  }
  
  if (ngay_day) {
    query += ' AND ngay_day = ?';
    params.push(ngay_day);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/diem-danh-tiet', (req, res) => {
  const { phan_cong_id, ngay_day, trang_thai, ghi_chu } = req.body;
  
  // Kiểm tra xem đã điểm danh chưa
  db.get(
    'SELECT * FROM diem_danh_tiet WHERE phan_cong_id=? AND ngay_day=?',
    [phan_cong_id, ngay_day],
    (err, row) => {
      if (row) {
        // Đã có, cập nhật
        db.run(
          'UPDATE diem_danh_tiet SET trang_thai=?, ghi_chu=? WHERE id=?',
          [trang_thai, ghi_chu, row.id],
          (err) => {
            if (err) {
              res.status(400).json({ error: err.message });
              return;
            }
            res.json({ message: 'Cập nhật trạng thái thành công' });
          }
        );
      } else {
        // Chưa có, thêm mới
        db.run(
          'INSERT INTO diem_danh_tiet (phan_cong_id, ngay_day, trang_thai, ghi_chu) VALUES (?, ?, ?, ?)',
          [phan_cong_id, ngay_day, trang_thai, ghi_chu],
          function(err) {
            if (err) {
              res.status(400).json({ error: err.message });
              return;
            }
            res.json({ id: this.lastID, message: 'Đánh dấu thành công' });
          }
        );
      }
    }
  );
});

// --- ĐIỂM ---
app.get('/api/diem', (req, res) => {
  const { hoc_sinh_id, mon_hoc_id, giao_vien_id } = req.query;
  let query = `
    SELECT d.*, hs.ho_ten as ten_hoc_sinh, hs.lop, mh.ten_mon 
    FROM diem d
    JOIN hoc_sinh hs ON d.hoc_sinh_id = hs.id
    JOIN mon_hoc mh ON d.mon_hoc_id = mh.id
    WHERE 1=1
  `;
  const params = [];
  
  if (hoc_sinh_id) {
    query += ' AND d.hoc_sinh_id = ?';
    params.push(hoc_sinh_id);
  }
  if (mon_hoc_id) {
    query += ' AND d.mon_hoc_id = ?';
    params.push(mon_hoc_id);
  }
  
  // Nếu là giáo viên, chỉ xem điểm của lớp được phân công
  if (giao_vien_id) {
    query += ` AND hs.lop IN (
      SELECT DISTINCT lop FROM phan_cong WHERE giao_vien_id = ?
    )`;
    params.push(giao_vien_id);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/diem', (req, res) => {
  const { hoc_sinh_id, mon_hoc_id, loai_diem, diem, hoc_ky, nam_hoc, ghi_chu } = req.body;
  db.run(
    `INSERT INTO diem (hoc_sinh_id, mon_hoc_id, loai_diem, diem, hoc_ky, nam_hoc, ghi_chu) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [hoc_sinh_id, mon_hoc_id, loai_diem, diem, hoc_ky, nam_hoc, ghi_chu],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Nhập điểm thành công' });
    }
  );
});

app.put('/api/diem/:id', (req, res) => {
  const { hoc_sinh_id, mon_hoc_id, loai_diem, diem, hoc_ky, nam_hoc, ghi_chu } = req.body;
  db.run(
    `UPDATE diem SET hoc_sinh_id=?, mon_hoc_id=?, loai_diem=?, diem=?, hoc_ky=?, nam_hoc=?, ghi_chu=? WHERE id=?`,
    [hoc_sinh_id, mon_hoc_id, loai_diem, diem, hoc_ky, nam_hoc, ghi_chu, req.params.id],
    (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: 'Cập nhật điểm thành công' });
    }
  );
});

app.delete('/api/diem/:id', (req, res) => {
  db.run('DELETE FROM diem WHERE id=?', [req.params.id], (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Xóa điểm thành công' });
  });
});

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server SMAX đang chạy tại http://localhost:${PORT}`);
  console.log(`Chia sẻ trong mạng LAN: http://<IP-máy-bạn>:${PORT}`);
  console.log(`Để xem IP máy bạn, chạy lệnh: ipconfig`);
});
