# Tài liệu các File Dữ liệu trong Dự án QLTH

## 1. Cấu trúc Thư mục Dự án

```
QLTH/
├── backend/                    # Backend Node.js
│   ├── src/
│   │   ├── app.js             # File chính của ứng dụng Express
│   │   ├── db/
│   │   │   └── pool.js        # Cấu hình kết nối MySQL
│   │   ├── middleware/
│   │   │   └── auth.js        # Middleware xác thực JWT và phân quyền
│   │   ├── routes/            # Các route API theo vai trò
│   │   │   ├── admin.js       # API cho Admin
│   │   │   ├── auth.js        # API đăng nhập/đăng xuất
│   │   │   ├── parent.js      # API cho Phụ huynh
│   │   │   ├── staff.js       # API cho Nhân viên
│   │   │   ├── student.js     # API cho Học sinh
│   │   │   └── teacher.js     # API cho Giáo viên
│   │   └── scripts/
│   │       └── initDb.js      # Script khởi tạo database
│   ├── package.json           # Dependencies backend
│   └── .env                   # Biến môi trường
├── frontend/                   # Frontend React
│   ├── src/
│   │   ├── main.jsx           # Entry point React
│   │   ├── pages/             # Các trang theo vai trò
│   │   │   ├── Admin*.jsx     # Trang Admin
│   │   │   ├── Teacher*.jsx   # Trang Giáo viên
│   │   │   ├── Student*.jsx   # Trang Học sinh
│   │   │   ├── Parent*.jsx    # Trang Phụ huynh
│   │   │   ├── Staff*.jsx     # Trang Nhân viên
│   │   │   └── Login.jsx      # Trang đăng nhập
│   │   ├── state/
│   │   │   ├── AuthContext.jsx # Context xác thực
│   │   │   └── Protected.jsx   # Component bảo vệ route
│   │   └── styles.css         # CSS toàn cục
│   ├── index.html             # HTML chính
│   ├── vite.config.js         # Cấu hình Vite
│   └── package.json           # Dependencies frontend
├── qlth.sql                   # Schema và dữ liệu mẫu MySQL
└── *.md                       # Tài liệu dự án
```

## 2. File Dữ liệu Chính

### 2.1 Database Schema (`qlth.sql`)
- **Mục đích**: Định nghĩa cấu trúc database và dữ liệu mẫu
- **Nội dung**:
  - Tạo database `qlth`
  - 15+ bảng: users, education_levels, grades, classes, subjects, school_years, terms, timetable_entries, grades, conduct, invoices, invoice_items, meal_plans, boarding_registrations
  - Dữ liệu mẫu cho tất cả bảng
  - Indexes và constraints

### 2.2 Backend Files

#### `backend/src/app.js`
- **Mục đích**: File chính của ứng dụng Express
- **Chức năng**:
  - Khởi tạo Express server
  - Cấu hình middleware (CORS, Helmet, Morgan)
  - Kết nối các route API
  - Xử lý lỗi toàn cục

#### `backend/src/db/pool.js`
- **Mục đích**: Quản lý kết nối MySQL
- **Chức năng**:
  - Tạo connection pool
  - Cấu hình từ biến môi trường
  - Tối ưu hiệu suất kết nối

#### `backend/src/middleware/auth.js`
- **Mục đích**: Xác thực và phân quyền
- **Chức năng**:
  - Verify JWT token
  - Kiểm tra quyền truy cập theo role
  - Bảo vệ các endpoint

#### Route Files (`backend/src/routes/`)
- **admin.js**: 20+ endpoints cho Admin
- **auth.js**: Login/logout endpoints
- **teacher.js**: 15+ endpoints cho Giáo viên
- **student.js**: 5+ endpoints cho Học sinh
- **parent.js**: 10+ endpoints cho Phụ huynh
- **staff.js**: 15+ endpoints cho Nhân viên

### 2.3 Frontend Files

#### `frontend/src/pages/`
**Admin Pages:**
- `AdminUsers.jsx`: Quản lý tài khoản người dùng
- `AdminStructure.jsx`: Quản lý cấu trúc trường (cấp, khối, lớp)
- `AdminAcademic.jsx`: Quản lý học vụ (môn học, năm học, học kỳ)
- `AdminTimetable.jsx`: Quản lý thời khóa biểu

**Teacher Pages:**
- `TeacherTimetable.jsx`: Xem thời khóa biểu cá nhân
- `TeacherStudents.jsx`: Danh sách học sinh
- `TeacherGrades.jsx`: Quản lý điểm số
- `TeacherConduct.jsx`: Đánh giá hạnh kiểm
- `TeacherReport.jsx`: Xuất báo cáo điểm

