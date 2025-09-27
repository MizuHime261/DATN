import express from 'express';
import pool from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

export const adminRouter = express.Router();

adminRouter.use(requireAuth, requireRoles('ADMIN'));

const USER_MANAGEMENT_ROLES = ['ADMIN', 'STAFF', 'TEACHER'];
const EMAIL_REGEX = /^([^\s@]+)@([^\s@]+)\.[^\s@]{2,}$/;

const RELATIONSHIP_VALUES = {
  'BỐ': 'Bố',
  'MẸ': 'Mẹ',
  'ÔNG': 'Ông',
  'BÀ': 'Bà',
  'GIÁM HỘ': 'Giám hộ',
  'KHÁC': 'Khác'
};

const GENDER_VALUES = {
  'MALE': 'Nam',
  'FEMALE': 'Nữ',
  'NAM': 'Nam',
  'NỮ': 'Nữ',
  'NU': 'Nữ',
  'M': 'Nam',
  'F': 'Nữ'
};

function normalizeGenderInput(value) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw === 'Nam' || raw === 'Nữ') return raw;
  const upper = raw.toUpperCase();
  return GENDER_VALUES[upper] || null;
}

function normalizeDateInput(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(text);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return null;
}

function slugifyName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/\s+/g, '');
}

function buildDefaultPassword(name, birthIso) {
  const compact = slugifyName(name);
  const digits = String(birthIso || '').replaceAll('-', '');
  const dd = digits.slice(6, 8) || '01';
  const mm = digits.slice(4, 6) || '01';
  return `${compact || 'guardian'}${dd}${mm}`;
}

async function createParentAccount(conn, parentData) {
  const username = String(parentData?.username || '').trim();
  const email = String(parentData?.email || '').trim();
  if (!username) {
    throw new Error('Tên phụ huynh bắt buộc');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Email phụ huynh không hợp lệ');
  }

  const [existing] = await conn.query('SELECT id FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1', [email]);
  if (existing.length) {
    throw new Error(`Email phụ huynh ${email} đã tồn tại`);
  }

  const birthIso = normalizeDateInput(parentData?.birthdate);
  const phone = parentData?.phone ? String(parentData.phone).trim() : null;
  if (phone && !/^\d{10}$/.test(phone)) {
    throw new Error('Số điện thoại phụ huynh phải đủ 10 số');
  }
  const gender = normalizeGenderInput(parentData?.gender);
  const passwordPlain = buildDefaultPassword(username, birthIso);

  const [result] = await conn.query(
    'INSERT INTO users (email, password, username, role, phone, gender, birthdate) VALUES (?, SHA2(?,256), ?, "PARENT", ?, ?, ?)',
    [email, passwordPlain, username, phone || null, gender, birthIso]
  );

  return {
    id: result.insertId,
    generatedPassword: passwordPlain,
    username,
    email,
    phone: phone || null
  };
}

async function resolveGuardians(conn, guardians, options = { allowNewParents: false }) {
  if (!Array.isArray(guardians)) {
    throw new Error('Danh sách người giám hộ không hợp lệ');
  }

  if (!guardians.length) {
    throw new Error('Cần ít nhất một người giám hộ');
  }

  const records = [];
  const createdParents = [];
  for (const guardian of guardians) {
    if (!guardian) continue;
    const relationship = String(guardian.relationship || '').trim();
    if (!relationship) {
      throw new Error('Thiếu quan hệ phụ huynh-học sinh');
    }

    const relationshipUpper = relationship.toUpperCase();
    if (!['BỐ', 'MẸ', 'ÔNG', 'BÀ', 'GIÁM HỘ', 'KHÁC'].includes(relationshipUpper)) {
      throw new Error('Quan hệ phải là Bố, Mẹ, Ông, Bà, Giám hộ hoặc Khác');
    }
    const relationshipLabel = RELATIONSHIP_VALUES[relationshipUpper] || relationship;

    if (guardian.parent_id) {
      const parentId = Number(guardian.parent_id);
      if (!parentId) {
        throw new Error('parent_id không hợp lệ');
      }
      const [parentRows] = await conn.query('SELECT id FROM users WHERE id=? AND role="PARENT"', [parentId]);
      if (!parentRows.length) {
        throw new Error(`Phụ huynh ${parentId} không tồn tại`);
      }
      records.push({ parentId, relationship: relationshipLabel, relationship_code: relationshipUpper, isNew: false });
      continue;
    }

    if (options.allowNewParents && guardian.parent) {
      const created = await createParentAccount(conn, guardian.parent);
      records.push({ parentId: created.id, relationship: relationshipLabel, relationship_code: relationshipUpper, isNew: true, info: created });
      createdParents.push(created);
      continue;
    }

    throw new Error('Thiếu thông tin phụ huynh');
  }

  return { records, createdParents };
}

