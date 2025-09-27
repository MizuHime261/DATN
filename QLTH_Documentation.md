## Tạo hóa đơn theo Khối (Batch Invoices by Grade)

Mục tiêu: tạo hóa đơn cho tất cả học sinh đang học trong một Khối, cùng kỳ thu và các khoản phí giống nhau.

### API Backend

- Endpoint: `POST /api/staff/invoices/batch-by-grade`
- Quyền: STAFF hoặc ADMIN
- Body JSON:
```
{
  "grade_id": 123,
  "billing_period_start": "2025-09-01",
  "billing_period_end": "2025-09-30",
  "replace": true,
  "items": [
    { "item_type": "TUITION", "description": "Học phí tháng 9", "quantity": 1, "unit_price_cents": 500000 },
    { "item_type": "MEAL", "description": "Bán trú", "quantity": 1, "unit_price_cents": 250000 }
  ]
}
```
- Hành vi:
  - Lấy danh sách học sinh active thuộc các lớp trong `grade_id`.
  - Với mỗi học sinh:
    - Tạo hóa đơn `DRAFT` nếu chưa có cho kỳ (start/end) này; nếu `replace=true` thì xóa items cũ để ghi đè.
    - Thêm các `invoice_items` như `items` gửi lên; cập nhật `invoices.total_cents`.
  - Trả về `{ ok, created, updated, students }`.

### Lưu ý dữ liệu

- Mỗi hóa đơn gắn với 1 học sinh (`invoices.student_user_id`).
- `invoice_items.total_cents = quantity * unit_price_cents`.
- Kỳ thu phân biệt bằng cặp (`billing_period_start`, `billing_period_end`).
- Chỉ lấy học sinh có `class_enrollments.active = TRUE`.

### Gợi ý UI (Trang Nhân viên)

- Form chọn Khối (dropdown: Cấp – Khối X), chọn kỳ thu (từ ngày/đến ngày).
- Bảng cấu hình khoản thu (thêm/xóa dòng: loại, mô tả, SL, đơn giá).
- Nút "Xem trước" (tính tổng tiền mỗi học sinh) và nút "Tạo hóa đơn" gọi API trên.

# HỆ THỐNG QUẢN LÝ TRƯỜNG HỌC PHENIKAA (QLTH)
## Tài liệu chức năng đã hoàn thành

### 1. TỔNG QUAN HỆ THỐNG
- **Backend**: Node.js + Express + MySQL
- **Frontend**: React + Vite
- **Database**: MySQL 8 với schema `qlth.sql`
- **Authentication**: JWT + Role-based Access Control (RBAC)
- **Theme**: Xanh dương đậm và trắng

### 2. CÁC VAI TRÒ NGƯỜI DÙNG
- **Admin**: Quản lý toàn hệ thống
- **Teacher**: Giáo viên
- **Staff**: Nhân viên kế toán
- **Parent**: Phụ huynh
- **Student**: Học sinh

---

## 3. CHI TIẾT CHỨC NĂNG THEO VAI TRÒ

### 3.1 ADMIN (Quản trị viên)

#### 3.1.1 Quản lý tài khoản người dùng ✅
- **API**: `POST /api/admin/users` - Tạo tài khoản mới
- **API**: `GET /api/admin/users` - Xem danh sách người dùng theo vai trò
- **Frontend**: Trang Admin → Quản lý tài khoản
- **Chức năng**: Tạo tài khoản cho giáo viên, nhân viên, phụ huynh, học sinh

#### 3.1.2 Quản lý cơ cấu trường học ✅
- **API**: 
  - `GET /api/admin/levels` - Danh sách cấp học
  - `POST /api/admin/levels` - Tạo cấp học mới
  - `GET /api/admin/grades` - Danh sách khối lớp
  - `POST /api/admin/grades` - Tạo khối lớp mới
  - `GET /api/admin/classes` - Danh sách lớp học
  - `POST /api/admin/classes` - Tạo lớp học mới
- **Frontend**: Trang Admin → Cơ cấu trường học
- **Chức năng**: Quản lý cấp học (Tiểu học, THCS, THPT), khối lớp, lớp học cụ thể

#### 3.1.3 Quản lý học vụ ✅
- **API**:
  - `GET /api/admin/subjects` - Danh sách môn học
  - `POST /api/admin/subjects` - Tạo môn học mới
  - `GET /api/admin/school-years` - Danh sách năm học
  - `POST /api/admin/school-years` - Tạo năm học mới
  - `GET /api/admin/terms` - Danh sách học kỳ
  - `POST /api/admin/terms` - Tạo học kỳ mới
