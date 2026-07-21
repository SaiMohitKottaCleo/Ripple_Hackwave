import { BAKED_CASCADE } from "./bakedCascade.js";
import { callClaude, hasAnthropicKey } from "./claude.js";

/**
 * Build the cascade for an event by asking Claude to simulate it across the
 * given society of characters. Falls back to the baked cascade when there's
 * no API key, when the call fails, or when the response can't be parsed.
 *
 * Shape returned (matches BAKED_CASCADE):
 *   { event:{emoji,name,tone}, waves:[{n,title,tone,impacts:[...]}], summary:{...} }
 */
export async function simulateCascade({ event, characters, connections, signal }) {
  if (!hasAnthropicKey) return { source: "baked", cascade: BAKED_CASCADE };

  const system = SYSTEM_PROMPT;
  const userMsg = buildUserPrompt({ event, characters, connections });

  try {
    const { text, provider } = await callClaude({
      system,
      messages: [{ role: "user", content: userMsg }],
      maxTokens: 3000,
      signal,
    });
    const parsed = extractJSON(text);
    const normalized = normalizeCascade(parsed, { event, characters });
    if (!normalized?.waves?.length) throw new Error("malformed cascade");
    return { source: provider || "claude", cascade: normalized };
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    console.warn("[ripple] cascade fell back to baked:", err.message);
    return { source: "baked", cascade: BAKED_CASCADE, error: err.message };
  }
}

/**
 * Ask Claude a follow-up question in-character. Falls back to a deterministic
 * canned reply per character when no key is configured.
 */
export async function characterReply({ character, question, history = [], signal }) {
  if (!hasAnthropicKey) return cannedReply(character);

  const system = CHARACTER_SYSTEM(character);
  const messages = [
    ...history.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: question },
  ];
  try {
    const { text } = await callClaude({
      system,
      messages,
      maxTokens: 400,
      signal,
    });
    return text.trim();
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    return cannedReply(character);
  }
}

/* ─────────────────────────── prompts ─────────────────────────── */

const SYSTEM_PROMPT = `You are RIPPLE, a societal cascade simulator.
Given an EVENT and a SOCIETY of characters (with realistic Indian economic data) plus their CONNECTIONS, you imagine how the shock propagates through people's lives in waves.

OUTPUT FORMAT — return ONLY a single JSON object, no prose, no markdown fences:
{
  "event": { "emoji": "...", "name": "...", "tone": "amber" | "green" },
  "waves": [
    {
      "n": 1,
      "title": "Direct Impact",
      "tone": "amber",
      "impacts": [
        {
          "id": <character id>,
          "bubble": "<≤4 word headline shown above their avatar>",
          "diary": "<2–3 sentence first-person Hinglish diary entry — Hindi+English mix, colloquial, mentions specific ₹ figures, names other characters by name when relevant>",
          "rows": [
            ["💰" | "📊" | "⚡" | "🔗" | "🔄", "<label>", "<value>", "amber"|"orange"|"red"|"green"|"neutral"]
          ]
        }
      ]
    }
  ],
  "summary": {
    "totalWaves": <int>, "affected": <int>, "incomeLost": <int>,
    "mostVulnerable": "<character name>", "breaking": <int>, "recoveryDays": <int>,
    "loops": ["<short causal loop description>"]
  }
}

RULES:
- 2–4 waves. Wave 1 = direct impact (amber). Wave 2 = behavioral response (orange). Wave 3+ = second-order cascade (red).
- For positive events use "green" tone throughout.
- Every diary line must be Hinglish (Hindi in Latin script + English), first-person, colloquial. Reference specific rupee amounts.
- Only include characters whose lives plausibly change.
- Keep "bubble" terse: e.g. "Fuel +₹900/mo", "Raised fare ₹15".
- Return valid JSON only.`;

function buildUserPrompt({ event, characters, connections }) {
  const society = characters.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    archetype: c.archetype,
    location: c.location,
    income: c.income,
    fixed: c.fixed,
    emi: c.emi,
    savings: c.savings,
    dependencies: c.dependencies,
  }));
  const ties = connections.map((e) => ({ a: e.a, b: e.b, type: e.type, strength: e.strength }));

  return `EVENT: ${event.emoji} ${event.name}
${event.description ? "Description: " + event.description : ""}

SOCIETY (${society.length} characters):
${JSON.stringify(society, null, 2)}

CONNECTIONS:
${JSON.stringify(ties, null, 2)}

Simulate the cascade. Return the JSON object only.`;
}

function CHARACTER_SYSTEM(c) {
  return `You ARE ${c.name}, a ${c.archetype} from ${c.location}.
Speak in first-person Hinglish (Hindi+English mixed, written in Latin script). Never break character. Never use English-only sentences. Reference real rupee amounts. Keep replies under 60 words.

Your economic reality:
- Monthly income: ₹${c.income.toLocaleString("en-IN")}
- Fixed expenses: ₹${c.fixed.toLocaleString("en-IN")}
- EMI: ₹${c.emi.toLocaleString("en-IN")}
- Savings: ₹${c.savings.toLocaleString("en-IN")}
- Key dependencies: ${(c.dependencies || []).map((d) => d.name).join(", ") || "—"}

You feel the squeeze of every rupee. You worry about your family, your customers, your loans. Answer the human asking you questions.`;
}