function formatSqlError(err) {
  if (!err) return 'Unknown error';
  if (err.sqlMessage) return err.sqlMessage;
  if (err.message) return err.message;
  return String(err);
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

async function loadStudentById(conn, studentId) {
  const [rows] = await conn.query(`
    SELECT u.id,
           u.username,
           u.email,
           u.gender,
           u.birthdate,
           u.phone,
           IFNULL(si.status, 'ACTIVE') AS status,
           si.enrollment_date,
           si.graduation_date,
           c.id AS class_id,
           c.name AS class_name,
           g.id AS grade_id,
           g.grade_number,
           el.id AS level_id,
           el.name AS level_name
    FROM users u
    LEFT JOIN student_info si ON si.user_id = u.id
    LEFT JOIN class_enrollments ce ON ce.student_user_id = u.id AND ce.active = 1
    LEFT JOIN classes c ON c.id = ce.class_id
    LEFT JOIN grades g ON g.id = c.grade_id
    LEFT JOIN education_levels el ON el.id = g.level_id
    WHERE u.role = 'STUDENT' AND u.id = ?
    LIMIT 1
  `, [studentId]);

  if (!rows.length) return null;

  const row = rows[0];
  const [guardianRows] = await conn.query(`
    SELECT ps.parent_id,
           ps.relationship,
           p.username AS parent_name,
           p.email    AS parent_email,
           p.phone    AS parent_phone
    FROM parent_student ps
    JOIN users p ON p.id = ps.parent_id
    WHERE ps.student_id = ?
    ORDER BY p.username ASC
  `, [studentId]);

  const guardians = guardianRows.map(g => ({
    parent_id: g.parent_id,
    parent_name: g.parent_name,
    parent_email: g.parent_email,
    parent_phone: g.parent_phone,
    relationship: RELATIONSHIP_VALUES[String(g.relationship || '').toUpperCase()] || g.relationship || ''
  }));

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    gender: row.gender,
    birthdate: row.birthdate,
    phone: row.phone,
    status: row.status,
    enrollment_date: row.enrollment_date,
    graduation_date: row.graduation_date,
    class: row.class_id ? {
      id: row.class_id,
      name: row.class_name,
      grade_id: row.grade_id,
      grade_number: row.grade_number,
      level_id: row.level_id,
      level_name: row.level_name
    } : null,
    guardians
  };
}

// Create user (teacher/staff/parent/student)

adminRouter.post('/users', async (req, res) => {
  const { email, username, role, phone, gender, birthdate, password } = req.body;
  if (!email || !username || !birthdate || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (!USER_MANAGEMENT_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role STUDENT/PARENT tạo trong trang quản lý học sinh' });
  }
  if (!EMAIL_REGEX.test(String(email))) {
    return res.status(400).json({ error: 'Email không hợp lệ' });
  }
  const phoneText = phone ? String(phone).trim() : '';
  if (phoneText && !/^\d{10}$/.test(phoneText)) {
    return res.status(400).json({ error: 'Số điện thoại phải đủ 10 số' });
  }

  const birthIso = normalizeDateInput(birthdate);
  if (!birthIso) {
    return res.status(400).json({ error: 'Ngày sinh phải dạng dd/mm/yyyy hoặc yyyy-mm-dd' });
  }

  const finalPassword = password && password.length ? password : buildDefaultPassword(username, birthIso);
  const normalizedGender = normalizeGenderInput(gender);

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email đã tồn tại' });
    }
    const [result] = await pool.query(
      'INSERT INTO users (email, password, username, role, phone, gender, birthdate) VALUES (?, SHA2(?,256), ?, ?, ?, ?, ?)',
      [email, finalPassword, username || null, role, phoneText || null, normalizedGender, birthIso]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err && (err.code === 'ER_DUP_ENTRY' || String(err.message || '').includes('Duplicate'))) {
      return res.status(409).json({ error: 'Email đã tồn tại' });
    }
    res.status(400).json({ error: 'Create user failed' });
  }
});


adminRouter.get('/parent-guardians', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ps.student_id,
             ps.parent_id,
             ps.relationship,
             sp.username AS student_name,
             pp.username AS parent_name,
             pp.email AS parent_email
      FROM parent_student ps
      JOIN users sp ON sp.id = ps.student_id
      JOIN users pp ON pp.id = ps.parent_id
      ORDER BY ps.student_id DESC, pp.username ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: formatSqlError(err) });
  }
});

