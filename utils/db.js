// utils/db.js
import pkg from 'pg';
const { Pool } = pkg;

export const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

// ตัวช่วย query: คืน rows ตรง ๆ
export const query = async (text, params = []) => {
  const client = await pgPool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows; // ✅ คืน array ของ rows โดยตรง
  } finally {
    client.release();
  }
};
