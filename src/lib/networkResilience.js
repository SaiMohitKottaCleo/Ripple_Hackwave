/**
 * Network Resilience Analysis
 * Quantifies the "invisible chain" by calculating:
 * - Network Fragility Score (0-100)
 * - Critical nodes (characters whose protection prevents cascades)
 * - Cascade Prevention ROI for each character
 */

/**
 * Build a character dependency graph
 * Returns adjacency map: { characterId: [connectedIds] }
 */
function buildDependencyGraph(characters, cascade, connections = []) {
  const graph = {};
  
  // Initialize
  characters.forEach(c => {
    graph[c.id] = new Set();
  });

  // Seed graph from explicit character links in the builder.
  connections.forEach((e) => {
    if (graph[e.a] && graph[e.b]) {
      graph[e.a].add(e.b);
      graph[e.b].add(e.a);
    }
  });

  // If cascade has waves with impacts, extract dependency patterns
  if (cascade?.waves) {
    cascade.waves.forEach(wave => {
      wave.impacts?.forEach(impact => {
        // Look for characters mentioned in diary entries
        const diaryText = impact.diary || "";
        const bubbleText = impact.bubble || "";
        
        characters.forEach(other => {
          if (other.id !== impact.id) {
            // Simple heuristic: if character name appears in impact text, they're connected
            if (
              diaryText.toLowerCase().includes(other.name.toLowerCase()) ||
              bubbleText.toLowerCase().includes(other.name.toLowerCase())
            ) {
              graph[impact.id].add(other.id);
              graph[other.id].add(impact.id); // Bidirectional
            }
          }
        });
      });
    });
  }

  // If no explicit connections found, use vulnerability/income patterns
  if (Object.values(graph).every(set => set.size === 0)) {
    // Heuristic: characters in similar income brackets or archetypes are connected
    characters.forEach((c, i) => {
      characters.forEach((other, j) => {
        if (i < j) {
          const incomeDiff = Math.abs(c.income - other.income);
          const avgIncome = (c.income + other.income) / 2;
          
          // If income within 40% of average, likely connected
          if (incomeDiff < avgIncome * 0.4) {
            graph[c.id].add(other.id);
            graph[other.id].add(c.id);
          }
        }
      });
    });
  }

  return graph;
}

/**
 * Calculate centrality score for each character (0-100)
 * High centrality = character is critical to network stability
 */
function calculateCentrality(characterId, graph, characters) {
  const connections = graph[characterId]?.size || 0;
  const degree = (connections / (characters.length - 1)) * 100;

  // Betweenness approximation: shortest path from this node to others
  let betweenness = 0;
  const visited = new Set();
  const queue = [[characterId, 0, new Set([characterId])]];

  while (queue.length > 0) {
    const [nodeId, depth, path] = queue.shift();
    if (depth > 2 || visited.has(nodeId)) continue;
    visited.add(nodeId);

    graph[nodeId]?.forEach(next => {
      if (!path.has(next)) {
        const newPath = new Set([...path, next]);
        betweenness += 1 / newPath.size;
        queue.push([next, depth + 1, newPath]);
      }
    });
  }

  return Math.min(100, degree * 0.6 + (betweenness / characters.length) * 40);
}

/**
 * Calculate Network Fragility Score (0-100)
 * 0 = very resilient (many redundant connections)
 * 100 = very fragile (few critical nodes)
 */
function calculateFragilityScore(graph, characters) {
  const centralityScores = characters.map(c => 
    calculateCentrality(c.id, graph, characters)
  );

  const avgCentrality = centralityScores.reduce((a, b) => a + b, 0) / centralityScores.length;
  const variance = centralityScores.reduce((sum, score) => 
    sum + Math.pow(score - avgCentrality, 2), 0
  ) / centralityScores.length;

  // High variance = some critical nodes, others not = fragile
  // Low variance = balanced = resilient
  const fragility = Math.min(100, Math.round((variance / avgCentrality) * 2));
  
  return fragility;
}

/**
 * Find critical nodes: characters whose removal (or protection via intervention) most affects cascade
 */
function findCriticalNodes(graph, characters, cascade) {
  const centralityScores = characters.map(c => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    centrality: calculateCentrality(c.id, graph, characters),
    connections: graph[c.id]?.size || 0,
    income: c.income,
    savings: c.savings,
    vulnerability: Math.max(0, Math.min(100, Math.round(100 - (c.savings / c.income) * 100))),
  }));

  return centralityScores.sort((a, b) => b.centrality - a.centrality);
}

/**
 * Calculate intervention ROI for each character
 * ROI = (total cascade cost prevented) / (intervention cost)
 */
function calculateInterventionROI(characters, cascade, graph) {
  if (!cascade?.summary) return [];

  const totalIncomeLost = cascade.summary.incomeLost || 0;
  const affectedCount = cascade.summary.affected || 0;
  const avgLossPerPerson = affectedCount > 0 ? totalIncomeLost / affectedCount : 0;

  return characters.map(c => {
    // Estimate: protecting this character prevents their dependent losses
    const connections = graph[c.id]?.size || 0;
    const centralityWeight = Math.max(0.6, Math.min(2, connections / 2));
    const estimatedCostsPrevented = avgLossPerPerson * Math.max(1, connections) * centralityWeight;
    
    // Rough intervention cost: 1-2 months of their income as emergency support
    const interventionCost = c.income * 1.5;
    
    const roi = interventionCost > 0 ? 
      Math.round((estimatedCostsPrevented / interventionCost) * 100) : 
      0;

    return {
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      interventionCost: Math.round(interventionCost),
      costPrevented: Math.round(estimatedCostsPrevented),
      roi: Math.max(0, roi),
      priority: roi > 50 ? "high" : roi > 25 ? "medium" : "low",
    };
  }).sort((a, b) => b.roi - a.roi);
}

