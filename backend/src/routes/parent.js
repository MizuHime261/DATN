import express from 'express';
import pool from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

export const parentRouter = express.Router();

parentRouter.use(requireAuth, requireRoles('PARENT', 'ADMIN'));
// List children linked with this parent
parentRouter.get('/children', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email
       FROM parent_student ps JOIN users u ON u.id = ps.student_id
       WHERE ps.parent_id = ?
       ORDER BY u.username`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load children' });
  }
});


// Children timetable
parentRouter.get('/children/:studentId/timetable', async (req, res) => {
  const { studentId } = req.params;
  try {
    // authorize: ensure parent linked to student
    const [linked] = await pool.query(
      'SELECT 1 FROM parent_student WHERE parent_id = ? AND student_id = ? LIMIT 1',
      [req.user.id, studentId]
    );
    if (linked.length === 0) return res.status(403).json({ error: 'Not linked' });

    const [rows] = await pool.query(
      `SELECT te.*, c.name AS class_name, s.name AS subject_name
       FROM class_enrollments ce
       JOIN timetable_entries te ON te.class_id = ce.class_id
       JOIN classes c ON c.id = te.class_id
       JOIN subjects s ON s.id = te.subject_id
       WHERE ce.student_user_id = ? AND ce.active = TRUE
       ORDER BY te.day_of_week, te.period_index`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load timetable' });
  }
});

// Boarding registration: simple table to track registrations by term
parentRouter.post('/children/:studentId/boarding', async (req, res) => {
  const { studentId } = req.params;
  const { term_id, start_date, end_date } = req.body;
  try {
    const [linked] = await pool.query(
      'SELECT 1 FROM parent_student WHERE parent_id = ? AND student_id = ? LIMIT 1',
      [req.user.id, studentId]
    );
    if (linked.length === 0) return res.status(403).json({ error: 'Not linked' });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS boarding_registrations (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_user_id INT NOT NULL,
        term_id CHAR(36) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('REGISTERED','CANCELLED') NOT NULL DEFAULT 'REGISTERED',
        UNIQUE KEY uq_boarding (student_user_id, term_id),
        FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`);

    await pool.query(
      `INSERT INTO boarding_registrations (student_user_id, term_id, start_date, end_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE start_date=VALUES(start_date), end_date=VALUES(end_date), status='REGISTERED'`,
      [studentId, term_id, start_date, end_date]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Register boarding failed' });
  }
});

parentRouter.delete('/children/:studentId/boarding', async (req, res) => {
  const { studentId } = req.params;
  const { term_id } = req.body;
  try {
    const [linked] = await pool.query(
      'SELECT 1 FROM parent_student WHERE parent_id = ? AND student_id = ? LIMIT 1',
      [req.user.id, studentId]
    );
    if (linked.length === 0) return res.status(403).json({ error: 'Not linked' });
    await pool.query(
      `UPDATE boarding_registrations SET status='CANCELLED' WHERE student_user_id=? AND term_id=? AND start_date > CURDATE()`,
      [studentId, term_id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Cancel boarding failed' });
  }
});

// Tuition: view invoices and pay (mock)
parentRouter.get('/children/:studentId/invoices', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [authz] = await pool.query(
      'SELECT 1 FROM parent_student WHERE parent_id = ? AND student_id = ? LIMIT 1',
      [req.user.id, studentId]
    );
    if (authz.length === 0) return res.status(403).json({ error: 'Not linked' });
    const [rows] = await pool.query('SELECT * FROM invoices WHERE student_user_id=? ORDER BY created_at DESC', [studentId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load invoices' });
  }
});

// Invoice items of a child's invoice
parentRouter.get('/children/:studentId/invoices/:invoiceId/items', async (req, res) => {
  const { studentId, invoiceId } = req.params;
  try {
    const [authz] = await pool.query('SELECT 1 FROM parent_student WHERE parent_id=? AND student_id=? LIMIT 1', [req.user.id, studentId]);
    if (authz.length === 0) return res.status(403).json({ error: 'Not linked' });
    const [[inv]] = await pool.query('SELECT id FROM invoices WHERE id=? AND student_user_id=? LIMIT 1', [invoiceId, studentId]);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id', [invoiceId]);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load invoice items' });
  }
});

