# MÔ HÌNH KIẾN TRÚC DỰ ÁN QLTH
## Hệ thống quản lý trường học Phenikaa

---

## 🏗️ TỔNG QUAN KIẾN TRÚC

Dự án QLTH sử dụng **mô hình kiến trúc 3 tầng (3-Tier Architecture)** với các đặc điểm hiện đại và bảo mật cao.

---

## 📊 MÔ HÌNH KIẾN TRÚC 3 TẦNG

### **1. Presentation Tier (Tầng Giao diện)**
- **Công nghệ**: React 18 + Vite
- **Chức năng**: 
  - Hiển thị giao diện người dùng
  - Xử lý tương tác người dùng
  - Quản lý state ứng dụng
- **Đặc điểm**:
  - Single Page Application (SPA)
  - Component-based architecture
  - Responsive design
  - Real-time updates

### **2. Business Logic Tier (Tầng Logic nghiệp vụ)**
- **Công nghệ**: Node.js + Express.js
- **Chức năng**:
  - Xử lý logic nghiệp vụ
  - Authentication & Authorization
  - API endpoints
  - Data validation
- **Đặc điểm**:
  - RESTful API design
  - JWT authentication
  - Role-based access control
  - Middleware architecture

### **3. Data Tier (Tầng Dữ liệu)**
- **Công nghệ**: MySQL 8
- **Chức năng**:
  - Lưu trữ dữ liệu
  - Quản lý transactions
  - Data integrity
- **Đặc điểm**:
  - Relational database
  - ACID properties
  - Connection pooling
  - Foreign key constraints

---

## 🔄 LUỒNG DỮ LIỆU (Data Flow)

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐    SQL Queries    ┌─────────────────┐
│   Frontend      │ ←──────────────→ │   Backend       │ ←──────────────→ │   Database      │
│   (React)       │                  │   (Express)     │                  │   (MySQL)       │
│                 │                  │                 │                  │                 │
│ • UI Components │                  │ • API Routes    │                  │ • Tables        │
│ • State Mgmt    │                  │ • Business Logic│                  │ • Relationships │
│ • User Input    │                  │ • Authentication│                  │ • Constraints   │
│ • Data Display  │                  │ • Authorization │                  │ • Indexes       │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

---

## 🎯 MÔ HÌNH PHÂN QUYỀN (RBAC)

### **Role-Based Access Control:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Admin    │    │   Teacher   │    │    Staff    │    │   Parent    │    │   Student   │
│             │    │             │    │             │    │             │    │             │
│ • Full      │    │ • Teaching  │    │ • Finance   │    │ • Child     │    │ • Personal  │
│   Access    │    │   Functions │    │   Management│    │   Info      │    │   Info      │
│ • User Mgmt │    │ • Grades    │    │ • Invoices  │    │ • Timetable │    │ • Timetable │
│ • System    │    │ • Students  │    │ • Reports   │    │ • Results   │    │ • Results   │
│   Config    │    │ • Conduct   │    │ • Meals     │    │ • Payments  │    │ • Class     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### **Permission Matrix:**
| Feature | Admin | Teacher | Staff | Parent | Student |
|---------|-------|---------|-------|--------|---------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| School Structure | ✅ | ❌ | ❌ | ❌ | ❌ |
| Academic Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Timetable Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Personal Timetable | ✅ | ✅ | ❌ | ✅ | ✅ |
| Grade Management | ❌ | ✅ | ❌ | ❌ | ❌ |
| Student List | ❌ | ✅ | ❌ | ❌ | ❌ |
| Conduct Assessment | ❌ | ✅ | ❌ | ❌ | ❌ |
| Invoice Management | ❌ | ❌ | ✅ | ❌ | ❌ |
| Meal Management | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Child Info | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Personal Results | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 🌐 MÔ HÌNH API

