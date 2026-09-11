require('dotenv').config();
const { sql, getPool } = require('./src/db');
(async () => {
  const pool = await getPool();
  const r = await pool.request().query(`
    SELECT * FROM B20Location WHERE Code = 'CDD89' OR Name LIKE '%A02%03%06%'
  `);
  console.log('EXACT:', JSON.stringify(r.recordset, null, 2));

  const r2 = await pool.request().query(`
    SELECT * FROM B20LocationItemGroup WHERE ItemCode = 'FN2402' OR Ma_Vt = 'FN2402'
  `);
  console.log('ITEMGROUP:', JSON.stringify(r2.recordset, null, 2));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
