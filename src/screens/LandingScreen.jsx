import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { GithubButton } from "../components/ui/GithubButton.jsx";
import { useReducedMotion } from "../hooks/useReducedMotion.js";

const ROTATING_EVENTS = [
  { emoji: "🛢️", text: "petrol jumps ₹20",        tone: "#f59e0b" },
  { emoji: "🌧️", text: "the monsoon fails",        tone: "#f59e0b" },
  { emoji: "🏦", text: "RBI hikes rates +50bps",    tone: "#f97316" },
  { emoji: "📵", text: "WhatsApp goes dark 48h",    tone: "#ef4444" },
  { emoji: "🏏", text: "India lifts the Cup",       tone: "#22c55e" },
  { emoji: "🌊", text: "Hormuz closes for 14 days", tone: "#ef4444" },
];

const HINGLISH_QUOTES = [
  { e: "🚗", who: "Ramesh", role: "auto driver",
    text: "Petrol phir mehnga ho gaya. ₹4500 ka budget tha, ab ₹5400 lagega. Mahine ke end mein ₹900 ka shortfall." },
  { e: "🎓", who: "Priya", role: "engineering student",
    text: "Auto ka kiraya badh gaya. Ab paidal college jaati hoon. Thak jaati hoon, padhai pe asar pad raha hai." },
  { e: "☕", who: "Lakshmi", role: "chai stall owner",
    text: "Ramesh ab chai nahi peeta. Doodh aur cheeni dono mehnga. Bohot tight ho raha hai." },
  { e: "🧑‍🌾", who: "Bhagwat", role: "marginal farmer",
    text: "Pump ka diesel mehnga, mandi rate same. Crop loan ka EMI kaise bharoon is mahine?" },
];

