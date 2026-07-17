const ECONOMIC_TYPES = ["serves", "buys_from", "sells_to", "depends_on", "supplies"];

function norm(text) {
  return String(text || "").toLowerCase();
}

function roleMatch(archetype, keywords) {
  const a = norm(archetype);
  return keywords.some((k) => a.includes(k));
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function scorePair(a, b) {
  let score = 0;

  if (norm(a.location) && norm(a.location) === norm(b.location)) score += 24;

  const avgIncome = (Number(a.income || 0) + Number(b.income || 0)) / 2 || 1;
  const incomeGap = Math.abs(Number(a.income || 0) - Number(b.income || 0));
  score += clamp(0, 22, 22 - (incomeGap / avgIncome) * 22);

  const aService = roleMatch(a.archetype, ["driver", "teacher", "police", "worker", "student"]);
  const bCommerce = roleMatch(b.archetype, ["owner", "store", "distributor", "farmer", "pharmacist"]);
  const bService = roleMatch(b.archetype, ["driver", "teacher", "police", "worker", "student"]);
  const aCommerce = roleMatch(a.archetype, ["owner", "store", "distributor", "farmer", "pharmacist"]);
  if ((aService && bCommerce) || (bService && aCommerce)) score += 20;

  const aDeps = Array.isArray(a.dependencies) ? a.dependencies.length : 0;
  const bDeps = Array.isArray(b.dependencies) ? b.dependencies.length : 0;
  score += clamp(0, 14, (aDeps + bDeps) * 2);

  return Math.round(score);
}

function chooseType(a, b) {
  const aa = norm(a.archetype);
  const bb = norm(b.archetype);
  if (aa.includes("student") && (bb.includes("teacher") || bb.includes("school"))) return "teaches";
  if (aa.includes("driver") || bb.includes("driver")) return "serves";
  if (aa.includes("farmer") || bb.includes("farmer")) return "sells_to";
  if (aa.includes("owner") || bb.includes("owner") || aa.includes("store") || bb.includes("store")) {
    return "buys_from";
  }
  return "depends_on";
}

export function canonicalEdgeKey(a, b) {
  const x = Math.min(a, b);
  const y = Math.max(a, b);
  return `${x}:${y}`;
}

export function mergeUniqueConnections(existing, additions) {
  const out = [...existing];
  const seen = new Set(existing.map((e) => canonicalEdgeKey(e.a, e.b)));
  additions.forEach((e) => {
    const key = canonicalEdgeKey(e.a, e.b);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  });
  return out;
}

export function inferConnectionsForCharacter(newCharacter, characters, existingConnections, maxLinks = 3) {
  const others = characters.filter((c) => c.id !== newCharacter.id);
  if (!others.length) return [];

  const existingKeys = new Set((existingConnections || []).map((e) => canonicalEdgeKey(e.a, e.b)));

  const ranked = others
    .map((c) => ({
      target: c,
      score: scorePair(newCharacter, c),
      type: chooseType(newCharacter, c),
    }))
    .filter((x) => x.score >= 24)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLinks);

  return ranked
    .map((r) => ({
      a: newCharacter.id,
      b: r.target.id,
      type: r.type,
      strength: clamp(3, 10, Math.round(r.score / 10) + 3),
    }))
    .filter((e) => !existingKeys.has(canonicalEdgeKey(e.a, e.b)));
}

export function countEconomicLinks(connections = []) {
  return connections.filter((e) => ECONOMIC_TYPES.includes(e.type)).length;
}