adminRouter.get('/students', async (_req, res) => {
  try {
    const [studentsRows] = await pool.query(`
      SELECT u.id,
             u.username,
             u.email,
             u.gender,
             u.birthdate,
             u.phone,
             IFNULL(si.status, 'ACTIVE') AS status,
             si.enrollment_date,
             si.graduation_date,
             c.id AS class_id,
             c.name AS class_name,
             g.id AS grade_id,
             g.grade_number,
             el.id AS level_id,
             el.name AS level_name
      FROM users u
      LEFT JOIN student_info si ON si.user_id = u.id
      LEFT JOIN class_enrollments ce ON ce.student_user_id = u.id AND ce.active = 1
      LEFT JOIN classes c ON c.id = ce.class_id
      LEFT JOIN grades g ON g.id = c.grade_id
      LEFT JOIN education_levels el ON el.id = g.level_id
      WHERE u.role = 'STUDENT'
      ORDER BY u.id DESC
    `);

    const [guardianRows] = await pool.query(`
      SELECT ps.student_id,
             ps.parent_id,
             ps.relationship,
             p.username AS parent_name,
             p.email AS parent_email,
             p.phone  AS parent_phone
      FROM parent_student ps
      JOIN users p ON p.id = ps.parent_id
      ORDER BY ps.student_id DESC, p.username ASC
    `);

    const guardiansMap = new Map();
    for (const row of guardianRows) {
      const normalizedRel = RELATIONSHIP_VALUES[String(row.relationship || '').toUpperCase()] || row.relationship || '';
      const list = guardiansMap.get(row.student_id) || [];
      list.push({
        parent_id: row.parent_id,
        parent_name: row.parent_name,
        parent_email: row.parent_email,
        parent_phone: row.parent_phone,
        relationship: normalizedRel
      });
      guardiansMap.set(row.student_id, list);
    }

    const payload = studentsRows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      gender: row.gender,
      birthdate: row.birthdate,
      phone: row.phone,
      status: row.status,
      class: row.class_id ? {
        id: row.class_id,
        name: row.class_name,
        grade_id: row.grade_id,
        grade_number: row.grade_number,
        level_id: row.level_id,
        level_name: row.level_name
      } : null,
      enrollment_date: row.enrollment_date,
      graduation_date: row.graduation_date,
      guardians: guardiansMap.get(row.id) || []
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: formatSqlError(err) });
  }
});

adminRouter.get('/students/:id', async (req, res) => {
  const { id } = req.params;
  const studentId = Number(id);
  if (!studentId) {
    return res.status(400).json({ error: 'student_id không hợp lệ' });
  }

  const conn = await pool.getConnection();
  try {
    const student = await loadStudentById(conn, studentId);
    if (!student) {
      return res.status(404).json({ error: 'Học sinh không tồn tại' });
    }
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: formatSqlError(err) });
  } finally {
    conn.release();
  }
});

adminRouter.get('/student-parent-links', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id AS student_id,
             s.username AS student_name,
             s.birthdate,
             s.gender,
             c.name AS class_name,
             g.grade_number,
             el.id AS level_id,
             el.name AS level_name,
             p.id AS parent_id,
             p.username AS parent_name,
             p.email AS parent_email,
             p.phone AS parent_phone
      FROM parent_student ps
      JOIN users s ON s.id = ps.student_id
      LEFT JOIN class_enrollments ce ON ce.student_user_id = s.id AND ce.active = 1
      LEFT JOIN classes c ON c.id = ce.class_id
      LEFT JOIN grades g ON g.id = c.grade_id
      LEFT JOIN education_levels el ON el.id = g.level_id
      JOIN users p ON p.id = ps.parent_id
      ORDER BY el.sort_order, g.grade_number, c.name, s.username
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: formatSqlError(err) });
  }
});

