const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Database = require('better-sqlite3');

const DEFAULT_SOURCE = 'UK Lodged TM44s at December25 - MASTER.xlsx';
const sourceFile = process.argv[2] || DEFAULT_SOURCE;
const dbPath = process.env.DB_PATH || path.join('data', 'records.db');

if (!fs.existsSync(sourceFile)) {
  console.error(`Source Excel file not found: ${sourceFile}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const workbook = XLSX.readFile(sourceFile, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

if (rows.length === 0) {
  console.error('No rows found in the Excel sheet.');
  process.exit(1);
}

const originalColumns = Object.keys(rows[0]);
const used = new Set();

function sanitizeColumn(name) {
  let col = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!col) col = 'col';
  if (/^\d/.test(col)) col = `col_${col}`;
  const base = col;
  let suffix = 1;
  while (used.has(col)) {
    col = `${base}_${suffix++}`;
  }
  used.add(col);
  return col;
}

const columns = originalColumns.map((name) => ({
  original: name,
  column: sanitizeColumn(name),
}));

const db = new Database(dbPath);

db.exec('PRAGMA journal_mode = WAL;');

db.exec('CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);');

const columnSql = columns.map((col) => `"${col.column}" TEXT`).join(', ');
const createSql = `CREATE TABLE records (id INTEGER PRIMARY KEY AUTOINCREMENT, ${columnSql});`;

db.exec(createSql);

const insertColumns = columns.map((col) => `"${col.column}"`).join(', ');
const placeholders = columns.map(() => '?').join(', ');
const insertStmt = db.prepare(`INSERT INTO records (${insertColumns}) VALUES (${placeholders})`);

const insertRows = db.transaction((data) => {
  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col.original];
      return value === null || value === undefined ? '' : String(value);
    });
    insertStmt.run(values);
  }
});

insertRows(rows);

const metaStmt = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
metaStmt.run('columns', JSON.stringify(columns));
metaStmt.run('source_file', path.basename(sourceFile));
metaStmt.run('sheet_name', sheetName);
metaStmt.run('row_count', String(rows.length));

console.log(`Imported ${rows.length} rows from ${sourceFile} (${sheetName}) into ${dbPath}`);

