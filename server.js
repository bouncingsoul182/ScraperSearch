const fs = require('fs');
const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'records.db');

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at ${DB_PATH}. Run: node scripts/import_excel.js`);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });
const metaStmt = db.prepare('SELECT value FROM meta WHERE key = ?');
const allColumns = JSON.parse(metaStmt.get('columns').value);
const columns = allColumns.filter((col) => col.original !== 'Assessor’s name');
const addressNameColumn = allColumns.find((col) => col.original === 'Address - Name');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

function escapeLike(input) {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function formatDateUk(value) {
  if (!value) return value;
  const trimmed = String(value).trim();
  const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const monthMap = {
      jan: '01',
      feb: '02',
      mar: '03',
      apr: '04',
      may: '05',
      jun: '06',
      jul: '07',
      aug: '08',
      sep: '09',
      oct: '10',
      nov: '11',
      dec: '12',
    };
    const month = monthMap[monthName] || '01';
    const year = Number(match[3]) >= 70 ? `19${match[3]}` : `20${match[3]}`;
    return `${day}/${month}/${year}`;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3].length === 2
      ? Number(slashMatch[3]) >= 70
        ? `19${slashMatch[3]}`
        : `20${slashMatch[3]}`
      : slashMatch[3];
    return `${day}/${month}/${year}`;
  }

  return value;
}

app.get('/api/columns', (req, res) => {
  res.json({ columns });
});

app.get('/api/search', (req, res) => {
  const rawQuery = String(req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

  let where = '';
  const params = [];

  if (rawQuery && addressNameColumn) {
    const query = `%${escapeLike(rawQuery)}%`;
    where = `WHERE \"${addressNameColumn.column}\" LIKE ? ESCAPE '\\'`;
    params.push(query);
  }

  const sql = `SELECT * FROM records ${where} ORDER BY id LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...params, limit, offset);

  const results = rows.map((row) => {
    const mapped = {};
    for (const col of columns) {
      let value = row[col.column];
      if (col.original === 'Inspection date') {
        value = formatDateUk(value);
      }
      mapped[col.original] = value;
    }
    return mapped;
  });

  res.json({
    query: rawQuery,
    column: addressNameColumn ? addressNameColumn.column : '',
    limit,
    offset,
    count: results.length,
    rows: results,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Search running at http://${HOST}:${PORT}`);
});
