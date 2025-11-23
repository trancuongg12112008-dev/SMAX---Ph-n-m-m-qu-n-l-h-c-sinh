const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Kiểm tra đăng nhập khi tải trang
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainScreen();
  }
});

// Xử lý đăng nhập
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      currentUser = result.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showMainScreen();
    } else {
      alert(result.message || 'Đăng nhập thất bại');
    }
  } catch (error) {
    alert('Lỗi kết nối: ' + error.message);
  }
});

// Hiển thị màn hình chính
async function showMainScreen() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'block';
  
  let userName = `👤 ${currentUser.ho_ten} (${getRoleName(currentUser.vai_tro)})`;
  
  // Nếu là giáo viên, hiển thị thêm thông tin chủ nhiệm
  if (currentUser.vai_tro === 'giao_vien') {
    try {
      const response = await fetch(`${API_URL}/giao-vien/${currentUser.giao_vien_id}`);
      if (response.ok) {
        const teacher = await response.json();
        if (teacher.chu_nhiem_lop) {
          userName += ` - GVCN: ${teacher.chu_nhiem_lop}`;
        }
      }
    } catch (error) {
      console.error('Lỗi tải thông tin giáo viên:', error);
    }
    
    // Ẩn các tab không được phép với giáo viên
    document.querySelectorAll('[data-tab="giao-vien"]').forEach(btn => {
      btn.style.display = 'none';
    });
  }
  
  document.getElementById('user-name').textContent = userName;
  
  setupNavigation();
  loadTabData('hoc-sinh');
}

// Đăng xuất
function logout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-form').reset();
}

// Lấy tên vai trò
function getRoleName(role) {
  const roles = {
    'hieu_truong': 'Hiệu trưởng',
    'hieu_pho': 'Hiệu phó',
    'giao_vien': 'Giáo viên'
  };
  return roles[role] || role;
}

// Tab navigation
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabName).classList.add('active');
      
      loadTabData(tabName);
    });
  });
}

// Load data based on active tab
function loadTabData(tabName) {
  switch(tabName) {
    case 'hoc-sinh':
      loadStudents();
      break;
    case 'giao-vien':
      loadTeachers();
      break;
    case 'mon-hoc':
      loadSubjects();
      break;
    case 'phan-cong':
      loadAssignments();
      loadTeachersForSelect();
      loadSubjectsForSelect();
      break;
    case 'diem':
      loadScores();
      loadStudentsForSelect();
      loadSubjectsForScoreSelect();
      break;
  }
}

// ===== HỌC SINH =====
function showAddStudentForm() {
  document.getElementById('student-form').style.display = 'block';
}

function hideAddStudentForm() {
  document.getElementById('student-form').style.display = 'none';
  document.getElementById('add-student-form').reset();
  document.querySelector('#student-form h3').textContent = 'Thêm học sinh mới';
  editingStudentId = null;
}

