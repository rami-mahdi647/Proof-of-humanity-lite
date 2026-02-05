const Database = require("better-sqlite3");

const db = new Database("data.sqlite");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  hash TEXT NOT NULL,
  tenant TEXT,
  ua TEXT,
  ip_hint TEXT
);
CREATE INDEX IF NOT EXISTS idx_created_at ON proofs(created_at);
`);

try {
  db.exec("ALTER TABLE proofs ADD COLUMN tenant TEXT");
} catch (error) {
  const isDuplicateColumn = error && (error.code === "SQLITE_ERROR" || error.code === "SQLITE_CONSTRAINT") && /duplicate column name/i.test(error.message || "");
  if (!isDuplicateColumn) throw error;
}

module.exports = db;
