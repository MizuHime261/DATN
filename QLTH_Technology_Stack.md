# CÔNG NGHỆ VÀ THƯ VIỆN DỰ ÁN QLTH
## Hệ thống quản lý trường học Phenikaa

---

## 🖥️ BACKEND (Node.js)

### **Công nghệ chính:**
- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **MySQL 8** - Database
- **JWT** - Authentication

### **Thư viện Backend:**

#### **Dependencies (Production):**
```json
{
  "cors": "^2.8.5",           // Cross-Origin Resource Sharing
  "dotenv": "^16.4.5",        // Environment variables
  "express": "^4.19.2",       // Web framework
  "helmet": "^7.1.0",         // Security headers
  "jsonwebtoken": "^9.0.2",   // JWT authentication
  "mysql2": "^3.11.3",        // MySQL database driver
  "morgan": "^1.10.0"         // HTTP request logger
}
```

#### **DevDependencies:**
```json
{
  "nodemon": "^3.1.7"         // Auto-restart development server
}
```

### **Cấu trúc Backend:**
```
backend/
├── src/
│   ├── app.js              // Main Express app
│   ├── db/
│   │   └── pool.js         // MySQL connection pool
│   ├── middleware/
│   │   └── auth.js         // JWT & RBAC middleware
│   ├── routes/
│   │   ├── auth.js         // Authentication routes
│   │   ├── admin.js        // Admin routes
│   │   ├── teacher.js      // Teacher routes
│   │   ├── staff.js        // Staff routes
│   │   ├── parent.js       // Parent routes
│   │   └── student.js      // Student routes
│   └── scripts/
│       └── initDb.js       // Database initialization
├── package.json
└── .env                    // Environment variables
```

---

## 🌐 FRONTEND (React)

### **Công nghệ chính:**
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **JavaScript ES6+** - Programming language

### **Thư viện Frontend:**

#### **Dependencies (Production):**
```json
{
  "axios": "^1.7.7",              // HTTP client for API calls
  "react": "^18.3.1",             // React core library
  "react-dom": "^18.3.1",         // React DOM rendering
  "react-router-dom": "^6.27.0"   // Client-side routing
}
```

#### **DevDependencies:**
```json
{
  "@vitejs/plugin-react": "^4.3.1",  // Vite React plugin
  "vite": "^5.4.8"                   // Build tool & dev server
}
```

### **Cấu trúc Frontend:**
```
frontend/
├── src/
│   ├── main.jsx              // Entry point
│   ├── App.jsx               // Main app component
│   ├── styles.css            // Global styles
│   ├── pages/                // Page components
│   │   ├── Login.jsx
│   │   ├── AdminUsers.jsx
│   │   ├── AdminStructure.jsx
│   │   ├── AdminAcademic.jsx
│   │   ├── AdminTimetable.jsx
│   │   ├── TeacherTimetable.jsx
│   │   ├── TeacherGrades.jsx
│   │   ├── TeacherConduct.jsx
│   │   ├── TeacherStudents.jsx
│   │   ├── TeacherReport.jsx
│   │   ├── StaffInvoices.jsx
│   │   ├── StaffMeals.jsx
│   │   ├── ParentTimetable.jsx
│   │   ├── ParentBoarding.jsx
│   │   ├── ParentInvoices.jsx
│   │   ├── ParentClassInfo.jsx
│   │   ├── ParentResults.jsx
│   │   ├── StudentTimetable.jsx
│   │   ├── StudentClassInfo.jsx
│   │   └── StudentResults.jsx
│   └── state/
│       ├── AuthContext.jsx   // Authentication context
│       └── Protected.jsx     // Route protection
├── index.html
├── package.json
└── vite.config.js           // Vite configuration
```

---

## 🗄️ DATABASE

### **MySQL 8:**
- **Engine**: InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Connection**: Connection pooling với mysql2
- **Port**: 3307

### **Bảng chính:**
- `users` - Người dùng (Admin, Teacher, Staff, Parent, Student)
- `schools` - Trường học
- `education_levels` - Cấp học (Tiểu học, THCS, THPT)
- `grades` - Khối lớp
- `classes` - Lớp học
- `subjects` - Môn học
- `school_years` - Năm học
- `terms` - Học kỳ
- `timetable_entries` - Thời khóa biểu
- `enrollments` - Ghi danh học sinh
- `teacher_subjects` - Phân công giáo viên-môn
- `meal_plans` - Thực đơn bán trú
- `invoices` - Hóa đơn
- `payments` - Thanh toán

---

## 🔧 DEVELOPMENT TOOLS

### **Backend:**
- **Nodemon** - Auto-restart server khi code thay đổi
- **Morgan** - HTTP request logging
- **Helmet** - Security headers
- **dotenv** - Environment variables management

### **Frontend:**
- **Vite** - Fast build tool với HMR (Hot Module Replacement)
- **@vitejs/plugin-react** - React support cho Vite
- **Browser DevTools** - Development debugging

---

## 🌐 NETWORK & API

### **API Architecture:**
- **RESTful API** design
- **JWT Authentication** với Bearer token
- **Role-based Access Control (RBAC)**
- **CORS** enabled cho cross-origin requests

