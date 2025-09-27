-- Chỉ gán học sinh cho phụ huynh
-- Xóa dữ liệu cũ nếu có
DELETE FROM parent_student;

-- Gán học sinh với phụ huynh theo họ
INSERT INTO parent_student (parent_id, student_id, relationship) VALUES
-- Nguyễn: Anh Khoa -> Minh Châu (Mẹ)
(32, 22, 'Mẹ'),
-- Trần: Thanh Trúc -> Quang Huy (Bố)
(33, 23, 'Bố'),
-- Lê: Hoàng Nam -> Thu Hiền (Mẹ)
(34, 24, 'Mẹ'),
-- Phạm: Minh Thư -> Ngọc Anh (Mẹ)
(35, 25, 'Mẹ'),
-- Võ: Gia Hân -> Minh Thuận (Bố)
(36, 26, 'Bố'),
-- Hoàng: Bảo Châu -> Phương Hoàng (Bố)
(37, 27, 'Bố'),
-- Ngô: Đức Huy -> Thanh Thanh (Mẹ)
(38, 28, 'Mẹ'),
-- Đặng: Nhật Linh -> Thiên Phúc (Bố)
(39, 29, 'Bố'),
-- Đỗ: Kim Anh -> Kim Ngọc (Mẹ)
(40, 30, 'Mẹ'),
-- Bùi: Thanh Phong -> Kim Phụng (Mẹ)
(41, 31, 'Mẹ');

-- Kiểm tra kết quả
SELECT 
    ps.parent_id,
    p.username as parent_name,
    ps.student_id,
    s.username as student_name,
    ps.relationship
FROM parent_student ps
JOIN users p ON ps.parent_id = p.id
JOIN users s ON ps.student_id = s.id
ORDER BY ps.parent_id;