function cannedReply(c) {
  const stock = {
    Ramesh: "Toh fare nahi badhaunga. Lekin subsidy kitne din chalegi? Pichli baar 3 mahine mein band ho gayi. CNG conversion ka loan mil jaye toh permanent solution hai.",
    Priya:  "Agar fare subsidy mil jaye toh main wapas auto le sakti hoon. Paidal chalne se padhai ka time bhi waste hota hai. Scholarship bachani hai bas.",
    Lakshmi: "Ramesh chai chhod gaya toh ₹900 kam ho gaye mahine ke. Doodh aur cheeni dono mehnga. Bachche ke school fees kaise dungi pata nahi.",
    Govind: "Diesel ₹2400 zyada lag raha hai. Procurement rate badhaunga toh Suresh bhai kam khareedenge. Kuch toh balance karna padega.",
    Bhagwat: "Pump chalane ka kharcha badh gaya, lekin mandi mein rate same hai. Loan ka EMI bhar bhi nahi paunga is mahine.",
    Suresh: "Customer ko 4 percent zyada lagega. Kuch loyal hain, kuch chod denge. Govind se rate negotiate karne ki koshish karunga.",
    Meera: "Bus mehnga lagta hai, lekin Ramesh ke auto mein roz ja sakti hoon. Time bhi bachta hai aur usko support bhi milta hai.",
    Vikram: "Duty ke liye fuel allowance kam hai. Apni jeb se bharna padega ab. Family ke kharche kaise manage karoon?",
  };
  return stock[c.name] || `Namaste. ${c.name} bol raha hoon. Meri situation mein abhi har rupaya matter karta hai, poochho kya jaanna hai.`;
}

/* ─────────────────────────── helpers ─────────────────────────── */

/** Pull the first JSON object out of a Claude response, tolerating prose around it. */
function extractJSON(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fence ? fence[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeCascade(raw, { event, characters }) {
  if (!raw || !Array.isArray(raw.waves)) return null;

  const ids = new Set((characters || []).map((c) => c.id));
  const tones = new Set(["amber", "orange", "red", "green", "neutral"]);

  const waves = raw.waves
    .map((w, wi) => {
      const impacts = Array.isArray(w?.impacts)
        ? w.impacts
            .map((im) => {
              const id = Number(im?.id);
              if (!Number.isFinite(id) || !ids.has(id)) return null;

              const rows = Array.isArray(im?.rows)
                ? im.rows
                    .filter((r) => Array.isArray(r))
                    .map((r) => [
                      String(r?.[0] ?? "📊"),
                      String(r?.[1] ?? "Impact"),
                      String(r?.[2] ?? "Updated"),
                      tones.has(String(r?.[3])) ? String(r[3]) : "neutral",
                    ])
                : [];

              return {
                id,
                bubble: String(im?.bubble ?? "Impact update"),
                diary: String(im?.diary ?? "No diary entry available."),
                rows,
              };
            })
            .filter(Boolean)
        : [];

      if (!impacts.length) return null;
      return {
        n: Number.isFinite(Number(w?.n)) ? Number(w.n) : wi + 1,
        title: String(w?.title ?? `Wave ${wi + 1}`),
        tone: tones.has(String(w?.tone)) ? String(w.tone) : "amber",
        impacts,
      };
    })
    .filter(Boolean);

  if (!waves.length) return null;

  const affectedIds = new Set(waves.flatMap((w) => w.impacts.map((im) => im.id)));
  const incomeLost = Number(raw?.summary?.incomeLost);
  const breaking = Number(raw?.summary?.breaking);
  const recoveryDays = Number(raw?.summary?.recoveryDays);

  return {
    event: {
      emoji: String(raw?.event?.emoji ?? event?.emoji ?? "⚠️"),
      name: String(raw?.event?.name ?? event?.name ?? "Shock Event"),
      tone: tones.has(String(raw?.event?.tone)) ? String(raw.event.tone) : String(event?.tone ?? "amber"),
    },
    waves,
    summary: {
      totalWaves: Number.isFinite(Number(raw?.summary?.totalWaves))
        ? Number(raw.summary.totalWaves)
        : waves.length,
      affected: Number.isFinite(Number(raw?.summary?.affected))
        ? Number(raw.summary.affected)
        : affectedIds.size,
      incomeLost: Number.isFinite(incomeLost) ? incomeLost : 0,
      mostVulnerable: String(raw?.summary?.mostVulnerable ?? ""),
      breaking: Number.isFinite(breaking) ? breaking : 0,
      recoveryDays: Number.isFinite(recoveryDays) ? recoveryDays : 30,
      loops: Array.isArray(raw?.summary?.loops) ? raw.summary.loops.map((x) => String(x)) : [],
    },
  };
}
