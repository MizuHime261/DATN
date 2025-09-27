# THÔNG BÁO LỖI ĐĂNG NHẬP

## 📋 **Tổng quan**
Tài liệu này mô tả các thông báo lỗi trong hệ thống đăng nhập của ứng dụng QLTH (Quản lý trường học).

## 🔐 **Các thông báo lỗi đăng nhập**

### **1. Lỗi email không hợp lệ**
- **Điều kiện:** Email không có đuôi `@gmail.com`
- **Thông báo:** "Tài khoản gmail không hợp lệ"
- **Mã lỗi:** 400 (Bad Request)
- **Vị trí hiển thị:** Frontend và Backend

### **2. Lỗi thông tin đăng nhập sai**
- **Điều kiện:** 
  - Email đúng format nhưng không tồn tại trong hệ thống
  - Mật khẩu không đúng
  - Email và mật khẩu không khớp
- **Thông báo:** "Tài khoản hoặc mật khẩu sai"
- **Mã lỗi:** 401 (Unauthorized)
- **Vị trí hiển thị:** Frontend và Backend

### **3. Lỗi hệ thống**
- **Điều kiện:** Lỗi server hoặc database
- **Thông báo:** "Tài khoản hoặc mật khẩu sai"
- **Mã lỗi:** 500 (Internal Server Error)
- **Vị trí hiển thị:** Frontend và Backend
- **Lý do:** Bảo mật thông tin hệ thống

## 🛠️ **Chi tiết kỹ thuật**

### **Frontend (Login.jsx)**
```javascript
// Validation Gmail email
if (!email.endsWith('@gmail.com')) {
  setError('Tài khoản gmail không hợp lệ')
  setLoading(false)
  return
}

// Xử lý lỗi đăng nhập
catch(err){ 
  setError('Tài khoản hoặc mật khẩu sai') 
} finally{ 
  setLoading(false) 
}
```

### **Backend (auth.js)**
```javascript
// Validation Gmail email
if (!email.endsWith('@gmail.com')) {
  return res.status(400).json({ error: 'Tài khoản gmail không hợp lệ' });
}

// Kiểm tra thông tin đăng nhập
if (rows.length === 0) {
  return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu sai' });
}

// Xử lý lỗi server
catch (err) {
  res.status(500).json({ error: 'Tài khoản hoặc mật khẩu sai' });
}
```

## 📝 **Quy tắc validation**

1. **Email bắt buộc phải có đuôi `@gmail.com`**
2. **Thông báo lỗi phải rõ ràng, dễ hiểu cho người dùng**
3. **Không tiết lộ thông tin chi tiết về lỗi hệ thống**
4. **Validation được thực hiện ở cả Frontend và Backend**

## 🔄 **Luồng xử lý lỗi**

```
User nhập thông tin đăng nhập
         ↓
Frontend kiểm tra email có @gmail.com?
         ↓ (Không)
Hiển thị: "Tài khoản gmail không hợp lệ"
         ↓ (Có)
Gửi request đến Backend
         ↓
Backend kiểm tra lại email @gmail.com?
         ↓ (Không)
Trả về: "Tài khoản gmail không hợp lệ"
         ↓ (Có)
Kiểm tra email/password trong database
         ↓ (Không tìm thấy)
Trả về: "Tài khoản hoặc mật khẩu sai"
         ↓ (Tìm thấy)
Tạo JWT token và đăng nhập thành công
```

## 📅 **Ngày cập nhật**
- **Ngày tạo:** $(date)
- **Phiên bản:** 1.0
- **Trạng thái:** Hoàn thành

---
*Tài liệu này được tạo tự động bởi hệ thống quản lý dự án QLTH*
