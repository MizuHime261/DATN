import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Login from './Login.jsx'
import TeacherTimetable from './TeacherTimetable.jsx'
import StudentTimetable from './StudentTimetable.jsx'
import StudentClassInfo from './StudentClassInfo.jsx'
import StudentResults from './StudentResults.jsx'
import ParentTimetable from './ParentTimetable.jsx'
import StaffInvoices from './StaffInvoices.jsx'
import AdminUsers from './AdminUsers.jsx'
import TeacherGrades from './TeacherGrades.jsx'
import TeacherConduct from './TeacherConduct.jsx'
import ParentInvoices from './ParentInvoices.jsx'
import ParentClassInfo from './ParentClassInfo.jsx'
import ParentResults from './ParentResults.jsx'
import AdminStructure from './AdminStructure.jsx'
import AdminAcademic from './AdminAcademic.jsx'
import AdminTeacherLevels from './AdminTeacherLevels.jsx'
import AdminStudentParents from './AdminStudentParents.jsx'
import AdminTimetable from './AdminTimetable.jsx'
import ParentBoarding from './ParentBoarding.jsx'
import StaffMeals from './StaffMeals.jsx'
import TeacherStudents from './TeacherStudents.jsx'
import TeacherReport from './TeacherReport.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ResetPassword from './ResetPassword.jsx'
import { AuthProvider, useAuth } from '../state/AuthContext.jsx'
import { RequireAuth, RequireRoles } from '../state/Protected.jsx'
import { Navigate } from 'react-router-dom'