adminRouter.post('/students/assign-parent', async (req, res) => {
  const { student_id, parent_id, relationship } = req.body;
  if (!student_id || !parent_id) {
    return res.status(400).json({ error: 'Thiếu student_id hoặc parent_id' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[studentRow]] = await conn.query('SELECT id FROM users WHERE id=? AND role="STUDENT" LIMIT 1', [student_id]);
    if (!studentRow) {
      await conn.rollback();
      return res.status(404).json({ error: 'Học sinh không tồn tại' });
    }

    const [[parentRow]] = await conn.query('SELECT id FROM users WHERE id=? AND role="PARENT" LIMIT 1', [parent_id]);
    if (!parentRow) {
      await conn.rollback();
      return res.status(404).json({ error: 'Phụ huynh không tồn tại' });
    }

    const relCode = relationship ? String(relationship).trim().toUpperCase() : 'BỐ';
    const relLabel = RELATIONSHIP_VALUES[relCode] || 'Giám hộ';

    await conn.query('DELETE FROM parent_student WHERE student_id=?', [student_id]);
    await conn.query(
      'INSERT INTO parent_student (parent_id, student_id, relationship) VALUES (?, ?, ?)',
      [parent_id, student_id, relLabel]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Gán phụ huynh thất bại', detail: formatSqlError(err) });
  } finally {
    conn.release();
  }
});

adminRouter.post('/students/assign-class', async (req, res) => {
  const { student_id, class_id } = req.body;
  if (!student_id || !class_id) {
    return res.status(400).json({ error: 'Thiếu student_id hoặc class_id' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[studentRow]] = await conn.query('SELECT id FROM users WHERE id=? AND role="STUDENT" LIMIT 1', [student_id]);
    if (!studentRow) {
      await conn.rollback();
      return res.status(404).json({ error: 'Học sinh không tồn tại' });
    }

    const [[classRow]] = await conn.query('SELECT id FROM classes WHERE id=? LIMIT 1', [class_id]);
    if (!classRow) {
      await conn.rollback();
      return res.status(404).json({ error: 'Lớp học không tồn tại' });
    }

    await conn.query('DELETE FROM class_enrollments WHERE student_user_id=? AND active=1', [student_id]);
    await conn.query('INSERT INTO class_enrollments (student_user_id, class_id, active) VALUES (?,?,1)', [student_id, class_id]);

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Gán lớp học thất bại', detail: formatSqlError(err) });
  } finally {
    conn.release();
  }
});

// Teacher-Level management (teacher_school)
adminRouter.get('/teacher-levels', async (req, res) => {
  const { level_id } = req.query;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_level (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        level_id SMALLINT NOT NULL,
        position VARCHAR(100),
        start_date DATE,
        end_date DATE,
        UNIQUE KEY uq_teacher_level (teacher_id, level_id),
        CONSTRAINT fk_tl_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_tl_level   FOREIGN KEY (level_id)   REFERENCES education_levels(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `)
    const sql = `SELECT tl.teacher_id, tl.level_id, tl.position, tl.start_date, tl.end_date,
                        u.username AS teacher_name, u.email AS teacher_email,
                        el.name AS level_name
                 FROM teacher_level tl
                 JOIN users u ON u.id = tl.teacher_id
                 JOIN education_levels el ON el.id = tl.level_id
                 ${level_id? 'WHERE tl.level_id = ?' : ''}
                 ORDER BY tl.level_id, u.username`;
    const params = level_id? [level_id] : [];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list teacher levels' });
  }
});

adminRouter.post('/teacher-levels', async (req, res) => {
  const { teacher_id, level_id, position, start_date, end_date } = req.body;
  if (!teacher_id || !level_id) return res.status(400).json({ error: 'teacher_id và level_id bắt buộc' });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_level (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        level_id SMALLINT NOT NULL,
        position VARCHAR(100),
        start_date DATE,
        end_date DATE,
        UNIQUE KEY uq_teacher_level (teacher_id, level_id),
        CONSTRAINT fk_tl_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_tl_level   FOREIGN KEY (level_id)   REFERENCES education_levels(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `)
    // Validate teacher exists and is TEACHER
    const [tu] = await pool.query('SELECT role FROM users WHERE id=? LIMIT 1', [teacher_id])
    if (!tu.length) return res.status(404).json({ error: 'Giáo viên không tồn tại' })
    if (tu[0].role !== 'TEACHER') return res.status(400).json({ error: 'User không phải TEACHER' })
    // Validate level exists
    const [lv] = await pool.query('SELECT 1 FROM education_levels WHERE id=? LIMIT 1', [level_id])
    if (!lv.length) return res.status(404).json({ error: 'Cấp học không tồn tại' })

    await pool.query(
      'INSERT INTO teacher_level (teacher_id, level_id, position, start_date, end_date) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE position=VALUES(position), start_date=VALUES(start_date), end_date=VALUES(end_date)',
      [teacher_id, level_id, position || null, start_date || null, end_date || null]
    )
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Upsert teacher-level failed' });
  }
});

adminRouter.put('/teacher-levels', async (req, res) => {
  const { teacher_id, level_id, position, start_date, end_date } = req.body;
  if (!teacher_id || !level_id) return res.status(400).json({ error: 'teacher_id và level_id bắt buộc' });
  try {
    await pool.query(
      'UPDATE teacher_level SET position=?, start_date=?, end_date=? WHERE teacher_id=? AND level_id=?',
      [position || null, start_date || null, end_date || null, teacher_id, level_id]
    )
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Update teacher-level failed' });
  }
});

adminRouter.delete('/teacher-levels', async (req, res) => {
  const { teacher_id, level_id } = req.query;
  if (!teacher_id || !level_id) return res.status(400).json({ error: 'teacher_id và level_id bắt buộc' });
  try {
    await pool.query('DELETE FROM teacher_level WHERE teacher_id=? AND level_id=?', [teacher_id, level_id])
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Delete teacher-level failed' });
  }
});

// List users (optional filter by role)
adminRouter.get('/users', async (req, res) => {
  const { role } = req.query
  try {
    let sql
    let params = []
    if (role) {
      sql = 'SELECT id,email,username,role,phone,gender,birthdate FROM users WHERE role=? ORDER BY id DESC'
      params = [role]
    } else {
      sql = 'SELECT id,email,username,role,phone,gender,birthdate FROM users ORDER BY FIELD(role,\'ADMIN\',\'STAFF\',\'TEACHER\',\'STUDENT\',\'PARENT\'), id DESC'
    }
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' })
  }
})

// Update user
adminRouter.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, username, role, phone, gender, birthdate, parent_id, class_id, status } = req.body;
  
  console.log('PUT /users/:id - ID:', id, 'Body:', req.body);
  
  // Xử lý gán phụ huynh cho học sinh
  if (parent_id !== undefined) {
    if (!USER_MANAGEMENT_ROLES.includes('STUDENT')) {
      // just to silence lint about const unused; no effect
    }
    try {
      console.log('Processing parent_id assignment:', parent_id);
      
      // Kiểm tra user có phải học sinh không
      const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
      console.log('User check result:', user);
      if (user.length === 0) return res.status(404).json({ error: 'User không tồn tại' });
      if (user[0].role !== 'STUDENT') return res.status(400).json({ error: 'Chỉ có thể gán phụ huynh cho học sinh' });
      
      // Kiểm tra parent có tồn tại không
      const [parent] = await pool.query('SELECT id FROM users WHERE id = ? AND role = "PARENT"', [parent_id]);
      console.log('Parent check result:', parent);
      if (parent.length === 0) {
        console.log('Parent not found, parent_id:', parent_id);
        return res.status(404).json({ error: 'Phụ huynh không tồn tại' });
      }
      
      if (parent_id === null || parent_id === undefined || parent_id === '') {
        await pool.query('DELETE FROM parent_student WHERE student_id = ?', [id]);
        res.json({ ok: true });
        return;
      }

      const relCode = req.body.relationship ? String(req.body.relationship).trim().toUpperCase() : 'BỐ';
      if (!RELATIONSHIP_VALUES[relCode]) {
        return res.status(400).json({ error: 'Quan hệ không hợp lệ' });
      }

      await pool.query('DELETE FROM parent_student WHERE student_id = ? AND parent_id = ?', [id, parent_id]);
      await pool.query('INSERT INTO parent_student (parent_id, student_id, relationship) VALUES (?, ?, ?)', [parent_id, id, relCode]);
      
      console.log('Parent assignment successful');
      res.json({ ok: true });
      return;
    } catch (err) {
      console.error('Parent assignment error:', err);
      res.status(400).json({ error: 'Gán phụ huynh thất bại: ' + err.message });
      return;
    }
  }
  
  // Xử lý gán lớp học cho học sinh
  if (class_id !== undefined) {
    try {
      console.log('Processing class_id assignment:', class_id);
      
      // Kiểm tra user có phải học sinh không
      const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
      console.log('User check result for class:', user);
      if (user.length === 0) return res.status(404).json({ error: 'User không tồn tại' });
      if (user[0].role !== 'STUDENT') return res.status(400).json({ error: 'Chỉ có thể gán lớp cho học sinh' });
      
      // Kiểm tra class có tồn tại không
      const [classData] = await pool.query('SELECT id FROM classes WHERE id = ?', [class_id]);
      console.log('Class check result:', classData);
      if (classData.length === 0) return res.status(404).json({ error: 'Lớp học không tồn tại' });
      
      // Xóa enrollment cũ nếu có
      await pool.query('DELETE FROM class_enrollments WHERE student_user_id = ? AND active = 1', [id]);
      
      // Tạo enrollment mới
      if (class_id && class_id !== null && class_id !== '') {
        console.log('Inserting class_enrollments:', id, class_id);
        await pool.query('INSERT INTO class_enrollments (student_user_id, class_id, active) VALUES (?, ?, 1)', [id, class_id]);
        console.log('Class enrollment insert successful');
      } else {
        console.log('Skipping class enrollment, class_id is null/empty:', class_id);
      }
      
      console.log('Class assignment successful');
      res.json({ ok: true });
      return;
    } catch (err) {
      console.error('Class assignment error:', err);
      res.status(400).json({ error: 'Gán lớp học thất bại: ' + err.message });
      return;
    }
  }
  
  // Xử lý cập nhật status (nếu có bảng student_info)
  if (status !== undefined) {
    try {
      // Kiểm tra user có phải học sinh không
      const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
      if (user.length === 0) return res.status(404).json({ error: 'User không tồn tại' });
      if (user[0].role !== 'STUDENT') return res.status(400).json({ error: 'Chỉ có thể cập nhật status cho học sinh' });
      
      // Cập nhật status trong bảng student_info (nếu có)
      await pool.query('UPDATE student_info SET status = ? WHERE user_id = ?', [status, id]);
      
      res.json({ ok: true });
      return;
    } catch (err) {
      res.status(400).json({ error: 'Cập nhật status thất bại' });
      return;
    }
  }
  
  // Validation cho update thông tin cơ bản
  if (!email || !username || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]{2,}$/.test(String(email))) return res.status(400).json({ error: 'Email không hợp lệ' });
  if (phone && !/^\d{10}$/.test(String(phone))) return res.status(400).json({ error: 'Số điện thoại phải đủ 10 số' });
  
  try {
    // Duplicate email check excluding this id
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER(?) AND id<>? LIMIT 1', [email, id]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email đã tồn tại' });
    const normalizedGender = normalizeGenderInput(gender);
    await pool.query(
      'UPDATE users SET email=?, username=?, role=?, phone=?, gender=?, birthdate=? WHERE id=?',
      [email, username || null, role, phone || null, normalizedGender, birthdate ? normalizeDateInput(birthdate) : null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Update user failed:', err);
    res.status(400).json({ error: formatSqlError(err) });
  }
});

