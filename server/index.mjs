// GeoShield-NER Groq proxy server (Phase 7).
//
// Purpose: the mobile app must NEVER hold GROQ_API_KEY. This tiny server
// is the only thing that talks to Groq; the app calls this server over
// the local network instead. If GROQ_API_KEY is missing or the call
// fails/times out, this server responds with an error and the app's
// groqClient.ts falls back to a deterministic local analysis so the
// demo keeps working either way.
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf-8");
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

const env = { ...loadEnvFile(), ...process.env };
const GROQ_API_KEY = env.GROQ_API_KEY;
const GROQ_MODEL = env.GROQ_MODEL || "llama-3.1-8b-instant";
const PORT = Number(env.PORT || 8787);

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, body) {
  withCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf-8")) : {};
}

async function callGroqClassifier(text, signs) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  const systemPrompt = `You are an assistant for a landslide early-warning system. Given a field officer's report text and a list of observed signs, respond with ONLY a compact JSON object (no markdown, no prose) of the exact shape:
{"category": string, "severity": "LOW"|"MEDIUM"|"HIGH", "signals": string[], "summary": string, "confidence": number between 0 and 1}
Base your answer only on the supplied text and signs. Do not invent facts not present in the input.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Report text: ${text}\nObserved signs: ${signs.join(", ") || "none"}` },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    return { ...parsed, model: GROQ_MODEL };
  } finally {
    clearTimeout(timeout);
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    withCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, { status: "ok", groqConfigured: Boolean(GROQ_API_KEY) });
    return;
  }

  if (req.method === "POST" && req.url === "/api/analyze-report") {
    try {
      const body = await readBody(req);
      const text = String(body.text || "");
      const signs = Array.isArray(body.signs) ? body.signs : [];
      const result = await callGroqClassifier(text, signs);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 502, { error: String(err.message || err) });
    }
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`GeoShield-NER Groq proxy listening on http://localhost:${PORT}`);
  console.log(`GROQ_API_KEY configured: ${Boolean(GROQ_API_KEY)}`);
});
