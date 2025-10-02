import express from 'express';
import pool from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

export const staffRouter = express.Router();

staffRouter.use(requireAuth, requireRoles('STAFF', 'ADMIN'));

// Read-only for Staff: Levels and Grades
staffRouter.get('/levels', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM education_levels ORDER BY sort_order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list levels' });
  }
});

staffRouter.get('/grades', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM grades ORDER BY level_id, grade_number');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list grades' });
  }
});
// Create invoices in batch for all active students in a grade
staffRouter.post('/invoices/batch-by-grade', async (req, res) => {
  console.log('Received request body:', req.body);
  const { grade_id, billing_period_start, billing_period_end, items = [], replace } = req.body;
  
  console.log('Parsed values:', {
    grade_id,
    grade_id_type: typeof grade_id,
    billing_period_start,
    billing_period_end,
    items_length: items.length,
    items_is_array: Array.isArray(items)
  });
  
  if (!grade_id || !billing_period_start || !billing_period_end || !Array.isArray(items) || items.length===0) {
    console.log('Validation failed:', {
      has_grade_id: !!grade_id,
      has_start: !!billing_period_start,
      has_end: !!billing_period_end,
      is_items_array: Array.isArray(items),
      items_length: items.length
    });
    return res.status(400).json({ error: 'grade_id, period and items required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Get level_id from grade_id first
    console.log('Querying grade with ID:', grade_id);
    const [gradeRows] = await conn.query(
      `SELECT level_id FROM grades WHERE id=? LIMIT 1`, [grade_id]
    );
    
    console.log('Grade query result:', gradeRows);
    
    if (!gradeRows || gradeRows.length === 0) {
      console.log('Grade not found for ID:', grade_id);
      await conn.rollback();
      return res.status(400).json({ error: 'Grade not found' });
    }
    
    const gradeInfo = gradeRows[0];
    
    const level_id = gradeInfo.level_id;
    
    // find student ids in this grade (active enrollment)
    const [students] = await conn.query(
      `SELECT DISTINCT ce.student_user_id AS id
       FROM classes c JOIN class_enrollments ce ON ce.class_id=c.id
       WHERE c.grade_id=? AND ce.active=TRUE`, [grade_id]
    );
    
    if (students.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'No active students found in this grade' });
    }
    
    let created = 0, updated = 0;
    for (const s of students){
      // ensure invoice exists or create
      const [exist] = await conn.query(
        `SELECT id FROM invoices WHERE student_user_id=? AND billing_period_start=? AND billing_period_end=? LIMIT 1`,
        [s.id, billing_period_start, billing_period_end]
      );
      let invoiceId;
      if (exist.length){
        invoiceId = exist[0].id;
        if (replace){
          await conn.query('DELETE FROM invoice_items WHERE invoice_id=?', [invoiceId]);
        }
        updated++;
      } else {
        const [r] = await conn.query(
          `INSERT INTO invoices (student_user_id, level_id, billing_period_start, billing_period_end, status, total_cents)
           VALUES (?, ?, ?, ?, 'DRAFT', 0)`, [s.id, level_id, billing_period_start, billing_period_end]
        );
        invoiceId = r.insertId; created++;
      }
      // insert items
      for (const it of items){
        const qty = Number(it.quantity||1); const unit = Number(it.unit_price_cents||0); const total = Math.round(qty*unit);
        await conn.query(
          `INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price_cents, total_cents)
           VALUES (?, ?, ?, ?, ?, ?)`, [invoiceId, it.item_type||'OTHER', it.description||'Khoản phí', qty, unit, total]
        );
      }
      await conn.query('UPDATE invoices SET total_cents=(SELECT COALESCE(SUM(total_cents),0) FROM invoice_items WHERE invoice_id=?) WHERE id=?', [invoiceId, invoiceId]);
    }
    await conn.commit();
    res.status(201).json({ ok:true, created, updated, students: students.length });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: 'Batch create failed' });
  } finally {
    conn.release();
  }
});

// Tuition management: invoices, items, payments
staffRouter.get('/invoices', async (req, res) => {
  const { student_user_id, status } = req.query;
  try {
    const where = [];
    const params = [];
    if (student_user_id) { where.push('i.student_user_id = ?'); params.push(student_user_id); }
    if (status) { where.push('i.status = ?'); params.push(status); }
    const sql = `SELECT i.*, u.username AS student_name
                 FROM invoices i JOIN users u ON u.id = i.student_user_id
                 ${where.length? 'WHERE '+where.join(' AND '): ''}
                 ORDER BY i.created_at DESC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list invoices' });
  }
});

// Invoice detail (items + payments)
staffRouter.get('/invoices/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const [[invoice]] = await pool.query('SELECT * FROM invoices WHERE id=?', [invoiceId]);
    const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=?', [invoiceId]);
    const [payments] = await pool.query('SELECT * FROM payments WHERE invoice_id=? ORDER BY created_at DESC', [invoiceId]);
    res.json({ invoice, items, payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoice detail' });
  }
});

staffRouter.post('/invoices/:invoiceId/payments', async (req, res) => {
  const { invoiceId } = req.params;
  const { amount_cents, method, status } = req.body;
  try {
    await pool.query(
      `INSERT INTO payments (invoice_id, amount_cents, method, status, paid_at)
       VALUES (?, ?, ?, ?, CASE WHEN ?='SUCCESS' THEN NOW() ELSE NULL END)`,
      [invoiceId, amount_cents, method, status || 'PENDING', status || 'PENDING']
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Record payment failed' });
  }
});

// Add fee item
staffRouter.post('/invoices/:invoiceId/items', async (req, res) => {
  const { invoiceId } = req.params;
  const { item_type, description, quantity, unit_price_cents } = req.body;
  try {
    const qty = Number(quantity || 1);
    const unit = Number(unit_price_cents || 0);
    const total = Math.round(qty * unit);
    await pool.query(
      `INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price_cents, total_cents)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, item_type || 'OTHER', description || 'Khoản phí', qty, unit, total]
    );
    await pool.query('UPDATE invoices SET total_cents = (SELECT COALESCE(SUM(total_cents),0) FROM invoice_items WHERE invoice_id=?) WHERE id=?', [invoiceId, invoiceId]);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Add item failed' });
  }
});

