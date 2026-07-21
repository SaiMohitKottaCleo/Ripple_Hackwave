import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
} from "d3-force";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, RefreshCw, Settings2, BarChart2, Shield, X, BookOpenText } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Card } from "../components/ui/Card.jsx";
import { AvatarToken } from "../components/ripple/AvatarToken.jsx";
import { WaveMarker } from "../components/ripple/WaveMarker.jsx";
import { StatReadout } from "../components/ripple/StatReadout.jsx";
import { ImpactDashboard } from "../components/ripple/ImpactDashboard.jsx";
import { StoryPanel } from "./StoryPanel.jsx";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { simulateCascade } from "../lib/cascade.js";
import { analyzeNetworkResilience, buildResilienceBlueprint, estimateInterventionImpact } from "../lib/networkResilience.js";
import { vulnerability } from "../data/society.js";

const TONE = {
  amber: "var(--wave-amber)",
  orange: "var(--wave-orange)",
  red: "var(--wave-red)",
  green: "var(--wave-green)",
};

/** Run d3-force in a layout effect, get static node positions, breathe forever. */
function useForceLayout({ characters, connections, width, height }) {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!width || !height || !characters.length) return;
    const nodes = characters.map((c) => ({
      id: c.id,
      x: (c.x ?? 0.5) * width,
      y: (c.y ?? 0.5) * height,
    }));
    const links = connections
      .filter((e) => nodes.find((n) => n.id === e.a) && nodes.find((n) => n.id === e.b))
      .map((e) => ({ source: e.a, target: e.b, strength: e.strength || 5 }));

    const sim = forceSimulation(nodes)
      .force("charge", forceManyBody().strength(-380))
      .force(
        "link",
        forceLink(links)
          .id((d) => d.id)
          .distance(140)
          .strength((l) => 0.05 + (l.strength || 5) / 40)
      )
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(48))
      .alpha(1)
      .alphaDecay(0.05)
      .stop();

    for (let i = 0; i < 220; i++) sim.tick();

    const next = {};
    nodes.forEach((n) => {
      next[n.id] = {
        x: Math.max(60, Math.min(width - 60, n.x)),
        y: Math.max(80, Math.min(height - 220, n.y)),
      };
    });
    setPositions(next);
  }, [characters, connections, width, height]);

  return positions;
}

