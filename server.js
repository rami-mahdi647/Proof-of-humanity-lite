require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const { nanoid } = require("nanoid");
const path = require("path");
const db = require("./db");

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const LICENSES_FILE = path.join(__dirname, "licenses.json");
const LICENSE_RELOAD_INTERVAL_MS = 45000;

const licensesState = {
  values: null,
  mtimeMs: null,
  hasValidSnapshot: false,
  invalidated: true
};

function normalizeLicenses(raw) {
  const entries = Array.isArray(raw) ? raw : raw?.licenses;
  if (!Array.isArray(entries)) {
    throw new Error("licenses.json must contain an array or a { licenses: [] } object");
  }

  return new Set(
    entries
      .map((value) => value?.toString().trim())
      .filter(Boolean)
  );
}

function loadLicenses(force = false) {
  try {
    const stats = fs.statSync(LICENSES_FILE);
    const unchanged = !force && !licensesState.invalidated && licensesState.mtimeMs === stats.mtimeMs;
    if (unchanged && licensesState.hasValidSnapshot) {
      return licensesState.values;
    }

    const file = fs.readFileSync(LICENSES_FILE, "utf8");
    const parsed = JSON.parse(file);
    licensesState.values = normalizeLicenses(parsed);
    licensesState.mtimeMs = stats.mtimeMs;
    licensesState.hasValidSnapshot = true;
    licensesState.invalidated = false;
    return licensesState.values;
  } catch (error) {
    if (error.code === "ENOENT") {
      licensesState.values = null;
      licensesState.mtimeMs = null;
      licensesState.hasValidSnapshot = false;
      licensesState.invalidated = false;
      return null;
    }

    console.warn(`[license] Failed to reload ${LICENSES_FILE}: ${error.message}`);
    licensesState.invalidated = false;

    if (licensesState.hasValidSnapshot) {
      return licensesState.values;
    }

    return null;
  }
}

loadLicenses(true);
setInterval(() => loadLicenses(), LICENSE_RELOAD_INTERVAL_MS).unref();
fs.watchFile(LICENSES_FILE, { interval: 1000 }, () => {
  licensesState.invalidated = true;
  loadLicenses();
});
 codex/refactorizar-requirelicense-para-usar-headers
const LICENSES = {
  "POH-ABCD-1234-Z9Y8": {
    tenant: "demo-wallet",
    plan: "starter",
    maxPerDay: 500
  }
};

function loadLicenses() {
  try {
    const raw = fs.readFileSync("licenses.json", "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

let LICENSES = loadLicenses();
 main

function requireLicense(req, res, next) {
  if (req.path === "/health") return next();

 codex/refactorizar-requirelicense-para-usar-headers
  const incomingKey = req.get("x-license-key") || req.query.license_key || process.env.LICENSE_KEY || "";
  const key = incomingKey.toString().trim().toUpperCase();
  const okFormat = /^POH-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
  const license = LICENSES[key];

  if (!key || !okFormat || !license) {

  const key = (process.env.LICENSE_KEY || "").trim().toUpperCase();
  const okFormat = /^POH-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);

  if (!okFormat) {
 main
    return res.status(503).json({
      error: "Invalid or missing license",
      hint: "Send x-license-key header (format: POH-XXXX-XXXX-XXXX)."
    });
  }

 codex/add-periodic-license-reload-with-error-handling
  const allowedLicenses = loadLicenses();
  if (allowedLicenses && !allowedLicenses.has(key)) {
    return res.status(403).json({
      error: "License key not allowed"
    });
  }


 codex/refactorizar-requirelicense-para-usar-headers
  req.tenant = license.tenant;
  req.plan = license.plan;
  req.maxPerDay = license.maxPerDay;

  const entry = LICENSES[key];
  if (!entry) {
    return res.status(403).json({
      error: "Invalid license key"
    });
  }

  req.tenant = entry.tenant;
  req.plan = entry.plan;
  req.maxPerDay = entry.max_per_day ?? 5000;
 main

 main
  next();
}

app.get("/health", (req, res) => res.json({ ok: true }));
app.use(requireLicense);

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// prompts simples y virales (rotan)
const PROMPTS = [
  "Elige: 1 BTC hoy o pizza infinita. ¿Por qué?",
  "Escribe 10 palabras que un bot probablemente no escribiría.",
  "Completa: “Si Satoshi volviera, lo primero que diría sería…”",
  "¿Qué harías con $100 si NO pudieras comprar crypto?",
  "Describe un recuerdo real en una sola frase."
];

// anti-spam básico en memoria (MVP)
const recent = new Map(); // key: ip, val: timestamp
function tooFast(ip) {
  const now = Date.now();
  const last = recent.get(ip) || 0;
  recent.set(ip, now);
  return now - last < 4000; // 4s
}

const tenantDaily = new Map(); // tenant -> { dayKey, count }
function dayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function tenantExceeded(tenant, max) {
  const key = dayKey();
  const cur = tenantDaily.get(tenant) || { dayKey: key, count: 0 };
  if (cur.dayKey !== key) {
    cur.dayKey = key;
    cur.count = 0;
  }
  cur.count++;
  tenantDaily.set(tenant, cur);
  return cur.count > max;
}

app.get("/api/prompt", (req, res) => {
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt });
});

app.post("/api/prove", (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  if (tooFast(ip)) return res.status(429).json({ error: "Demasiado rápido. Espera unos segundos." });

  if (tenantExceeded(req.tenant, req.maxPerDay)) {
    return res.status(429).json({ error: "Daily limit reached for this license" });
  }

  const prompt = (req.body?.prompt || "").toString().trim();
  const answerRaw = (req.body?.answer || "").toString();

  const answer = answerRaw.replace(/\s+/g, " ").trim();
  if (!prompt || prompt.length < 5) return res.status(400).json({ error: "Prompt inválido." });
  if (!answer || answer.length < 10) return res.status(400).json({ error: "Respuesta demasiado corta (mínimo 10 caracteres)." });
  if (answer.length > 240) return res.status(400).json({ error: "Respuesta demasiado larga (máx 240 caracteres)." });

  const createdAt = Date.now();
  const id = nanoid(10);
  const nonce = crypto.randomBytes(16).toString("hex");

  // hash público (no guarda secretos; MVP conceptual)
  const hash = sha256(`${createdAt}|${prompt}|${answer}|${nonce}`);

  const stmt = db.prepare(`
    INSERT INTO proofs (id, created_at, tenant, prompt, answer, hash, ua, ip_hint)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ua = (req.headers["user-agent"] || "").toString().slice(0, 180);
  const ip_hint = ip ? sha256(ip).slice(0, 10) : null; // no guardamos IP real

  stmt.run(id, createdAt, req.tenant, prompt, answer, hash, ua, ip_hint);

  const origin = `${req.protocol}://${req.get("host")}`;
  res.json({
    id,
    createdAt,
    hash,
    shareUrl: `${origin}/p/${id}`
  });
});

// página de prueba compartible
app.get("/p/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "proof.html"));
});

// datos para render en proof.html
app.get("/api/proof/:id", (req, res) => {
  const id = req.params.id;
  const row = db.prepare("SELECT id, created_at, tenant, prompt, answer, hash FROM proofs WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "No encontrado." });
  res.json(row);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ running on http://localhost:${PORT}`));
