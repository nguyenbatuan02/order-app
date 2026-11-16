require('dotenv').config();
const { sql, getPool } = require('./src/db');
(async () => {
  const pool = await getPool();
  const r = await pool.request().query(`
    SELECT name, is_tracked_by_cdc FROM sys.tables WHERE name = 'B30AccDoc'
  `);
  console.log('B30AccDoc CDC:', JSON.stringify(r.recordset, null, 2));

  const r2 = await pool.request().query(`
    SELECT * FROM cdc.change_tables
  `);
  console.log('change_tables:', JSON.stringify(r2.recordset, null, 2));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
