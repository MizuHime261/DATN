import express from 'express';
import pool from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

export const parentRouter = express.Router();

parentRouter.use(requireAuth, requireRoles('PARENT', 'ADMIN'));

// Get terms for parent
parentRouter.get('/terms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM terms ORDER BY term_order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list terms' });
  }
});

// Get meals for a specific term
parentRouter.get('/meals', async (req, res) => {
  const { term_id } = req.query;
  try {
    if (!term_id) {
      return res.status(400).json({ error: 'term_id is required' });
    }
    
    // Get term dates
    const [termRows] = await pool.query(
      'SELECT start_date, end_date FROM terms WHERE id = ?',
      [term_id]
    );
    
    if (termRows.length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }
    
    const { start_date, end_date } = termRows[0];
    
    // Get meals within term date range
    const [rows] = await pool.query(
      `SELECT mp.*, COALESCE(l.name, 'Unknown') as level_name 
       FROM meal_plans mp 
       LEFT JOIN levels l ON l.id = mp.level_id
       WHERE mp.plan_date BETWEEN ? AND ?
       ORDER BY mp.plan_date, mp.meal_type`,
      [start_date, end_date]
    );
    
    res.json(rows);
  } catch (err) {
    console.error('Error in meals API:', err);
    res.status(500).json({ error: 'Failed to load meals' });
  }
});

// Get registered meals for current parent's children
parentRouter.get('/registered-meals', async (req, res) => {
  const { term_id } = req.query;
  try {
    if (!term_id) {
      return res.status(400).json({ error: 'term_id is required' });
    }
    
    // Get all children of this parent
    const [children] = await pool.query(
      'SELECT student_id FROM parent_student WHERE parent_id = ?',
      [req.user.id]
    );
    
    if (children.length === 0) {
      return res.json([]);
    }
    
    const studentIds = children.map(c => c.student_id);
    const placeholders = studentIds.map(() => '?').join(',');
    
    // Get registered meals
    const [rows] = await pool.query(
      `SELECT mr.*, mp.plan_date, mp.title, mp.price_cents
       FROM meal_registrations mr
       JOIN meal_plans mp ON mp.id = mr.meal_id
       WHERE mr.student_user_id IN (${placeholders}) 
       AND mp.plan_date BETWEEN (
         SELECT start_date FROM terms WHERE id = ?
       ) AND (
         SELECT end_date FROM terms WHERE id = ?
       )
       ORDER BY mp.plan_date`,
      [...studentIds, term_id, term_id]
    );
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load registered meals' });
  }
});