document.getElementById('add-student-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    ma_hs: document.getElementById('ma_hs').value.trim(),
    ho_ten: document.getElementById('ho_ten').value,
    ngay_sinh: document.getElementById('ngay_sinh').value,
    gioi_tinh: document.getElementById('gioi_tinh').value,
    lop: document.getElementById('lop').value,
    dia_chi: document.getElementById('dia_chi').value,
    sdt_phu_huynh: document.getElementById('sdt_phu_huynh').value
  };
  
  try {
    let url = `${API_URL}/hoc-sinh`;
    let method = 'POST';
    
    if (editingStudentId) {
      url += `/${editingStudentId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.ma_hs && !editingStudentId) {
        alert(`Thêm học sinh thành công!\nMã học sinh: ${result.ma_hs}`);
      } else {
        alert(editingStudentId ? 'Cập nhật học sinh thành công!' : 'Thêm học sinh thành công!');
      }
      hideAddStudentForm();
      loadStudents();
      editingStudentId = null;
    } else {
      const error = await response.json();
      alert('Lỗi: ' + error.error);
    }
  } catch (error) {
    alert('Lỗi kết nối: ' + error.message);
  }
});

async function loadStudents() {
  try {
    let url = `${API_URL}/hoc-sinh`;
    // Nếu là giáo viên, chỉ xem học sinh của lớp được phân công
    if (currentUser.vai_tro === 'giao_vien') {
      url += `?giao_vien_id=${currentUser.giao_vien_id}`;
    }
    
    const response = await fetch(url);
    const students = await response.json();
    
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';
    
    students.forEach(student => {
      const actionButtons = `
        <button class="btn-edit" onclick="editStudent(${student.id}, '${student.ma_hs}', '${student.ho_ten}', '${student.ngay_sinh || ''}', '${student.gioi_tinh || ''}', '${student.lop || ''}', '${student.dia_chi || ''}', '${student.sdt_phu_huynh || ''}')">Sửa</button>
        <button class="btn-danger" onclick="deleteStudent(${student.id})">Xóa</button>
      `;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${student.ma_hs}</td>
        <td>${student.ho_ten}</td>
        <td>${student.ngay_sinh || ''}</td>
        <td>${student.gioi_tinh || ''}</td>
        <td>${student.lop || ''}</td>
        <td>${student.sdt_phu_huynh || ''}</td>
        <td class="action-buttons">${actionButtons}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Lỗi tải học sinh:', error);
  }
}

let editingStudentId = null;

function editStudent(id, ma_hs, ho_ten, ngay_sinh, gioi_tinh, lop, dia_chi, sdt) {
  editingStudentId = id;
  document.getElementById('ma_hs').value = ma_hs;
  document.getElementById('ho_ten').value = ho_ten;
  document.getElementById('ngay_sinh').value = ngay_sinh;
  document.getElementById('gioi_tinh').value = gioi_tinh;
  document.getElementById('lop').value = lop;
  document.getElementById('dia_chi').value = dia_chi;
  document.getElementById('sdt_phu_huynh').value = sdt;
  
  document.querySelector('#student-form h3').textContent = 'Chỉnh sửa học sinh';
  document.getElementById('student-form').style.display = 'block';
}

async function deleteStudent(id) {
  if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;
  
  try {
    const response = await fetch(`${API_URL}/hoc-sinh/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Xóa thành công!');
      loadStudents();
    }
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

// ===== GIÁO VIÊN =====
function showAddTeacherForm() {
  // Giáo viên không được thêm giáo viên
  if (currentUser.vai_tro === 'giao_vien') {
    alert('Bạn không có quyền thêm giáo viên');
    return;
  }
  document.getElementById('teacher-form').style.display = 'block';
}

function hideAddTeacherForm() {
  document.getElementById('teacher-form').style.display = 'none';
  document.getElementById('add-teacher-form').reset();
  document.getElementById('ma_gv').disabled = false;
  document.getElementById('mat_khau_gv').placeholder = 'Mật khẩu (mặc định: 123456)';
  document.querySelector('#teacher-form h3').textContent = 'Thêm giáo viên mới';
  editingTeacherId = null;
}

document.getElementById('add-teacher-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    ma_gv: document.getElementById('ma_gv').value,
    ho_ten: document.getElementById('ho_ten_gv').value,
    mon_day: document.getElementById('mon_day').value,
    chu_nhiem_lop: document.getElementById('chu_nhiem_lop').value,
    sdt: document.getElementById('sdt_gv').value,
    email: document.getElementById('email').value
  };
  
  // Chỉ thêm mật khẩu nếu có giá trị hoặc đang thêm mới
  const matKhau = document.getElementById('mat_khau_gv').value;
  if (matKhau || !editingTeacherId) {
    data.mat_khau = matKhau || '123456';
  }
  
  try {
    let url = `${API_URL}/giao-vien`;
    let method = 'POST';
    
    if (editingTeacherId) {
      url += `/${editingTeacherId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert(editingTeacherId ? 'Cập nhật giáo viên thành công!' : 'Thêm giáo viên thành công!');
      hideAddTeacherForm();
      loadTeachers();
      editingTeacherId = null;
    } else {
      const error = await response.json();
      alert('Lỗi: ' + error.error);
    }
  } catch (error) {
    alert('Lỗi kết nối: ' + error.message);
  }
});

async function loadTeachers() {
  try {
    const response = await fetch(`${API_URL}/giao-vien`);
    const teachers = await response.json();
    
    const tbody = document.querySelector('#teachers-table tbody');
    tbody.innerHTML = '';
    
    teachers.forEach(teacher => {
      const chuNhiem = teacher.chu_nhiem_lop ? `<strong>${teacher.chu_nhiem_lop}</strong>` : '-';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${teacher.ma_gv}</td>
        <td>${teacher.ho_ten}</td>
        <td>${teacher.mon_day}</td>
        <td>${chuNhiem}</td>
        <td>${teacher.sdt || ''}</td>
        <td>${teacher.email || ''}</td>
        <td class="action-buttons">
          <button class="btn-edit" onclick="editTeacher(${teacher.id}, '${teacher.ma_gv}', '${teacher.ho_ten}', '${teacher.mon_day}', '${teacher.chu_nhiem_lop || ''}', '${teacher.sdt || ''}', '${teacher.email || ''}')">Sửa</button>
          <button class="btn-danger" onclick="deleteTeacher(${teacher.id})">Xóa</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Lỗi tải giáo viên:', error);
  }
}

let editingTeacherId = null;

function editTeacher(id, ma_gv, ho_ten, mon_day, chu_nhiem_lop, sdt, email) {
  editingTeacherId = id;
  document.getElementById('ma_gv').value = ma_gv;
  document.getElementById('ma_gv').disabled = true; // Không cho sửa mã GV
  document.getElementById('ho_ten_gv').value = ho_ten;
  document.getElementById('mon_day').value = mon_day;
  document.getElementById('chu_nhiem_lop').value = chu_nhiem_lop;
  document.getElementById('sdt_gv').value = sdt;
  document.getElementById('email').value = email;
  document.getElementById('mat_khau_gv').value = '';
  document.getElementById('mat_khau_gv').placeholder = 'Để trống nếu không đổi mật khẩu';
  
  document.querySelector('#teacher-form h3').textContent = 'Chỉnh sửa giáo viên';
  document.getElementById('teacher-form').style.display = 'block';
}

async function deleteTeacher(id) {
  // Giáo viên không được xóa giáo viên
  if (currentUser.vai_tro === 'giao_vien') {
    alert('Bạn không có quyền xóa giáo viên');
    return;
  }
  
  if (!confirm('Bạn có chắc muốn xóa giáo viên này?')) return;
  
  try {
    const response = await fetch(`${API_URL}/giao-vien/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Xóa thành công!');
      loadTeachers();
    }
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

// ===== MÔN HỌC =====
function showAddSubjectForm() {
  // Giáo viên không được thêm môn học
  if (currentUser.vai_tro === 'giao_vien') {
    alert('Bạn không có quyền thêm môn học');
    return;
  }
  document.getElementById('subject-form').style.display = 'block';
}

function hideAddSubjectForm() {
  document.getElementById('subject-form').style.display = 'none';
  document.getElementById('add-subject-form').reset();
  document.getElementById('ma_mon').disabled = false;
  document.querySelector('#subject-form h3').textContent = 'Thêm môn học mới';
  editingSubjectId = null;
}

document.getElementById('add-subject-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    ma_mon: document.getElementById('ma_mon').value,
    ten_mon: document.getElementById('ten_mon').value,
    so_tiet: document.getElementById('so_tiet').value
  };
  
  try {
    let url = `${API_URL}/mon-hoc`;
    let method = 'POST';
    
    if (editingSubjectId) {
      url += `/${editingSubjectId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert(editingSubjectId ? 'Cập nhật môn học thành công!' : 'Thêm môn học thành công!');
      hideAddSubjectForm();
      loadSubjects();
      editingSubjectId = null;
    } else {
      const error = await response.json();
      alert('Lỗi: ' + error.error);
    }
  } catch (error) {
    alert('Lỗi kết nối: ' + error.message);
  }
});

async function loadSubjects() {
  try {
    let url = `${API_URL}/mon-hoc`;
    // Nếu là giáo viên, chỉ xem môn được phân công
    if (currentUser.vai_tro === 'giao_vien') {
      url += `?giao_vien_id=${currentUser.giao_vien_id}`;
    }
    
    const response = await fetch(url);
    const subjects = await response.json();
    
    const tbody = document.querySelector('#subjects-table tbody');
    tbody.innerHTML = '';
    
    subjects.forEach(subject => {
      const tr = document.createElement('tr');
      
      // Giáo viên không có nút sửa/xóa
      let actionButtons = '';
      if (currentUser.vai_tro !== 'giao_vien') {
        actionButtons = `<td class="action-buttons">
          <button class="btn-edit" onclick="editSubject(${subject.id}, '${subject.ma_mon}', '${subject.ten_mon}', ${subject.so_tiet || 0})">Sửa</button>
          <button class="btn-danger" onclick="deleteSubject(${subject.id})">Xóa</button>
        </td>`;
      } else {
        actionButtons = '<td>-</td>';
      }
      
      tr.innerHTML = `
        <td>${subject.ma_mon}</td>
        <td>${subject.ten_mon}</td>
        <td>${subject.so_tiet || ''}</td>
        ${actionButtons}
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Lỗi tải môn học:', error);
  }
}

let editingSubjectId = null;

function editSubject(id, ma_mon, ten_mon, so_tiet) {
  editingSubjectId = id;
  document.getElementById('ma_mon').value = ma_mon;
  document.getElementById('ma_mon').disabled = true;
  document.getElementById('ten_mon').value = ten_mon;
  document.getElementById('so_tiet').value = so_tiet;
  
  document.querySelector('#subject-form h3').textContent = 'Chỉnh sửa môn học';
  document.getElementById('subject-form').style.display = 'block';
}

async function deleteSubject(id) {
  // Giáo viên không được xóa môn học
  if (currentUser.vai_tro === 'giao_vien') {
    alert('Bạn không có quyền xóa môn học');
    return;
  }
  
  if (!confirm('Bạn có chắc muốn xóa môn học này?')) return;
  
  try {
    const response = await fetch(`${API_URL}/mon-hoc/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Xóa thành công!');
      loadSubjects();
    }
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

// ===== PHÂN CÔNG =====
function showAddAssignmentForm() {
  // Giáo viên không được phân công
  if (currentUser.vai_tro === 'giao_vien') {
    alert('Bạn không có quyền phân công giảng dạy');
    return;
  }
  document.getElementById('assignment-form').style.display = 'block';
}

function hideAddAssignmentForm() {
  document.getElementById('assignment-form').style.display = 'none';
  document.getElementById('add-assignment-form').reset();
  document.querySelector('#assignment-form h3').textContent = 'Phân công giảng dạy';
  editingAssignmentId = null;
}

async function loadTeachersForSelect() {
  try {
    const response = await fetch(`${API_URL}/giao-vien`);
    const teachers = await response.json();
    
    const select = document.getElementById('giao_vien_id');
    select.innerHTML = '<option value="">Chọn giáo viên *</option>';
    
    teachers.forEach(teacher => {
      const option = document.createElement('option');
      option.value = teacher.id;
      option.textContent = `${teacher.ho_ten} - ${teacher.mon_day}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Lỗi tải giáo viên:', error);
  }
}

async function loadSubjectsForSelect() {
  try {
    const response = await fetch(`${API_URL}/mon-hoc`);
    const subjects = await response.json();
    
    const select = document.getElementById('mon_hoc_id');
    select.innerHTML = '<option value="">Chọn môn học *</option>';
    
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.id;
      option.textContent = subject.ten_mon;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Lỗi tải môn học:', error);
  }
}

document.getElementById('add-assignment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    giao_vien_id: document.getElementById('giao_vien_id').value,
    mon_hoc_id: document.getElementById('mon_hoc_id').value,
    lop: document.getElementById('lop_pc').value,
    thu: document.getElementById('thu').value,
    tiet: document.getElementById('tiet').value,
    so_tiet: document.getElementById('so_tiet').value,
    phong: document.getElementById('phong').value
  };
  
  try {
    let url = `${API_URL}/phan-cong`;
    let method = 'POST';
    
    if (editingAssignmentId) {
      url += `/${editingAssignmentId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert(editingAssignmentId ? 'Cập nhật phân công thành công!' : 'Phân công thành công!');
      hideAddAssignmentForm();
      loadAssignments();
      editingAssignmentId = null;
    } else {
      const error = await response.json();
      alert('Lỗi: ' + error.error);
    }
  } catch (error) {
    alert('Lỗi kết nối: ' + error.message);
  }
});

async function loadAssignments() {
  try {
    let url = `${API_URL}/phan-cong`;
    // Nếu là giáo viên, chỉ xem phân công của mình
    if (currentUser.vai_tro === 'giao_vien') {
      url += `?giao_vien_id=${currentUser.giao_vien_id}`;
    }
    
    const response = await fetch(url);
    const assignments = await response.json();
    
    // Lấy ngày hôm nay
    const today = new Date().toISOString().split('T')[0];
    
    // Lấy trạng thái điểm danh
    const diemDanhResponse = await fetch(`${API_URL}/diem-danh-tiet?ngay_day=${today}`);
    const diemDanhData = await diemDanhResponse.json();
    const diemDanhMap = {};
    diemDanhData.forEach(dd => {
      diemDanhMap[dd.phan_cong_id] = dd.trang_thai;
    });
    
    const tbody = document.querySelector('#assignments-table tbody');
    tbody.innerHTML = '';
    
    assignments.forEach(assignment => {
      const soTiet = assignment.so_tiet || 1;
      let tietText = `Tiết ${assignment.tiet}`;
      if (soTiet > 1) {
        const tietCuoi = assignment.tiet + soTiet - 1;
        tietText = `Tiết ${assignment.tiet}-${tietCuoi}`;
      }
      
      let actionButtons = '';
      if (currentUser.vai_tro !== 'giao_vien') {
        actionButtons = `
          <button class="btn-edit" onclick="editAssignment(${assignment.id}, ${assignment.giao_vien_id}, ${assignment.mon_hoc_id}, '${assignment.lop}', ${assignment.thu}, ${assignment.tiet}, ${soTiet}, '${assignment.phong || ''}')">Sửa</button>
          <button class="btn-danger" onclick="deleteAssignment(${assignment.id})">Xóa</button>
        `;
      } else {
        // Giáo viên có nút đánh dấu đã dạy
        const trangThai = diemDanhMap[assignment.id] || 'chua_day';
        const checked = trangThai === 'da_day' ? 'checked' : '';
        const checkIcon = trangThai === 'da_day' ? '✅' : '⬜';
        actionButtons = `
          <label style="cursor:pointer;">
            <input type="checkbox" ${checked} onchange="toggleDayXong(${assignment.id}, this.checked)" style="display:none;">
            <span style="font-size:20px;">${checkIcon}</span>
          </label>
        `;
      }
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${assignment.ten_giao_vien}</td>
        <td>${assignment.ten_mon}</td>
        <td>${assignment.lop}</td>
        <td>Thứ ${assignment.thu}</td>
        <td>${tietText}</td>
        <td>${soTiet} tiết</td>
        <td>${assignment.phong || ''}</td>
        <td class="action-buttons">${actionButtons}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Lỗi tải phân công:', error);
  }
}

async function toggleDayXong(phanCongId, isDaDay) {
  const today = new Date().toISOString().split('T')[0];
  const trangThai = isDaDay ? 'da_day' : 'chua_day';
  
  try {
    const response = await fetch(`${API_URL}/diem-danh-tiet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phan_cong_id: phanCongId,
        ngay_day: today,
        trang_thai: trangThai,
        ghi_chu: ''
      })
    });
    
    if (response.ok) {
      loadAssignments(); // Reload để cập nhật icon
    } else {
      alert('Lỗi cập nhật trạng thái');
    }
  } catch (error) {
    alert('Lỗi kết nối: ' + error.message);
  }
}