- **Frontend**: Trang Admin → Quản lý học vụ
- **Chức năng**: Quản lý môn học, năm học, học kỳ, phân bổ môn theo cấp/lớp

#### 3.1.4 Quản lý thời khóa biểu ✅
- **API**:
  - `GET /api/admin/timetable` - Danh sách thời khóa biểu
  - `POST /api/admin/timetable` - Tạo tiết học mới
- **Frontend**: Trang Admin → Thời khóa biểu
- **Chức năng**: Xây dựng TKB cho 3 cấp học, phân công môn học và giáo viên, kiểm tra xung đột lịch

---

### 3.2 TEACHER (Giáo viên)

#### 3.2.1 Xem thời khóa biểu cá nhân ✅
- **API**: `GET /api/teacher/timetable`
- **Frontend**: Trang Teacher → Thời khóa biểu
- **Chức năng**: Xem TKB cá nhân với thông tin môn học, tiết học, lớp học

#### 3.2.2 Quản lý điểm số ✅
- **API**:
  - `GET /api/teacher/students` - Danh sách học sinh
  - `POST /api/teacher/grades` - Nhập điểm mới
  - `PUT /api/teacher/grades/:id` - Sửa điểm
  - `GET /api/teacher/grades/report` - Báo cáo điểm (JSON/CSV)
- **Frontend**: Trang Teacher → Nhập điểm
- **Chức năng**: Nhập/sửa điểm kiểm tra, điểm miệng, điểm thi; tự động tính điểm TB và xếp loại

#### 3.2.3 Xem danh sách học sinh ✅
- **API**: `GET /api/teacher/students` (có tìm kiếm, lọc)
- **Frontend**: Trang Teacher → Danh sách học sinh
- **Chức năng**: Xem danh sách học sinh với thông tin chi tiết (họ tên, ngày sinh, giới tính, SĐT phụ huynh)

#### 3.2.4 Đánh giá hạnh kiểm (GVCN) ✅
- **API**:
  - `POST /api/teacher/conduct` - Nhập hạnh kiểm
  - `PUT /api/teacher/conduct/:id` - Sửa hạnh kiểm
- **Frontend**: Trang Teacher → Đánh giá hạnh kiểm
- **Chức năng**: Nhập nhận xét hạnh kiểm theo kỳ/năm học, phân loại (Tốt, Khá, Trung bình, Yếu)

#### 3.2.5 Báo cáo kết quả học tập ✅
- **API**: `GET /api/teacher/grades/report`
- **Frontend**: Trang Teacher → Báo cáo
- **Chức năng**: Xuất báo cáo điểm theo lớp/môn/kỳ, tải file CSV

---

### 3.3 STAFF (Nhân viên kế toán)

#### 3.3.1 Quản lý học phí ✅
- **API**:
  - `GET /api/staff/invoices` - Danh sách hóa đơn (có lọc)
  - `GET /api/staff/invoices/:id` - Chi tiết hóa đơn
  - `POST /api/staff/invoices/:id/items` - Thêm khoản phí
  - `PUT /api/staff/invoices/:id/status` - Cập nhật trạng thái
  - `GET /api/staff/fee-status` - Tình trạng công nợ
- **Frontend**: Trang Staff → Quản lý học phí
- **Chức năng**: Theo dõi tình trạng nộp học phí, lập phiếu thu, quản lý các khoản phí khác

#### 3.3.2 Báo cáo học phí ✅
- **API**:
  - `GET /api/staff/reports/tuition` - Báo cáo học phí theo lớp/khối/trường
- **Chức năng**: Tổng hợp báo cáo học phí, tra cứu nhanh tình trạng học phí

#### 3.3.3 Quản lý suất ăn bán trú ✅
- **API**:
  - `GET /api/staff/meal-plans` - Danh sách thực đơn
  - `POST /api/staff/meal-plans` - Tạo thực đơn mới
  - `GET /api/staff/reports/meal-count` - Báo cáo số lượng suất ăn
- **Frontend**: Trang Staff → Quản lý bán trú
- **Chức năng**: Tạo phí ăn bán trú theo khối (cấp 1), báo cáo thống kê số lượng suất ăn

---

### 3.4 PARENT (Phụ huynh)

#### 3.4.1 Xem thời khóa biểu của con ✅
- **API**: `GET /api/parent/children/:studentId/timetable`
- **Frontend**: Trang Parent → Thời khóa biểu
- **Chức năng**: Xem TKB học tập của con theo ngày/tuần/kỳ

