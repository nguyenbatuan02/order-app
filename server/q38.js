require('dotenv').config();
const { sql, getPool } = require('./src/db');
(async () => {
  const pool = await getPool();
  const cols = await pool.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'B00DocTracking'`);
  console.log('COLS:', JSON.stringify(cols.recordset.map(c=>c.COLUMN_NAME)));

  const r = await pool.request().query(`
    SELECT TOP 30 t.*
    FROM B00DocTracking t
    JOIN B30AccDoc h ON h.Stt = t.Stt
    WHERE h.DocNo = 'HT211026-020'
    ORDER BY t.Id DESC
  `);
  console.log(JSON.stringify(r.recordset, null, 2));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