// Register for a meal
parentRouter.post('/meal-registration/:mealId', async (req, res) => {
  const { mealId } = req.params;
  try {
    // Verify meal exists and get its details
    const [mealRows] = await pool.query(
      'SELECT mp.*, l.name as level_name FROM meal_plans mp JOIN levels l ON l.id = mp.level_id WHERE mp.id = ?',
      [mealId]
    );
    
    if (mealRows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    const meal = mealRows[0];
    
    // Check if meal date is in the past
    const today = new Date();
    const mealDate = new Date(meal.plan_date);
    today.setHours(0, 0, 0, 0);
    mealDate.setHours(0, 0, 0, 0);
    
    if (mealDate < today) {
      return res.status(400).json({ error: 'Cannot register for past meals' });
    }
    
    // Get all children of this parent
    const [children] = await pool.query(
      'SELECT student_id FROM parent_student WHERE parent_id = ?',
      [req.user.id]
    );
    
    if (children.length === 0) {
      return res.status(400).json({ error: 'No children found' });
    }
    
    // For now, register the first child (can be extended to select specific child)
    const studentId = children[0].student_id;
    
    // Check if already registered
    const [existing] = await pool.query(
      'SELECT id FROM meal_registrations WHERE student_user_id = ? AND meal_id = ?',
      [studentId, mealId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already registered for this meal' });
    }
    
    // Create meal registration
    await pool.query(
      'INSERT INTO meal_registrations (student_user_id, meal_id, registered_at) VALUES (?, ?, NOW())',
      [studentId, mealId]
    );
    
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register for meal' });
  }
});

// Cancel meal registration
parentRouter.delete('/meal-registration/:mealId', async (req, res) => {
  const { mealId } = req.params;
  try {
    // Get all children of this parent
    const [children] = await pool.query(
      'SELECT student_id FROM parent_student WHERE parent_id = ?',
      [req.user.id]
    );
    
    if (children.length === 0) {
      return res.status(400).json({ error: 'No children found' });
    }
    
    const studentIds = children.map(c => c.student_id);
    const placeholders = studentIds.map(() => '?').join(',');
    
    // Get meal date to check if it's in the past
    const [mealRows] = await pool.query(
      'SELECT plan_date FROM meal_plans WHERE id = ?',
      [mealId]
    );
    
    if (mealRows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    const mealDate = new Date(mealRows[0].plan_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mealDate.setHours(0, 0, 0, 0);
    
    // If meal is in the past, cannot cancel
    if (mealDate < today) {
      return res.status(400).json({ error: 'Cannot cancel registration for past meals' });
    }
    
    // Delete meal registration
    const [result] = await pool.query(
      `DELETE FROM meal_registrations 
       WHERE student_user_id IN (${placeholders}) AND meal_id = ?`,
      [...studentIds, mealId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel meal registration' });
  }
});

// Generate invoices for registered meals
parentRouter.post('/generate-meal-invoices', async (req, res) => {
  try {
    // Get all children of this parent
    const [children] = await pool.query(
      'SELECT student_id FROM parent_student WHERE parent_id = ?',
      [req.user.id]
    );
    
    if (children.length === 0) {
      return res.status(400).json({ error: 'No children found' });
    }
    
    const studentIds = children.map(c => c.student_id);
    const placeholders = studentIds.map(() => '?').join(',');
    
    // Get all registered meals for this month that don't have invoices yet
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const [registeredMeals] = await pool.query(
      `SELECT mr.student_user_id, mr.meal_id, mp.plan_date, mp.title, mp.price_cents, mp.level_id
       FROM meal_registrations mr
       JOIN meal_plans mp ON mp.id = mr.meal_id
       WHERE mr.student_user_id IN (${placeholders})
       AND mp.plan_date BETWEEN ? AND ?
       AND NOT EXISTS (
         SELECT 1 FROM invoice_items ii 
         JOIN invoices i ON i.id = ii.invoice_id
         WHERE i.student_user_id = mr.student_user_id
         AND ii.description = mp.title
         AND ii.item_type = 'MEAL'
         AND DATE(ii.created_at) = DATE(mr.registered_at)
       )
       ORDER BY mr.student_user_id, mp.plan_date`,
      [...studentIds, startOfMonth, endOfMonth]
    );
    
    if (registeredMeals.length === 0) {
      return res.json({ message: 'No new meal registrations to invoice', invoices_created: 0 });
    }
    
    // Group by student
    const mealsByStudent = {};
    registeredMeals.forEach(meal => {
      if (!mealsByStudent[meal.student_user_id]) {
        mealsByStudent[meal.student_user_id] = [];
      }
      mealsByStudent[meal.student_user_id].push(meal);
    });
    
    let invoicesCreated = 0;
    
    // Create invoices for each student
    for (const [studentId, meals] of Object.entries(mealsByStudent)) {
      // Create invoice for this month
      const [invoiceResult] = await pool.query(
        `INSERT INTO invoices (student_user_id, level_id, billing_period_start, billing_period_end, status, total_cents)
         VALUES (?, ?, ?, ?, 'ISSUED', 0)`,
        [studentId, meals[0].level_id, startOfMonth, endOfMonth]
      );
      
      const invoiceId = invoiceResult.insertId;
      
      // Add meal items to invoice
      for (const meal of meals) {
        await pool.query(
          `INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price_cents, total_cents)
           VALUES (?, 'MEAL', ?, 1, ?, ?)`,
          [invoiceId, meal.title, meal.price_cents, meal.price_cents]
        );
      }
      
      // Update invoice total
      await pool.query(
        'UPDATE invoices SET total_cents = (SELECT SUM(total_cents) FROM invoice_items WHERE invoice_id = ?) WHERE id = ?',
        [invoiceId, invoiceId]
      );
      
      invoicesCreated++;
    }
    
    res.json({ 
      message: 'Meal invoices generated successfully', 
      invoices_created: invoicesCreated,
      meals_processed: registeredMeals.length 
    });
    
  } catch (err) {
    console.error('Error generating meal invoices:', err);
    res.status(500).json({ error: 'Failed to generate meal invoices' });
  }
});

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
      `SELECT te.*, 
              c.name AS class_name,
              c.room_name AS room_name,
              s.name AS subject_name,
              t.name AS term_name,
              u.username AS teacher_name,
              u.phone AS teacher_phone
       FROM class_enrollments ce
       JOIN timetable_entries te ON te.class_id = ce.class_id
       JOIN classes c ON c.id = te.class_id
       JOIN subjects s ON s.id = te.subject_id
       JOIN terms t ON t.id = te.term_id
       LEFT JOIN users u ON u.id = te.teacher_user_id
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

    // Get current class and homeroom teacher info
    const [[cls]] = await pool.query(
      `SELECT c.id AS class_id, c.name AS class_name, c.room_name,
              t.username AS homeroom_teacher_name, t.phone AS homeroom_teacher_phone
       FROM class_enrollments ce
       JOIN classes c ON c.id = ce.class_id
       LEFT JOIN users t ON t.id = c.homeroom_teacher_id
       WHERE ce.student_user_id=? AND ce.active=TRUE
       LIMIT 1`,
      [studentId]
    );
    if (!cls) return res.json(null);

    // Classmates list (exclude current student)
    const [mates] = await pool.query(
      `SELECT u.id, u.username, u.gender, u.phone
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_user_id
       WHERE ce.class_id=? AND ce.active=TRUE AND ce.student_user_id <> ?
       ORDER BY u.username`,
      [cls.class_id, studentId]
    );

    res.json({
      class_id: cls.class_id,
      class_name: cls.class_name,
      room_name: cls.room_name,
      homeroom_teacher_name: cls.homeroom_teacher_name || null,
      homeroom_teacher_phone: cls.homeroom_teacher_phone || null,
      classmates: mates
    });
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


