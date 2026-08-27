require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { sql, getPool } = require('./db');
const { verifyPassword } = require('./users');

const app = express();
app.use(cors());
app.use(express.json());

const DOC_CODES = ['HD', 'H2', 'XK', 'DV', 'TL', 'R2'];

// In-memory session store (token -> user). Đủ dùng cho app nội bộ quy mô nhỏ.
const sessions = new Map();

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const user = token && sessions.get(token);
  if (!user) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn' });
  }
  req.user = user;
  next();
}

// POST /api/auth/login  body: { ma, mat_khau }
app.post('/api/auth/login', (req, res) => {
  const { ma, mat_khau } = req.body || {};
  if (!ma || !mat_khau) {
    return res.status(400).json({ error: 'Thiếu mã đăng nhập hoặc mật khẩu' });
  }
  const user = verifyPassword(ma, mat_khau);
  if (!user) {
    return res.status(401).json({ error: 'Sai mã đăng nhập hoặc mật khẩu' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, user);
  res.json({ token, user });
});

// POST /api/auth/logout  header: Authorization: Bearer <token>
app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// GET /api/auth/me  header: Authorization: Bearer <token>
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/orders?from=YYYY-MM-DD&to=YYYY-MM-DD -> danh sách đơn hàng trong khoảng ngày (to mặc định = from)
app.get('/api/orders', async (req, res) => {
  const { from, to } = req.query;
  const isValidDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

  if (!isValidDate(from)) {
    return res.status(400).json({ error: 'Query param "from" phải theo định dạng YYYY-MM-DD' });
  }
  const toDate = isValidDate(to) ? to : from;

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('dateFrom', sql.Date, from)
      .input('dateTo', sql.Date, toDate)
      .query(`
        SELECT
            h.DocNo, h.DocDate, h.CustomerCode, h.DocStatus,
            COUNT(ct.ItemCode)   AS so_dong,
            SUM(ct.Amount2)      AS tong_tien
        FROM B30AccDoc h
        JOIN B30AccDocSales ct ON ct.Stt = h.Stt
        WHERE h.DocCode IN (${DOC_CODES.map((_, i) => `'${DOC_CODES[i]}'`).join(',')})
          AND h.DocDate >= @dateFrom AND h.DocDate < DATEADD(day, 1, @dateTo)
        GROUP BY h.DocNo, h.DocDate, h.CustomerCode, h.DocStatus
        ORDER BY h.DocDate DESC;
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

function mapDocStatus(docStatus) {
  if (docStatus <= 1) return 'tiepnhan';
  if (docStatus === 2) return 'chuanbi';
  if (docStatus === 3) return 'donggoi';
  return 'congno';
}

function pad2(n) { return String(n).padStart(2, '0'); }

function fmtTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

function fmtDateTime(dt) {
  if (!dt) return '';
  return `${fmtTime(dt)} ${fmtDate(dt)}`;
}

const SERVICE_CATG_CODES = ['DICHVU', 'HT-DICHVU'];

const ORDER_ROWS_SELECT = `
    h.Stt, h.DocNo, h.DocCode, h.BranchCode, h.DocDate, h.CreatedAt, h.DocStatus, h.CustomerCode,
    c.Name AS CustomerName, c.Tel AS CustomerTel, COALESCE(c.Address, h.Address2, '') AS CustomerAddress,
    h.Goi_Vc, h.WarehouseCode AS HeaderWarehouseCode, w.Name AS HeaderWarehouseName,
    ct.RowId, ct.ItemCode, ct.Description, ct.Quantity, ct.UnitPrice, ct.LocationCode,
    ct.WarehouseCode AS ItemWarehouseCode, wi.Name AS ItemWarehouseName,
    i.ItemCatgCode,
    ct.Thoigiankho, ct.Nvkho, ct.Thoigiandonggoi, ct.Nvdonggoi, ct.Thoigianvanchuyen, ct.NvVanchuyen
  FROM B30AccDoc h
  JOIN B30AccDocSales ct ON ct.Stt = h.Stt
  LEFT JOIN B20Customer c ON c.Code = h.CustomerCode
  LEFT JOIN B20Warehouse w ON w.Code = h.WarehouseCode
  LEFT JOIN B20Warehouse wi ON wi.Code = ct.WarehouseCode
  LEFT JOIN B20Item i ON i.Code = ct.ItemCode
`;

function shippingLabel(goiVc) {
  if (goiVc === 'TH') return 'Giao thường';
  if (goiVc === 'EX') return 'Giao nhanh';
  return 'Khách đến lấy';
}

function rowsToOrders(rows) {
  const ordersByDoc = new Map();
  for (const row of rows) {
    if (!ordersByDoc.has(row.DocNo)) {
      ordersByDoc.set(row.DocNo, {
        id: row.DocNo,
        stt: row.Stt,
        docCode: row.DocCode,
        branchCode: row.BranchCode,
        docDate: row.DocDate,
        customer: row.CustomerName || row.CustomerCode,
        phone: row.CustomerTel || '',
        status: mapDocStatus(row.DocStatus),
        docStatus: row.DocStatus,
        addr: row.CustomerAddress || '',
        time: fmtTime(row.CreatedAt),
        date: fmtDate(row.DocDate),
        shipping: row.Goi_Vc || '',
        shippingLabel: shippingLabel(row.Goi_Vc),
        warehouseCode: row.HeaderWarehouseCode || '',
        warehouseName: row.HeaderWarehouseName || row.HeaderWarehouseCode || '',
        items: [],
        log: [{ stage: 'tiepnhan', person: '', time: fmtDateTime(row.CreatedAt) }],
      });
    }
    const order = ordersByDoc.get(row.DocNo);
    const docStatus = row.DocStatus;

    // Bỏ các dòng thuộc nhóm DỊCH VỤ (cước vận chuyển...) — không có tồn kho, không cần nhặt/đóng gói.
    if (SERVICE_CATG_CODES.includes(row.ItemCatgCode)) continue;

    order.items.push({
      rowId: row.RowId,
      itemCode: row.ItemCode,
      warehouseCode: row.ItemWarehouseCode || '',
      warehouseName: row.ItemWarehouseName || row.ItemWarehouseCode || '',
      name: row.Description,
      sku: row.ItemCode,
      req: row.Quantity,
      shelf: row.LocationCode || '—',
      type: row.ItemCode && row.ItemCode.endsWith('-CC') ? 'chaycua' : 'noibo',
      price: row.UnitPrice,
      done: docStatus >= 3 && !!row.Thoigiandonggoi,
    });

    // Chỉ hiện các bước tiến trình khớp với DocStatus thực tế — DB có thể chứa timestamp
    // "ảo" vượt quá trạng thái hiện tại (dữ liệu import/test cũ), không phản ánh đúng đã xảy ra.
    // Chỉ ghi 1 lần mỗi bước cho cả đơn (không lặp lại theo từng dòng sản phẩm).
    const loggedStages = order._loggedStages || (order._loggedStages = new Set());
    if (docStatus >= 2 && row.Thoigiankho && !loggedStages.has('xacnhan')) {
      loggedStages.add('xacnhan');
      order.log.push({ stage: 'xacnhan', person: row.Nvkho || '', time: fmtDateTime(row.Thoigiankho) });
    }
    if (docStatus >= 3 && row.Thoigiandonggoi && !loggedStages.has('donggoi')) {
      loggedStages.add('donggoi');
      order.log.push({ stage: 'donggoi', person: row.Nvdonggoi || '', time: fmtDateTime(row.Thoigiandonggoi) });
    }
    if (docStatus >= 4 && row.Thoigianvanchuyen && !loggedStages.has('dieuvan')) {
      loggedStages.add('dieuvan');
      order.log.push({ stage: 'dieuvan', person: row.NvVanchuyen || '', time: fmtDateTime(row.Thoigianvanchuyen) });
    }
  }
  for (const order of ordersByDoc.values()) delete order._loggedStages;
  return Array.from(ordersByDoc.values());
}

const STATUS_TO_DOCSTATUS = {
  tiepnhan: [0, 1],
  chuanbi: [2],
  donggoi: [3],
  congno: [4, 5],
};

// GET /api/orders/list?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&pageSize=20&status=&q= -> danh sách đơn hàng đầy đủ (dạng Order), có phân trang + lọc + tìm kiếm
app.get('/api/orders/list', async (req, res) => {
  const { from, to, status, q } = req.query;
  const isValidDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

  if (!isValidDate(from)) {
    return res.status(400).json({ error: 'Query param "from" phải theo định dạng YYYY-MM-DD' });
  }
  const toDate = isValidDate(to) ? to : from;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;

  const docStatusList = STATUS_TO_DOCSTATUS[status];
  const statusClause = docStatusList ? `AND h.DocStatus IN (${docStatusList.join(',')})` : '';
  const searchTerm = typeof q === 'string' ? q.trim() : '';
  const searchClause = searchTerm
    ? `AND (h.DocNo COLLATE Vietnamese_CI_AI LIKE @q COLLATE Vietnamese_CI_AI OR c.Name COLLATE Vietnamese_CI_AI LIKE @q COLLATE Vietnamese_CI_AI OR c.Tel LIKE @q)`
    : '';
  const chayCuaOnly = req.query.chayCua === '1' || req.query.chayCua === 'true';
  const chayCuaClause = chayCuaOnly
    ? `AND EXISTS (SELECT 1 FROM B30AccDocSales cc WHERE cc.Stt = h.Stt AND cc.ItemCode LIKE '%-CC')`
    : '';

  try {
    const pool = await getPool();

    const countReq = pool.request().input('dateFrom', sql.Date, from).input('dateTo', sql.Date, toDate);
    if (searchTerm) countReq.input('q', sql.NVarChar, `%${searchTerm}%`);
    const countResult = await countReq.query(`
        SELECT COUNT(DISTINCT h.DocNo) AS total
        FROM B30AccDoc h
        LEFT JOIN B20Customer c ON c.Code = h.CustomerCode
        WHERE h.DocCode IN (${DOC_CODES.map((_, i) => `'${DOC_CODES[i]}'`).join(',')})
          AND h.DocDate >= @dateFrom AND h.DocDate < DATEADD(day, 1, @dateTo)
          AND EXISTS (SELECT 1 FROM B30AccDocSales ct WHERE ct.Stt = h.Stt)
          ${statusClause}
          ${searchClause}
          ${chayCuaClause}
      `);
    const total = countResult.recordset[0].total;

    const docNoReq = pool.request()
      .input('dateFrom', sql.Date, from)
      .input('dateTo', sql.Date, toDate)
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize);
    if (searchTerm) docNoReq.input('q', sql.NVarChar, `%${searchTerm}%`);
    const docNoResult = await docNoReq.query(`
        SELECT DISTINCT h.DocNo, MAX(h.CreatedAt) AS LastCreatedAt
        FROM B30AccDoc h
        LEFT JOIN B20Customer c ON c.Code = h.CustomerCode
        WHERE h.DocCode IN (${DOC_CODES.map((_, i) => `'${DOC_CODES[i]}'`).join(',')})
          AND h.DocDate >= @dateFrom AND h.DocDate < DATEADD(day, 1, @dateTo)
          AND EXISTS (SELECT 1 FROM B30AccDocSales ct WHERE ct.Stt = h.Stt)
          ${statusClause}
          ${chayCuaClause}
          ${searchClause}
        GROUP BY h.DocNo
        ORDER BY MAX(h.CreatedAt) DESC, h.DocNo DESC
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `);
    const docNos = docNoResult.recordset.map((r) => r.DocNo);

    if (docNos.length === 0) {
      return res.json({ orders: [], total, page, pageSize });
    }

    const request = pool.request();
    docNos.forEach((docNo, i) => request.input(`docNo${i}`, sql.NVarChar, docNo));
    const result = await request.query(`
      SELECT ${ORDER_ROWS_SELECT}
      WHERE h.DocNo IN (${docNos.map((_, i) => `@docNo${i}`).join(',')})
      ORDER BY h.CreatedAt DESC, ct.ItemCode;
    `);

    const orders = rowsToOrders(result.recordset);
    orders.sort((a, b) => docNos.indexOf(a.id) - docNos.indexOf(b.id));

    res.json({ orders, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// GET /api/orders/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&q= -> số lượng đơn theo trạng thái, không phân trang
app.get('/api/orders/summary', async (req, res) => {
  const { from, to, q } = req.query;
  const isValidDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

  if (!isValidDate(from)) {
    return res.status(400).json({ error: 'Query param "from" phải theo định dạng YYYY-MM-DD' });
  }
  const toDate = isValidDate(to) ? to : from;
  const searchTerm = typeof q === 'string' ? q.trim() : '';
  const searchClause = searchTerm ? `AND (h.DocNo COLLATE Vietnamese_CI_AI LIKE @q COLLATE Vietnamese_CI_AI OR c.Name COLLATE Vietnamese_CI_AI LIKE @q COLLATE Vietnamese_CI_AI OR c.Tel LIKE @q)` : '';

  try {
    const pool = await getPool();
    const request = pool.request().input('dateFrom', sql.Date, from).input('dateTo', sql.Date, toDate);
    if (searchTerm) request.input('q', sql.NVarChar, `%${searchTerm}%`);
    const result = await request.query(`
        SELECT h.DocStatus, COUNT(DISTINCT h.DocNo) AS cnt
        FROM B30AccDoc h
        LEFT JOIN B20Customer c ON c.Code = h.CustomerCode
        WHERE h.DocCode IN (${DOC_CODES.map((_, i) => `'${DOC_CODES[i]}'`).join(',')})
          AND h.DocDate >= @dateFrom AND h.DocDate < DATEADD(day, 1, @dateTo)
          AND EXISTS (SELECT 1 FROM B30AccDocSales ct WHERE ct.Stt = h.Stt)
          ${searchClause}
        GROUP BY h.DocStatus
      `);

    const counts = { tiepnhan: 0, suachờ: 0, chuanbi: 0, donggoi: 0, congno: 0 };
    for (const row of result.recordset) {
      counts[mapDocStatus(row.DocStatus)] += row.cnt;
    }
    res.json({ counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// GET /api/orders/find/:docNo -> tra cứu 1 đơn hàng đầy đủ (dạng Order) theo mã, dùng cho quét mã vạch
app.get('/api/orders/find/:docNo', async (req, res) => {
  const { docNo } = req.params;

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('docNo', sql.NVarChar, docNo)
      .query(`
        SELECT ${ORDER_ROWS_SELECT}
        WHERE h.DocNo = @docNo
          AND h.DocCode IN (${DOC_CODES.map((_, i) => `'${DOC_CODES[i]}'`).join(',')})
        ORDER BY ct.ItemCode;
      `);

    const orders = rowsToOrders(result.recordset);
    if (orders.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn hàng ${docNo}` });
    }
    res.json(orders[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// GET /api/orders/:docNo -> chi tiết đơn hàng
app.get('/api/orders/:docNo', async (req, res) => {
  const { docNo } = req.params;

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('docNo', sql.NVarChar, docNo)
      .query(`
        SELECT
            h.DocNo, h.DocDate, h.CustomerCode, h.DocStatus,
            ct.ItemCode,
            ct.Description                              AS ten_vt,
            ct.Quantity                                AS so_luong,
            ROUND(ct.Amount2/NULLIF(ct.Quantity,0),0)  AS don_gia_nb,
            ct.Amount2                                 AS thanh_tien
        FROM B30AccDocSales ct
        JOIN B30AccDoc h ON ct.Stt = h.Stt
        WHERE h.DocNo = @docNo
          AND h.DocCode IN (${DOC_CODES.map((_, i) => `'${DOC_CODES[i]}'`).join(',')})
        ORDER BY ct.ItemCode;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn hàng ${docNo}` });
    }
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

const STEP_CONFIG = {
  kho: { timeCol: 'Thoigiankho', personCol: 'Nvkho', docStatus: 2 },
  donggoi: { timeCol: 'Thoigiandonggoi', personCol: 'Nvdonggoi', docStatus: 3 },
  vanchuyen: { timeCol: 'Thoigianvanchuyen', personCol: 'NvVanchuyen', docStatus: 5 },
};

// POST /api/orders/:docNo/step  (yêu cầu đăng nhập)
// body: { step: 'kho'|'donggoi'|'vanchuyen', items: [{ rowId, itemCode, quantity? }] }
app.post('/api/orders/:docNo/step', requireAuth, async (req, res) => {
  const { docNo } = req.params;
  const { step, items } = req.body || {};
  const employee = req.user.ten;

  const cfg = STEP_CONFIG[step];
  if (!cfg) {
    return res.status(400).json({ error: 'Tham số "step" phải là kho | donggoi | vanchuyen' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Thiếu danh sách "items" cần cập nhật' });
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    const headerResult = await new sql.Request(tx)
      .input('docNo', sql.NVarChar, docNo)
      .query(`
        SELECT h.Stt, h.DocCode, h.BranchCode, h.DocDate
        FROM B30AccDoc h
        WHERE h.DocNo = @docNo AND h.DocCode IN (${DOC_CODES.map((_, i) => `'${DOC_CODES[i]}'`).join(',')})
      `);
    const header = headerResult.recordset[0];
    if (!header) {
      await tx.rollback();
      return res.status(404).json({ error: `Không tìm thấy đơn hàng ${docNo}` });
    }

    for (const item of items) {
      if (!item.rowId || !item.itemCode) continue;
      const request = new sql.Request(tx)
        .input('stt', sql.VarChar, header.Stt)
        .input('itemCode', sql.VarChar, item.itemCode)
        .input('rowId', sql.VarChar, item.rowId)
        .input('employee', sql.NVarChar, employee);

      let setClause = `${cfg.timeCol} = GETDATE(), ${cfg.personCol} = @employee`;
      if (step === 'kho' && item.quantity !== undefined && item.quantity !== null) {
        request.input('quantity', sql.Numeric(18, 4), item.quantity);
        setClause += `, QuantityWarehouse = @quantity`;
      }

      await request.query(`
        UPDATE B30AccDocSales SET ${setClause}
        WHERE Stt = @stt AND ItemCode = @itemCode AND RowId = @rowId
      `);
    }

    await new sql.Request(tx)
      .input('stt', sql.VarChar, header.Stt)
      .input('docStatus', sql.TinyInt, cfg.docStatus)
      .query(`UPDATE B30AccDoc SET DocStatus = @docStatus WHERE Stt = @stt`);

    await new sql.Request(tx)
      .input('branchCode', sql.VarChar, header.BranchCode)
      .input('stt', sql.VarChar, header.Stt)
      .input('docDate', sql.Date, header.DocDate)
      .input('docCode', sql.VarChar, header.DocCode)
      .input('docStatus', sql.TinyInt, cfg.docStatus)
      .query(`
        EXECUTE usp_B30AccDoc_Post
          @_BranchCode=@branchCode, @_Stt=@stt, @_DocDate=@docDate, @_DocCode=@docCode, @_DocStatus=@docStatus
      `);

    await tx.commit();
    res.json({ ok: true, docNo, step, docStatus: cfg.docStatus });
  } catch (err) {
    console.error(err);
    try { await tx.rollback(); } catch (_) {}
    res.status(500).json({ error: 'Lỗi khi ghi dữ liệu vào cơ sở dữ liệu', detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Order API listening on port ${PORT}`);
});
