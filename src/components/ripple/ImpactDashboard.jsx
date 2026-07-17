import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Users, Waves, AlertTriangle, BarChart3 } from "lucide-react";
import { analyzeNetworkResilience, buildResilienceBlueprint } from "../../lib/networkResilience.js";
import { NetworkResilience } from "./NetworkResilience.jsx";

const TONE_COLORS = {
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  green: "#22c55e",
};

/**
 * Impact Dashboard - Shows societal metrics after cascade
 */
export function ImpactDashboard({ cascade, characters, connections = [] }) {
  if (!cascade) return null;

  const summary = cascade.summary || {};
  const totalWaves = summary.totalWaves || cascade.waves.length;
  const affected = summary.affected || new Set(cascade.waves.flatMap((w) => w.impacts.map((i) => i.id))).size;
  const incomeLost = summary.incomeLost || 0;
  const breaking = summary.breaking || 0;
  const mostVulnerable = summary.mostVulnerable || "Unknown";
  const recoveryDays = summary.recoveryDays || "?";

  // Calculate network resilience analysis
  const networkAnalysis = analyzeNetworkResilience(characters, cascade, connections);

  // Calculate society health score
  const avgIncome = characters.length > 0 
    ? characters.reduce((sum, c) => sum + (c.income || 0), 0) / characters.length 
    : 0;
  const avgSavings = characters.length > 0
    ? characters.reduce((sum, c) => sum + (c.savings || 0), 0) / characters.length
    : 0;
  const healthScore = avgIncome > 0 ? Math.round((avgSavings / avgIncome) * 100) : 0;
  const blueprint = buildResilienceBlueprint({
    characters,
    cascade,
    connections,
    totalBudget: Math.round(avgIncome * 2),
  });

  const metrics = [
    {
      icon: Users,
      label: "Characters Affected",
      value: String(affected),
      subtext: `out of ${characters.length}`,
      tone: affected === characters.length ? "red" : affected > characters.length / 2 ? "orange" : "amber",
      trend: null,
    },
    {
      icon: Waves,
      label: "Cascade Depth",
      value: String(totalWaves),
      subtext: "waves",
      tone: totalWaves > 3 ? "red" : totalWaves > 2 ? "orange" : "amber",
      trend: null,
    },
    {
      icon: AlertTriangle,
      label: "At Breaking Point",
      value: String(breaking),
      subtext: `characters`,
      tone: breaking > 0 ? "red" : "green",
      trend: breaking > 0 ? "down" : "up",
    },
    {
      icon: BarChart3,
      label: "Income Lost",
      value: `₹${(incomeLost / 1000).toFixed(1)}K`,
      subtext: "monthly",
      tone: "red",
      trend: "down",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-2xl text-primary mb-1">Society Impact Report</h2>
        <p className="text-sm text-secondary">Post-cascade analysis</p>
      </div>

      {/* Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6 p-6 rounded-lg border border-subtle bg-gradient-to-br from-elevated/50 to-surface/50"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-secondary font-mono uppercase tracking-wider mb-1">Society Health Score</p>
            <h3 className="font-display font-bold text-4xl text-primary">{healthScore}%</h3>
            <p className="text-xs text-muted mt-2">Savings buffer / Income ratio</p>
          </div>
          <div
            className="h-16 w-16 rounded-full border-4 flex items-center justify-center font-bold text-lg"
            style={{
              borderColor: healthScore > 70 ? TONE_COLORS.green : healthScore > 40 ? TONE_COLORS.amber : TONE_COLORS.red,
              color: healthScore > 70 ? TONE_COLORS.green : healthScore > 40 ? TONE_COLORS.amber : TONE_COLORS.red,
            }}
          >
            {healthScore > 70 ? "✓" : healthScore > 40 ? "⚠" : "✗"}
          </div>
        </div>
        <p className="text-xs text-secondary italic">
          {healthScore > 70
            ? "Society has strong financial resilience."
            : healthScore > 40
            ? "Society is vulnerable. Small shocks ripple quickly."
            : "Society is fragile. No safety net. One shock breaks multiple people."}
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          const color = TONE_COLORS[metric.tone] || TONE_COLORS.amber;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              className="p-4 rounded-lg border border-subtle bg-elevated/40"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className="h-4 w-4" style={{ color }} />
                {metric.trend && (
                  <div className="flex items-center gap-1 text-xs font-mono" style={{ color }}>
                    {metric.trend === "down" ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-1">{metric.label}</p>
              <div className="font-display font-bold text-xl text-primary mb-1">{metric.value}</div>
              <p className="text-xs text-muted">{metric.subtext}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Most Vulnerable */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="p-4 rounded-lg border border-red-500/30 bg-red-500/5 mb-6"
      >
        <p className="text-xs text-red-400 uppercase tracking-wider font-mono mb-1">⚠ Most Vulnerable</p>
        <p className="text-sm text-primary font-semibold">{mostVulnerable}</p>
        <p className="text-xs text-secondary mt-1">Likely to break during cascade</p>
      </motion.div>

      {/* Recovery Estimate */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="p-4 rounded-lg border border-subtle bg-elevated/30"
      >
        <p className="text-xs text-secondary uppercase tracking-wider font-mono mb-1">Estimated Recovery</p>
        <div className="flex items-end gap-2">
          <div className="font-display font-bold text-2xl text-primary">~{recoveryDays}</div>
          <p className="text-sm text-secondary mb-1">days</p>
        </div>
        <p className="text-xs text-muted mt-2">Time for society to absorb shock and stabilize</p>
      </motion.div>

      {/* Key Insights */}
      {summary.loops && summary.loops.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-6 p-4 rounded-lg border border-accent-blue/30 bg-accent-blue/5"
        >
          <p className="text-xs text-accent-blue uppercase tracking-wider font-mono mb-3">Key Causal Loops</p>
          <div className="space-y-2">
            {summary.loops.map((loop, i) => (
              <p key={i} className="text-xs text-primary leading-relaxed">
                <span className="font-mono text-accent-blue">→</span> {loop}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Network Resilience Analysis */}
      {networkAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8 pt-8 border-t border-subtle"
        >
          <h3 className="font-display font-bold text-lg text-primary mb-4">The Invisible Chain</h3>
          <NetworkResilience analysis={networkAnalysis} />

          {networkAnalysis.shockDNA && (
            <div className="mt-6 rounded-lg border border-subtle bg-elevated/40 p-4">
              <p className="text-xs text-secondary uppercase tracking-wider font-mono mb-3">Shock DNA</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-md border border-subtle bg-surface p-3">
                  <div className="text-[11px] text-secondary uppercase tracking-[0.08em]">Spread Rate</div>
                  <div className="font-display font-bold text-lg text-primary mt-1">{networkAnalysis.shockDNA.spreadRate}%</div>
                  <div className="text-[11px] text-muted mt-1">{networkAnalysis.shockDNA.spreadLabel}</div>
                </div>
                <div className="rounded-md border border-subtle bg-surface p-3">
                  <div className="text-[11px] text-secondary uppercase tracking-[0.08em]">Concentration</div>
                  <div className="font-display font-bold text-lg text-primary mt-1">{networkAnalysis.shockDNA.concentration}%</div>
                  <div className="text-[11px] text-muted mt-1">{networkAnalysis.shockDNA.concentrationLabel}</div>
                </div>
                <div className="rounded-md border border-subtle bg-surface p-3">
                  <div className="text-[11px] text-secondary uppercase tracking-[0.08em]">Persistence</div>
                  <div className="font-display font-bold text-lg text-primary mt-1">{networkAnalysis.shockDNA.persistence}%</div>
                  <div className="text-[11px] text-muted mt-1">{networkAnalysis.shockDNA.persistenceLabel}</div>
                </div>
              </div>
            </div>
          )}

          {blueprint.plans.length > 0 && (
            <div className="mt-6 rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 p-4">
              <p className="text-xs text-accent-cyan uppercase tracking-wider font-mono mb-2">Resilience Blueprint</p>
              <p className="text-xs text-secondary mb-3">
                With a fast-response budget of ₹{blueprint.budget.toLocaleString("en-IN")}, allocate to the top nodes below.
              </p>
              <div className="space-y-2.5">
                {blueprint.plans.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-subtle bg-surface px-3 py-2">
                    <span className="text-xs text-primary">{p.emoji} {p.name}</span>
                    <span className="text-[11px] font-mono text-secondary">₹{p.grant.toLocaleString("en-IN")} to ₹{p.projectedSavings.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-subtle flex justify-between text-xs">
                <span className="text-secondary">Projected protection</span>
                <span className="font-mono text-wave-green">₹{blueprint.projectedSavings.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