#### 3.4.2 Đăng ký bán trú ✅
- **API**:
  - `POST /api/parent/children/:studentId/boarding` - Đăng ký bán trú
  - `DELETE /api/parent/children/:studentId/boarding` - Hủy đăng ký
- **Frontend**: Trang Parent → Đăng ký bán trú
- **Chức năng**: Đăng ký/hủy suất ăn bán trú cho con theo kỳ học

#### 3.4.3 Thanh toán học phí ✅
- **API**:
  - `GET /api/parent/children/:studentId/invoices` - Hóa đơn của con
  - `GET /api/parent/children/:studentId/fee-status` - Tình trạng công nợ
- **Frontend**: Trang Parent → Thanh toán học phí
- **Chức năng**: Xem chi tiết học phí, tình trạng thanh toán, biên lai điện tử

#### 3.4.4 Xem thông tin lớp học ✅
- **API**: `GET /api/parent/children/:studentId/class`
- **Frontend**: Trang Parent → Thông tin lớp học
- **Chức năng**: Xem thông tin lớp học của con (GVCN, phòng học)

#### 3.4.5 Xem kết quả học tập ✅
- **API**: `GET /api/parent/children/:studentId/results`
- **Frontend**: Trang Parent → Kết quả học tập
- **Chức năng**: Theo dõi điểm số, kết quả kiểm tra và xếp loại học lực của con

---

### 3.5 STUDENT (Học sinh)

#### 3.5.1 Xem thời khóa biểu cá nhân ✅
- **API**: `GET /api/student/me/timetable`
- **Frontend**: Trang Student → Thời khóa biểu
- **Chức năng**: Xem TKB cá nhân theo ngày/tuần/kỳ

#### 3.5.2 Xem thông tin lớp học ✅
- **API**: `GET /api/student/me/class`
- **Frontend**: Trang Student → Thông tin lớp học
- **Chức năng**: Xem thông tin lớp học, danh sách bạn học, GVCN

#### 3.5.3 Xem kết quả học tập ✅
- **API**: `GET /api/student/me/results`
- **Frontend**: Trang Student → Kết quả học tập
- **Chức năng**: Theo dõi điểm kiểm tra, điểm thi, điểm TB và xếp loại học lực

---

## 4. CẤU TRÚC DỮ LIỆU

### 4.1 Database Schema (qlth.sql)
- **Bảng chính**: users, schools, education_levels, grades, classes, subjects, school_years, terms
- **Bảng quan hệ**: timetable_entries, enrollments, teacher_subjects, meal_plans, invoices, payments
- **Dữ liệu mẫu**: Đã có đầy đủ seed data cho tất cả bảng

### 4.2 API Endpoints
- **Authentication**: `/api/auth/login`
- **Admin**: `/api/admin/*`
- **Teacher**: `/api/teacher/*`
- **Staff**: `/api/staff/*`
- **Parent**: `/api/parent/*`
- **Student**: `/api/student/*`

---

## 5. HƯỚNG DẪN SỬ DỤNG

### 5.1 Khởi động hệ thống
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### 5.2 Tài khoản mặc định
- **Admin**: trangmeo2k3tb@gmail.com / 123456
- **Teacher**: teacher1@example.com / 123456
- **Staff**: staff1@example.com / 123456
- **Parent**: parent1@example.com / 123456
- **Student**: student1@example.com / 123456

### 5.3 URL truy cập
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 6. GHI CHÚ KỸ THUẬT

### 6.1 Bảo mật
- JWT authentication với token expiration
- Role-based access control (RBAC)
- Password hashing với SHA256

### 6.2 Database
- MySQL 8 với connection pooling
- Foreign key constraints
- UUID primary keys

### 6.3 Frontend
- React 18 với Vite
- Context API cho state management
- Axios cho API calls
- Responsive design với theme xanh dương/trắng

---

## 7. TÍNH NĂNG CÓ THỂ MỞ RỘNG

### 7.1 UI/UX
- Thêm biểu đồ cho báo cáo tài chính
- Export PDF cho báo cáo
- Notification system
- Dark mode

### 7.2 Chức năng
- Email notifications
- SMS alerts
- File upload cho tài liệu
- Calendar integration
- Mobile app

### 7.3 Báo cáo nâng cao
- Dashboard analytics
- Real-time statistics
- Advanced filtering
- Custom reports

---

**Ngày tạo**: $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Phiên bản**: 1.0
**Trạng thái**: Hoàn thành cơ bản, sẵn sàng sử dụng



