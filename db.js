const Database = require("better-sqlite3");

const db = new Database("data.sqlite");
db.pragma("journal_mode = WAL");

function dayKeyFromDate(date) {
  return date.toISOString().slice(0, 10);
}

db.exec(`
CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  tenant TEXT,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  hash TEXT NOT NULL,
  tenant TEXT,
  ua TEXT,
  ip_hint TEXT
);
CREATE INDEX IF NOT EXISTS idx_created_at ON proofs(created_at);

CREATE TABLE IF NOT EXISTS tenant_daily_usage (
  tenant TEXT NOT NULL,
  day_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant, day_key)
);
CREATE INDEX IF NOT EXISTS idx_tenant_daily_usage_day_key ON tenant_daily_usage(day_key);
`);

const upsertTenantDailyUsageStmt = db.prepare(`
  INSERT INTO tenant_daily_usage (tenant, day_key, count)
  VALUES (?, ?, 1)
  ON CONFLICT(tenant, day_key) DO UPDATE SET count = count + 1
`);

const getTenantDailyUsageStmt = db.prepare(`
  SELECT count FROM tenant_daily_usage WHERE tenant = ? AND day_key = ?
`);

 codex/update-database-for-tenant-column
try {
  db.exec("ALTER TABLE proofs ADD COLUMN tenant TEXT");
} catch (error) {
  const isDuplicateColumn = error && (error.code === "SQLITE_ERROR" || error.code === "SQLITE_CONSTRAINT") && /duplicate column name/i.test(error.message || "");
  if (!isDuplicateColumn) throw error;

 codex/implement-daily-usage-limit-tracking
const deleteOldTenantUsageStmt = db.prepare(`
  DELETE FROM tenant_daily_usage WHERE day_key < ?
`);

const incrementTenantDailyUsage = db.transaction((tenant, dayKey) => {
  upsertTenantDailyUsageStmt.run(tenant, dayKey);
  const row = getTenantDailyUsageStmt.get(tenant, dayKey);
  return row?.count || 0;
});

function cleanupTenantDailyUsage(keepDays) {
  if (!Number.isInteger(keepDays) || keepDays <= 0) return 0;

  const oldestKeptDate = new Date();
  oldestKeptDate.setUTCHours(0, 0, 0, 0);
  oldestKeptDate.setUTCDate(oldestKeptDate.getUTCDate() - (keepDays - 1));

  const cutoffDayKey = dayKeyFromDate(oldestKeptDate);
  const result = deleteOldTenantUsageStmt.run(cutoffDayKey);
  return result.changes;
}

module.exports = {
  db,
  incrementTenantDailyUsage,
  cleanupTenantDailyUsage
};

try {
  db.exec("ALTER TABLE proofs ADD COLUMN tenant TEXT");
} catch {
  // columna ya existe
 main
}

module.exports = db;
 main