// Delete user
adminRouter.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Delete user failed' });
  }
});

// School structure management: levels, grades, classes
adminRouter.post('/levels', async (req, res) => {
  const { id, code, name, sort_order } = req.body;
  try {
    await pool.query(
      'INSERT INTO education_levels (id, code, name, sort_order) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE code=VALUES(code), name=VALUES(name), sort_order=VALUES(sort_order)',
      [id, code, name, sort_order]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Upsert level failed' });
  }
});

// Update/Delete levels
adminRouter.put('/levels/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, sort_order } = req.body;
  try {
    await pool.query('UPDATE education_levels SET code=?, name=?, sort_order=? WHERE id=?', [code, name, sort_order, id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: 'Update level failed' }); }
});
adminRouter.delete('/levels/:id', async (req, res) => {
  const { id } = req.params;
  try { await pool.query('DELETE FROM education_levels WHERE id=?', [id]); res.json({ ok: true }); }
  catch (err) { res.status(400).json({ error: 'Delete level failed' }); }
});

adminRouter.get('/levels', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM education_levels ORDER BY sort_order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list levels' });
  }
});

adminRouter.post('/grades', async (req, res) => {
  const { level_id, grade_number } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO grades (level_id, grade_number) VALUES (?, ?)',
      [level_id, grade_number]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(400).json({ error: 'Create grade failed' });
  }
});