function HomeRedirect() {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/users" replace />
    case 'TEACHER':
      return <Navigate to="/teacher/timetable" replace />
    case 'STUDENT':
      return <Navigate to="/student/timetable" replace />
    case 'PARENT':
      return <Navigate to="/parent/timetable" replace />
    case 'STAFF':
      return <Navigate to="/staff/invoices" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

function Shell(){
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(()=>{
    if (!user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [user])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }
  
  // If not logged in, show login page without sidebar
  if (!user) {
    return (
      <div className="login-container">
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/reset-password" element={<ResetPassword/>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    )
  }
  
  // If logged in, show full app with sidebar
  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {isMobileMenuOpen && <div className="mobile-overlay active" onClick={closeMobileMenu}></div>}
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand">QLTH</div>
        <div className="mt16">{user.username} ({user.role})</div>
        <nav className="nav">
          {/* Teacher */}
          {user.role==='TEACHER' && (
            <>
              <NavLink to="/teacher/timetable" onClick={closeMobileMenu}>Thời khóa biểu</NavLink>
              <NavLink to="/teacher/students" onClick={closeMobileMenu}>Học sinh</NavLink>
              <NavLink to="/teacher/grades" onClick={closeMobileMenu}>Nhập điểm</NavLink>
              <NavLink to="/teacher/conduct" onClick={closeMobileMenu}>Hạnh kiểm</NavLink>
              <NavLink to="/teacher/report" onClick={closeMobileMenu}>Báo cáo điểm</NavLink>
            </>
          )}

          {/* Student */}
          {user.role==='STUDENT' && (
            <>
              <NavLink to="/student/timetable" onClick={closeMobileMenu}>Thời khóa biểu</NavLink>
              <NavLink to="/student/class" onClick={closeMobileMenu}>Thông tin lớp</NavLink>
              <NavLink to="/student/results" onClick={closeMobileMenu}>Kết quả học tập</NavLink>
            </>
          )}

          {/* Parent */}
          {user.role==='PARENT' && (
            <>
              <NavLink to="/parent/class" onClick={closeMobileMenu}>Thông tin lớp</NavLink>
              <NavLink to="/parent/timetable" onClick={closeMobileMenu}>Thời khóa biểu</NavLink> 
              <NavLink to="/parent/results" onClick={closeMobileMenu}>Kết quả học tập</NavLink>
              <NavLink to="/parent/boarding" onClick={closeMobileMenu}>Đăng ký bán trú</NavLink>
              <NavLink to="/parent/invoices" onClick={closeMobileMenu}>Thanh toán học phí</NavLink>
            </>
          )}

          {/* Staff */}
          {user.role==='STAFF' && (
            <>
              <NavLink to="/staff/invoices" onClick={closeMobileMenu}>Quản lý khoản thu</NavLink>
              <NavLink to="/staff/meals" onClick={closeMobileMenu}>Bán trú</NavLink>
            </>
          )}

          {/* Admin */}
          {user.role==='ADMIN' && (
            <>
              <NavLink to="/admin/users" onClick={closeMobileMenu}>Quản lý người dùng</NavLink>
              <NavLink to="/admin/student-parents" onClick={closeMobileMenu}>Liên kết phụ huynh</NavLink>
              <NavLink to="/admin/teacher-levels" onClick={closeMobileMenu}>Quản lý giáo viên theo cấp</NavLink>
              <NavLink to="/admin/structure" onClick={closeMobileMenu}>Quản lý cơ cấu</NavLink>
              <NavLink to="/admin/academic" onClick={closeMobileMenu}>Quản lý học vụ</NavLink>
              <NavLink to="/admin/timetable" onClick={closeMobileMenu}>Thời khóa biểu</NavLink>
            </>
          )}
          <button className="btn mt16" onClick={logout}>Đăng xuất</button>
        </nav>
      </aside>
      <main className="content">
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          ☰ Menu
        </button>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/teacher/timetable" element={<RequireRoles roles={["TEACHER","ADMIN"]}><TeacherTimetable/></RequireRoles>} />
          <Route path="/teacher/students" element={<RequireRoles roles={["TEACHER","ADMIN"]}><TeacherStudents/></RequireRoles>} />
          <Route path="/teacher/grades" element={<RequireRoles roles={["TEACHER","ADMIN"]}><TeacherGrades/></RequireRoles>} />
          <Route path="/teacher/conduct" element={<RequireRoles roles={["TEACHER","ADMIN"]}><TeacherConduct/></RequireRoles>} />
          <Route path="/teacher/report" element={<RequireRoles roles={["TEACHER","ADMIN"]}><TeacherReport/></RequireRoles>} />
          <Route path="/student/timetable" element={<RequireRoles roles={["STUDENT","ADMIN"]}><StudentTimetable/></RequireRoles>} />
          <Route path="/student/class" element={<RequireRoles roles={["STUDENT","ADMIN"]}><StudentClassInfo/></RequireRoles>} />
          <Route path="/student/results" element={<RequireRoles roles={["STUDENT","ADMIN"]}><StudentResults/></RequireRoles>} />
          <Route path="/parent/timetable" element={<RequireRoles roles={["PARENT","ADMIN"]}><ParentTimetable/></RequireRoles>} />
          <Route path="/parent/invoices" element={<RequireRoles roles={["PARENT","ADMIN"]}><ParentInvoices/></RequireRoles>} />
          <Route path="/parent/boarding" element={<RequireRoles roles={["PARENT","ADMIN"]}><ParentBoarding/></RequireRoles>} />
          <Route path="/parent/class" element={<RequireRoles roles={["PARENT","ADMIN"]}><ParentClassInfo/></RequireRoles>} />
          <Route path="/parent/results" element={<RequireRoles roles={["PARENT","ADMIN"]}><ParentResults/></RequireRoles>} />
          <Route path="/staff/invoices" element={<RequireRoles roles={["STAFF","ADMIN"]}><StaffInvoices/></RequireRoles>} />
          <Route path="/staff/meals" element={<RequireRoles roles={["STAFF","ADMIN"]}><StaffMeals/></RequireRoles>} />
          <Route path="/admin/users" element={<RequireRoles roles={["ADMIN"]}><AdminUsers/></RequireRoles>} />
          <Route path="/admin/student-parents" element={<RequireRoles roles={["ADMIN"]}><AdminStudentParents/></RequireRoles>} />
          <Route path="/admin/structure" element={<RequireRoles roles={["ADMIN"]}><AdminStructure/></RequireRoles>} />
          <Route path="/admin/academic" element={<RequireRoles roles={["ADMIN"]}><AdminAcademic/></RequireRoles>} />
          <Route path="/admin/teacher-levels" element={<RequireRoles roles={["ADMIN"]}><AdminTeacherLevels/></RequireRoles>} />
          <Route path="/admin/timetable" element={<RequireRoles roles={["ADMIN"]}><AdminTimetable/></RequireRoles>} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<div className="card">Chọn chức năng bên trái</div>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App(){
  return (
    <AuthProvider>
      <Shell/>
    </AuthProvider>
  )
}


