// PostgreSQL Database Configuration
// PostgreSQL ডাটাবেস কনফিগারেশন

const { Pool } = require('pg');
require('dotenv').config();

// Database connection pool তৈরি করা
// এটি multiple database connections পরিচালনা করতে সাহায্য করে
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // সর্বোচ্চ connection সংখ্যা
  idleTimeoutMillis: 30000, // idle connection timeout
  connectionTimeoutMillis: 2000, // connection timeout
});

// Database connection test করা
pool.on('connect', () => {
  console.log('✅ Database এ সফলভাবে connected হয়েছে');
});

// Database error handling
pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Database query function
// এই function ব্যবহার করে সহজে query চালানো যাবে
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`✓ Query executed in ${duration}ms`);
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Database connection test function
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database connection test সফল:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection test ব্যর্থ:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};