// Update invoice status
staffRouter.patch('/invoices/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE invoices SET status=? WHERE id=?', [status, invoiceId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Update invoice failed' });
  }
});

// Boarding meals: create plan for primary (level 1) or by grade
staffRouter.post('/meal-plans', async (req, res) => {
  const { school_id, plan_date, meal_type, title, price_cents } = req.body;
  
  // Validation
  if (!school_id || !plan_date || !meal_type || !title || price_cents === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
  if (!validMealTypes.includes(meal_type)) {
    return res.status(400).json({ error: 'Invalid meal type' });
  }
  
  try {
    await pool.query(
      `INSERT INTO meal_plans (school_id, plan_date, meal_type, title, price_cents)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), price_cents=VALUES(price_cents)`,
      [school_id, plan_date, meal_type, title.trim(), Number(price_cents)]
    );
    res.status(201).json({ ok: true, message: 'Meal plan saved successfully' });
  } catch (err) {
    console.error('Error saving meal plan:', err);
    res.status(400).json({ error: 'Upsert meal plan failed' });
  }
});

// List meal plans
staffRouter.get('/meal-plans', async (req, res) => {
  const { school_id } = req.query;
  try {
    const [rows] = await pool.query(
      school_id ? 'SELECT * FROM meal_plans WHERE school_id=? ORDER BY plan_date' : 'SELECT * FROM meal_plans ORDER BY plan_date',
      school_id ? [school_id] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list meal plans' });
  }
});

// Tuition summary report
staffRouter.get('/reports/tuition', async (req, res) => {
  const { group_by = 'class' } = req.query;
  try {
    let sql;
    if (group_by === 'grade') {
      sql = `SELECT g.level_id, g.grade_number, SUM(i.total_cents) AS total
             FROM invoices i
             JOIN class_enrollments ce ON ce.student_user_id = i.student_user_id AND ce.active = TRUE
             JOIN classes c ON c.id = ce.class_id
             JOIN grades g ON g.id = c.grade_id
             GROUP BY g.level_id, g.grade_number
             ORDER BY g.level_id, g.grade_number`;
    } else if (group_by === 'school') {
      // single-school design: aggregate overall
      sql = `SELECT 'ALL' AS scope, SUM(i.total_cents) AS total FROM invoices i`;
    } else {
      sql = `SELECT c.id AS class_id, c.name AS class_name, SUM(i.total_cents) AS total
             FROM invoices i
             JOIN class_enrollments ce ON ce.student_user_id = i.student_user_id AND ce.active = TRUE
             JOIN classes c ON c.id = ce.class_id
             GROUP BY c.id, c.name
             ORDER BY c.name`;
    }
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to build tuition report' });
  }
});

// Fee status by student
staffRouter.get('/fee-status', async (req, res) => {
  const { student_user_id } = req.query;
  if (!student_user_id) return res.status(400).json({ error: 'student_user_id required' });
  try {
    const [[sumItems]] = await pool.query(
      `SELECT COALESCE(SUM(total_cents),0) AS total_billed
       FROM invoices WHERE student_user_id=?`, [student_user_id]);
    const [[sumPay]] = await pool.query(
      `SELECT COALESCE(SUM(amount_cents),0) AS total_paid
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       WHERE i.student_user_id=? AND p.status='SUCCESS'`, [student_user_id]);
    res.json({ total_billed: sumItems.total_billed, total_paid: sumPay.total_paid, due_cents: sumItems.total_billed - sumPay.total_paid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get fee status' });
  }
});

// Meal count report by date
staffRouter.get('/reports/meal-count', async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: 'date required' });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boarding_registrations (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        student_user_id INT NOT NULL,
        term_id CHAR(36) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('REGISTERED','CANCELLED') NOT NULL DEFAULT 'REGISTERED'
      ) ENGINE=InnoDB;`);
    const [rows] = await pool.query(
      `SELECT c.id AS class_id, c.name AS class_name, COUNT(*) AS meal_count
       FROM boarding_registrations br
       JOIN class_enrollments ce ON ce.student_user_id = br.student_user_id AND ce.active = TRUE
       JOIN classes c ON c.id = ce.class_id
       WHERE br.status='REGISTERED' AND ? BETWEEN br.start_date AND br.end_date
       GROUP BY c.id, c.name
       ORDER BY c.name`,
      [date]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to build meal report' });
  }
});