### **RESTful API Design:**
```
┌─────────────────────────────────────────────────────────────┐
│                    API Architecture                         │
├─────────────────────────────────────────────────────────────┤
│  /api/auth/*          - Authentication & Login             │
│  /api/admin/*         - Admin Management Functions         │
│  /api/teacher/*       - Teacher Teaching Functions         │
│  /api/staff/*         - Staff Financial Functions          │
│  /api/parent/*        - Parent Child Management            │
│  /api/student/*       - Student Personal Functions         │
└─────────────────────────────────────────────────────────────┘
```

### **HTTP Methods Mapping:**
| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve data | `GET /api/teacher/students` |
| POST | Create new resource | `POST /api/admin/users` |
| PUT | Update existing resource | `PUT /api/teacher/grades/:id` |
| DELETE | Remove resource | `DELETE /api/admin/classes/:id` |

---

## 🔐 MÔ HÌNH BẢO MẬT

### **Security Layers:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Security Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend Security:                                         │
│  • Input Validation                                         │
│  • XSS Prevention                                           │
│  • Token Storage (localStorage)                            │
│  • HTTPS Enforcement                                       │
├─────────────────────────────────────────────────────────────┤
│  Backend Security:                                          │
│  • JWT Authentication                                       │
│  • Role-based Authorization                                 │
│  • CORS Configuration                                       │
│  • Helmet Security Headers                                  │
│  • Input Sanitization                                       │
├─────────────────────────────────────────────────────────────┤
│  Database Security:                                         │
│  • Connection Encryption                                    │
│  • SQL Injection Prevention                                 │
│  • Access Control                                           │
│  • Data Encryption at Rest                                  │
└─────────────────────────────────────────────────────────────┘
```

### **Authentication Flow:**
```
1. User Login Request
   ↓
2. Credentials Validation
   ↓
3. JWT Token Generation
   ↓
4. Token Storage (localStorage)
   ↓
5. Subsequent Requests with Bearer Token
   ↓
6. Token Validation on Each Request
   ↓
7. Role-based Access Control
```

---

## 📊 MÔ HÌNH DỮ LIỆU

### **Database Schema:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Database Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  Core Tables:                                               │
│  • users (Admin, Teacher, Staff, Parent, Student)          │
│  • schools (School Information)                            │
│  • education_levels (Primary, Middle, High)                │
│  • grades (Grade Levels)                                   │
│  • classes (Class Information)                             │
│  • subjects (Subject Catalog)                              │
│  • school_years (Academic Years)                           │
│  • terms (Semesters)                                       │
├─────────────────────────────────────────────────────────────┤
│  Relationship Tables:                                       │
│  • timetable_entries (Class Schedules)                     │
│  • enrollments (Student-Class Relationships)               │
│  • teacher_subjects (Teacher-Subject Assignments)          │
│  • meal_plans (Boarding Meal Plans)                        │
│  • invoices (Financial Records)                            │
│  • payments (Payment Records)                              │
└─────────────────────────────────────────────────────────────┘
```

### **Entity Relationships:**
```
School (1) ──→ (N) Education Levels
Education Level (1) ──→ (N) Grades
Grade (1) ──→ (N) Classes
Class (1) ──→ (N) Enrollments
User (1) ──→ (N) Enrollments
Teacher (N) ──→ (N) Subjects (Many-to-Many)
Class (1) ──→ (N) Timetable Entries
```

---

## 🚀 MÔ HÌNH DEPLOYMENT

### **Development Environment:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Port: 5173    │    │   Port: 5000    │    │   Port: 3307    │
│   (Vite Dev)    │    │   (Express)     │    │   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Production Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   App Servers   │    │   Database      │
│   (Nginx)       │    │   (Node.js)     │    │   (MySQL)       │
│                 │    │   (Express)     │    │   (Master-Slave)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔄 MÔ HÌNH XỬ LÝ REQUEST

### **Request Processing Flow:**
```
1. User Action (Click, Form Submit)
   ↓
2. Frontend State Update
   ↓
3. API Call (Axios)
   ↓
4. Vite Proxy (Development)
   ↓
5. Express Server
   ↓
6. CORS Middleware
   ↓
7. Authentication Middleware (JWT)
   ↓
8. Authorization Middleware (RBAC)
   ↓
9. Route Handler
   ↓
10. Business Logic Processing
    ↓
11. Database Query (MySQL)
    ↓
12. Response Generation
    ↓
13. Frontend State Update
    ↓
14. UI Re-render
```

