const promptPill = document.getElementById("promptPill");
const newPromptBtn = document.getElementById("newPromptBtn");
const answerEl = document.getElementById("answer");
const counter = document.getElementById("counter");
const proveBtn = document.getElementById("proveBtn");
const statusEl = document.getElementById("status");
const result = document.getElementById("result");
const shareUrlEl = document.getElementById("shareUrl");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");

let currentPrompt = "";

async function loadPrompt() {
  statusEl.textContent = "";
  result.style.display = "none";
  const r = await fetch("/api/prompt");
  const data = await r.json();
  currentPrompt = data.prompt;
  promptPill.textContent = currentPrompt;
}

answerEl.addEventListener("input", () => {
  counter.textContent = `${answerEl.value.length}/240`;
});

newPromptBtn.addEventListener("click", loadPrompt);

proveBtn.addEventListener("click", async () => {
  statusEl.textContent = "";
  result.style.display = "none";
  proveBtn.disabled = true;

  try {
    const r = await fetch("/api/prove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: currentPrompt, answer: answerEl.value })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Error");

    shareUrlEl.textContent = data.shareUrl;
    openBtn.href = data.shareUrl;
    result.style.display = "block";
    statusEl.textContent = "✅ Prueba creada.";
  } catch (e) {
    statusEl.textContent = "❌ " + e.message;
  } finally {
    proveBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrlEl.textContent);
    statusEl.textContent = "✅ Link copiado.";
  } catch {
    statusEl.textContent = "No pude copiar automáticamente.";
  }
});

loadPrompt();