let editingAssignmentId = null;

function editAssignment(id, giao_vien_id, mon_hoc_id, lop, thu, tiet, so_tiet, phong) {
  editingAssignmentId = id;
  document.getElementById('giao_vien_id').value = giao_vien_id;
  document.getElementById('mon_hoc_id').value = mon_hoc_id;
  document.getElementById('lop_pc').value = lop;
  document.getElementById('thu').value = thu;
  document.getElementById('tiet').value = tiet;
  document.getElementById('so_tiet').value = so_tiet;
  document.getElementById('phong').value = phong;
  
  document.querySelector('#assignment-form h3').textContent = 'Chỉnh sửa phân công';
  document.getElementById('assignment-form').style.display = 'block';
}

async function deleteAssignment(id) {
  // Giáo viên không được xóa phân công
  if (currentUser.vai_tro === 'giao_vien') {
    alert('Bạn không có quyền xóa phân công');
    return;
  }
  
  if (!confirm('Bạn có chắc muốn xóa phân công này?')) return;
  
  try {
    const response = await fetch(`${API_URL}/phan-cong/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Xóa thành công!');
      loadAssignments();
    }
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

// ===== ĐIỂM =====
function showAddScoreForm() {
  document.getElementById('score-form').style.display = 'block';
}

function hideAddScoreForm() {
  document.getElementById('score-form').style.display = 'none';
  document.getElementById('add-score-form').reset();
  document.querySelector('#score-form h3').textContent = 'Nhập điểm';
  editingScoreId = null;
}

async function loadStudentsForSelect() {
  try {
    const response = await fetch(`${API_URL}/hoc-sinh`);
    const students = await response.json();
    
    const select = document.getElementById('hoc_sinh_id');
    select.innerHTML = '<option value="">Chọn học sinh *</option>';
    
    students.forEach(student => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.ho_ten} - ${student.lop || ''}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Lỗi tải học sinh:', error);
  }
}

async function loadSubjectsForScoreSelect() {
  try {
    let url = `${API_URL}/mon-hoc`;
    // Nếu là giáo viên, chỉ xem môn được phân công
    if (currentUser.vai_tro === 'giao_vien') {
      url += `?giao_vien_id=${currentUser.giao_vien_id}`;
    }
    
    const response = await fetch(url);
    const subjects = await response.json();
    
    const select = document.getElementById('mon_hoc_id_diem');
    select.innerHTML = '<option value="">Chọn môn học *</option>';
    
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.id;
      option.textContent = subject.ten_mon;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Lỗi tải môn học:', error);
  }
}

document.getElementById('add-score-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    hoc_sinh_id: document.getElementById('hoc_sinh_id').value,
    mon_hoc_id: document.getElementById('mon_hoc_id_diem').value,
    loai_diem: document.getElementById('loai_diem').value,
    diem: document.getElementById('diem_so').value,
    hoc_ky: document.getElementById('hoc_ky').value,
    nam_hoc: document.getElementById('nam_hoc').value,
    ghi_chu: document.getElementById('ghi_chu').value
  };
  
  try {
    let url = `${API_URL}/diem`;
    let method = 'POST';
    
    if (editingScoreId) {
      url += `/${editingScoreId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert(editingScoreId ? 'Cập nhật điểm thành công!' : 'Nhập điểm thành công!');
      hideAddScoreForm();
      loadScores();
      editingScoreId = null;
    } else {
      const error = await response.json();
      alert('Lỗi: ' + error.error);
    }
  } catch (error) {
    alert('Lỗi kết nối: ' + error.message);
  }
});

