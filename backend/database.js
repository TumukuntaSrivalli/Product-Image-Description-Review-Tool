import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'vernx.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency and durability
db.exec('PRAGMA journal_mode = WAL;');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    product_id TEXT PRIMARY KEY,
    metadata_title TEXT,
    category TEXT,
    draft TEXT,
    description_short TEXT,
    description_bullets TEXT,
    description_long TEXT,
    edited_text TEXT,
    final_description TEXT,
    status TEXT DEFAULT 'PENDING',
    mode TEXT,
    quality_status TEXT,
    quality_score INTEGER,
    reviewer_note TEXT,
    inaccessible_reason TEXT,
    is_uploaded INTEGER DEFAULT 0,
    page_context TEXT,
    is_decorative INTEGER DEFAULT 0,
    translations_json TEXT,
    flags_json TEXT,
    extra_json TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT,
    action TEXT,
    details_json TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const upsertProductStmt = db.prepare(`
  INSERT INTO products (
    product_id, metadata_title, category, draft, description_short,
    description_bullets, description_long, edited_text, final_description,
    status, mode, quality_status, quality_score, reviewer_note,
    inaccessible_reason, is_uploaded, page_context, is_decorative,
    translations_json, flags_json, extra_json, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, CURRENT_TIMESTAMP
  )
  ON CONFLICT(product_id) DO UPDATE SET
    metadata_title = excluded.metadata_title,
    category = excluded.category,
    draft = excluded.draft,
    description_short = excluded.description_short,
    description_bullets = excluded.description_bullets,
    description_long = excluded.description_long,
    edited_text = excluded.edited_text,
    final_description = excluded.final_description,
    status = excluded.status,
    mode = excluded.mode,
    quality_status = excluded.quality_status,
    quality_score = excluded.quality_score,
    reviewer_note = excluded.reviewer_note,
    inaccessible_reason = excluded.inaccessible_reason,
    is_uploaded = excluded.is_uploaded,
    page_context = excluded.page_context,
    is_decorative = excluded.is_decorative,
    translations_json = excluded.translations_json,
    flags_json = excluded.flags_json,
    extra_json = excluded.extra_json,
    updated_at = CURRENT_TIMESTAMP
`);

const selectAllProductsStmt = db.prepare(`SELECT * FROM products ORDER BY rowid ASC`);
const selectProductStmt = db.prepare(`SELECT * FROM products WHERE product_id = ?`);
const deleteProductStmt = db.prepare(`DELETE FROM products WHERE product_id = ?`);
const clearProductsStmt = db.prepare(`DELETE FROM products`);
const clearAuditStmt = db.prepare(`DELETE FROM audit_history`);

const insertAuditStmt = db.prepare(`
  INSERT INTO audit_history (product_id, action, details_json, timestamp)
  VALUES (?, ?, ?, ?)
`);

const selectAuditStmt = db.prepare(`
  SELECT * FROM audit_history ORDER BY id DESC LIMIT ?
`);