// Update/Delete grades
adminRouter.put('/grades/:id', async (req, res) => {
  const { id } = req.params;
  const { level_id, grade_number } = req.body;
  try {
    await pool.query('UPDATE grades SET level_id=?, grade_number=? WHERE id=?', [level_id, grade_number, id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: 'Update grade failed' }); }
});
adminRouter.delete('/grades/:id', async (req, res) => {
  const { id } = req.params;
  try { await pool.query('DELETE FROM grades WHERE id=?', [id]); res.json({ ok: true }); }
  catch (err) { res.status(400).json({ error: 'Delete grade failed' }); }
});

adminRouter.get('/grades', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM grades ORDER BY level_id, grade_number');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list grades' });
  }
});

adminRouter.post('/classes', async (req, res) => {
  const { grade_id, name, homeroom_teacher_id, room_name, active } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO classes (grade_id, name, homeroom_teacher_id, room_name, active) VALUES (?, ?, ?, ?, ?)',
      [grade_id, name, homeroom_teacher_id || null, room_name, active ?? true]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(400).json({ error: 'Create class failed' });
  }
});

// Update/Delete classes
adminRouter.put('/classes/:id', async (req, res) => {
  const { id } = req.params;
  const { grade_id, name, homeroom_teacher_id, room_name, active } = req.body;
  try {
    await pool.query('UPDATE classes SET grade_id=?, name=?, homeroom_teacher_id=?, room_name=?, active=? WHERE id=?', [grade_id, name, homeroom_teacher_id || null, room_name, !!active, id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: 'Update class failed' }); }
});
adminRouter.delete('/classes/:id', async (req, res) => {
  const { id } = req.params;
  try { await pool.query('DELETE FROM classes WHERE id=?', [id]); res.json({ ok: true }); }
  catch (err) { res.status(400).json({ error: 'Delete class failed' }); }
});

adminRouter.get('/classes', async (req, res) => {
  const { grade_id } = req.query;
  try {
    const [rows] = await pool.query(
      grade_id ? 'SELECT * FROM classes WHERE grade_id=? ORDER BY name' : 'SELECT * FROM classes ORDER BY name',
      grade_id ? [grade_id] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list classes' });
  }
});

// Academic: subjects, school years, terms, teacher-subjects
adminRouter.post('/subjects', async (req, res) => {
  const { code, name, level_id, grade_id } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO subjects (code, name, level_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), level_id=VALUES(level_id)',
      [code, name, level_id || null]
    );
    const subjectId = r?.insertId || null;
    if (grade_id && (subjectId || code)) {
      try {
        // use subject_grades if exists
        await pool.query('INSERT INTO subject_grades (subject_id, grade_id) VALUES ((SELECT id FROM subjects WHERE code=?), ?) ON DUPLICATE KEY UPDATE grade_id=VALUES(grade_id)', [code, grade_id]);
      } catch (_e) {
        // ignore if table not present
      }
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Upsert subject failed' });
  }
});

adminRouter.get('/subjects', async (req, res) => {
  const { level_id } = req.query;
  try {
    // Try include grade_id via subject_grades if table exists
    const sqlWithGrade = `
      SELECT s.*, sg.grade_id
      FROM subjects s
      LEFT JOIN subject_grades sg ON sg.subject_id = s.id
      ${level_id ? 'WHERE s.level_id=?' : ''}
      ORDER BY s.name
    `;
    try {
      const [rows] = await pool.query(sqlWithGrade, level_id ? [level_id] : []);
      return res.json(rows);
    } catch (_e) {
      // fallback without join if link table missing
      const [rows] = await pool.query(
        level_id ? 'SELECT * FROM subjects WHERE level_id=? ORDER BY name' : 'SELECT * FROM subjects ORDER BY name',
        level_id ? [level_id] : []
      );
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to list subjects' });
  }
});

adminRouter.put('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, level_id, grade_id } = req.body;
  try {
    await pool.query('UPDATE subjects SET code=?, name=?, level_id=? WHERE id=?', [code, name, level_id || null, id]);
    if (typeof grade_id !== 'undefined') {
      try {
        await pool.query('INSERT INTO subject_grades (subject_id, grade_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE grade_id=VALUES(grade_id)', [id, grade_id || null]);
      } catch (_e) {
        // ignore if link table missing
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Update subject failed' });
  }
});

adminRouter.delete('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM subjects WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Delete subject failed' });
  }
});

