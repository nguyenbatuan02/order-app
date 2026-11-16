require('dotenv').config();
const { sql, getPool } = require('./src/db');
(async () => {
  const pool = await getPool();
  const r = await pool.request().query(`SELECT * FROM B00DocStatus WHERE DocStatus = 3`);
  console.log(JSON.stringify(r.recordset, null, 2));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