// Pay an invoice (mock payment)
parentRouter.post('/invoices/:invoiceId/pay', async (req, res) => {
  const { invoiceId } = req.params;
  const { amount_cents, method } = req.body; // CASH/CARD/TRANSFER/WALLET
  try {
    // Fetch invoice and check ownership via parent_student
    const [[inv]] = await pool.query('SELECT * FROM invoices WHERE id=? LIMIT 1', [invoiceId]);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const [authz] = await pool.query('SELECT 1 FROM parent_student WHERE parent_id=? AND student_id=? LIMIT 1', [req.user.id, inv.student_user_id]);
    if (authz.length === 0) return res.status(403).json({ error: 'Not linked' });

    // Compute due
    const [[sumPaid]] = await pool.query(
      `SELECT COALESCE(SUM(amount_cents),0) AS paid FROM payments WHERE invoice_id=? AND status='SUCCESS'`, [invoiceId]
    );
    const due = Math.max(0, Number(inv.total_cents||0) - Number(sumPaid.paid||0));
    const pay = Math.min(due, Math.max(0, Number(amount_cents||0)));
    if (pay <= 0) return res.status(400).json({ error: 'Nothing to pay' });

    // Insert payment SUCCESS
    await pool.query(
      'INSERT INTO payments (invoice_id, amount_cents, method, status, paid_at) VALUES (?, ?, ?, ?, NOW())',
      [invoiceId, pay, method || 'TRANSFER', 'SUCCESS']
    );

    // Update invoice status
    const newStatus = pay === due ? 'PAID' : 'PARTIALLY_PAID';
    await pool.query('UPDATE invoices SET status=? WHERE id=?', [newStatus, invoiceId]);
    res.status(201).json({ ok: true, paid_cents: pay, new_status: newStatus });
  } catch (err) {
    res.status(400).json({ error: 'Payment failed' });
  }
});

// Class info of child
parentRouter.get('/children/:studentId/class', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [authz] = await pool.query('SELECT 1 FROM parent_student WHERE parent_id=? AND student_id=? LIMIT 1', [req.user.id, studentId]);
    if (authz.length === 0) return res.status(403).json({ error: 'Not linked' });
    const [rows] = await pool.query(
      `SELECT c.*, u.username AS homeroom_teacher
       FROM class_enrollments ce
       JOIN classes c ON c.id = ce.class_id
       LEFT JOIN users u ON u.id = c.homeroom_teacher_id
       WHERE ce.student_user_id=? AND ce.active=TRUE LIMIT 1`,
      [studentId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load class info' });
  }
});

// Results of child
parentRouter.get('/children/:studentId/results', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [authz] = await pool.query('SELECT 1 FROM parent_student WHERE parent_id=? AND student_id=? LIMIT 1', [req.user.id, studentId]);
    if (authz.length === 0) return res.status(403).json({ error: 'Not linked' });
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
        UNIQUE KEY uq_grade (student_user_id, subject_id, term_id)
      ) ENGINE=InnoDB;`);
    const [rows] = await pool.query(
      `SELECT g.*, s.name AS subject_name, t.name AS term_name
       FROM student_grades g
       JOIN subjects s ON s.id = g.subject_id
       JOIN terms t ON t.id = g.term_id
       WHERE g.student_user_id = ?
       ORDER BY t.start_date DESC, s.name ASC`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load results' });
  }
});

// Fee status of child
parentRouter.get('/children/:studentId/fee-status', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [authz] = await pool.query('SELECT 1 FROM parent_student WHERE parent_id=? AND student_id=? LIMIT 1', [req.user.id, studentId]);
    if (authz.length === 0) return res.status(403).json({ error: 'Not linked' });
    const [[sumItems]] = await pool.query(
      `SELECT COALESCE(SUM(total_cents),0) AS total_billed
       FROM invoices WHERE student_user_id=?`, [studentId]);
    const [[sumPay]] = await pool.query(
      `SELECT COALESCE(SUM(amount_cents),0) AS total_paid
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       WHERE i.student_user_id=? AND p.status='SUCCESS'`, [studentId]);
    res.json({ total_billed: sumItems.total_billed, total_paid: sumPay.total_paid, due_cents: sumItems.total_billed - sumPay.total_paid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load fee status' });
  }
});


