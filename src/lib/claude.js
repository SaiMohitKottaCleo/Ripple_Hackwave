/**
 * Thin LLM wrapper with provider routing (Anthropic + Groq).
 * Browser requests go through Vite dev-server proxies so API keys never
 * live in client code.
 */
const CLAUDE_MODEL = import.meta.env.VITE_CLAUDE_MODEL || "claude-sonnet-4-5";
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
const ENV_PROVIDER = String(import.meta.env.VITE_AI_PROVIDER || "auto").toLowerCase();

export const hasAnthropicKey =
  typeof __HAS_ANTHROPIC_KEY__ !== "undefined"
    ? __HAS_ANTHROPIC_KEY__
    : typeof __HAS_AI_KEY__ !== "undefined"
    ? __HAS_AI_KEY__
    : false;

const RUNTIME_PROVIDER =
  typeof __AI_PROVIDER__ !== "undefined" ? String(__AI_PROVIDER__).toLowerCase() : "baked";

export function currentProvider() {
  if (ENV_PROVIDER === "anthropic" || ENV_PROVIDER === "groq") return ENV_PROVIDER;
  if (RUNTIME_PROVIDER === "anthropic" || RUNTIME_PROVIDER === "groq") return RUNTIME_PROVIDER;
  return "baked";
}

export async function callClaude({
  system,
  messages,
  maxTokens = 2048,
  signal,
}) {
  const provider = currentProvider();
  if (provider === "groq") {
    return callGroq({ system, messages, maxTokens, signal });
  }
  if (provider !== "anthropic") {
    throw new Error("No AI provider configured");
  }

  const res = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const text = (json.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return { text, raw: json, provider: "claude" };
}

async function callGroq({ system, messages, maxTokens, signal }) {
  const groqMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages,
  ];

  const res = await fetch("/api/groq/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      temperature: 0.6,
      messages: groqMessages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq API ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content || "";
  return { text, raw: json, provider: "groq" };
}