const selectSettingStmt = db.prepare(`SELECT value FROM app_settings WHERE key = ?`);
const upsertSettingStmt = db.prepare(`
  INSERT INTO app_settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

function rowToProduct(row) {
  if (!row) return null;
  const extra = row.extra_json ? JSON.parse(row.extra_json) : {};
  const translations = row.translations_json ? JSON.parse(row.translations_json) : {};
  const flags = row.flags_json ? JSON.parse(row.flags_json) : [];

  return {
    ...extra,
    product_id: row.product_id,
    metadata_title: row.metadata_title ?? extra.metadata_title ?? '',
    category: row.category ?? extra.category ?? '',
    draft: row.draft ?? '',
    description_short: row.description_short ?? '',
    description_bullets: row.description_bullets ?? '',
    description_long: row.description_long ?? '',
    edited_text: row.edited_text ?? '',
    final_description: row.final_description ?? '',
    status: row.status ?? 'PENDING',
    mode: row.mode ?? 'SHORT',
    quality_status: row.quality_status ?? 'GOOD',
    quality_score: row.quality_score !== null ? row.quality_score : 92,
    reviewer_note: row.reviewer_note ?? '',
    inaccessible_reason: row.inaccessible_reason ?? '',
    is_uploaded: Boolean(row.is_uploaded),
    isUploaded: Boolean(row.is_uploaded),
    image_url: extra.image_url || extra.imageUrl || '',
    page_context: row.page_context ?? '',
    is_decorative: Boolean(row.is_decorative),
    translations,
    flags,
  };
}

/**
 * Upsert a single product in SQLite
 */
export function saveProduct(product) {
  if (!product || !product.product_id) return;
  const pid = String(product.product_id);
  const isUploadedVal = Boolean(product.is_uploaded || product.isUploaded || pid.startsWith('UPLOAD-'));

  // Extract separate JSON columns and remaining extra fields
  const {
    translations = {},
    flags = [],
    metadata_title = '',
    category = '',
    draft = '',
    description_short = '',
    description_bullets = '',
    description_long = '',
    edited_text = '',
    final_description = '',
    status = 'PENDING',
    mode = 'SHORT',
    quality_status = 'GOOD',
    quality_score = 92,
    reviewer_note = '',
    inaccessible_reason = '',
    is_uploaded = false,
    isUploaded = false,
    page_context = '',
    is_decorative = false,
    ...extra
  } = product;

  // Preserve image_url in extra so it is saved in extra_json
  if (product.image_url && !extra.image_url) {
    extra.image_url = product.image_url;
  }

  upsertProductStmt.run(
    pid,
    metadata_title,
    category,
    draft,
    description_short,
    description_bullets,
    description_long,
    edited_text,
    final_description,
    status,
    mode,
    quality_status,
    Number(quality_score) || 92,
    reviewer_note,
    inaccessible_reason,
    isUploadedVal ? 1 : 0,
    page_context,
    is_decorative ? 1 : 0,
    JSON.stringify(translations || {}),
    JSON.stringify(flags || []),
    JSON.stringify(extra || {})
  );
}

/**
 * Upsert multiple products in a fast SQLite transaction
 */
export function saveProductsBatch(products) {
  if (!Array.isArray(products) || products.length === 0) return;
  db.exec('BEGIN TRANSACTION');
  try {
    for (const p of products) {
      saveProduct(p);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Get all stored products as a key-value dictionary keyed by product_id
 */
export function getAllProductsMap() {
  const rows = selectAllProductsStmt.all();
  const map = {};
  for (const row of rows) {
    const p = rowToProduct(row);
    if (p && p.product_id) {
      map[p.product_id] = p;
    }
  }
  return map;
}

/**
 * Get all products as an array
 */
export function getAllProductsList() {
  const rows = selectAllProductsStmt.all();
  return rows.map(rowToProduct);
}

/**
 * Get all uploaded products as an array
 */
export function getUploadedProductsList() {
  const rows = db.prepare(`SELECT * FROM products WHERE is_uploaded = 1 OR product_id LIKE 'UPLOAD-%' ORDER BY rowid ASC`).all();
  return rows.map(rowToProduct);
}

/**
 * Get single product by ID
 */
export function getProduct(productId) {
  const row = selectProductStmt.get(String(productId));
  return row ? rowToProduct(row) : null;
}

/**
 * Record an audit log entry
 */
export function logAudit(productId, action, details = {}) {
  const timestamp = new Date().toISOString();
  insertAuditStmt.run(
    productId ? String(productId) : null,
    action,
    JSON.stringify(details || {}),
    timestamp
  );
}

/**
 * Get recent audit logs
 */
export function getAuditHistory(limit = 100) {
  const rows = selectAuditStmt.all(limit);
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    action: r.action,
    details: r.details_json ? JSON.parse(r.details_json) : {},
    timestamp: r.timestamp,
  }));
}

/**
 * Get or set app settings (e.g. merchantName)
 */
export function getSetting(key, defaultValue = '') {
  const row = selectSettingStmt.get(key);
  return row ? row.value : defaultValue;
}

export function setSetting(key, value) {
  upsertSettingStmt.run(key, String(value ?? ''));
}

/**
 * Reset database products and audit history
 */
export function resetDatabase() {
  clearProductsStmt.run();
  clearAuditStmt.run();
}

/**
 * Get comprehensive SQLite database status, file sizes, and table counts
 */
export function getDatabaseStats() {
  let fileSize = 0;
  try {
    if (fs.existsSync(DB_PATH)) {
      fileSize = fs.statSync(DB_PATH).size;
    }
  } catch {}

  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get()?.c || 0;
  const approvedCount = db.prepare("SELECT COUNT(*) as c FROM products WHERE status = 'APPROVED'").get()?.c || 0;
  const editedCount = db.prepare("SELECT COUNT(*) as c FROM products WHERE status = 'EDITED'").get()?.c || 0;
  const auditCount = db.prepare('SELECT COUNT(*) as c FROM audit_history').get()?.c || 0;
  const settingsCount = db.prepare('SELECT COUNT(*) as c FROM app_settings').get()?.c || 0;

  return {
    dbPath: DB_PATH,
    fileName: path.basename(DB_PATH),
    fileSizeBytes: fileSize,
    fileSizeKB: (fileSize / 1024).toFixed(2),
    tables: ['products', 'audit_history', 'app_settings'],
    counts: {
      totalProducts: productCount,
      approvedProducts: approvedCount,
      editedProducts: editedCount,
      auditLogs: auditCount,
      settings: settingsCount,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Safely retrieve rows from a specific table for web inspection
 */
export function getTableRows(tableName, limit = 200) {
  const allowed = {
    products: 'SELECT * FROM products ORDER BY rowid DESC LIMIT ?',
    audit_history: 'SELECT * FROM audit_history ORDER BY id DESC LIMIT ?',
    app_settings: 'SELECT * FROM app_settings ORDER BY key ASC LIMIT ?',
  };

  const sql = allowed[tableName];
  if (!sql) return { error: `Invalid table name: ${tableName}` };

  const rows = db.prepare(sql).all(Number(limit) || 200);
  return {
    tableName,
    count: rows.length,
    rows,
  };
}

export { db, DB_PATH };
