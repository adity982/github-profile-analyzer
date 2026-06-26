const mysql2 = require('mysql2/promise');

const pool = mysql2.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'github_analyzer',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset: 'utf8mb4',
});

/**
 * Test the DB connection on startup.
 */
async function connectDB() {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, connectDB };