**Student Pages:**
- `StudentTimetable.jsx`: Thời khóa biểu cá nhân
- `StudentClassInfo.jsx`: Thông tin lớp học
- `StudentResults.jsx`: Kết quả học tập

**Parent Pages:**
- `ParentTimetable.jsx`: Thời khóa biểu con
- `ParentClassInfo.jsx`: Thông tin lớp của con
- `ParentResults.jsx`: Kết quả học tập của con
- `ParentInvoices.jsx`: Hóa đơn học phí
- `ParentBoarding.jsx`: Đăng ký bán trú

**Staff Pages:**
- `StaffInvoices.jsx`: Quản lý hóa đơn
- `StaffMeals.jsx`: Quản lý suất ăn

#### `frontend/src/state/`
- `AuthContext.jsx`: Quản lý trạng thái đăng nhập
- `Protected.jsx`: Bảo vệ route theo role

## 3. File Cấu hình

### 3.1 Backend Configuration
- **package.json**: Dependencies (Express, MySQL2, JWT, CORS, Helmet, Morgan)
- **.env**: Biến môi trường (DB, JWT, OAuth, Email, Cloudinary)

### 3.2 Frontend Configuration
- **package.json**: Dependencies (React, Vite, Axios, React Router)
- **vite.config.js**: Cấu hình dev server và proxy API
- **index.html**: HTML template chính

## 4. Dữ liệu Mẫu

### 4.1 Users (Tài khoản)
- **Admin**: admin@phenikaa.edu.vn
- **Teacher**: teacher1@phenikaa.edu.vn
- **Student**: student1@phenikaa.edu.vn
- **Parent**: parent1@phenikaa.edu.vn
- **Staff**: staff1@phenikaa.edu.vn

### 4.2 School Structure
- **3 Education Levels**: Tiểu học, THCS, THPT
- **Grades**: 1-12
- **Classes**: 10A1, 10A2, 11A1, 11A2, 12A1, 12A2
- **Subjects**: Toán, Lý, Hóa, Sinh, Văn, Sử, Địa, Anh, GDCD, TD, QPAN

### 4.3 Academic Data
- **School Year**: 2024-2025
- **Terms**: HK1, HK2
- **Timetable**: Thời khóa biểu mẫu cho tất cả lớp
- **Grades**: Điểm số mẫu cho học sinh
- **Invoices**: Hóa đơn học phí mẫu

## 5. API Endpoints

### 5.1 Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

### 5.2 Admin APIs (20+ endpoints)
- User management, school structure, academic data, timetable

### 5.3 Teacher APIs (15+ endpoints)
- Timetable, students, grades, conduct, reports

### 5.4 Student APIs (5+ endpoints)
- Personal timetable, class info, results

### 5.5 Parent APIs (10+ endpoints)
- Child's data, invoices, boarding registration

### 5.6 Staff APIs (15+ endpoints)
- Invoice management, meal plans, reports

## 6. Tính năng Chính

### 6.1 Admin
- Quản lý tài khoản người dùng
- Quản lý cấu trúc trường học
- Quản lý học vụ
- Quản lý thời khóa biểu

### 6.2 Teacher
- Xem thời khóa biểu
- Quản lý điểm số
- Xem danh sách học sinh
- Đánh giá hạnh kiểm
- Xuất báo cáo

### 6.3 Student
- Xem thời khóa biểu
- Xem thông tin lớp
- Xem kết quả học tập

### 6.4 Parent
- Xem thời khóa biểu con
- Thanh toán học phí
- Đăng ký bán trú
- Xem kết quả học tập con

### 6.5 Staff
- Quản lý học phí
- Quản lý suất ăn bán trú
- Xuất báo cáo tài chính

## 7. Công nghệ Sử dụng

### 7.1 Backend
- **Node.js** + **Express.js**
- **MySQL2** (database)
- **JWT** (authentication)
- **CORS, Helmet, Morgan** (middleware)

### 7.2 Frontend
- **React 18** + **Vite**
- **Axios** (HTTP client)
- **React Router DOM** (routing)
- **Context API** (state management)

### 7.3 Database
- **MySQL 8.0**
- **InnoDB** engine
- **UTF8MB4** charset

## 8. Cách Chạy Dự án

### 8.1 Backend
```bash
cd backend
npm install
npm run dev
```

### 8.2 Frontend
```bash
cd frontend
npm install
npm run dev
```

### 8.3 Database
```bash
# Chạy script khởi tạo
cd backend
npm run init-db
```

## 9. Ports
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **Database**: localhost:3307

## 10. Bảo mật
- JWT authentication
- Role-based access control (RBAC)
- Password hashing (SHA256)
- CORS protection
- Helmet security headers