adminRouter.post('/school-years', async (req, res) => {
  const { level_id, name, start_date, end_date } = req.body;
  if (!level_id || !name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Thiếu level_id, name, start_date hoặc end_date' });
  }
  try {
    const [r] = await pool.query(
      'INSERT INTO school_years (level_id, name, start_date, end_date) VALUES (?, ?, ?, ?)',
      [level_id, name, start_date, end_date]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Create school year failed' });
  }
});

adminRouter.get('/school-years', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM school_years ORDER BY start_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list school years' });
  }
});

adminRouter.put('/school-years/:id', async (req, res) => {
  const { id } = req.params;
  const { level_id, name, start_date, end_date } = req.body;
  try {
    await pool.query(
      'UPDATE school_years SET level_id=?, name=?, start_date=?, end_date=? WHERE id=?',
      [level_id, name, start_date, end_date, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Update school year failed' });
  }
});

adminRouter.delete('/school-years/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM school_years WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Delete school year failed' });
  }
});

adminRouter.post('/terms', async (req, res) => {
  const { school_year_id, name, term_order, start_date, end_date } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO terms (school_year_id, name, term_order, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [school_year_id, name, term_order, start_date, end_date]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(400).json({ error: 'Create term failed' });
  }
});

adminRouter.get('/terms', async (req, res) => {
  const { school_year_id } = req.query;
  try {
    const [rows] = await pool.query(
      school_year_id ? 'SELECT * FROM terms WHERE school_year_id=? ORDER BY term_order' : 'SELECT * FROM terms ORDER BY term_order',
      school_year_id ? [school_year_id] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list terms' });
  }
});

adminRouter.put('/terms/:id', async (req, res) => {
  const { id } = req.params;
  const { school_year_id, name, term_order, start_date, end_date } = req.body;
  try {
    await pool.query(
      'UPDATE terms SET school_year_id=?, name=?, term_order=?, start_date=?, end_date=? WHERE id=?',
      [school_year_id, name, term_order, start_date, end_date, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Update term failed' });
  }
});

adminRouter.delete('/terms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM terms WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Delete term failed' });
  }
});

adminRouter.post('/teacher-subjects', async (req, res) => {
  const { teacher_user_id, subject_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO teacher_subjects (teacher_user_id, subject_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE teacher_user_id=VALUES(teacher_user_id), subject_id=VALUES(subject_id) ',
      [teacher_user_id, subject_id]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Upsert teacher-subject failed' });
  }
});

// List teacher-subject assignments (optional filters)
adminRouter.get('/teacher-subjects', async (req, res) => {
  const { subject_id, teacher_user_id } = req.query;
  try {
    const where = [];
    const params = [];
    if (subject_id) { where.push('ts.subject_id=?'); params.push(subject_id); }
    if (teacher_user_id) { where.push('ts.teacher_user_id=?'); params.push(teacher_user_id); }
    const sql = `
      SELECT ts.subject_id, ts.teacher_user_id,
             u.username AS teacher_name, u.email AS teacher_email
      FROM teacher_subjects ts
      JOIN users u ON u.id = ts.teacher_user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY u.username
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err?.sqlMessage || err?.message || 'Failed to list teacher-subjects' });
  }
});

// Remove teacher-subject assignment
adminRouter.delete('/teacher-subjects', async (req, res) => {
  const { subject_id, teacher_user_id } = req.query;
  if (!subject_id || !teacher_user_id) return res.status(400).json({ error: 'Thiếu subject_id hoặc teacher_user_id' });
  try {
    await pool.query('DELETE FROM teacher_subjects WHERE subject_id=? AND teacher_user_id=?', [subject_id, teacher_user_id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Delete teacher-subject failed' });
  }
});

// Subject-Levels linking (M:N) using table subject_levels(subject_id, level_id)
adminRouter.get('/subject-levels', async (req, res) => {
  const { subject_id, level_id } = req.query;
  try {
    const where = [];
    const params = [];
    if (subject_id) { where.push('sl.subject_id=?'); params.push(subject_id); }
    if (level_id) { where.push('sl.level_id=?'); params.push(level_id); }
    const sql = `
      SELECT sl.subject_id, sl.level_id, el.name AS level_name, el.code AS level_code
      FROM subject_levels sl
      JOIN education_levels el ON el.id = sl.level_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY el.sort_order, el.name
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err?.sqlMessage || err?.message || 'Failed to list subject-levels' });
  }
});