/**
 * Main analysis function
 * Returns comprehensive network resilience report
 */
export function analyzeNetworkResilience(characters, cascade, connections = []) {
  if (!characters?.length || !cascade?.waves) {
    return null;
  }

  const graph = buildDependencyGraph(characters, cascade, connections);
  const fragility = calculateFragilityScore(graph, characters);
  const criticalNodes = findCriticalNodes(graph, characters, cascade);
  const interventionROI = calculateInterventionROI(characters, cascade, graph);

  // Top 3 most critical: protect these to stabilize network
  const topCritical = criticalNodes.slice(0, 3);
  
  // Top 3 highest ROI interventions
  const topInterventions = interventionROI.slice(0, 3);
  const shockDNA = computeShockDNA(cascade);

  return {
    // Fragility score: how vulnerable is the network?
    fragilityScore: Math.round(fragility),
    fragilityLabel: fragility > 70 ? "Very Fragile" : fragility > 50 ? "Fragile" : fragility > 30 ? "Moderate" : "Resilient",
    fragilityTone: fragility > 70 ? "red" : fragility > 50 ? "orange" : fragility > 30 ? "amber" : "green",

    // Critical nodes: who matters most?
    criticalNodes: topCritical.map(n => ({
      ...n,
      tone: n.vulnerability > 70 ? "red" : n.vulnerability > 50 ? "orange" : "amber",
    })),

    // Intervention recommendations
    interventions: topInterventions.map(int => ({
      ...int,
      tone: int.priority === "high" ? "green" : int.priority === "medium" ? "amber" : "neutral",
      summary: `₹${(int.interventionCost / 1000).toFixed(1)}K to ${int.name} could save ₹${(int.costPrevented / 1000).toFixed(1)}K`,
    })),

    shockDNA,

    // Network stats
    networkStats: {
      totalCharacters: characters.length,
      connectedPairs: Object.values(graph).reduce((sum, set) => sum + set.size, 0) / 2,
      avgConnectionsPerCharacter: Object.values(graph).reduce((sum, set) => sum + set.size, 0) / characters.length,
      isolatedCharacters: Object.values(graph).filter(set => set.size === 0).length,
    },
  };
}

function computeShockDNA(cascade) {
  const waves = cascade?.waves || [];
  if (!waves.length) {
    return {
      spreadRate: 0,
      spreadLabel: "steady",
      concentration: 0,
      concentrationLabel: "distributed",
      persistence: 0,
      persistenceLabel: "short",
    };
  }

  const counts = waves.map((w) => (w.impacts || []).length || 0);
  const peak = Math.max(...counts);
  const total = counts.reduce((a, b) => a + b, 0) || 1;

  let transitions = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i - 1] > 0) transitions += counts[i] / counts[i - 1];
  }

  const spreadRate = counts.length > 1 ? Math.round((transitions / (counts.length - 1)) * 100) : counts[0] > 1 ? 100 : 20;
  const concentration = Math.round((peak / total) * 100);
  const persistence = Math.round((counts.filter((x) => x > 0).length / counts.length) * 100);

  return {
    spreadRate,
    spreadLabel: spreadRate > 120 ? "explosive" : spreadRate > 80 ? "fast" : "contained",
    concentration,
    concentrationLabel: concentration > 45 ? "single-node heavy" : "distributed",
    persistence,
    persistenceLabel: persistence > 80 ? "long-tail" : persistence > 55 ? "multi-wave" : "short",
  };
}

export function buildResilienceBlueprint({ characters, cascade, connections = [], totalBudget = 0 }) {
  const analysis = analyzeNetworkResilience(characters, cascade, connections);
  if (!analysis?.interventions?.length) {
    return {
      budget: totalBudget,
      allocated: 0,
      projectedSavings: 0,
      plans: [],
    };
  }

  const ranked = [...analysis.interventions].sort((a, b) => b.roi - a.roi);
  let remaining = Math.max(0, totalBudget);
  const plans = [];
  let projectedSavings = 0;

  ranked.forEach((row, idx) => {
    if (remaining <= 0 || idx >= 4) return;
    const ask = row.interventionCost;
    const grant = Math.min(ask, remaining);
    if (grant <= 0) return;
    const ratio = ask > 0 ? grant / ask : 0;
    const projected = Math.round(row.costPrevented * ratio);
    projectedSavings += projected;
    remaining -= grant;
    plans.push({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      grant,
      projectedSavings: projected,
      roi: row.roi,
      tone: row.tone,
    });
  });

  return {
    budget: totalBudget,
    allocated: totalBudget - remaining,
    projectedSavings,
    plans,
  };
}

/**
 * Quantify what-if: How would cascade change if character got intervention?
 * Returns estimated savings if this character is protected
 */
export function estimateInterventionImpact(character, characters, cascade) {
  if (!cascade?.summary) return 0;

  // Rough estimate: protecting 1 critical character saves ~20-40% of cascade damage
  const graph = buildDependencyGraph(characters, cascade);
  const centrality = calculateCentrality(character.id, graph, characters);
  
  const impactFactor = centrality / 100; // 0 to 1
  const totalCascadeCost = cascade.summary.incomeLost || 0;
  
  return Math.round(totalCascadeCost * impactFactor);
}
