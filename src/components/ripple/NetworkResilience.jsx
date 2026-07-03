import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";

/**
 * Network Resilience Dashboard
 * Shows network fragility, critical nodes, and intervention ROI
 * Integrates with cascade analysis to quantify the "invisible chain"
 */
export function NetworkResilience({ analysis }) {
  if (!analysis) {
    return (
      <div className="text-center py-8 text-secondary">
        <p>Network analysis unavailable</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Fragility Score ─── */}
      <motion.div variants={itemVariants}>
        <div className="bg-elevated/50 rounded-lg border border-subtle p-5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-primary">Network Fragility</span>
          </div>

          <div className="space-y-3">
            {/* Score bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-secondary">Resilience Score</span>
                <span className="font-mono font-bold text-lg" style={{ color: getToneColor(analysis.fragilityTone) }}>
                  {100 - analysis.fragilityScore}/100
                </span>
              </div>
              <div className="h-3 bg-surface rounded-full overflow-hidden border border-subtle">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: getToneColor(analysis.fragilityTone) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - analysis.fragilityScore}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Interpretation */}
            <div className="text-sm">
              <p className="text-secondary">
                <strong>{analysis.fragilityLabel}</strong> network:
              </p>
              {analysis.fragilityScore > 70 && (
                <p className="text-xs text-red-400 mt-1">
                  🚨 Few critical nodes. Disrupting {analysis.criticalNodes[0]?.name} cascades entire system.
                </p>
              )}
              {analysis.fragilityScore > 50 && analysis.fragilityScore <= 70 && (
                <p className="text-xs text-orange-400 mt-1">
                  ⚠️ Some critical nodes. {analysis.criticalNodes[0]?.name} and {analysis.criticalNodes[1]?.name} are bottlenecks.
                </p>
              )}
              {analysis.fragilityScore <= 50 && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Multiple redundant connections. Network can absorb shocks.
                </p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-subtle">
              <div className="text-center">
                <div className="font-mono text-sm font-bold text-primary">
                  {analysis.networkStats.connectedPairs}
                </div>
                <div className="text-xs text-secondary">connections</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-sm font-bold text-primary">
                  {analysis.networkStats.isolatedCharacters}
                </div>
                <div className="text-xs text-secondary">isolated</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Critical Nodes ─── */}
      <motion.div variants={itemVariants}>
        <div className="bg-elevated/50 rounded-lg border border-subtle p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-primary">Critical Nodes</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-secondary">
              Protecting these characters prevents cascading collapse
            </p>

            {analysis.criticalNodes.map((node, idx) => (
              <motion.div
                key={node.id}
                className="bg-surface/50 rounded-lg border border-subtle p-3 flex items-center gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <span className="text-lg">{node.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary truncate">
                    {node.name}
                  </div>
                  <div className="text-xs text-secondary flex items-center gap-2">
                    <span>Central. {Math.round(node.centrality)}%</span>
                    <span>•</span>
                    <span>{node.connections} connections</span>
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-mono font-bold"
                  style={{
                    backgroundColor: getToneColor(node.tone) + "20",
                    color: getToneColor(node.tone),
                  }}
                >
                  {node.vulnerability}% vuln.
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Intervention ROI ─── */}
      <motion.div variants={itemVariants}>
        <div className="bg-elevated/50 rounded-lg border border-subtle p-5">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-primary">Highest-Impact Interventions</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-secondary">
              Where to spend intervention budget for maximum cascade prevention
            </p>

            {analysis.interventions.map((int, idx) => (
              <motion.div
                key={int.id}
                className="bg-surface/50 rounded-lg border border-subtle p-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{int.emoji}</span>
                    <span className="font-semibold text-sm text-primary">{int.name}</span>
                  </div>
                  <div
                    className="px-2 py-1 rounded text-xs font-mono font-bold whitespace-nowrap"
                    style={{
                      backgroundColor: getToneColor(int.tone) + "20",
                      color: getToneColor(int.tone),
                    }}
                  >
                    ROI {int.roi}%
                  </div>
                </div>

                <div className="text-xs text-secondary mb-2">
                  {int.summary}
                </div>

                {/* ROI bar */}
                <div className="h-2 bg-surface rounded-full overflow-hidden border border-subtle">
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: getToneColor(int.tone) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, int.roi)}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.1 + 0.2 }}
                  />
                </div>

                <div className="flex justify-between mt-1 text-[10px] text-secondary">
                  <span>Cost: ₹{(int.interventionCost / 1000).toFixed(1)}K</span>
                  <span>Saves: ₹{(int.costPrevented / 1000).toFixed(1)}K</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Key Insight ─── */}
      <motion.div
        variants={itemVariants}
        className="bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg p-4"
      >
        <div className="flex gap-3">
          <Zap className="h-5 w-5 text-accent-cyan flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-accent-cyan mb-1">💡 The Invisible Chain</p>
            <p className="text-xs text-secondary">
              {analysis.fragilityScore > 70
                ? `This economy depends heavily on ${analysis.criticalNodes[0]?.name}. If they collapse, the entire system fails. Strategic intervention here prevents cascading failures.`
                : analysis.fragilityScore > 50
                ? `Protecting ${analysis.criticalNodes[0]?.name} and ${analysis.criticalNodes[1]?.name} could stabilize the entire network and prevent ${analysis.interventions[0]?.costPrevented && `₹${(analysis.interventions[0].costPrevented / 1000).toFixed(1)}K in losses`}.`
                : `This network is resilient—multiple characters can absorb shocks. But targeted support for ${analysis.criticalNodes[0]?.name} accelerates recovery.`}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Helper: Map tone to color hex
 */
function getToneColor(tone) {
  const colors = {
    red: "#ef4444",
    orange: "#f97316",
    amber: "#eab308",
    green: "#22c55e",
    blue: "#3b82f6",
    neutral: "#9ca3af",
  };
  return colors[tone] || colors.neutral;
}
