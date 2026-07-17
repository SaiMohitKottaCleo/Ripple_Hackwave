import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Github, Heart } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { GithubButton, REPO_URL } from "../components/ui/GithubButton.jsx";
import { useReducedMotion } from "../hooks/useReducedMotion.js";

const TONE = {
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  green: "#22c55e",
  cyan: "#22d3ee",
  blue: "#4a7cff",
};

export function FeatureFriday({ go }) {
  return (
    <div className="h-full overflow-y-auto bg-void">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-void/85 border-b border-subtle">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-8 h-14 flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => go("landing")}
            className="h-8 w-8 flex-none inline-flex items-center justify-center rounded-md border border-subtle text-secondary hover:text-primary hover:border-active transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-display font-semibold text-lg text-primary">RIPPLE</span>
          <Badge tone="blue" className="hidden sm:inline-flex">Feature Friday </Badge>
          <span className="flex-1" />
          <GithubButton size="sm" />
          <Button variant="ghost" size="sm" onClick={() => go("builder")}>
            <span className="hidden sm:inline">Open the app →</span>
            <span className="sm:hidden">App →</span>
          </Button>
        </div>
      </div>

      <main className="max-w-[1120px] mx-auto px-4 sm:px-8 pb-24">
        <Hero />
        <Problem />
        <HowItWorks />
        <ERDiagramSection />
        <ShowcaseSection />
        <FeaturesSection />
        <TechStackSection />
        <Footer />
      </main>
    </div>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

function Hero() {
  const reduced = useReducedMotion();
  return (
    <section className="relative pt-24 pb-20 text-center overflow-hidden">
      {/* Concentric rings backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[180, 320, 480, 660].map((r, i) => (
          <motion.div
            key={r}
            className="absolute rounded-full border border-wave-amber/15"
            style={{ width: r, height: r }}
            animate={reduced ? {} : { scale: [1, 1.04, 1], opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
          />
        ))}
      </div>

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          <Badge tone="blue"> · Feature Friday Final Sprint</Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold text-primary mt-6 leading-none tracking-[-0.03em]"
          style={{ fontSize: "clamp(56px, 8vw, 92px)" }}
        >
          RIPPLE
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-body text-secondary mt-4 max-w-[640px] mx-auto"
          style={{ fontSize: "clamp(16px, 1.4vw, 20px)" }}
        >
          A multi-agent societal impact simulation engine with live relationship inference and intervention planning. Every event has a face.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="font-body text-accent-blue mt-3 text-sm font-medium"
        >
          Built by Team Ripple
        </motion.p>
      </div>
    </section>
  );
}

/* ─────────────────────────── Problem ─────────────────────────── */

function Problem() {
  return (
    <section className="py-16 border-t border-subtle">
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <h2 className="font-display font-semibold text-primary text-3xl tracking-[-0.01em]">
            The Invisible Chain
          </h2>
          <div className="font-body text-secondary text-[15px] leading-relaxed mt-5 space-y-4">
            <p>
              When petrol prices rise, we see a number on a news ticker. We don&apos;t see the
              auto-rickshaw driver who quietly raises his fare ₹15. The college student who
              starts walking 4km because she can&apos;t afford it. The scholarship she loses
              because her attendance slips. The chai stall owner whose evening regular
              stopped coming.
            </p>
            <p>
              Policy decisions affect real humans through chains of consequence that no
              dashboard captures. RIPPLE makes those chains visible — wave by wave, in the
              characters&apos; own words.
            </p>
          </div>
        </div>
        <div className="relative">
          <MiniRipple />
        </div>
      </div>
    </section>
  );
}

function MiniRipple() {
  const reduced = useReducedMotion();
  // a tiny graph of 5 nodes, with rings emanating periodically
  const nodes = [
    { x: 50, y: 50, e: "🛢️" },
    { x: 150, y: 30, e: "🚗" },
    { x: 250, y: 70, e: "🎓" },
    { x: 200, y: 160, e: "👩‍🏫" },
    { x: 90, y: 170, e: "☕" },
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [1, 4],
    [2, 3],
  ];

  return (
    <div className="aspect-[4/3] bg-surface border border-subtle rounded-lg p-3 relative overflow-hidden">
      <svg viewBox="0 0 320 220" className="w-full h-full">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="rgba(34,211,238,0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}
        {/* sonar rings */}
        {!reduced &&
          [0, 1.5, 3].map((delay) => (
            <circle
              key={delay}
              cx={nodes[0].x}
              cy={nodes[0].y}
              r="14"
              fill="none"
              stroke={TONE.amber}
              strokeWidth="1.5"
              style={{
                transformOrigin: `${nodes[0].x}px ${nodes[0].y}px`,
                animation: `mini-sonar 4.5s ${delay}s cubic-bezier(0.16,1,0.3,1) infinite`,
              }}
            />
          ))}
        <style>{`@keyframes mini-sonar{0%{transform:scale(0.3);opacity:0.9}80%{opacity:0.05}100%{transform:scale(6);opacity:0}}`}</style>
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r="18"
              fill="#16161c"
              stroke={i === 0 ? TONE.amber : TONE.cyan}
              strokeWidth="1.5"
            />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14">
              {n.e}
            </text>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-2 left-3 font-mono text-[10px] text-muted uppercase tracking-[0.12em]">
        a single shock · four lives · three waves
      </div>
    </div>
  );
}

/* ─────────────────────────── How It Works ─────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      title: "Build",
      glyph: <BuildGlyph />,
      body:
        "Drop in everyday characters with real economic profiles. New characters are now auto-linked into the social graph using role, income, and location so nobody enters the simulation isolated.",
    },
    {
      title: "Drop",
      glyph: <DropGlyph />,
      body:
        "Pick a shock event — petrol price spike, monsoon failure, RBI rate hike — or write your own. Claude reasons about how each character is hit.",
    },
    {
      title: "Watch",
      glyph: <WatchGlyph />,
      body:
        "Sonar rings expand wave by wave across the network. Then Intervention Lab projects how targeted support changes total losses and breaking points before the shock becomes irreversible.",
    },
  ];
  return (
    <section className="py-16 border-t border-subtle">
      <h2 className="font-display font-semibold text-primary text-3xl tracking-[-0.01em] text-center">
        How it works
      </h2>
      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface border border-subtle rounded-md p-6"
          >
            <div className="h-24 w-24 mb-5 rounded-md bg-elevated border border-subtle flex items-center justify-center">
              {s.glyph}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-secondary">
              Step {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="font-display font-semibold text-primary text-xl mt-1.5">
              {s.title}
            </h3>
            <p className="font-body text-secondary text-sm leading-relaxed mt-3">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BuildGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12">
      <circle cx="18" cy="22" r="6" fill="none" stroke={TONE.cyan} strokeWidth="1.5" />
      <circle cx="46" cy="22" r="6" fill="none" stroke={TONE.cyan} strokeWidth="1.5" />
      <circle cx="32" cy="46" r="6" fill="none" stroke={TONE.cyan} strokeWidth="1.5" />
      <line x1="18" y1="22" x2="46" y2="22" stroke={TONE.cyan} strokeWidth="1" strokeDasharray="2 3" />
      <line x1="18" y1="22" x2="32" y2="46" stroke={TONE.cyan} strokeWidth="1" strokeDasharray="2 3" />
      <line x1="46" y1="22" x2="32" y2="46" stroke={TONE.cyan} strokeWidth="1" strokeDasharray="2 3" />
    </svg>
  );
}
function DropGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12">
      <path
        d="M30 8 L38 30 L34 30 L40 56 L24 32 L28 32 Z"
        fill={TONE.amber}
        opacity="0.85"
      />
    </svg>
  );
}
function WatchGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12">
      <circle cx="32" cy="32" r="5" fill={TONE.amber} />
      <circle cx="32" cy="32" r="11" fill="none" stroke={TONE.orange} strokeWidth="1.5" opacity="0.8" />
      <circle cx="32" cy="32" r="18" fill="none" stroke={TONE.red} strokeWidth="1.25" opacity="0.5" />
      <circle cx="32" cy="32" r="26" fill="none" stroke={TONE.red} strokeWidth="1" opacity="0.25" />
    </svg>
  );
}

/* ─────────────────────────── ER Diagram ─────────────────────────── */

const ENTITIES = [
  {
    id: "RESOURCE",
    x: 60,
    y: 80,
    fields: [
      ["PK", "id", "int"],
      ["", "name", "string"],
      ["", "type", "string"],
    ],
  },
  {
    id: "DEPENDENCY",
    x: 360,
    y: 80,
    fields: [
      ["PK", "id", "int"],
      ["FK", "characterId", "int"],
      ["FK", "resourceId", "int"],
      ["", "monthlyCost", "int"],
      ["", "criticality", "int"],
      ["", "createdAt", "datetime"],
    ],
  },
  {
    id: "EVENT",
    x: 820,
    y: 80,
    fields: [
      ["PK", "id", "int"],
      ["", "name", "string"],
      ["", "description", "text"],
      ["", "parameters", "json"],
      ["", "createdAt", "datetime"],
    ],
  },
  {
    id: "CHARACTER",
    x: 60,
    y: 350,
    fields: [
      ["PK", "id", "int"],
      ["", "name", "string"],
      ["", "archetype", "string"],
      ["", "monthlyIncome", "int"],
      ["", "fixedExpenses", "int"],
      ["", "emi", "int"],
      ["", "savings", "int"],
      ["", "vulnerabilityScore", "int"],
      ["", "createdAt", "datetime"],
    ],
  },
  {
    id: "CONNECTION",
    x: 360,
    y: 350,
    fields: [
      ["PK", "id", "int"],
      ["FK", "characterAId", "int"],
      ["FK", "characterBId", "int"],
      ["", "relationshipType", "string"],
      ["", "strength", "int"],
      ["", "createdAt", "datetime"],
    ],
  },
  {
    id: "SIMULATIONRUN",
    x: 820,
    y: 350,
    fields: [
      ["PK", "id", "int"],
      ["FK", "eventId", "int"],
      ["", "status", "string"],
      ["", "startedAt", "datetime"],
      ["", "endedAt", "datetime"],
    ],
  },
  {
    id: "GOAL",
    x: 60,
    y: 700,
    fields: [
      ["PK", "id", "int"],
      ["FK", "characterId", "int"],
      ["", "description", "text"],
      ["", "priority", "int"],
      ["", "status", "string"],
      ["", "createdAt", "datetime"],
    ],
  },
  {
    id: "IMPACTLOG",
    x: 560,
    y: 700,
    fields: [
      ["PK", "id", "int"],
      ["FK", "simulationRunId", "int"],
      ["FK", "characterId", "int"],
      ["", "waveNumber", "int"],
      ["", "content", "text"],
      ["", "decisionType", "string"],
      ["", "createdAt", "datetime"],
    ],
  },
];

const ENTITY_W = 260;
const ROW_H = 22;
const HEADER_H = 34;

function entityRect(id) {
  const e = ENTITIES.find((x) => x.id === id);
  const h = HEADER_H + e.fields.length * ROW_H;
  return { ...e, w: ENTITY_W, h };
}

function side(rect, where) {
  switch (where) {
    case "right":  return { x: rect.x + rect.w, y: rect.y + rect.h / 2 };
    case "left":   return { x: rect.x,          y: rect.y + rect.h / 2 };
    case "top":    return { x: rect.x + rect.w / 2, y: rect.y };
    case "bottom": return { x: rect.x + rect.w / 2, y: rect.y + rect.h };
    default:       return { x: rect.x, y: rect.y };
  }
}

function ERDiagramSection() {
  const rels = [
    { from: ["RESOURCE", "right"],   to: ["DEPENDENCY", "left"],    label: "supplies", oneFrom: "1", manyTo: "N" },
    { from: ["CHARACTER", "top"],    to: ["DEPENDENCY", "bottom"],  label: "has",      oneFrom: "1", manyTo: "N" },
    { from: ["CHARACTER", "right"],  to: ["CONNECTION", "left"],    label: "links",    oneFrom: "1", manyTo: "N" },
    { from: ["CHARACTER", "bottom"], to: ["GOAL", "top"],           label: "pursues",  oneFrom: "1", manyTo: "N" },
    { from: ["CHARACTER", "right"],  to: ["IMPACTLOG", "left"],     label: "logged",   oneFrom: "1", manyTo: "N", offsetFrom: 60 },
    { from: ["EVENT", "bottom"],     to: ["SIMULATIONRUN", "top"],  label: "runs",     oneFrom: "1", manyTo: "N" },
    { from: ["SIMULATIONRUN", "bottom"], to: ["IMPACTLOG", "right"], label: "produces", oneFrom: "1", manyTo: "N" },
  ];

  return (
    <section className="py-16 border-t border-subtle">
      <div className="text-center">
        <h2 className="font-display font-semibold text-primary text-[28px] tracking-[-0.01em]">
          Data Architecture
        </h2>
        <p className="font-body text-secondary text-sm mt-2 max-w-xl mx-auto">
          The schema that lets a society be saved, a cascade re-run, a character&apos;s
          breaking point traced back through every wave that led to it.
        </p>
      </div>

      <div className="mt-8 bg-surface border border-subtle rounded-lg p-4 overflow-x-auto">
        <svg viewBox="0 0 1120 900" className="w-full" style={{ minWidth: 960 }}>
          {/* relationships first so they sit behind the boxes */}
          {rels.map((r, i) => {
            const a = entityRect(r.from[0]);
            const b = entityRect(r.to[0]);
            const p1 = side(a, r.from[1]);
            const p2 = side(b, r.to[1]);
            if (r.offsetFrom) p1.y += r.offsetFrom;
            return (
              <Relationship key={i} p1={p1} p2={p2} label={r.label} from={r.oneFrom} to={r.manyTo} />
            );
          })}
          {ENTITIES.map((e) => (
            <Entity key={e.id} entity={e} />
          ))}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 justify-center font-mono text-[11px] text-muted uppercase tracking-[0.12em]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" /> primary key
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-wave-amber" /> foreign key
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 border-l border-r border-accent-cyan" /> 1:N relationship
        </span>
      </div>
    </section>
  );
}

function Entity({ entity }) {
  const h = HEADER_H + entity.fields.length * ROW_H;
  return (
    <g transform={`translate(${entity.x},${entity.y})`}>
      <rect
        width={ENTITY_W}
        height={h}
        rx="10"
        fill="#111114"
        stroke="#222228"
        strokeWidth="1"
      />
      <rect width={ENTITY_W} height={HEADER_H} rx="10" fill="#1a1a1f" />
      <rect width={ENTITY_W} height={2} y={HEADER_H - 1} fill="#222228" />
      <text
        x="14"
        y="22"
        fontFamily='"Space Grotesk", system-ui, sans-serif'
        fontWeight="600"
        fontSize="13"
        fill="#e8e8ed"
        letterSpacing="0.04em"
      >
        {entity.id}
      </text>
      {entity.fields.map((f, i) => {
        const y = HEADER_H + i * ROW_H + ROW_H * 0.65;
        const [kind, name, type] = f;
        const dot =
          kind === "PK" ? "#4a7cff" : kind === "FK" ? "#f59e0b" : null;
        return (
          <g key={i}>
            {dot && <circle cx="14" cy={y - 4} r="3" fill={dot} />}
            <text
              x="26"
              y={y}
              fontFamily='"JetBrains Mono", monospace'
              fontSize="11"
              fill={kind ? "#e8e8ed" : "#8888a0"}
            >
              {name}
            </text>
            <text
              x={ENTITY_W - 14}
              y={y}
              fontFamily='"JetBrains Mono", monospace'
              fontSize="10"
              fill="#55556a"
              textAnchor="end"
            >
              {type}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Relationship({ p1, p2, label, from, to }) {
  // orthogonal-ish path
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const dh = Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y);
  const d = dh
    ? `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`
    : `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="rgba(34,211,238,0.45)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <text
        x={p1.x + (p2.x - p1.x) * 0.25}
        y={p1.y - 6}
        fontFamily='"JetBrains Mono", monospace'
        fontSize="10"
        fill="#22d3ee"
      >
        {from}
      </text>
      <text
        x={p2.x - 12}
        y={p2.y - 6}
        fontFamily='"JetBrains Mono", monospace'
        fontSize="10"
        fill="#22d3ee"
        textAnchor="end"
      >
        {to}
      </text>
      <text
        x={midX}
        y={midY - 6}
        fontFamily='"Inter", system-ui, sans-serif'
        fontSize="11"
        fill="#8888a0"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

/* ─────────────────────────── UI Showcase ─────────────────────────── */

function ShowcaseSection() {
  const frames = [
    { title: "Society Builder", body: <ShowcaseBuilder /> },
    { title: "Event Drop",      body: <ShowcaseEvent /> },
    { title: "Cascade",         body: <ShowcaseSim /> },
    { title: "Story Card",      body: <ShowcaseStory /> },
  ];
  return (
    <section className="py-16 border-t border-subtle">
      <h2 className="font-display font-semibold text-primary text-[28px] tracking-[-0.01em] text-center">
        The Experience
      </h2>
      <p className="font-body text-secondary text-sm mt-2 text-center max-w-xl mx-auto">
        Four screens. One ~12-second choreography. Pacing over volume.
      </p>
      <div className="grid md:grid-cols-2 gap-5 mt-10">
        {frames.map((f) => (
          <BrowserFrame key={f.title} title={f.title}>
            {f.body}
          </BrowserFrame>
        ))}
      </div>
    </section>
  );
}

function BrowserFrame({ title, children }) {
  return (
    <div className="rounded-lg bg-surface border border-subtle overflow-hidden shadow-md">
      <div className="h-8 bg-elevated border-b border-subtle flex items-center px-3 gap-1.5">
        <span className="h-2 w-2 rounded-full bg-wave-red/70" />
        <span className="h-2 w-2 rounded-full bg-wave-amber/70" />
        <span className="h-2 w-2 rounded-full bg-wave-green/70" />
        <span className="ml-3 font-mono text-[10px] text-muted uppercase tracking-[0.16em]">
          {title}
        </span>
      </div>
      <div className="aspect-[16/10] relative">{children}</div>
    </div>
  );
}

function ShowcaseBuilder() {
  const chars = [
    { x: 0.5, y: 0.32, e: "🚗", n: "Ramesh" },
    { x: 0.3, y: 0.55, e: "🎓", n: "Priya" },
    { x: 0.72, y: 0.55, e: "🏪", n: "Suresh" },
    { x: 0.16, y: 0.32, e: "👩‍🏫", n: "Meera" },
    { x: 0.86, y: 0.32, e: "🧑‍🌾", n: "Bhagwat" },
    { x: 0.5, y: 0.78, e: "👮", n: "Vikram" },
    { x: 0.86, y: 0.78, e: "🥛", n: "Govind" },
    { x: 0.3, y: 0.84, e: "☕", n: "Lakshmi" },
  ];
  const edges = [
    [0, 1], [0, 7], [2, 6], [4, 2], [3, 1], [5, 2], [6, 4], [7, 2],
  ];
  return (
    <div className="absolute inset-0 p-4">
      <svg viewBox="0 0 320 200" className="w-full h-full">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={chars[a].x * 320}
            y1={chars[a].y * 200}
            x2={chars[b].x * 320}
            y2={chars[b].y * 200}
            stroke="rgba(34,211,238,0.2)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
          />
        ))}
        {chars.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x * 320}
              cy={c.y * 200}
              r="11"
              fill="#16161c"
              stroke="rgba(34,211,238,0.55)"
              strokeWidth="1"
            />
            <text x={c.x * 320} y={c.y * 200 + 4} textAnchor="middle" fontSize="10">
              {c.e}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ShowcaseEvent() {
  const events = ["🛢️", "🌊", "🌧️", "🏦", "📵", "💰"];
  return (
    <div className="absolute inset-0 p-5 flex items-center justify-center">
      <div className="bg-elevated border border-subtle rounded-md p-4 w-[78%]">
        <div className="font-display font-semibold text-primary text-[13px] text-center">
          Choose your event
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          {events.map((e, i) => (
            <div
              key={i}
              className="bg-surface border border-subtle rounded-sm p-1.5 text-center"
              style={i === 0 ? { borderColor: TONE.amber } : undefined}
            >
              <span className="text-[14px]">{e}</span>
            </div>
          ))}
        </div>
        <div
          className="mt-2.5 rounded-full bg-accent-blue text-white text-[10px] font-medium py-1 text-center"
        >
          Trigger Event
        </div>
      </div>
    </div>
  );
}

function ShowcaseSim() {
  const reduced = useReducedMotion();
  return (
    <div className="absolute inset-0 p-3"
      style={{ background: "radial-gradient(circle at 50% 50%, #0d0d12, var(--bg-void))" }}>
      <svg viewBox="0 0 320 200" className="w-full h-full">
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="160"
            cy="100"
            r="14"
            fill="none"
            stroke={[TONE.amber, TONE.orange, TONE.red][i]}
            strokeWidth="1.5"
            style={{
              transformOrigin: "160px 100px",
              animation: reduced
                ? "none"
                : `mini-sonar 3s ${i * 0.9}s cubic-bezier(0.16,1,0.3,1) infinite`,
            }}
          />
        ))}
        {[
          { x: 160, y: 100, e: "🛢️", c: TONE.amber },
          { x: 90, y: 60, e: "🚗", c: TONE.amber },
          { x: 230, y: 60, e: "🥛", c: TONE.amber },
          { x: 80, y: 150, e: "🎓", c: TONE.red },
          { x: 240, y: 150, e: "☕", c: TONE.orange },
        ].map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="13" fill="#16161c" stroke={n.c} strokeWidth="1.5" />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11">
              {n.e}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ShowcaseStory() {
  return (
    <div className="absolute inset-0 p-4 overflow-hidden">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-full bg-elevated border border-wave-red flex items-center justify-center text-lg">
          🚗
        </div>
        <div>
          <div className="font-display font-semibold text-primary text-[13px]">Ramesh</div>
          <div className="font-body text-[10px] text-secondary">Auto-rickshaw Driver · Pune</div>
        </div>
      </div>
      <div className="mt-3 font-mono text-[9px] text-secondary uppercase tracking-[0.16em]">
        Wave 01 · Direct Impact
      </div>
      <p className="font-body italic text-primary text-[11px] leading-relaxed mt-1.5">
        "Petrol phir mehnga ho gaya. ₹4500 ka budget tha fuel ka, ab ₹5400 lagega.
        Mahine ke end mein ₹900 ka shortfall."
      </p>
      <div className="mt-3 space-y-1.5 font-mono text-[10px]">
        <div className="flex justify-between">
          <span className="text-secondary">💰 Monthly fuel</span>
          <span className="text-wave-red">₹4,500 → ₹5,400</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">📊 Savings buffer</span>
          <span className="text-wave-amber">2.3 → 1.4 mo</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Features Section ─────────────────────────── */

function FeaturesSection() {
  const features = [
    {
      title: "Smart Connection Engine",
      description: "Wizard-created characters are now stitched into the economy instantly. The engine infers high-probability links from archetype, income proximity, dependencies, and location. Judges get a realistic, non-fragile network without manual setup overhead.",
      preview: <SmartConnectionsPreview />,
    },
    {
      title: "Impact Dashboard",
      description: "Real-time visualization of cascading economic impacts across the network. Watch vulnerability scores shift, dependencies break, and ripple effects spread through your society. Track every character's financial health as events unfold wave by wave.",
      preview: <ImpactDashboardPreview />,
    },
    {
      title: "Intervention Lab",
      description: "A policy sandbox inside the simulation. Pick a critical character, tune support budget, and instantly project prevented losses, reduced breaking points, and post-intervention recovery trajectories. This turns RIPPLE from storytelling into actionable planning.",
      preview: <InterventionLabPreview />,
    },
    {
      title: "Ask the Characters",
      description: "Natural conversation with simulated characters. Ask Ramesh about his fuel costs, Priya about her scholarship, or anyone else about their daily struggles. Get nuanced, first-person responses in Hinglish that reveal the human side of policy impact.",
      preview: <AskCharactersPreview />,
    },
    {
      title: "Character Creation Wizard",
      description: "Step-by-step guided creation of economic personas. Set income, expenses, EMI, and dependencies. Get real-time vulnerability scores and warnings for unrealistic profiles. Build your cast with full economic depth in minutes, not hours.",
      preview: <CharacterWizardPreview />,
    },
  ];

  return (
    <section className="py-16 border-t border-subtle">
      <h2 className="font-display font-semibold text-primary text-[28px] tracking-[-0.01em] text-center">
        Key Features
      </h2>
      <p className="font-body text-secondary text-sm mt-2 text-center max-w-xl mx-auto">
        Powerful tools designed to make societal impact simulation accessible and intuitive.
      </p>
      <div className="grid md:grid-cols-1 gap-10 mt-12">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
          >
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <h3 className="font-display font-semibold text-primary text-2xl tracking-[-0.01em]">
                {feature.title}
              </h3>
              <p className="font-body text-secondary text-[15px] leading-relaxed mt-4">
                {feature.description}
              </p>
            </div>
            <div className={`rounded-lg bg-surface border border-subtle overflow-hidden shadow-md ${i % 2 === 1 ? "md:order-1" : ""}`}>
              {feature.preview}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ImpactDashboardPreview() {
  return (
    <div className="aspect-video p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #111114 0%, #1a1a1f 100%)" }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-secondary uppercase tracking-[0.08em]">Wave 02</span>
          <span className="font-mono text-xs text-wave-amber">+3 affected</span>
        </div>
        <div className="space-y-2">
          {[
            { name: "Ramesh", score: 75, color: TONE.red },
            { name: "Priya", score: 62, color: TONE.orange },
            { name: "Suresh", score: 45, color: TONE.amber },
          ].map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-primary font-medium">{c.name}</span>
                <span style={{ color: c.color }}>{c.score}%</span>
              </div>
              <div className="h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${c.score}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-subtle text-xs text-secondary space-y-1">
          <div className="flex justify-between">
            <span>💰 Total savings at risk:</span>
            <span className="text-wave-red">₹18,200</span>
          </div>
          <div className="flex justify-between">
            <span>🔗 Broken dependencies:</span>
            <span className="text-wave-orange">2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartConnectionsPreview() {
  const nodes = [
    { e: "🚗", n: "Driver", x: 0.2, y: 0.3 },
    { e: "🏪", n: "Store", x: 0.55, y: 0.28 },
    { e: "🎓", n: "Student", x: 0.82, y: 0.48 },
    { e: "☕", n: "Chai", x: 0.5, y: 0.72 },
    { e: "🆕", n: "New", x: 0.22, y: 0.72 },
  ];
  const links = [
    [0, 1, "solid"],
    [1, 2, "solid"],
    [1, 3, "solid"],
    [4, 0, "inferred"],
    [4, 3, "inferred"],
  ];

  return (
    <div className="aspect-video p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #111114 0%, #1a1a1f 100%)" }}>
      <svg viewBox="0 0 320 180" className="w-full h-full">
        {links.map(([a, b, kind], i) => (
          <line
            key={i}
            x1={nodes[a].x * 320}
            y1={nodes[a].y * 180}
            x2={nodes[b].x * 320}
            y2={nodes[b].y * 180}
            stroke={kind === "inferred" ? TONE.blue : "rgba(34,211,238,0.3)"}
            strokeDasharray={kind === "inferred" ? "4 3" : "0"}
            strokeWidth="1.4"
          />
        ))}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle cx={node.x * 320} cy={node.y * 180} r="13" fill="#15151a" stroke="rgba(34,211,238,0.55)" />
            <text x={node.x * 320} y={node.y * 180 + 4} textAnchor="middle" fontSize="10">{node.e}</text>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-3 left-4 font-mono text-[10px] text-secondary uppercase tracking-[0.12em]">
        inferred links activate in under 1 sec
      </div>
    </div>
  );
}

function InterventionLabPreview() {
  return (
    <div className="aspect-video p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #111114 0%, #1a1a1f 100%)" }}>
      <div className="rounded-md border border-subtle bg-surface/70 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-primary font-semibold">Intervention Lab</span>
          <span className="font-mono text-[10px] text-accent-cyan">WHAT-IF</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-secondary">Protect</span>
            <span className="text-primary">🥛 Govind</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Budget</span>
            <span className="text-accent-cyan font-mono">₹52,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Loss prevented</span>
            <span className="text-wave-green font-mono">₹31,400</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Breaking point</span>
            <span className="text-wave-amber font-mono">5 to 3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AskCharactersPreview() {
  return (
    <div className="aspect-video p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #111114 0%, #1a1a1f 100%)" }}>
      <div className="space-y-3 h-full flex flex-col">
        <div className="flex items-start gap-2">
          <div className="h-6 w-6 rounded-full bg-accent-blue/20 border border-accent-blue flex items-center justify-center text-xs flex-none">
            🚗
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-accent-blue">Ramesh</div>
            <p className="text-xs text-secondary mt-1 leading-relaxed">
              "Petrol ke baad, ab diesel bhi badhne lag gaya. Mere business ka margin hi nahi reh gaya..."
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 justify-end">
          <div className="flex-1 text-right">
            <div className="text-xs font-semibold text-muted">You</div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              What if you raised fares?
            </p>
          </div>
          <div className="h-6 w-6 rounded-full bg-muted/10 flex-none" />
        </div>
        <div className="flex items-start gap-2 flex-1 overflow-hidden">
          <div className="h-6 w-6 rounded-full bg-wave-amber/20 border border-wave-amber flex items-center justify-center text-xs flex-none">
            💭
          </div>
          <div className="flex-1">
            <p className="text-xs text-wave-amber leading-relaxed italic">
              "Raise fare? Phir customers jaenge Uber ya auto pool mein..."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CharacterWizardPreview() {
  return (
    <div className="aspect-video p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #111114 0%, #1a1a1f 100%)" }}>
      <div className="space-y-4">
        <div className="text-center pb-4 border-b border-subtle">
          <div className="text-3xl mb-2">🎓</div>
          <div className="text-sm font-semibold text-primary">Create Character</div>
          <div className="text-xs text-secondary mt-1">Step 3 of 4: Finances</div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-[0.08em] text-secondary font-semibold">Income</label>
            <div className="text-lg font-display font-bold text-accent-cyan mt-1">₹25,000/mo</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-elevated rounded border border-subtle">
              <div className="text-secondary">Fixed Expenses</div>
              <div className="font-semibold text-primary">₹12,000</div>
            </div>
            <div className="p-2 bg-elevated rounded border border-subtle">
              <div className="text-secondary">EMI</div>
              <div className="font-semibold text-primary">₹5,000</div>
            </div>
          </div>
          <div className="pt-2 border-t border-subtle">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-secondary">Vulnerability</span>
              <span className="font-semibold text-wave-amber">36%</span>
            </div>
            <div className="h-2 bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r"
                style={{ width: "36%", backgroundImage: `linear-gradient(to right, ${TONE.green}, ${TONE.amber})` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tech Stack ─────────────────────────── */

function TechStackSection() {
  const stack = [
    { name: "React + Vite", color: "#61dafb" },
    { name: "Tailwind CSS", color: "#22d3ee" },
    { name: "Framer Motion", color: "#bb86ff" },
    { name: "d3-force", color: "#f59e0b" },
    { name: "Claude Sonnet 4.5", color: "#cc785c" },
    { name: "Lucide Icons", color: "#22c55e" },
  ];
  return (
    <section className="py-14 border-t border-subtle">
      <h2 className="font-display font-semibold text-primary text-[22px] tracking-[-0.01em] text-center">
        Built with
      </h2>
      <div className="flex flex-wrap gap-2.5 justify-center mt-6">
        {stack.map((s) => (
          <span
            key={s.name}
            className="inline-flex items-center gap-2 font-body text-[13px] font-medium text-primary border border-subtle bg-surface rounded-full px-3.5 py-1.5"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Footer ─────────────────────────── */

function Footer() {
  return (
    <footer className="pt-14 mt-10 border-t border-subtle text-center">
      <div className="font-display font-semibold text-primary text-lg">RIPPLE</div>
      <div className="font-body text-secondary text-sm mt-1.5">
        Every event has a face.
      </div>
      <div className="font-body text-muted text-xs mt-6 inline-flex items-center gap-1.5 justify-center">
        Feature Friday  Built with
        <Heart className="h-3 w-3 inline" style={{ color: TONE.red }} />
        and Claude
      </div>
      <div className="mt-5 inline-flex gap-2">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-body text-xs text-secondary hover:text-primary"
        >
          <Github className="h-3.5 w-3.5" /> source on github
        </a>
      </div>
    </footer>
  );
}
