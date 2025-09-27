# Hệ thống Quản lý Trường học (QLTH)

## Mô tả
Hệ thống quản lý trường học toàn diện với các chức năng quản lý học sinh, giáo viên, phụ huynh, thời khóa biểu và các hoạt động học tập.

## Công nghệ sử dụng

### Backend
- **Node.js** với Express.js
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** password hashing

### Frontend  
- **React** với Vite
- **Axios** cho API calls
- **CSS** cho styling

## Cấu trúc dự án

```
QLTH/
├── backend/           # Server Node.js
│   ├── src/
│   │   ├── app.js    # Main server file
│   │   ├── db/       # Database configuration
│   │   ├── middleware/ # Authentication middleware
│   │   ├── routes/   # API routes
│   │   └── scripts/  # Database initialization
│   └── package.json
├── frontend/          # React client
│   ├── src/
│   │   ├── pages/    # React components
│   │   ├── state/    # State management
│   │   └── styles.css
│   └── package.json
├── docs/             # Documentation
└── *.sql            # Database scripts
```

## Tính năng chính

### Quản trị viên
- Quản lý người dùng (học sinh, giáo viên, phụ huynh)
- Quản lý cấu trúc trường học (khối, lớp, môn học)
- Quản lý thời khóa biểu
- Quản lý học kỳ và năm học

### Giáo viên
- Xem danh sách học sinh
- Nhập điểm và đánh giá hạnh kiểm
- Xem thời khóa biểu
- Tạo báo cáo học tập

### Học sinh
- Xem thông tin lớp học
- Xem điểm số và kết quả học tập
- Xem thời khóa biểu

### Phụ huynh
- Xem thông tin con em
- Xem điểm số và kết quả học tập
- Xem thời khóa biểu
- Quản lý thông tin nội trú và ăn uống

## Cài đặt và chạy

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
1. Tạo database PostgreSQL
2. Chạy script `qlth.sql` để tạo tables
3. Chạy script `timetable_sample_data.sql` để thêm dữ liệu mẫu

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

### Admin
- `GET /api/admin/users` - Lấy danh sách người dùng
- `POST /api/admin/users` - Tạo người dùng mới
- `GET /api/admin/classes` - Lấy danh sách lớp
- `GET /api/admin/timetable-entries` - Lấy thời khóa biểu

### Teacher
- `GET /api/teacher/students` - Lấy danh sách học sinh
- `POST /api/teacher/grades` - Nhập điểm

### Student/Parent
- `GET /api/student/results` - Xem kết quả học tập
- `GET /api/student/timetable` - Xem thời khóa biểu

## Database Schema

### Tables chính
- `users` - Thông tin người dùng
- `classes` - Lớp học
- `subjects` - Môn học
- `grades` - Khối học
- `levels` - Cấp học (Tiểu học, THCS, THPT)
- `timetable_entries` - Thời khóa biểu
- `terms` - Học kỳ
- `school_years` - Năm học

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Liên hệ

Project Link: [https://github.com/MizuHime261/DATN](https://github.com/MizuHime261/DATN)