adminRouter.post('/subject-levels', async (req, res) => {
  const { subject_id, level_id } = req.body;
  if (!subject_id || !level_id) return res.status(400).json({ error: 'Thiếu subject_id hoặc level_id' });
  try {
    await pool.query(
      'INSERT INTO subject_levels (subject_id, level_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE subject_id=VALUES(subject_id), level_id=VALUES(level_id)'
      , [subject_id, level_id]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Upsert subject-level failed' });
  }
});

adminRouter.delete('/subject-levels', async (req, res) => {
  const { subject_id, level_id } = req.query;
  if (!subject_id || !level_id) return res.status(400).json({ error: 'Thiếu subject_id hoặc level_id' });
  try {
    await pool.query('DELETE FROM subject_levels WHERE subject_id=? AND level_id=?', [subject_id, level_id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Delete subject-level failed' });
  }
});

// Timetable Management
adminRouter.get('/periods', async (req, res) => {
  const { level_id } = req.query;
  try {
    const [rows] = await pool.query(
      level_id ? 'SELECT * FROM periods WHERE level_id=? ORDER BY day_of_week, period_index' : 'SELECT * FROM periods ORDER BY level_id, day_of_week, period_index',
      level_id ? [level_id] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list periods' });
  }
});

adminRouter.post('/timetable-entries', async (req, res) => {
  const { term_id, class_id, subject_id, teacher_user_id, day_of_week, period_index } = req.body;
  if (!term_id || !class_id || !subject_id || !teacher_user_id || !day_of_week || !period_index) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }
  try {
    const [r] = await pool.query(
      'INSERT INTO timetable_entries (term_id, class_id, subject_id, teacher_user_id, day_of_week, period_index) VALUES (?, ?, ?, ?, ?, ?)',
      [term_id, class_id, subject_id, teacher_user_id, day_of_week, period_index]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Create timetable entry failed' });
  }
});

adminRouter.get('/timetable-entries', async (req, res) => {
  const { term_id, class_id, teacher_user_id } = req.query;
  try {
    const where = [];
    const params = [];
    if (term_id) { where.push('tte.term_id=?'); params.push(term_id); }
    if (class_id) { where.push('tte.class_id=?'); params.push(class_id); }
    if (teacher_user_id) { where.push('tte.teacher_user_id=?'); params.push(teacher_user_id); }
    
    const sql = `
      SELECT tte.*, 
             s.name AS subject_name,
             u.username AS teacher_name,
             c.name AS class_name,
             t.name AS term_name
      FROM timetable_entries tte
      JOIN subjects s ON s.id = tte.subject_id
      JOIN users u ON u.id = tte.teacher_user_id
      JOIN classes c ON c.id = tte.class_id
      JOIN terms t ON t.id = tte.term_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY tte.day_of_week, tte.period_index
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list timetable entries' });
  }
});

adminRouter.delete('/timetable-entries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM timetable_entries WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Delete timetable entry failed' });
  }
});

// Timetable management
adminRouter.post('/periods', async (req, res) => {
  const { level_id, day_of_week, period_index, start_time, end_time } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO periods (level_id, day_of_week, period_index, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
      [level_id, day_of_week, period_index, start_time, end_time]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(400).json({ error: err?.sqlMessage || err?.message || 'Create period failed' });
  }
});

adminRouter.get('/periods', async (req, res) => {
  const { level_id } = req.query;
  try {
    const [rows] = await pool.query(
      level_id ? 'SELECT * FROM periods WHERE level_id=? ORDER BY day_of_week, period_index' : 'SELECT * FROM periods ORDER BY level_id, day_of_week, period_index',
      level_id ? [level_id] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list periods' });
  }
});
adminRouter.post('/timetable-entries', async (req, res) => {
  const { term_id, class_id, subject_id, teacher_user_id, day_of_week, period_index } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO timetable_entries (term_id, class_id, subject_id, teacher_user_id, day_of_week, period_index) VALUES (?, ?, ?, ?, ?, ?)',
      [term_id, class_id, subject_id, teacher_user_id, day_of_week, period_index]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(400).json({ error: 'Create timetable entry failed' });
  }
});

adminRouter.get('/timetable-entries', async (req, res) => {
  const { term_id, class_id, teacher_user_id } = req.query;
  try {
    const where = [];
    const params = [];
    if (term_id) { where.push('term_id=?'); params.push(term_id); }
    if (class_id) { where.push('class_id=?'); params.push(class_id); }
    if (teacher_user_id) { where.push('teacher_user_id=?'); params.push(teacher_user_id); }
    const sql = `
      SELECT te.*, c.name AS class_name, s.name AS subject_name, u.username AS teacher_name
      FROM timetable_entries te
      JOIN classes c ON c.id = te.class_id
      JOIN subjects s ON s.id = te.subject_id
      JOIN users u ON u.id = te.teacher_user_id
      ${where.length? 'WHERE '+where.join(' AND '): ''}
      ORDER BY te.day_of_week, te.period_index
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list timetable entries' });
  }
});


