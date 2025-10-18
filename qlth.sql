-- QLTH - Phenikaa School (single school, no schools table)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS QLTH CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE QLTH;

-- =====================
-- 1) USERS & RBAC
-- =====================
CREATE TABLE IF NOT EXISTS users (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    email               VARCHAR(255) UNIQUE,
    password            VARCHAR(255) NOT NULL,
    username            VARCHAR(255),
    reset_token         VARCHAR(255),
    reset_token_expiry  BIGINT,
    role                ENUM('ADMIN','TEACHER','STAFF','PARENT','STUDENT') NOT NULL DEFAULT 'STUDENT',
    google_id           VARCHAR(255),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    gender              ENUM('Nam','Nữ') NULL,
    birthdate           DATE NULL,
    phone               VARCHAR(45)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS parent_student (
    parent_id    INT NOT NULL,
    student_id   INT NOT NULL,
    relationship VARCHAR(50),
    PRIMARY KEY (parent_id, student_id),
    CONSTRAINT fk_ps_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- 2) EDUCATION LEVELS
-- =====================
CREATE TABLE IF NOT EXISTS education_levels (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(32) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    sort_order  SMALLINT NOT NULL
) ENGINE=InnoDB;

-- Grades
CREATE TABLE IF NOT EXISTS grades (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    level_id        INT NOT NULL,
    grade_number    SMALLINT NOT NULL,
    UNIQUE KEY uq_grade (level_id, grade_number),
    CONSTRAINT fk_grades_level FOREIGN KEY (level_id) REFERENCES education_levels(id)
) ENGINE=InnoDB;

-- Teacher - Level
CREATE TABLE IF NOT EXISTS teacher_level (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id  INT NOT NULL,
    level_id    INT NOT NULL,
    position    VARCHAR(100),
    start_date  DATE,
    end_date    DATE,
    UNIQUE KEY uq_teacher_level (teacher_id, level_id),
    CONSTRAINT fk_tl_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tl_level   FOREIGN KEY (level_id)   REFERENCES education_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    grade_id            INT NOT NULL,
    name                VARCHAR(64) NOT NULL,
    homeroom_teacher_id INT NULL,
    room_name           VARCHAR(255) NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_room_one_class (room_name),
    CONSTRAINT fk_classes_grade   FOREIGN KEY (grade_id)  REFERENCES grades(id)  ON DELETE CASCADE,
    CONSTRAINT fk_classes_teacher FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Enrollments
CREATE TABLE IF NOT EXISTS class_enrollments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_user_id INT NOT NULL,
    class_id        INT NOT NULL,
    term_id         INT NULL,
    enrolled_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_active_enrollment (student_user_id, active),
    UNIQUE KEY uq_enrollment_once (student_user_id, class_id, term_id),
    CONSTRAINT fk_enr_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_enr_class   FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================
-- 3) ACADEMIC MANAGEMENT
-- ============================
CREATE TABLE IF NOT EXISTS subjects (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    level_id        INT NOT NULL,
    code            VARCHAR(64) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_subject (level_id, code),
    CONSTRAINT fk_subjects_level FOREIGN KEY (level_id) REFERENCES education_levels(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS school_years (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    level_id        INT NOT NULL,
    name            VARCHAR(32) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    UNIQUE KEY uq_school_year (level_id, name),
    CONSTRAINT fk_school_years_level FOREIGN KEY (level_id) REFERENCES education_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS terms (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    school_year_id  INT NOT NULL,
    name            VARCHAR(64) NOT NULL,
    term_order      SMALLINT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    UNIQUE KEY uq_term_order (school_year_id, term_order),
    CONSTRAINT fk_terms_school_year FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teacher_subjects (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    teacher_user_id  INT NOT NULL,
    subject_id       INT NOT NULL,
    UNIQUE KEY uq_teacher_subject (teacher_user_id, subject_id),
    CONSTRAINT fk_teacher_subjects_user FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS periods (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    level_id        INT NOT NULL,
    day_of_week     TINYINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    period_index    SMALLINT NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    CONSTRAINT chk_period_time CHECK (start_time < end_time),
    UNIQUE KEY uq_period (level_id, day_of_week, period_index),
    CONSTRAINT fk_periods_level FOREIGN KEY (level_id) REFERENCES education_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS timetable_entries (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    term_id         INT NOT NULL,
    class_id        INT NOT NULL,
    subject_id      INT NOT NULL,
    teacher_user_id INT NOT NULL,
    day_of_week     TINYINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    period_index    SMALLINT NOT NULL,
    UNIQUE KEY uq_tt_class_slot   (term_id, class_id, day_of_week, period_index),
    UNIQUE KEY uq_tt_teacher_slot (term_id, teacher_user_id, day_of_week, period_index),
    CONSTRAINT fk_tt_term    FOREIGN KEY (term_id)    REFERENCES terms(id)     ON DELETE CASCADE,
    CONSTRAINT fk_tt_class   FOREIGN KEY (class_id)   REFERENCES classes(id)   ON DELETE CASCADE,
    CONSTRAINT fk_tt_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)  ON DELETE CASCADE,
    CONSTRAINT fk_tt_teacher FOREIGN KEY (teacher_user_id) REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- 5) MEALS
-- =====================
CREATE TABLE IF NOT EXISTS meal_plans (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    level_id        INT NOT NULL,
    plan_date       DATE NOT NULL,
    meal_type       ENUM('LUNCH') NOT NULL,
    title           VARCHAR(255) NOT NULL,
    price_cents     INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_meal_plan (level_id, plan_date, meal_type),
    CONSTRAINT fk_meal_plans_level FOREIGN KEY (level_id) REFERENCES education_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =================
-- 6) BILLING
-- =================
CREATE TABLE IF NOT EXISTS invoices (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    student_user_id      INT NOT NULL,
    level_id             INT NOT NULL,
    billing_period_start DATE NULL,
    billing_period_end   DATE NULL,
    status               ENUM('DRAFT','ISSUED','PARTIALLY_PAID','PAID','VOID') NOT NULL DEFAULT 'DRAFT',
    total_cents          INT NOT NULL DEFAULT 0,
    currency             VARCHAR(3) NOT NULL DEFAULT 'VND',
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    issued_at            TIMESTAMP NULL,
    INDEX idx_invoice_student (student_user_id, status),
    CONSTRAINT fk_inv_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_level  FOREIGN KEY (level_id)  REFERENCES education_levels(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice_items (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id       INT NOT NULL,
    item_type        ENUM('TUITION','MEAL','FEE','DISCOUNT','OTHER') NOT NULL,
    description      VARCHAR(512) NOT NULL,
    quantity         DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price_cents INT NOT NULL DEFAULT 0,
    total_cents      INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_items_invoice (invoice_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id       INT NOT NULL,
    amount_cents     INT NOT NULL,
    method           ENUM('CASH','CARD','TRANSFER','WALLET') NOT NULL,
    status           ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    paid_at          TIMESTAMP NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_payments_invoice (invoice_id, status)
) ENGINE=InnoDB;

-- ==========================
-- 7) Minimal seed data
-- ==========================
INSERT INTO education_levels (id, code, name, sort_order) VALUES
  (1, 'PRIMARY', 'Tiểu học', 1),
  (2, 'THCS', 'Trung học cơ sở', 2),
  (3, 'THPT', 'Trung học phổ thông', 3)
ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), sort_order = VALUES(sort_order);

INSERT INTO users (email, password, username, role, phone)
VALUES (
    'trangmeo2k3tb@gmail.com',
    SHA2('trang123.', 256),
    'trang',
    'ADMIN',
    '0388264291'
);

INSERT INTO users (email, password, username, role, phone)
VALUES
  -- Staff
  ('linhchi.nguyen.staff@gmail.com',   SHA2('123456',256), 'Nguyễn Linh Chi',   'STAFF',  '0901000001'),
  ('minhquan.tran.staff@gmail.com',    SHA2('123456',256), 'Trần Minh Quân',    'STAFF',  '0901000002'),
  ('thanhha.le.staff@gmail.com',       SHA2('123456',256), 'Lê Thanh Hà',       'STAFF',  '0901000003'),
  ('phuonganh.pham.staff@gmail.com',   SHA2('123456',256), 'Phạm Phương Anh',   'STAFF',  '0901000004'),
  ('anhthu.vo.staff@gmail.com',        SHA2('123456',256), 'Võ Anh Thư',        'STAFF',  '0901000005'),
  ('quynhmai.hoang.staff@gmail.com',   SHA2('123456',256), 'Hoàng Quỳnh Mai',   'STAFF',  '0901000006'),
  ('ducmanh.ngo.staff@gmail.com',      SHA2('123456',256), 'Ngô Đức Mạnh',      'STAFF',  '0901000007'),
  ('baoloc.dang.staff@gmail.com',      SHA2('123456',256), 'Đặng Bảo Lộc',      'STAFF',  '0901000008'),
  ('kimanh.do.staff@gmail.com',        SHA2('123456',256), 'Đỗ Kim Anh',        'STAFF',  '0901000009'),
  ('huuphuoc.bui.staff@gmail.com',     SHA2('123456',256), 'Bùi Hữu Phước',     'STAFF',  '0901000010'),
  -- Teachers
  ('thanhson.nguyen.teacher@gmail.com',SHA2('123456',256), 'Nguyễn Thành Sơn',  'TEACHER','0902000001'),
  ('thuyduong.tran.teacher@gmail.com', SHA2('123456',256), 'Trần Thùy Dương',   'TEACHER','0902000002'),
  ('ngocanh.le.teacher@gmail.com',     SHA2('123456',256), 'Lê Ngọc Ánh',       'TEACHER','0902000003'),
  ('nhatnam.pham.teacher@gmail.com',   SHA2('123456',256), 'Phạm Nhật Nam',     'TEACHER','0902000004'),
  ('khaihoang.vo.teacher@gmail.com',   SHA2('123456',256), 'Võ Khải Hoàng',     'TEACHER','0902000005'),
  ('haianh.hoang.teacher@gmail.com',   SHA2('123456',256), 'Hoàng Hải Anh',     'TEACHER','0902000006'),
  ('thienan.ngo.teacher@gmail.com',    SHA2('123456',256), 'Ngô Thiên Ân',      'TEACHER','0902000007'),
  ('baoan.dang.teacher@gmail.com',     SHA2('123456',256), 'Đặng Bảo An',       'TEACHER','0902000008'),
  ('kimngan.do.teacher@gmail.com',     SHA2('123456',256), 'Đỗ Kim Ngân',       'TEACHER','0902000009'),
  ('huonggiang.bui.teacher@gmail.com', SHA2('123456',256), 'Bùi Hương Giang',   'TEACHER','0902000010'),
  -- Students
  ('anhkhoa.nguyen.student@gmail.com', SHA2('123456',256), 'Nguyễn Anh Khoa',   'STUDENT','0913000001'),
  ('thanhtruc.tran.student@gmail.com', SHA2('123456',256), 'Trần Thanh Trúc',   'STUDENT','0913000002'),
  ('hoangnam.le.student@gmail.com',    SHA2('123456',256), 'Lê Hoàng Nam',      'STUDENT','0913000003'),
  ('minhthu.pham.student@gmail.com',   SHA2('123456',256), 'Phạm Minh Thư',     'STUDENT','0913000004'),
  ('giahan.vo.student@gmail.com',      SHA2('123456',256), 'Võ Gia Hân',        'STUDENT','0913000005'),
  ('baochau.hoang.student@gmail.com',  SHA2('123456',256), 'Hoàng Bảo Châu',    'STUDENT','0913000006'),
  ('duchuy.ngo.student@gmail.com',     SHA2('123456',256), 'Ngô Đức Huy',       'STUDENT','0913000007'),
  ('nhatlinh.dang.student@gmail.com',  SHA2('123456',256), 'Đặng Nhật Linh',    'STUDENT','0913000008'),
  ('kimanh.do.student@gmail.com',      SHA2('123456',256), 'Đỗ Kim Anh',        'STUDENT','0913000009'),
  ('thanhphong.bui.student@gmail.com', SHA2('123456',256), 'Bùi Thanh Phong',   'STUDENT','0913000010'),
  -- Parents
  ('minhchau.nguyen.parent@gmail.com', SHA2('123456',256), 'Nguyễn Minh Châu',  'PARENT', '0924000001'),
  ('quanghuy.tran.parent@gmail.com',   SHA2('123456',256), 'Trần Quang Huy',    'PARENT', '0924000002'),
  ('thuhien.le.parent@gmail.com',      SHA2('123456',256), 'Lê Thu Hiền',       'PARENT', '0924000003'),
  ('ngocanh.pham.parent@gmail.com',    SHA2('123456',256), 'Phạm Ngọc Anh',     'PARENT', '0924000004'),
  ('thuanvo.parent@gmail.com',         SHA2('123456',256), 'Võ Minh Thuận',     'PARENT', '0924000005'),
  ('phuonghoang.hoang.parent@gmail.com',SHA2('123456',256),'Hoàng Phương Hoàng','PARENT','0924000006'),
  ('thanhthanh.ngo.parent@gmail.com',  SHA2('123456',256), 'Ngô Thanh Thanh',   'PARENT', '0924000007'),
  ('thienphuc.dang.parent@gmail.com',  SHA2('123456',256), 'Đặng Thiên Phúc',   'PARENT', '0924000008'),
  ('kimngoc.do.parent@gmail.com',      SHA2('123456',256), 'Đỗ Kim Ngọc',       'PARENT', '0924000009'),
  ('kimphung.bui.parent@gmail.com',    SHA2('123456',256), 'Bùi Kim Phụng',     'PARENT', '0924000010')
ON DUPLICATE KEY UPDATE username=VALUES(username), role=VALUES(role), phone=VALUES(phone);



-- - 1. Tạo bảng thông tin học sinh
CREATE TABLE student_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  status ENUM('ACTIVE', 'GRADUATED', 'TRANSFERRED', 'DROPPED') DEFAULT 'ACTIVE',
  enrollment_date DATE,
  graduation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. Thêm dữ liệu cho học sinh hiện có
INSERT INTO student_info (user_id, status, enrollment_date)
SELECT id, 'ACTIVE', NOW() FROM users WHERE role = 'STUDENT';

-- 3. Tạo bảng lịch sử chuyển lớp
CREATE TABLE student_class_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  class_id INT,
  level_id INT,
  start_date DATE,
  end_date DATE,
  reason ENUM('PROMOTION', 'TRANSFER', 'REPEAT', 'GRADUATION') DEFAULT 'PROMOTION',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (level_id) REFERENCES education_levels(id)
);

-- Bảng liên kết khối với môn học
-- CREATE TABLE subject_levels (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     subject_id INT NOT NULL,
--     level_id INT NOT NULL,
--     UNIQUE KEY uq_subject_level (subject_id, level_id),
--     CONSTRAINT fk_sl_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
--     CONSTRAINT fk_sl_level   FOREIGN KEY (level_id)   REFERENCES education_levels(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subject_grades (
  subject_id INT NOT NULL,
  grade_id   INT NOT NULL,
  UNIQUE KEY uq_subject_grade (subject_id),
  CONSTRAINT fk_sg_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_sg_grade   FOREIGN KEY (grade_id)   REFERENCES grades(id)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng đăng ký bữa ăn của học sinh
CREATE TABLE IF NOT EXISTS meal_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_user_id INT NOT NULL,
  meal_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_meal_registration (student_user_id, meal_id),
  CONSTRAINT fk_mr_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_mr_meal FOREIGN KEY (meal_id) REFERENCES meal_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;