export function SimulationView({ go, event, society }) {
  const characters = society?.characters || [];
  const connections = society?.connections || [];
  const reduced = useReducedMotion();

  // Stage container size — graph is full-bleed minus the bottom timeline.
  const stageRef = useRef(null);
  const [size, setSize] = useState({ w: 1280, h: 600 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const positions = useForceLayout({
    characters,
    connections,
    width: size.w,
    height: size.h,
  });

  // ── Cascade fetch ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null); // "claude" | "baked"
  const [cascade, setCascade] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const ctl = new AbortController();
    setLoading(true);
    setCascade(null);
    simulateCascade({
      event,
      characters,
      connections,
      signal: ctl.signal,
    })
      .then((res) => {
        if (cancelled) return;
        setCascade(res.cascade);
        setSource(res.source);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
      ctl.abort();
    };
    // intentionally only react to event identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.name]);

  // ── Choreography ──────────────────────────────────────────────
  const [activeWave, setActiveWave] = useState(0);
  const [lit, setLit] = useState({}); // id -> tone
  const [bubbles, setBubbles] = useState({}); // id -> string
  const [rings, setRings] = useState([]); // {id, tone, x, y}
  const [cracked, setCracked] = useState({});
  const [phase, setPhase] = useState("intro"); // intro | running | done
  const [showPulse, setShowPulse] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCascadeDiary, setShowCascadeDiary] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  const [protectedId, setProtectedId] = useState(null);
  const [budgetFactor, setBudgetFactor] = useState(1);
  const [portfolioBudget, setPortfolioBudget] = useState(60000);
  const [chrome, setChrome] = useState(true);
  const [selId, setSelId] = useState(null);
  const timersRef = useRef([]);
  const runIdRef = useRef(0);

  const at = (ms, fn) => {
    const t = setTimeout(fn, reduced ? Math.min(ms, 400) : ms);
    timersRef.current.push(t);
  };

  function play() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    runIdRef.current += 1;
    setPhase("intro");
    setActiveWave(0);
    setLit({});
    setBubbles({});
    setRings([]);
    setCracked({});

    if (!cascade) return;
    at(400, () => setPhase("running"));
    const G = reduced ? 700 : 2000;
    cascade.waves.forEach((w, wi) => {
      const base = 900 + wi * G;
      const points = w.impacts
        .map((im) => positions[im.id])
        .filter(Boolean);
      const cx =
        points.length ? points.reduce((s, p) => s + p.x, 0) / points.length : size.w / 2;
      const cy =
        points.length ? points.reduce((s, p) => s + p.y, 0) / points.length : size.h / 2;
      at(base, () => {
        setActiveWave(w.n);
        setRings((r) => [...r, { id: `${w.n}-${runIdRef.current}`, tone: w.tone, cx, cy }]);
      });
      at(base + 650, () => {
        setLit((prev) => {
          const n = { ...prev };
          w.impacts.forEach((im) => (n[im.id] = w.tone));
          return n;
        });
        setBubbles((prev) => {
          const n = { ...prev };
          w.impacts.forEach((im) => (n[im.id] = im.bubble));
          return n;
        });
      });
    });
    const end = 900 + cascade.waves.length * G;
    at(end, () => {
      // Mark the most-vulnerable as "cracked" if they appear in any wave.
      const mv = cascade.summary?.mostVulnerable;
      if (mv) {
        const target = characters.find((c) => c.name === mv);
        if (target) setCracked({ [target.id]: true });
      }
      setPhase("done");
      setShowPulse(true);
    });
  }

  // Auto-play once cascade + positions are ready
  useEffect(() => {
    if (!cascade || !Object.keys(positions).length) return;
    play();
    return () => timersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cascade, Object.keys(positions).length]);

  // ── Derived ──────────────────────────────────────────────
  const tone = (id) => lit[id];
  const selected = selId != null ? characters.find((c) => c.id === selId) : null;
  const protectedCharacter = protectedId != null ? characters.find((c) => c.id === protectedId) : null;
  const networkAnalysis = useMemo(
    () => (cascade ? analyzeNetworkResilience(characters, cascade, connections) : null),
    [cascade, characters, connections]
  );

  const interventionProjection = useMemo(() => {
    if (!cascade || !protectedCharacter) return null;
    const baseLoss = cascade.summary?.incomeLost || 0;
    const baseBreaking = cascade.summary?.breaking || 0;
    const protectedAmount = Math.round(estimateInterventionImpact(protectedCharacter, characters, cascade) * budgetFactor);
    const projectedIncomeLost = Math.max(0, baseLoss - protectedAmount);
    const breakingDropRatio = baseLoss > 0 ? Math.min(0.7, protectedAmount / baseLoss) : 0;
    const projectedBreaking = Math.max(0, Math.round(baseBreaking * (1 - breakingDropRatio)));
    return {
      protectedAmount,
      projectedIncomeLost,
      projectedBreaking,
      protectedName: protectedCharacter.name,
      budget: Math.round((protectedCharacter.income || 0) * budgetFactor),
    };
  }, [budgetFactor, cascade, characters, protectedCharacter]);

  const portfolioPlan = useMemo(() => {
    if (!cascade) return null;
    return buildResilienceBlueprint({
      characters,
      cascade,
      connections,
      totalBudget: portfolioBudget,
    });
  }, [cascade, characters, connections, portfolioBudget]);

  const selImpacts = useMemo(() => {
    if (!cascade || selId == null) return [];
    return cascade.waves
      .map((w) => ({ wave: w, im: w.impacts.find((i) => i.id === selId) }))
      .filter((x) => x.im);
  }, [cascade, selId]);

  const impactByCharacter = useMemo(() => {
    if (!cascade) return new Map();
    const m = new Map();
    cascade.waves.forEach((w) => {
      w.impacts.forEach((im) => {
        if (!m.has(im.id)) m.set(im.id, []);
        m.get(im.id).push({ wave: w, im });
      });
    });
    return m;
  }, [cascade]);

  const headline =
    phase === "done" && cascade
      ? `${cascade.summary?.totalWaves ?? cascade.waves.length} waves · ${
          cascade.summary?.affected ?? new Set(cascade.waves.flatMap((w) => w.impacts.map((i) => i.id))).size
        } characters impacted`
      : loading
      ? "Simulating…"
      : cascade
      ? `Wave ${activeWave} of ${cascade.waves.length} · simulating…`
      : "";

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, #0d0d12, var(--bg-void))",
      }}
      onMouseMove={(e) => setChrome(e.clientY < 90)}
    >
      {/* Force-graph layer */}
      <div
        ref={stageRef}
        className="absolute inset-0"
        style={{ paddingBottom: selected ? 0 : 184 }}
      >
        <svg className="absolute inset-0 h-full w-full">
          {/* edges */}
          {connections.map((e, i) => {
            const a = positions[e.a];
            const b = positions[e.b];
            if (!a || !b) return null;
            const carrying = lit[e.a] && lit[e.b];
            const color = carrying ? TONE[lit[e.b]] : "rgba(34,211,238,0.15)";
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={carrying ? 2 : 1}
                strokeDasharray={
                  ["buys_from", "sells_to", "depends_on"].includes(e.type) && !carrying
                    ? "5 5"
                    : "0"
                }
                style={{
                  transition: "stroke 600ms, stroke-width 600ms",
                  filter: carrying ? "drop-shadow(0 0 4px currentColor)" : "none",
                }}
              />
            );
          })}

          {/* sonar rings */}
          {rings.map((r) => (
            <circle
              key={r.id}
              cx={r.cx}
              cy={r.cy}
              r="30"
              fill="none"
              stroke={TONE[r.tone]}
              strokeWidth="2"
              style={{
                transformOrigin: `${r.cx}px ${r.cy}px`,
                animation: reduced
                  ? "none"
                  : "ripple-sonar 1.6s cubic-bezier(0.16,1,0.3,1) forwards",
                opacity: reduced ? 0.25 : undefined,
              }}
            />
          ))}
        </svg>

        <style>{`@keyframes ripple-sonar{0%{transform:scale(0.4);opacity:0.85}80%{opacity:0.06}100%{transform:scale(9);opacity:0}}`}</style>

        {/* nodes */}
        {characters.map((c) => {
          const pos = positions[c.id];
          if (!pos) return null;
          const t = tone(c.id);
          const v = vulnerability(c);
          return (
            <motion.div
              key={c.id}
              onClick={() => setSelId(c.id)}
              animate={t ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute cursor-pointer z-[2]"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <AvatarToken
                emoji={c.emoji}
                vulnerability={v}
                wave={t || null}
                cracked={!!cracked[c.id]}
                pulse={!t && phase !== "done"}
                size={58}
                label={c.name}
              />
              {protectedId === c.id && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: "0 0 0 2px rgba(34,211,238,0.95), 0 0 18px rgba(34,211,238,0.55)",
                    transform: "scale(1.34)",
                    pointerEvents: "none",
                  }}
                />
              )}
              <AnimatePresence>
                {bubbles[c.id] && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-1/2 bottom-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap bg-elevated px-2.5 py-[5px] rounded-lg shadow-md pointer-events-none border font-body text-[11px] font-medium text-primary"
                    style={{ borderColor: TONE[t] }}
                  >
                    {bubbles[c.id]}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Event banner */}
      {phase !== "intro" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 z-20"
          style={{
            top: chrome ? 64 : 18,
            transition: "top 200ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur border"
            style={{
              background: "rgba(26,26,31,0.8)",
              borderColor: TONE[event?.tone || cascade?.event?.tone || "amber"],
              boxShadow: `0 0 28px ${
                event?.tone === "green" || cascade?.event?.tone === "green"
                  ? "var(--glow-green)"
                  : "var(--glow-amber)"
              }`,
            }}
          >
            <span className="text-lg">{event?.emoji || cascade?.event?.emoji}</span>
            <span
              className="font-display font-bold text-[15px] uppercase tracking-[0.02em]"
              style={{ color: TONE[event?.tone || cascade?.event?.tone || "amber"] }}
            >
              {event?.name || cascade?.event?.name}
            </span>
          </div>
        </motion.div>
      )}

      {/* Top chrome */}
      <div
        className="absolute top-0 left-0 right-0 h-14 z-30 flex items-center px-3 sm:px-4 gap-2 sm:gap-3.5"
        style={{
          background: "linear-gradient(to bottom, rgba(9,9,11,0.92), transparent)",
          transform: chrome ? "none" : "translateY(-100%)",
          transition: "transform 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <button
          onClick={() => go("event")}
          className="h-8 w-8 flex-none inline-flex items-center justify-center rounded-md border border-subtle text-secondary hover:text-primary hover:border-active"
          aria-label="Back to events"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="font-display font-semibold text-lg text-primary hidden sm:inline">
          RIPPLE
        </span>
        <Badge
          tone={(event?.tone || cascade?.event?.tone) === "green" ? "green" : "amber"}
        >
          {event?.emoji || cascade?.event?.emoji}{" "}
          <span className="hidden sm:inline">{event?.name || cascade?.event?.name}</span>
        </Badge>
        <span className="flex-1 text-center font-mono text-xs text-secondary hidden md:inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {headline}
          {source && (
            <span
              className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{ color: source === "claude" ? "var(--accent-cyan)" : "var(--text-muted)" }}
            >
              · {source}
            </span>
          )}
        </span>
        <span className="flex-1 md:hidden" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPulse((s) => !s)}
          iconLeft={<Settings2 className="h-3.5 w-3.5" />}
        >
          <span className="hidden md:inline">Society Pulse</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDashboard((s) => !s)}
          iconLeft={<BarChart2 className="h-3.5 w-3.5" />}
        >
          <span className="hidden md:inline">Impact Report</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCascadeDiary(true)}
          iconLeft={<BookOpenText className="h-3.5 w-3.5" />}
        >
          <span className="hidden md:inline">Cascade Diary</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowIntervention((s) => !s)}
          iconLeft={<Shield className="h-3.5 w-3.5" />}
        >
          <span className="hidden md:inline">Intervention Lab</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={play}
          iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
        >
          <span className="hidden md:inline">Replay</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => go("event")}>
          <span className="hidden sm:inline">New event</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Baked-mode helper */}
      <AnimatePresence>
        {!loading && source === "baked" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="px-3 py-2 rounded-md border border-amber-400/40 bg-amber-400/10 font-body text-xs text-amber-100">
              Demo cascade is showing. Add GROQ_API_KEY in Vercel and redeploy for live responses.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Society Pulse */}
      <AnimatePresence>
        {showPulse && cascade && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-16 right-4 w-[280px] z-30"
          >
            <Card elevated padding="p-[18px]">
              <div className="font-display font-semibold text-[15px] text-primary mb-3.5">
                Society Pulse
              </div>
              <div className="grid gap-4">
                <StatReadout
                  label="Average Savings Buffer"
                  value={avgBuffer(characters)}
                  unit="months"
                  trend="down"
                  tone="amber"
                />
                <StatReadout
                  label="Characters at Breaking Point"
                  value={String(cascade.summary?.breaking ?? 0)}
                  unit={`of ${characters.length}`}
                  tone="red"
                />
                <StatReadout
                  label="Total Monthly Income Lost"
                  value={`₹${(cascade.summary?.incomeLost ?? 0).toLocaleString("en-IN")}`}
                  tone="red"
                />
                <StatReadout
                  label="Cascade Depth"
                  value={String(cascade.summary?.totalWaves ?? cascade.waves.length)}
                  unit="waves"
                  tone="blue"
                />
                <StatReadout
                  label="Recovery Estimate"
                  value={`~${cascade.summary?.recoveryDays ?? "?"}`}
                  unit="days"
                  tone="neutral"
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention Lab */}
      <AnimatePresence>
        {showIntervention && cascade && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-16 left-4 w-[320px] z-30"
          >
            <Card elevated padding="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-display font-semibold text-[15px] text-primary">Intervention Lab</div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-cyan">what-if</span>
              </div>
              <p className="font-body text-xs text-secondary mb-3">
                Protect one critical character and project prevented network damage.
              </p>

              {networkAnalysis?.interventions?.length ? (
                <div className="space-y-2 mb-3">
                  <div className="font-body text-[11px] text-muted uppercase tracking-[0.08em]">Recommended</div>
                  {networkAnalysis.interventions.slice(0, 3).map((it) => (
                    <button
                      key={it.id}
                      onClick={() => setProtectedId(it.id)}
                      className={`w-full text-left rounded-md border px-2.5 py-2 transition-colors ${
                        protectedId === it.id ? "border-accent-cyan bg-accent-cyan/10" : "border-subtle bg-surface hover:border-active"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs text-primary">{it.emoji} {it.name}</span>
                        <span className="font-mono text-[10px] text-wave-green">ROI {it.roi}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-secondary">
                  <span>Support multiplier</span>
                  <span className="font-mono text-primary">{budgetFactor.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={budgetFactor}
                  onChange={(e) => setBudgetFactor(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {interventionProjection ? (
                <div className="mt-3 space-y-2 rounded-md border border-subtle bg-surface p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Protected node</span>
                    <span className="font-semibold text-primary">{interventionProjection.protectedName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Intervention budget</span>
                    <span className="font-mono text-accent-cyan">₹{interventionProjection.budget.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Projected loss prevented</span>
                    <span className="font-mono text-wave-green">₹{interventionProjection.protectedAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-2 border-t border-subtle space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-secondary">Income lost after intervention</span>
                      <span className="font-mono text-primary">₹{interventionProjection.projectedIncomeLost.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-secondary">People near breaking point</span>
                      <span className="font-mono text-primary">{interventionProjection.projectedBreaking}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="font-body text-xs text-muted mt-3">Pick a recommended character to run a projection.</p>
              )}

              <div className="mt-3 rounded-md border border-accent-cyan/30 bg-accent-cyan/5 p-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-accent-cyan font-mono uppercase tracking-[0.1em]">Portfolio Optimizer</span>
                  <span className="font-mono text-primary">₹{portfolioBudget.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="200000"
                  step="5000"
                  value={portfolioBudget}
                  onChange={(e) => setPortfolioBudget(Number(e.target.value))}
                  className="w-full"
                />
                {portfolioPlan?.plans?.length ? (
                  <div className="mt-2.5 space-y-1.5">
                    {portfolioPlan.plans.slice(0, 3).map((plan) => (
                      <div key={plan.id} className="flex justify-between text-xs">
                        <span className="text-primary">{plan.emoji} {plan.name}</span>
                        <span className="font-mono text-secondary">₹{plan.grant.toLocaleString("en-IN")} to ₹{plan.projectedSavings.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-subtle flex justify-between text-xs">
                      <span className="text-secondary">Projected cascade loss prevented</span>
                      <span className="font-mono text-wave-green">₹{portfolioPlan.projectedSavings.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted mt-2">No portfolio recommendations yet.</p>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Impact Dashboard Modal */}
      <AnimatePresence>
        {showDashboard && cascade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDashboard(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface border border-subtle rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 border-b border-subtle bg-elevated/50 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-display font-bold text-lg text-primary">Impact Analysis</h2>
                <button
                  onClick={() => setShowDashboard(false)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-subtle text-secondary hover:text-primary hover:border-active"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <ImpactDashboard cascade={cascade} characters={characters} connections={connections} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Cascade Diary Modal */}
      <AnimatePresence>
        {showCascadeDiary && cascade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCascadeDiary(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface border border-subtle rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 border-b border-subtle bg-elevated/70 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-display font-bold text-lg text-primary">Cascade Diary</h2>
                <button
                  onClick={() => setShowCascadeDiary(false)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-subtle text-secondary hover:text-primary hover:border-active"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {cascade.waves.map((w) => (
                  <section key={w.n} className="space-y-3">
                    <WaveMarker number={w.n} title={w.title} active={activeWave === w.n} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {w.impacts.map((im) => {
                        const c = characters.find((x) => x.id === im.id);
                        if (!c) return null;
                        return (
                          <article key={im.id} className="rounded-md border border-subtle bg-elevated/40 p-3">
                            <div className="flex items-center gap-2.5 mb-2">
                              <AvatarToken emoji={c.emoji} size={34} wave={w.tone} cracked={!!cracked[c.id]} />
                              <div>
                                <div className="font-body text-sm font-semibold text-primary">{c.name}</div>
                                <div className="font-body text-[11px] text-secondary">{im.bubble}</div>
                              </div>
                            </div>
                            <p className="font-body text-sm text-primary leading-relaxed italic">“{im.diary}”</p>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}

                {impactByCharacter.size === 0 && (
                  <p className="font-body text-sm text-muted">No impacts were generated for this simulation.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cascade timeline (bottom) */}
      {cascade && (
        <div
          className={`absolute bottom-0 left-0 right-0 ${
            selected ? "sm:right-[420px]" : ""
          } h-[184px] z-20 border-t border-subtle px-3 sm:px-5 py-4 overflow-x-auto flex gap-6 sm:gap-9`}
          style={{
            background: "linear-gradient(to top, var(--bg-surface), rgba(17,17,20,0.96))",
            transition: "right 300ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {cascade.waves.map((w) => (
            <div
              key={w.n}
              className="flex-none min-w-[220px] transition-opacity duration-300"
              style={{ opacity: activeWave >= w.n ? 1 : 0.25 }}
            >
              <WaveMarker number={w.n} title={w.title} active={activeWave === w.n} />
              <div className="flex gap-3.5 mt-3.5">
                {w.impacts.map((im) => {
                  const c = characters.find((x) => x.id === im.id);
                  if (!c) return null;
                  return (
                    <div
                      key={im.id}
                      onClick={() => setSelId(im.id)}
                      className="cursor-pointer text-center w-[76px]"
                    >
                      <div className="flex justify-center">
                        <AvatarToken
                          emoji={c.emoji}
                          size={40}
                          wave={activeWave >= w.n ? w.tone : null}
                          cracked={!!cracked[im.id]}
                        />
                      </div>
                      <div className="font-body text-[11px] text-primary mt-1.5 font-medium">
                        {c.name}
                      </div>
                      <div className="font-body text-[10px] text-secondary mt-0.5 leading-snug">
                        {im.bubble}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Story / Chat side panel */}
      <StoryPanel
        character={selected}
        impacts={selImpacts}
        event={event || cascade?.event}
        cracked={selected ? !!cracked[selected.id] : false}
        onOpenCascade={() => setShowCascadeDiary(true)}
        onClose={() => setSelId(null)}
      />

      {/* Loading veil */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-void/70 backdrop-blur-sm"
          >
            <Loader2 className="h-7 w-7 text-accent-cyan animate-spin" />
            <p className="font-body text-sm text-secondary mt-3">
              Asking Claude to imagine the shockwave…
            </p>
            <p className="font-mono text-[10px] text-muted mt-1.5 uppercase tracking-[0.16em]">
              Simulating wave 1 of ?
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function avgBuffer(chars) {
  if (!chars.length) return "—";
  const months = chars.map((c) => {
    const monthly = (c.fixed || 0) + (c.emi || 0);
    return monthly ? (c.savings || 0) / monthly : 0;
  });
  const avg = months.reduce((s, x) => s + x, 0) / months.length;
  return avg.toFixed(1);
}
