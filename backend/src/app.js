import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { teacherRouter } from './routes/teacher.js';
import { staffRouter } from './routes/staff.js';
import { parentRouter } from './routes/parent.js';
import { studentRouter } from './routes/student.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'qlth-backend' });
});

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/teacher', teacherRouter);
app.use('/staff', staffRouter);
app.use('/parent', parentRouter);
app.use('/student', studentRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`QLTH backend running on http://localhost:${PORT}`);
});


