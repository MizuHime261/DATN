import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const projectRoot = path.resolve(__dirname, '../../../');
  const sqlPath = path.join(projectRoot, 'qlth.sql');
  if (!fs.existsSync(sqlPath)) {
    // eslint-disable-next-line no-console
    console.error('qlth.sql not found at', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3307,
    multipleStatements: true,
    charset: 'utf8mb4_general_ci',
    timezone: 'Z'
  });

  try {
    await connection.query(sql);
    // eslint-disable-next-line no-console
    console.log('Database initialized from qlth.sql');
  } finally {
    await connection.end();
  }
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


