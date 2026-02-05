const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const { nanoid } = require("nanoid");
const path = require("path");
const db = require("./db");

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ running on http://localhost:${PORT}`));