### **API Endpoints:**
```
/api/auth/*          - Authentication
/api/admin/*         - Admin functions
/api/teacher/*       - Teacher functions
/api/staff/*         - Staff functions
/api/parent/*        - Parent functions
/api/student/*       - Student functions
```

### **HTTP Methods:**
- **GET** - Lấy dữ liệu
- **POST** - Tạo mới
- **PUT** - Cập nhật
- **DELETE** - Xóa

---

## 🎨 UI/UX

### **Styling:**
- **Vanilla CSS** - No CSS framework
- **Custom theme**: Xanh dương đậm (#1e40af) và trắng
- **Responsive design** - Mobile-friendly
- **Gradient backgrounds** - Modern look
- **Card-based layout** - Clean interface

### **State Management:**
- **React Context API** - Global state (authentication)
- **Local state** - Component-level state với useState
- **Props drilling** - Data passing between components

---

## 📦 PACKAGE MANAGERS

### **Backend:**
- **npm** - Node Package Manager
- **Node.js** version: 18+
- **ES Modules** - Modern JavaScript modules

### **Frontend:**
- **npm** - Node Package Manager
- **Vite** - Modern build tool (thay thế Create React App)
- **ES Modules** - Modern JavaScript modules

---

## 🚀 DEPLOYMENT

### **Development:**
```bash
# Backend
cd backend
npm install
npm run dev          # Port 5000

# Frontend  
cd frontend
npm install
npm run dev          # Port 5173
```

### **Production:**
```bash
# Backend
npm start

# Frontend
npm run build        # Build static files
npm run preview      # Preview production build
```

### **Database:**
```bash
# Initialize database
cd backend
npm run init-db
```

---

## 🔐 SECURITY

### **Authentication:**
- **JWT (JSON Web Tokens)** - Stateless authentication
- **SHA256** - Password hashing
- **Role-based permissions** - 5 user roles (Admin, Teacher, Staff, Parent, Student)

### **Security Headers:**
- **Helmet.js** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Environment variables** - Sensitive data protection
- **Input validation** - Server-side validation

---

## 📊 MONITORING & LOGGING

### **Backend:**
- **Morgan** - HTTP request logging
- **Console logging** - Error tracking
- **MySQL connection pooling** - Database performance
- **Error handling** - Try-catch blocks

### **Frontend:**
- **Browser DevTools** - Development debugging
- **Vite HMR** - Hot reload for development
- **Console logging** - API call tracking

---

## 🔄 DATA FLOW

### **Authentication Flow:**
1. User login → POST /api/auth/login
2. Server validates credentials
3. Returns JWT token
4. Frontend stores token in localStorage
5. Subsequent requests include Bearer token

### **API Request Flow:**
1. Frontend makes API call with Axios
2. Request goes through Vite proxy
3. Backend receives request
4. JWT middleware validates token
5. RBAC middleware checks permissions
6. Route handler processes request
7. Response sent back to frontend

---

## 📱 RESPONSIVE DESIGN

### **Breakpoints:**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Features:**
- **Flexible grid system** - CSS Grid & Flexbox
- **Mobile-first approach** - Progressive enhancement
- **Touch-friendly** - Large buttons and inputs

---

## 🧪 TESTING

### **Current Status:**
- **Manual testing** - Manual API testing với PowerShell
- **Browser testing** - Frontend testing trong browser
- **No automated tests** - Có thể thêm Jest, React Testing Library

### **Testing Tools:**
- **PowerShell Invoke-RestMethod** - API testing
- **Browser DevTools** - Frontend debugging
- **Postman** - API testing (optional)

---

## 📈 PERFORMANCE

### **Backend:**
- **Connection pooling** - MySQL connection reuse
- **JWT stateless** - No server-side session storage
- **Middleware optimization** - Efficient request processing

### **Frontend:**
- **Vite HMR** - Fast development builds
- **Code splitting** - Lazy loading components
- **Optimized bundles** - Tree shaking

---

## 🔧 CONFIGURATION

### **Environment Variables:**
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=qlth
DB_PORT=3307

# JWT
JWT_SECRET=your_secret_key_here

# Google OAuth (Future)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email (Future)
EMAIL_USER=...
EMAIL_PASS=...

# Cloudinary (Future)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### **Vite Configuration:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

---

## 🚀 FUTURE ENHANCEMENTS

### **Potential Additions:**
- **TypeScript** - Type safety
- **Redux Toolkit** - Advanced state management
- **Material-UI** - Component library
- **Jest** - Unit testing
- **Cypress** - E2E testing
- **Docker** - Containerization
- **Redis** - Caching
- **WebSocket** - Real-time updates

---

## 📋 SUMMARY

**Stack**: **MERN** (MySQL + Express + React + Node.js)
**Build Tool**: Vite (thay vì Create React App)
**Database**: MySQL 8 với connection pooling
**Authentication**: JWT với RBAC
**Styling**: Vanilla CSS với custom theme
**State Management**: React Context API
**Package Manager**: npm
**Development**: Hot reload với Vite HMR

**Tổng kết**: Dự án sử dụng stack hiện đại, bảo mật cao, dễ mở rộng và phù hợp cho hệ thống quản lý trường học quy mô vừa và lớn.

---

**Ngày tạo**: $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Phiên bản**: 1.0
**Trạng thái**: Production Ready



