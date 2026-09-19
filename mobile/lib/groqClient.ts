/**
 * Phase 7 — Groq AI integration, called through a local proxy server
 * (server/index.mjs) so the GROQ_API_KEY never ships inside the app.
 *
 * Architecture rule: the app must keep working if Groq is unavailable —
 * every call here has a deterministic, clearly-labeled fallback.
 */
import Constants from "expo-constants";
import { FieldReportAI, ObservedSign } from "./types";

const PROXY_PORT = 8787;

function getApiBase(): string {
  // Derive the LAN IP Metro is serving from, so a phone on Expo Go can
  // reach the proxy server running on the same machine/network.
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri;
  const host = hostUri ? hostUri.split(":")[0] : "localhost";
  return `http://${host}:${PROXY_PORT}`;
}

const NEGATION_WORDS = ["no", "not", "none", "nothing", "without", "clear", "clear of", "absence of"];

/**
 * Keyword-based fallback has no real language understanding, so a naive
 * substring match on "crack" fires on both "cracks observed" and "no
 * cracks observed". This checks whether a negation word appears in the
 * same comma/period-delimited clause as the keyword, and only counts the
 * keyword as a positive signal when it doesn't.
 */
function keywordPresent(lower: string, keyword: string): boolean {
  if (!lower.includes(keyword)) return false;
  const clauses = lower.split(/[.,;]/);
  return clauses.some((clause) => {
    if (!clause.includes(keyword)) return false;
    return !NEGATION_WORDS.some((neg) => clause.includes(neg));
  });
}

function fallbackAnalysis(text: string, signs: ObservedSign[]): FieldReportAI {
  const lower = text.toLowerCase();
  let category = "general_observation";
  let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (signs.includes("rockfall") || keywordPresent(lower, "rockfall") || keywordPresent(lower, "boulder")) {
    category = "rockfall";
    severity = "HIGH";
  } else if (signs.includes("ground_cracks") || keywordPresent(lower, "crack")) {
    category = "ground_cracking";
    severity = "HIGH";
  } else if (signs.includes("road_obstruction") || keywordPresent(lower, "road")) {
    category = "road_obstruction";
    severity = "MEDIUM";
  } else if (signs.includes("unusual_water_flow") || keywordPresent(lower, "water")) {
    category = "hydrological_anomaly";
    severity = "MEDIUM";
  } else if (signs.length > 0) {
    // No keyword matched but the officer still flagged observed signs —
    // treat as worth a look rather than fully routine.
    severity = "MEDIUM";
  }

  return {
    category,
    severity,
    signals: signs,
    summary: text.length > 140 ? text.slice(0, 137) + "..." : text || "No description provided.",
    confidence: 0.4,
    model: "deterministic-fallback",
    generatedAt: new Date().toISOString(),
    source: "fallback",
  };
}

export async function analyzeReport(text: string, signs: ObservedSign[]): Promise<FieldReportAI> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${getApiBase()}/api/analyze-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, signs }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Proxy responded ${res.status}`);
    const data = await res.json();

    return {
      category: data.category ?? "general_observation",
      severity: data.severity ?? "MEDIUM",
      signals: data.signals ?? signs,
      summary: data.summary ?? text,
      confidence: typeof data.confidence === "number" ? data.confidence : 0.6,
      model: data.model ?? "groq",
      generatedAt: new Date().toISOString(),
      source: "groq",
    };
  } catch {
    return fallbackAnalysis(text, signs);
  } finally {
    clearTimeout(timeout);
  }
}

export type AiStatus = "ONLINE" | "FALLBACK_ONLY" | "OFFLINE";

export async function pingAiService(): Promise<AiStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${getApiBase()}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return "OFFLINE";
    const data = await res.json();
    // The proxy server can be reachable while GROQ_API_KEY is not
    // configured — that's still "the app works" (deterministic fallback),
    // but it is not the same as real Groq analysis being available, so
    // report it distinctly instead of a misleading blanket "ONLINE".
    return data.groqConfigured ? "ONLINE" : "FALLBACK_ONLY";
  } catch {
    return "OFFLINE";
  }
}