async function loadScores() {
  try {
    let url = `${API_URL}/diem`;
    // Nếu là giáo viên, chỉ xem điểm của lớp được phân công
    if (currentUser.vai_tro === 'giao_vien') {
      url += `?giao_vien_id=${currentUser.giao_vien_id}`;
    }
    
    const response = await fetch(url);
    const scores = await response.json();
    
    const tbody = document.querySelector('#scores-table tbody');
    tbody.innerHTML = '';
    
    scores.forEach(score => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${score.ten_hoc_sinh}</td>
        <td>${score.ten_mon}</td>
        <td>${score.loai_diem}</td>
        <td><strong>${score.diem}</strong></td>
        <td>HK${score.hoc_ky}</td>
        <td>${score.nam_hoc}</td>
        <td>${score.ghi_chu || ''}</td>
        <td class="action-buttons">
          <button class="btn-edit" onclick="editScore(${score.id}, ${score.hoc_sinh_id}, ${score.mon_hoc_id}, '${score.loai_diem}', ${score.diem}, ${score.hoc_ky}, '${score.nam_hoc}', '${score.ghi_chu || ''}')">Sửa</button>
          <button class="btn-danger" onclick="deleteScore(${score.id})">Xóa</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Lỗi tải điểm:', error);
  }
}

let editingScoreId = null;

function editScore(id, hoc_sinh_id, mon_hoc_id, loai_diem, diem, hoc_ky, nam_hoc, ghi_chu) {
  editingScoreId = id;
  document.getElementById('hoc_sinh_id').value = hoc_sinh_id;
  document.getElementById('mon_hoc_id_diem').value = mon_hoc_id;
  document.getElementById('loai_diem').value = loai_diem;
  document.getElementById('diem_so').value = diem;
  document.getElementById('hoc_ky').value = hoc_ky;
  document.getElementById('nam_hoc').value = nam_hoc;
  document.getElementById('ghi_chu').value = ghi_chu;
  
  document.querySelector('#score-form h3').textContent = 'Chỉnh sửa điểm';
  document.getElementById('score-form').style.display = 'block';
}

async function deleteScore(id) {
  if (!confirm('Bạn có chắc muốn xóa điểm này?')) return;
  
  try {
    const response = await fetch(`${API_URL}/diem/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Xóa thành công!');
      loadScores();
    }
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

// Không load data ban đầu nữa, chỉ load sau khi đăng nhập
