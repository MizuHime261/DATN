import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db/pool.js';

export const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  
  // Validate Gmail email
  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'Tài khoản gmail không hợp lệ' });
  }
  
  try {
    // Passwords in seed are SHA2(256). Let MySQL compute and compare.
    const [rows] = await pool.query(
      'SELECT id, email, username, role FROM users WHERE email = ? AND password = SHA2(?, 256) LIMIT 1',
      [email, password]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu sai' });
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'dev',
      { expiresIn: '8h' }
    );
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Tài khoản hoặc mật khẩu sai' });
  }
});

authRouter.post('/logout', (_req, res) => {
  // JWT is stateless; client should discard token.
  res.json({ ok: true });
});

// Forgot password: issue reset token and send email
authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiryMs = Date.now() + 1000 * 60 * 15; // 15 minutes
    const [result] = await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ? LIMIT 1',
      [resetToken, expiryMs, email]
    );
    // Avoid user enumeration; return ok even if not matched
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send email if SMTP configured; do not fail if sending fails
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Đặt lại mật khẩu - QLTH',
          html: `<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p>Nhấn vào liên kết sau trong 15 phút:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
      } catch (mailErr) {
        // eslint-disable-next-line no-console
        console.warn('Email sending failed, but token issued:', mailErr?.message);
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('EMAIL_USER/EMAIL_PASS not set; skipping email send');
    }

    res.json({ ok: true, message: 'Nếu email tồn tại, liên kết đặt lại đã được gửi.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not process request' });
  }
});

// Reset password: verify token and set new password
authRouter.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });
  try {
    const now = Date.now();
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry IS NOT NULL AND reset_token_expiry > ? LIMIT 1',
      [token, now]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const userId = rows[0].id;
    await pool.query(
      'UPDATE users SET password = SHA2(?,256), reset_token = NULL, reset_token_expiry = NULL WHERE id = ? LIMIT 1',
      [password, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});


