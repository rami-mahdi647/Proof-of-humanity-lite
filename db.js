const Database = require("better-sqlite3");

const db = new Database("data.sqlite");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  tenant TEXT,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  hash TEXT NOT NULL,
  ua TEXT,
  ip_hint TEXT
);
CREATE INDEX IF NOT EXISTS idx_created_at ON proofs(created_at);
`);

try {
  db.exec("ALTER TABLE proofs ADD COLUMN tenant TEXT");
} catch {
  // columna ya existe
}

module.exports = db;
