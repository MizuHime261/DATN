import express from 'express';
import pool from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

export const studentRouter = express.Router();

studentRouter.use(requireAuth, requireRoles('STUDENT', 'ADMIN'));

studentRouter.get('/me/timetable', async (req, res) => {
  try {
    // Check if there is an active term covering today
    const [[activeTerm]] = await pool.query(
      'SELECT COUNT(1) AS cnt FROM terms WHERE CURDATE() BETWEEN start_date AND end_date'
    );

    const whereTerm = activeTerm && activeTerm.cnt > 0
      ? 'AND CURDATE() BETWEEN t.start_date AND t.end_date'
      : '';

    const [rows] = await pool.query(
      `SELECT 
              te.id,
              te.term_id,
              te.class_id,
              te.subject_id,
              te.teacher_user_id,
              te.day_of_week,
              te.period_index,
              c.name AS class_name,
              c.room_name AS room_name,
              s.name AS subject_name,
              u.username AS teacher_name,
              t.name AS term_name
       FROM class_enrollments ce
       JOIN timetable_entries te ON te.class_id = ce.class_id
       JOIN classes c ON c.id = te.class_id
       JOIN subjects s ON s.id = te.subject_id
       JOIN users u ON u.id = te.teacher_user_id
       JOIN terms t ON t.id = te.term_id
       WHERE ce.student_user_id = ?
         AND ce.active = TRUE
         ${whereTerm}
       ORDER BY te.day_of_week, te.period_index`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load timetable' });
  }
});

studentRouter.get('/me/class', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.username AS homeroom_teacher
       FROM class_enrollments ce
       JOIN classes c ON c.id = ce.class_id
       LEFT JOIN users u ON u.id = c.homeroom_teacher_id
       WHERE ce.student_user_id = ? AND ce.active = TRUE
       LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load class' });
  }
});

// Danh sách bạn cùng lớp đang active
studentRouter.get('/me/classmates', async (req, res) => {
  try {
    // Tìm lớp hiện tại của học sinh
    const [[cls]] = await pool.query(
      `SELECT ce.class_id
       FROM class_enrollments ce
       WHERE ce.student_user_id = ? AND ce.active = TRUE
       LIMIT 1`,
      [req.user.id]
    );
    if (!cls) return res.json([]);

    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.gender, u.birthdate, u.phone
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_user_id
       WHERE ce.class_id = ? AND ce.active = TRUE
       ORDER BY u.username`,
      [cls.class_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load classmates' });
  }
});

studentRouter.get('/me/results', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_user_id INT NOT NULL,
        subject_id INT NOT NULL,
        term_id INT NOT NULL,
        oral DECIMAL(4,2) NULL,
        test DECIMAL(4,2) NULL,
        exam DECIMAL(4,2) NULL,
        average DECIMAL(4,2) NULL,
        UNIQUE KEY uq_grade (student_user_id, subject_id, term_id),
        FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`);
    const [rows] = await pool.query(
      `SELECT g.*, s.name AS subject_name, t.name AS term_name
       FROM student_grades g
       JOIN subjects s ON s.id = g.subject_id
       JOIN terms t ON t.id = g.term_id
       WHERE g.student_user_id = ?
       ORDER BY t.start_date DESC, s.name ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load results' });
  }
});


