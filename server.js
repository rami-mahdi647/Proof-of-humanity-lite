require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const { nanoid } = require("nanoid");
const path = require("path");
const { db, incrementTenantDailyUsage, cleanupTenantDailyUsage } = require("./db");

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const isProduction = process.env.NODE_ENV === "production";
const localDailyUsage = new Map(); // key: tenant|YYYY-MM-DD, val: count

function requireLicense(req, res, next) {
  if (req.path === "/health") return next();

  const key = (process.env.LICENSE_KEY || "").trim();
  const okFormat = /^POH-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(key);

  if (!key || !okFormat) {
    return res.status(503).json({
      error: "License not configured",
      hint: "Set LICENSE_KEY env var (format: POH-XXXX-XXXX-XXXX)."
    });
  }

  next();
}

function attachTenantLimits(req, res, next) {
  req.tenant = (process.env.TENANT_ID || process.env.LICENSE_KEY || "local-dev").trim();

  const configuredMaxPerDay = Number.parseInt(process.env.MAX_PROOFS_PER_DAY || "1000", 10);
  req.maxPerDay = Number.isInteger(configuredMaxPerDay) && configuredMaxPerDay > 0
    ? configuredMaxPerDay
    : 1000;

  next();
}

app.get("/health", (req, res) => res.json({ ok: true }));
app.use(requireLicense);
app.use(attachTenantLimits);

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function dayKeyFromTimestamp(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function incrementDailyUsage(tenant, dayKey) {
  if (!isProduction) {
    const key = `${tenant}|${dayKey}`;
    const nextValue = (localDailyUsage.get(key) || 0) + 1;
    localDailyUsage.set(key, nextValue);
    return nextValue;
  }

  return incrementTenantDailyUsage(tenant, dayKey);
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

app.get("/api/prompt", (req, res) => {
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt });
});

app.post("/api/prove", (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  if (tooFast(ip)) return res.status(429).json({ error: "Demasiado rápido. Espera unos segundos." });

  const prompt = (req.body?.prompt || "").toString().trim();
  const answerRaw = (req.body?.answer || "").toString();

  const answer = answerRaw.replace(/\s+/g, " ").trim();
  if (!prompt || prompt.length < 5) return res.status(400).json({ error: "Prompt inválido." });
  if (!answer || answer.length < 10) return res.status(400).json({ error: "Respuesta demasiado corta (mínimo 10 caracteres)." });
  if (answer.length > 240) return res.status(400).json({ error: "Respuesta demasiado larga (máx 240 caracteres)." });

  const createdAt = Date.now();
  const dayKey = dayKeyFromTimestamp(createdAt);
  const dailyUsageCount = incrementDailyUsage(req.tenant, dayKey);

  if (dailyUsageCount > req.maxPerDay) {
    return res.status(429).json({
      error: "Límite diario alcanzado para este tenant.",
      tenant: req.tenant,
      dayKey,
      maxPerDay: req.maxPerDay
    });
  }

  const id = nanoid(10);
  const nonce = crypto.randomBytes(16).toString("hex");

  // hash público (no guarda secretos; MVP conceptual)
  const hash = sha256(`${createdAt}|${prompt}|${answer}|${nonce}`);

  const stmt = db.prepare(`
    INSERT INTO proofs (id, created_at, prompt, answer, hash, ua, ip_hint)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const ua = (req.headers["user-agent"] || "").toString().slice(0, 180);
  const ip_hint = ip ? sha256(ip).slice(0, 10) : null; // no guardamos IP real

  stmt.run(id, createdAt, prompt, answer, hash, ua, ip_hint);

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
  const row = db.prepare("SELECT id, created_at, prompt, answer, hash FROM proofs WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "No encontrado." });
  res.json(row);
});

if (isProduction) {
  const keepDays = Number.parseInt(process.env.TENANT_USAGE_RETENTION_DAYS || "", 10);
  if (Number.isInteger(keepDays) && keepDays > 0) {
    const removedRows = cleanupTenantDailyUsage(keepDays);
    console.log(`🧹 tenant_daily_usage cleanup complete (removed ${removedRows} rows, keepDays=${keepDays})`);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ running on http://localhost:${PORT}`));
