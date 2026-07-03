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
function buildDependencyGraph(characters, cascade) {
  const graph = {};
  
  // Initialize
  characters.forEach(c => {
    graph[c.id] = new Set();
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
function calculateInterventionROI(characters, cascade) {
  if (!cascade?.summary) return [];

  const totalIncomeLost = cascade.summary.incomeLost || 0;
  const affectedCount = cascade.summary.affected || 0;
  const avgLossPerPerson = affectedCount > 0 ? totalIncomeLost / affectedCount : 0;

  return characters.map(c => {
    // Estimate: protecting this character prevents their dependent losses
    const connections = 1; // Simplified
    const estimatedCostsPrevented = avgLossPerPerson * connections;
    
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
export function analyzeNetworkResilience(characters, cascade) {
  if (!characters?.length || !cascade?.waves) {
    return null;
  }

  const graph = buildDependencyGraph(characters, cascade);
  const fragility = calculateFragilityScore(graph, characters);
  const criticalNodes = findCriticalNodes(graph, characters, cascade);
  const interventionROI = calculateInterventionROI(characters, cascade);

  // Top 3 most critical: protect these to stabilize network
  const topCritical = criticalNodes.slice(0, 3);
  
  // Top 3 highest ROI interventions
  const topInterventions = interventionROI.slice(0, 3);

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

    // Network stats
    networkStats: {
      totalCharacters: characters.length,
      connectedPairs: Array.from(graph).reduce((sum, [_, set]) => sum + set.size, 0) / 2,
      avgConnectionsPerCharacter: Array.from(graph).reduce((sum, [_, set]) => sum + set.size, 0) / characters.length,
      isolatedCharacters: Object.values(graph).filter(set => set.size === 0).length,
    },
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
