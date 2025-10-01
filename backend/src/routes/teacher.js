import express from 'express';
import pool from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

export const teacherRouter = express.Router();

teacherRouter.use(requireAuth, requireRoles('TEACHER', 'ADMIN'));

// View personal timetable (by teacher)
// Thời khóa biểu cá nhân (tùy chọn lọc theo học kỳ)
teacherRouter.get('/timetable', async (req, res) => {
  const { term_id } = req.query;
  try {
    const params = [req.user.id];
    let where = 'te.teacher_user_id = ?';
    if (term_id) { where += ' AND te.term_id = ?'; params.push(term_id); }
    const [rows] = await pool.query(
      `SELECT te.*, c.name AS class_name, s.name AS subject_name
       FROM timetable_entries te
       JOIN classes c ON c.id = te.class_id
       JOIN subjects s ON s.id = te.subject_id
       WHERE ${where}
       ORDER BY te.day_of_week, te.period_index`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load timetable' });
  }
});

// Lấy thông tin lớp chủ nhiệm của giáo viên
teacherRouter.get('/homeroom', async (req, res) => {
  try {
    const [[cls]] = await pool.query(
      'SELECT id, name, grade_id, homeroom_teacher_id FROM classes WHERE homeroom_teacher_id=? LIMIT 1',
      [req.user.id]
    );
    res.json(cls || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load homeroom class' });
  }
});

// Thời khóa biểu lớp chủ nhiệm (yêu cầu đúng giáo viên chủ nhiệm)
teacherRouter.get('/class-timetable', async (req, res) => {
  const { class_id, term_id } = req.query;
  if (!class_id) return res.status(400).json({ error: 'Thiếu class_id' });
  try {
    const [[authz]] = await pool.query(
      'SELECT 1 FROM classes WHERE id=? AND homeroom_teacher_id=? LIMIT 1',
      [class_id, req.user.id]
    );
    if (!authz) return res.status(403).json({ error: 'Không phải giáo viên chủ nhiệm lớp này' });

    const params = [];
    let where = 'tte.class_id = ?';
    params.push(class_id);
    if (term_id) { where += ' AND tte.term_id = ?'; params.push(term_id); }
    const [rows] = await pool.query(
      `SELECT tte.*, s.name AS subject_name, u.username AS teacher_name, c.name AS class_name, t.name AS term_name
       FROM timetable_entries tte
       JOIN subjects s ON s.id = tte.subject_id
       JOIN users u ON u.id = tte.teacher_user_id
       JOIN classes c ON c.id = tte.class_id
       JOIN terms t ON t.id = tte.term_id
       WHERE ${where}
       ORDER BY tte.day_of_week, tte.period_index`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load class timetable' });
  }
});

// Danh sách periods để hiển thị khung giờ
teacherRouter.get('/periods', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM periods ORDER BY level_id, day_of_week, period_index');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load periods' });
  }
});