---

## 📱 MÔ HÌNH RESPONSIVE

### **Responsive Design Strategy:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile        │    │   Tablet        │    │   Desktop       │
│   < 768px       │    │   768-1024px    │    │   > 1024px      │
│                 │    │                 │    │                 │
│ • Single Column │    │ • Two Columns   │    │ • Multi Column  │
│ • Touch UI      │    │ • Hybrid UI     │    │ • Full UI       │
│ • Stack Layout  │    │ • Grid Layout   │    │ • Complex Layout│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🧪 MÔ HÌNH TESTING

### **Testing Pyramid:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Strategy                         │
├─────────────────────────────────────────────────────────────┤
│  E2E Tests (Cypress) - Few, High Value                     │
│  Integration Tests (Jest) - Some, Medium Value             │
│  Unit Tests (Jest + RTL) - Many, Low Value                 │
└─────────────────────────────────────────────────────────────┘
```

### **Current Testing Model:**
- **Manual Testing**: PowerShell API calls
- **Browser Testing**: Frontend functionality
- **Integration Testing**: End-to-end workflows

---

## 📈 MÔ HÌNH PERFORMANCE

### **Performance Optimization:**
```
┌─────────────────────────────────────────────────────────────┐
│                Performance Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend:                                                  │
│  • Vite HMR (Hot Module Replacement)                       │
│  • Code Splitting (Lazy Loading)                           │
│  • Tree Shaking (Dead Code Elimination)                    │
│  • Bundle Optimization                                     │
├─────────────────────────────────────────────────────────────┤
│  Backend:                                                   │
│  • Connection Pooling (MySQL)                              │
│  • Middleware Optimization                                 │
│  • JWT Stateless Authentication                            │
│  • Caching Strategy (Future: Redis)                        │
├─────────────────────────────────────────────────────────────┤
│  Database:                                                  │
│  • Index Optimization                                      │
│  • Query Optimization                                      │
│  • Connection Pooling                                      │
│  • Read Replicas (Future)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 MÔ HÌNH CONFIGURATION

### **Environment-Based Configuration:**
```
┌─────────────────────────────────────────────────────────────┐
│                Configuration Management                     │
├─────────────────────────────────────────────────────────────┤
│  Development:                                               │
│  • Local Database (localhost:3307)                         │
│  • Hot Reload Enabled                                      │
│  • Debug Logging                                           │
│  • CORS Enabled                                            │
├─────────────────────────────────────────────────────────────┤
│  Production:                                                │
│  • Production Database                                     │
│  • Optimized Builds                                        │
│  • Error Logging                                           │
│  • Security Headers                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 MÔ HÌNH SCALABILITY

### **Horizontal Scaling Strategy:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   App Server 1  │    │   App Server 2  │
│   (Nginx)       │    │   (Node.js)     │    │   (Node.js)     │
│                 │    │   (Stateless)   │    │   (Stateless)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (MySQL)       │
                    │   (Master-Slave)│
                    └─────────────────┘
```

---

## 📋 TỔNG KẾT MÔ HÌNH

### **Kiến trúc chính:**
- **3-Tier Architecture** (Presentation, Business Logic, Data)
- **RESTful API** design
- **JWT Authentication** với RBAC
- **Responsive Design** (Mobile-first)
- **Stateless Backend** (Scalable)

### **Đặc điểm nổi bật:**
- **Modular Design**: Dễ maintain và extend
- **Security-First**: Multi-layer security
- **Performance-Optimized**: Fast loading và response
- **User-Centric**: Role-based UI/UX
- **Future-Ready**: Dễ dàng scale và upgrade

### **Công nghệ stack:**
- **Frontend**: React 18 + Vite + CSS
- **Backend**: Node.js + Express + JWT
- **Database**: MySQL 8 + Connection Pooling
- **Deployment**: Docker-ready (Future)

---

**Ngày tạo**: $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Phiên bản**: 1.0
**Trạng thái**: Production Ready Architecture