/* ───────────── Calm particle field ───────────── */
function ParticleField() {
  const ref = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let w = 0;
    let h = 0;
    const N = 26;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00015,
      vy: (Math.random() - 0.5) * 0.00015,
    }));

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const dpr = window.devicePixelRatio || 1;
      const mx = mouse.current.x * dpr;
      const my = mouse.current.y * dpr;
      for (const n of nodes) {
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
        }
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const ax = nodes[i].x * w;
          const ay = nodes[i].y * h;
          const bx = nodes[j].x * w;
          const by = nodes[j].y * h;
          const d = Math.hypot(ax - bx, ay - by);
          const max = 180 * dpr;
          if (d < max) {
            ctx.strokeStyle = `rgba(34,211,238,${0.035 * (1 - d / max)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        const px = n.x * w;
        const py = n.y * h;
        const dm = Math.hypot(px - mx, py - my);
        const near = dm < 150 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, (near ? 2.4 : 1.4) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = near ? "rgba(34,211,238,0.4)" : "rgba(136,136,160,0.22)";
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      }}
      onMouseLeave={() => (mouse.current = { x: -999, y: -999 })}
      className="absolute inset-0 h-full w-full"
    />
  );
}

/* ───────────── What-if ticker ───────────── */
function EventTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % ROTATING_EVENTS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const ev = ROTATING_EVENTS[i];
  return (
    <div className="inline-flex items-center gap-2 font-body text-[15px] text-secondary leading-none">
      <span>What if</span>
      <span
        className="relative inline-block overflow-hidden"
        style={{ minWidth: 230, height: 22, verticalAlign: "middle" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 inline-flex items-center gap-1.5 font-medium whitespace-nowrap"
            style={{ color: ev.tone }}
          >
            <span>{ev.emoji}</span>
            <span>{ev.text}</span>
          </motion.span>
        </AnimatePresence>
      </span>
      <span>?</span>
    </div>
  );
}

/* ───────────── The preview card: cascade strip + diary quote ───────────── */
function PreviewCard() {
  const reduced = useReducedMotion();
  const ROW = [
    { e: "🛢️", n: "Crude",   t: "#f59e0b" },
    { e: "🚗", n: "Ramesh",  t: "#f59e0b" },
    { e: "🎓", n: "Priya",   t: "#f97316" },
    { e: "☕", n: "Lakshmi", t: "#ef4444" },
    { e: "🥛", n: "Govind",  t: "#f97316" },
    { e: "🧑‍🌾", n: "Bhagwat", t: "#f59e0b" },
  ];
  const [hit, setHit] = useState(-1);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    if (reduced) {
      setHit(ROW.length - 1);
      return;
    }
    let i = -1;
    const t = setInterval(() => {
      i = (i + 1) % (ROW.length + 1);
      setHit(i >= ROW.length ? -1 : i);
    }, 700);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    const t = setInterval(
      () => setQuoteIdx((x) => (x + 1) % HINGLISH_QUOTES.length),
      4800
    );
    return () => clearInterval(t);
  }, []);

  const q = HINGLISH_QUOTES[quoteIdx];

  return (
    <div className="w-full max-w-[640px] mx-auto bg-surface/80 backdrop-blur border border-subtle rounded-md overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-subtle bg-elevated/40">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-secondary">
          live cascade preview
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          🛢️ petrol +₹20 · wave {hit < 0 ? "—" : Math.min(3, hit + 1)} / 3
        </div>
      </div>

      {/* Cascade strip */}
      <div className="px-7 pt-6 pb-5">
        <div className="relative">
          <div className="absolute left-5 right-5 top-[18px] h-px bg-active/60" />
          <div className="relative flex justify-between items-start">
            {ROW.map((c, i) => {
              const active = hit >= i;
              return (
                <div key={i} className="relative flex flex-col items-center">
                  {hit === i && !reduced && (
                    <span
                      className="absolute top-[18px] left-1/2 rounded-full"
                      style={{
                        width: 36,
                        height: 36,
                        border: `1.5px solid ${c.t}`,
                        transformOrigin: "center",
                        animation: "land-sonar 1.4s cubic-bezier(0.16,1,0.3,1) forwards",
                      }}
                    />
                  )}
                  <motion.div
                    animate={{
                      scale: active ? 1 : 0.92,
                      borderColor: active ? c.t : "#333340",
                      boxShadow: active ? `0 0 14px ${c.t}66` : "none",
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 h-9 w-9 rounded-full border-2 bg-elevated flex items-center justify-center text-base"
                  >
                    {c.e}
                  </motion.div>
                  <span
                    className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] whitespace-nowrap"
                    style={{ color: active ? c.t : "var(--text-muted)" }}
                  >
                    {c.n}
                  </span>
                </div>
              );
            })}
          </div>
          <style>{`@keyframes land-sonar{0%{transform:translate(-50%,-50%) scale(0.5);opacity:0.85}100%{transform:translate(-50%,-50%) scale(4);opacity:0}}`}</style>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-subtle" />

      {/* Diary quote */}
      <div className="px-5 py-4 min-h-[112px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3"
          >
            <div className="h-10 w-10 rounded-full border border-active bg-elevated flex items-center justify-center text-lg flex-none">
              {q.e}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary">
                {q.who} · {q.role}
              </div>
              <p className="font-body italic text-primary text-[13px] leading-relaxed mt-1">
                “{q.text}”
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────────── Landing ───────────── */
export function LandingScreen({ go }) {
  return (
    <div className="relative h-full overflow-hidden bg-void">
      <ParticleField />

      {/* Subtle radial vignette so content reads cleanly over the particles */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(9,9,11,0) 0%, rgba(9,9,11,0.55) 60%, rgba(9,9,11,0.85) 100%)",
        }}
      />

      {/* Top chrome */}
      <div className="absolute top-5 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted pointer-events-auto">
          v0.4 · Feature Friday
        </div>
        <div className="pointer-events-auto">
          <GithubButton />
        </div>
      </div>

      {/* Hero column */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="w-full max-w-[680px] flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-secondary border border-subtle rounded-full px-3 py-1 bg-surface/60 backdrop-blur"
          >
            <Sparkles className="h-3 w-3 text-accent-cyan" />
            multi-agent societal impact simulation
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-primary mt-5 leading-none tracking-[-0.03em]"
            style={{
              fontSize: "clamp(56px, 9vw, 104px)",
              textShadow: "0 0 80px rgba(74,124,255,0.18)",
            }}
          >
            RIPPLE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-body text-base text-secondary mt-3"
          >
            Every event has a face.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-4"
          >
            <EventTicker />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              variant="primary"
              size="lg"
              glow
              onClick={() => go("builder")}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              Launch Simulation
            </Button>
            <Button variant="outline" size="lg" onClick={() => go("feature")}>
              Feature Friday
            </Button>
            <Button variant="outline" size="lg" onClick={() => go("chat")}>
              Ask the Characters
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mt-10"
          >
            <PreviewCard />
          </motion.div>
        </div>
      </div>

      {/* Footer ticker */}
      <div className="absolute bottom-5 left-0 right-0 z-10 text-center pointer-events-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          8 characters &nbsp;·&nbsp; 8 events &nbsp;·&nbsp; 3 waves &nbsp;·&nbsp; 1 Claude
        </div>
      </div>
    </div>
  );
}