// Students in classes taught or homeroom
teacherRouter.get('/students', async (req, res) => {
  const { q, class_id } = req.query; // search by name/phone, filter by class
  try {
    const params = [req.user.id, req.user.id];
    let whereClause = `ce.active = TRUE AND (
      c.homeroom_teacher_id = ? OR ce.class_id IN (
        SELECT class_id FROM timetable_entries WHERE teacher_user_id = ?
      )
    )`;
    
    if (class_id) {
      whereClause += ' AND ce.class_id = ?';
      params.push(class_id);
    }
    
    if (q) {
      whereClause += ' AND (u.username LIKE ? OR u.phone LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    
    const [rows] = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.gender, u.birthdate, u.phone, c.name AS class_name,
              (SELECT up.username FROM parent_student ps JOIN users up ON up.id = ps.parent_id WHERE ps.student_id = u.id LIMIT 1) AS parent_name,
              (SELECT up.phone FROM parent_student ps JOIN users up ON up.id = ps.parent_id WHERE ps.student_id = u.id LIMIT 1) AS parent_phone
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_user_id
       JOIN classes c ON c.id = ce.class_id
       WHERE ${whereClause}
       ORDER BY c.name, u.username`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load students' });
  }
});

// Grade report for a class/subject/term
teacherRouter.get('/grades/report', async (req, res) => {
  const { class_id, subject_id, term_id, format } = req.query;
  if (!class_id || !subject_id || !term_id) return res.status(400).json({ error: 'Missing params' });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_grades (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_user_id INT NOT NULL,
        subject_id CHAR(36) NOT NULL,
        term_id CHAR(36) NOT NULL,
        oral DECIMAL(4,2) NULL,
        test DECIMAL(4,2) NULL,
        exam DECIMAL(4,2) NULL,
        average DECIMAL(4,2) NULL,
        UNIQUE KEY uq_grade (student_user_id, subject_id, term_id)
      ) ENGINE=InnoDB;`);

    const [rows] = await pool.query(
      `SELECT u.id AS student_id, u.username, g.oral, g.test, g.exam,
              COALESCE(g.average, ROUND((COALESCE(g.oral,0)+COALESCE(g.test,0)+COALESCE(g.exam,0))/NULLIF((g.oral IS NOT NULL)+(g.test IS NOT NULL)+(g.exam IS NOT NULL),0),2)) AS average
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_user_id
       LEFT JOIN student_grades g ON g.student_user_id = u.id AND g.subject_id = ? AND g.term_id = ?
       WHERE ce.class_id = ? AND ce.active = TRUE
       ORDER BY u.username`,
      [subject_id, term_id, class_id]
    );

    if (format === 'csv') {
      const header = 'student_id,username,oral,test,exam,average\n';
      const body = rows.map(r => `${r.student_id},"${r.username}",${r.oral ?? ''},${r.test ?? ''},${r.exam ?? ''},${r.average ?? ''}`).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.send(header + body);
      return;
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to build report' });
  }
});

// Grades management: create or update a mark (simple schema for demo)
// We'll create a minimal table if not exists to store grades
teacherRouter.post('/grades', async (req, res) => {
  const { student_user_id, subject_id, term_id, oral, test, exam, quiz } = req.body;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_user_id INT NOT NULL,
        subject_id INT NOT NULL,
        term_id INT NOT NULL,
        oral DECIMAL(4,2) NULL,
        quiz DECIMAL(4,2) NULL,
        test DECIMAL(4,2) NULL,
        exam DECIMAL(4,2) NULL,
        average DECIMAL(4,2) NULL,
        UNIQUE KEY uq_grade (student_user_id, subject_id, term_id),
        FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`);

    const avg = [oral, quiz, test, exam].filter(v => typeof v === 'number' && v > 0).length
      ? ((Number(oral || 0) + Number(quiz || 0) + Number(test || 0) + Number(exam || 0)) / [oral, quiz, test, exam].filter(v => v != null && v > 0).length)
      : null;

    await pool.query(
      `INSERT INTO student_grades (student_user_id, subject_id, term_id, oral, quiz, test, exam, average)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE oral=VALUES(oral), quiz=VALUES(quiz), test=VALUES(test), exam=VALUES(exam), average=VALUES(average)`,
      [student_user_id, subject_id, term_id, oral ?? null, quiz ?? null, test ?? null, exam ?? null, avg]
    );

    res.status(201).json({ ok: true, average: avg });
  } catch (err) {
    res.status(400).json({ error: 'Upsert grade failed' });
  }
});

// Update existing grade
teacherRouter.put('/grades', async (req, res) => {
  const { student_user_id, subject_id, term_id, oral, test, exam, quiz } = req.body;
  try {
    const avg = [oral, quiz, test, exam].filter(v => typeof v === 'number' && v > 0).length
      ? ((Number(oral || 0) + Number(quiz || 0) + Number(test || 0) + Number(exam || 0)) / [oral, quiz, test, exam].filter(v => v != null && v > 0).length)
      : null;

    const [result] = await pool.query(
      `UPDATE student_grades 
       SET oral=?, quiz=?, test=?, exam=?, average=?
       WHERE student_user_id=? AND subject_id=? AND term_id=?`,
      [oral ?? null, quiz ?? null, test ?? null, exam ?? null, avg, student_user_id, subject_id, term_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Grade not found' });
    }

    res.json({ ok: true, average: avg });
  } catch (err) {
    res.status(400).json({ error: 'Update grade failed' });
  }
});

// Homeroom conduct evaluation
teacherRouter.post('/conduct', async (req, res) => {
  const { student_user_id, term_id, rating, note } = req.body; // rating: Tốt/Khá/Trung bình/Yếu
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conduct_reviews (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_user_id INT NOT NULL,
        term_id CHAR(36) NOT NULL,
        rating ENUM('Tốt','Khá','Trung bình','Yếu') NOT NULL,
        note VARCHAR(1000) NULL,
        UNIQUE KEY uq_conduct (student_user_id, term_id),
        FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`);

    await pool.query(
      `INSERT INTO conduct_reviews (student_user_id, term_id, rating, note)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating=VALUES(rating), note=VALUES(note)`,
      [student_user_id, term_id, rating, note || null]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Upsert conduct failed' });
  }
});

// Classes that teacher teaches or is homeroom teacher for
teacherRouter.get('/classes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.room_name
       FROM classes c
       WHERE c.homeroom_teacher_id = ? OR c.id IN (
         SELECT DISTINCT class_id FROM timetable_entries WHERE teacher_user_id = ?
       )
       ORDER BY c.name`,
      [req.user.id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load classes' });
  }
});

// Subjects that teacher teaches
teacherRouter.get('/teacher-subjects', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ts.subject_id, s.name AS subject_name
       FROM teacher_subjects ts
       JOIN subjects s ON s.id = ts.subject_id
       WHERE ts.teacher_user_id = ?
       ORDER BY s.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load teacher subjects' });
  }
});

// Read-only helpers for teachers: terms and subjects
teacherRouter.get('/terms', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM terms ORDER BY start_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load terms' });
  }
});

teacherRouter.get('/subjects', async (req, res) => {
  const { school_id } = req.query;
  try {
    const [rows] = await pool.query(
      school_id ? 'SELECT * FROM subjects WHERE school_id=? ORDER BY name' : 'SELECT * FROM subjects ORDER BY name',
      school_id ? [school_id] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load subjects' });
  }
});


