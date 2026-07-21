import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Slider } from "../components/ui/Slider.jsx";
import { AvatarToken } from "../components/ripple/AvatarToken.jsx";
import { VulnerabilityBar } from "../components/ripple/VulnerabilityBar.jsx";
import { CharacterWizard } from "../components/ripple/CharacterWizard.jsx";
import {
  ARCHETYPES,
  DEMO_CHARACTERS,
  DEMO_CONNECTIONS,
  vulnerability,
} from "../data/society.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import {
  canonicalEdgeKey,
  countEconomicLinks,
  inferConnectionsForCharacter,
  mergeUniqueConnections,
} from "../lib/connections.js";

/** Organic-looking but deterministic positions, seeded by character id. */
function seededPosition(id, n) {
  // golden-angle layout in a 0.1–0.9 box
  const phi = Math.PI * (3 - Math.sqrt(5));
  const t = id * phi;
  const r = 0.32 * Math.sqrt(((id * 13) % n) / n + 0.2);
  const cx = 0.5 + r * Math.cos(t);
  const cy = 0.5 + r * Math.sin(t) * 0.85;
  return { x: Math.max(0.12, Math.min(0.88, cx)), y: Math.max(0.18, Math.min(0.82, cy)) };
}

function withPositions(chars) {
  return chars.map((c, _i, arr) =>
    c.x != null && c.y != null ? c : { ...c, ...seededPosition(c.id, arr.length) }
  );
}

const STORAGE_KEY = "ripple.society.v1";

export function SocietyBuilder({ go, onReady }) {
  const [stored, setStored] = useLocalStorage(STORAGE_KEY, {
    characters: DEMO_CHARACTERS,
    connections: DEMO_CONNECTIONS,
  });

  const characters = useMemo(() => withPositions(stored.characters), [stored.characters]);
  const connections = stored.connections;

  const [selId, setSel] = useState(null);
  const [hov, setHov] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const selected = selId != null ? characters.find((c) => c.id === selId) : null;

  const networkStats = useMemo(() => {
    const linked = new Set();
    connections.forEach((e) => {
      linked.add(e.a);
      linked.add(e.b);
    });
    const isolated = characters.filter((c) => !linked.has(c.id)).length;
    const avgDegree = characters.length ? ((connections.length * 2) / characters.length).toFixed(1) : "0.0";
    return {
      isolated,
      avgDegree,
      economicLinks: countEconomicLinks(connections),
    };
  }, [characters, connections]);

  const updateChar = (id, patch) => {
    setStored((s) => ({
      ...s,
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const deleteChar = (id) => {
    setStored((s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      connections: s.connections.filter((e) => e.a !== id && e.b !== id),
    }));
    setSel(null);
  };

  const addFromArchetype = (key) => {
    const meta = ARCHETYPES[key];
    if (!meta) return;
    let createdId = null;
    setStored((s) => {
      const id = (s.characters.reduce((m, c) => Math.max(m, c.id), 0) || 0) + 1;
      createdId = id;
      const tmpl = {
        id,
        key,
        emoji: meta.emoji,
        name: `New ${meta.label.split(" ")[0]}`,
        archetype: meta.label,
        location: "—",
        income: 20000,
        fixed: 9000,
        emi: 2000,
        savings: 3000,
        dependencies: [],
      };
      const inferred = inferConnectionsForCharacter(tmpl, s.characters, s.connections, 2);
      return {
        ...s,
        characters: [...s.characters, tmpl],
        connections: mergeUniqueConnections(s.connections, inferred),
      };
    });
    setSel(createdId);
  };

  const addFromWizard = (profile) => {
    let createdId = null;
    setStored((s) => {
      const id = (s.characters.reduce((m, c) => Math.max(m, c.id), 0) || 0) + 1;
      createdId = id;
      const character = {
        id,
        ...profile,
        dependencies: [],
      };
      const inferred = inferConnectionsForCharacter(character, s.characters, s.connections, 3);
      return {
        ...s,
        characters: [...s.characters, character],
        connections: mergeUniqueConnections(s.connections, inferred),
      };
    });
    setSel(createdId);
    setShowWizard(false);
  };

  const addConnection = (a, b, type, strength) => {
    if (!a || !b || a === b) return;
    setStored((s) => ({
      ...s,
      connections: mergeUniqueConnections(s.connections, [
        {
          a,
          b,
          type: type || "depends_on",
          strength: Math.max(1, Math.min(10, Number(strength) || 5)),
        },
      ]),
    }));
  };

  const removeConnection = (a, b) => {
    const kill = canonicalEdgeKey(a, b);
    setStored((s) => ({
      ...s,
      connections: s.connections.filter((e) => canonicalEdgeKey(e.a, e.b) !== kill),
    }));
  };

  const resetSociety = () => {
    setStored({ characters: DEMO_CHARACTERS, connections: DEMO_CONNECTIONS });
    setSel(null);
  };

  const archetypeKeys = Object.keys(ARCHETYPES);

  return (
    <div className="flex h-full flex-col bg-void">
      {/* Top bar */}
      <header className="h-14 flex-none flex items-center px-3 sm:px-5 gap-2 sm:gap-4 border-b border-subtle">
        <button
          onClick={() => go("landing")}
          className="h-8 w-8 flex-none inline-flex items-center justify-center rounded-md border border-subtle text-secondary hover:text-primary hover:border-active transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="font-display font-semibold text-xl text-primary tracking-[-0.01em]">
          RIPPLE
        </span>
        <span className="flex-1 text-center font-body text-base text-secondary hidden md:inline">
          Society Builder
        </span>
        <span className="flex-1 md:hidden" />
        <Badge tone="neutral" mono className="hidden sm:inline-flex">
          {characters.length} characters
        </Badge>
        <Button variant="ghost" size="sm" onClick={resetSociety} iconLeft={<RotateCcw className="h-3.5 w-3.5" />}>
          <span className="hidden sm:inline">Reset</span>
        </Button>
        <Button
          variant="primary"
          glow
          pulse
          onClick={() => {
            onReady?.({ characters, connections });
            go("event");
          }}
          iconRight={<ArrowRight className="h-4 w-4" />}
        >
          <span className="hidden sm:inline">Drop an Event</span>
          <span className="sm:hidden">Event</span>
        </Button>
      </header>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Canvas */}
        <div className="relative md:flex-[0_0_60%] flex-none h-[55vh] md:h-auto overflow-hidden md:border-r border-b md:border-b-0 border-subtle">
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            {connections.map((e, i) => {
              const a = characters.find((c) => c.id === e.a);
              const b = characters.find((c) => c.id === e.b);
              if (!a || !b) return null;
              const lit = hov != null && (hov === e.a || hov === e.b);
              return (
                <line
                  key={i}
                  x1={`${a.x * 100}%`}
                  y1={`${a.y * 100}%`}
                  x2={`${b.x * 100}%`}
                  y2={`${b.y * 100}%`}
                  stroke={lit ? "var(--accent-cyan)" : "rgba(34,211,238,0.18)"}
                  strokeWidth={lit ? 1.6 : 1}
                  strokeDasharray={
                    ["buys_from", "sells_to", "depends_on"].includes(e.type) ? "5 5" : "0"
                  }
                  style={{ transition: "stroke 200ms" }}
                />
              );
            })}
          </svg>

          {characters.map((c) => {
            const v = vulnerability(c);
            return (
              <motion.div
                key={c.id}
                onClick={() => setSel(c.id)}
                onMouseEnter={() => setHov(c.id)}
                onMouseLeave={() => setHov(null)}
                animate={{ y: hov === c.id ? -4 : 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute cursor-pointer w-[110px] sm:w-[150px]"
                style={{
                  left: `${c.x * 100}%`,
                  top: `${c.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Card
                  padding="p-2 sm:p-3"
                  className={`text-center ${
                    selId === c.id
                      ? "border-accent-blue"
                      : hov === c.id
                      ? "border-active shadow-md"
                      : ""
                  }`}
                >
                  <div className="flex justify-center">
                    <AvatarToken emoji={c.emoji} vulnerability={v} size={44} className="sm:!hidden" />
                    <AvatarToken emoji={c.emoji} vulnerability={v} size={56} className="hidden sm:inline-flex" />
                  </div>
                  <div className="font-display font-semibold text-[12px] sm:text-[15px] text-primary mt-1.5 sm:mt-2 truncate">
                    {c.name}
                  </div>
                  <div className="font-body text-[10px] sm:text-[11px] text-secondary mt-0.5 truncate">
                    {c.archetype}
                  </div>
                  <div className="mt-2 sm:mt-2.5">
                    <VulnerabilityBar score={v} />
                  </div>
                </Card>
              </motion.div>
            );
          })}

          <div className="absolute bottom-4 left-4 font-mono text-[11px] text-muted tracking-[0.08em]">
            ╌╌ economic dependency &nbsp;·&nbsp; — social tie &nbsp;·&nbsp; hover to trace
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display font-semibold text-2xl text-primary m-0">
                  Your Society
                </h2>
                <p className="font-body text-sm text-secondary leading-normal mt-2.5">
                  Add characters to build your miniature world. Each person has an income,
                  expenses, dependencies, and connections to others.
                </p>

                <div className="grid grid-cols-3 gap-2.5 mt-5">
                  {archetypeKeys.map((key) => (
                    <Card
                      key={key}
                      interactive
                      padding="p-3.5"
                      className="text-center"
                      onClick={() => addFromArchetype(key)}
                    >
                      <div className="text-2xl leading-none">{ARCHETYPES[key].emoji}</div>
                      <div className="font-body text-[11px] text-secondary mt-1.5">
                        {ARCHETYPES[key].label}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setShowWizard(true)}
                    iconLeft={<Plus className="h-4 w-4" />}
                  >
                    Create Custom Character
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => addFromArchetype("auto")}
                    iconLeft={<Plus className="h-4 w-4" />}
                  >
                    Quick Add (Auto-rickshaw Driver)
                  </Button>
                </div>

                <Card padding="p-4" className="mt-5">
                  <div className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-secondary mb-2">
                    Network Intelligence
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="font-display font-bold text-xl text-primary">{connections.length}</div>
                      <div className="font-body text-[11px] text-muted">Total links</div>
                    </div>
                    <div>
                      <div className="font-display font-bold text-xl text-primary">{networkStats.economicLinks}</div>
                      <div className="font-body text-[11px] text-muted">Economic ties</div>
                    </div>
                    <div>
                      <div className={`font-display font-bold text-xl ${networkStats.isolated > 0 ? "text-wave-red" : "text-wave-green"}`}>
                        {networkStats.isolated}
                      </div>
                      <div className="font-body text-[11px] text-muted">Isolated</div>
                    </div>
                  </div>
                  <p className="font-body text-xs text-secondary mt-3">
                    Avg degree: <span className="font-mono text-primary">{networkStats.avgDegree}</span> links per character.
                  </p>
                </Card>

                <p className="font-body text-xs text-muted mt-5 text-center">
                  Click any character on the canvas to edit their profile.
                </p>
              </motion.div>
            ) : (
              <CharacterEditor
                key={`editor-${selected.id}`}
                character={selected}
                characters={characters}
                connections={connections}
                onChange={(patch) => updateChar(selected.id, patch)}
                onClose={() => setSel(null)}
                onDelete={() => deleteChar(selected.id)}
                onAddConnection={(targetId, type, strength) =>
                  addConnection(selected.id, targetId, type, strength)
                }
                onRemoveConnection={(targetId) => removeConnection(selected.id, targetId)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Character Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <CharacterWizard
            onCreate={addFromWizard}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CharacterEditor({
  character: c,
  characters,
  connections,
  onChange,
  onClose,
  onDelete,
  onAddConnection,
  onRemoveConnection,
}) {
  const v = vulnerability(c);
  const others = characters.filter((x) => x.id !== c.id);
  const linked = connections
    .filter((e) => e.a === c.id || e.b === c.id)
    .map((e) => ({
      ...e,
      otherId: e.a === c.id ? e.b : e.a,
    }));

  const [targetId, setTargetId] = useState(others[0]?.id || null);
  const [linkType, setLinkType] = useState("depends_on");
  const [strength, setStrength] = useState(6);

  useEffect(() => {
   if(!connectable.find((x) => x.id === targetId)){
     setTargetId(connectable[0]?.id ?? null);
   }
  },[c.id, connectable, targetId]);

  const linkedSet = new Set(linked.map((e) => e.otherId));
  const connectable = others.filter((x) => !linkedSet.has(x.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <AvatarToken emoji={c.emoji} vulnerability={v} size={48} />
        <div className="flex-1 min-w-0">
          <input
            value={c.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="font-display font-semibold text-xl text-primary bg-transparent border-none outline-none w-full"
          />
          <div className="font-body text-xs text-secondary truncate">
            {c.archetype} · {c.location}
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-subtle text-secondary hover:text-primary hover:border-active"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Input
          label="Income"
          prefix="₹"
          mono
          inputMode="numeric"
          value={String(c.income)}
          onChange={(e) => onChange({ income: numberOr(c.income, e.target.value) })}
        />
        <Input
          label="Fixed Expenses"
          prefix="₹"
          mono
          inputMode="numeric"
          value={String(c.fixed)}
          onChange={(e) => onChange({ fixed: numberOr(c.fixed, e.target.value) })}
        />
        <Input
          label="EMI"
          prefix="₹"
          mono
          inputMode="numeric"
          value={String(c.emi)}
          onChange={(e) => onChange({ emi: numberOr(c.emi, e.target.value) })}
        />
        <Input
          label="Savings"
          prefix="₹"
          mono
          inputMode="numeric"
          value={String(c.savings)}
          onChange={(e) => onChange({ savings: numberOr(c.savings, e.target.value) })}
        />
      </div>

      <div className="mt-5 p-4 border border-subtle rounded-md bg-surface">
        <VulnerabilityBar score={v} showLabel />
        <div className="font-body text-[11px] text-muted mt-2">
          Auto-calculated: 100 − (savings ÷ income) × 100
        </div>
      </div>

      <SectionLabel>Dependencies</SectionLabel>
      <div className="space-y-3.5">
        {(c.dependencies || []).map((d, i) => (
          <Slider
            key={`${c.id}-${i}`}
            label={`${d.name} · ₹${d.monthlyCost.toLocaleString("en-IN")}/mo`}
            tone="amber"
            value={d.criticality}
            onChange={(e) => {
              const next = [...c.dependencies];
              next[i] = { ...d, criticality: Number(e.target.value) };
              onChange({ dependencies: next });
            }}
          />
        ))}
        {(!c.dependencies || c.dependencies.length === 0) && (
          <p className="font-body text-xs text-muted">No dependencies yet.</p>
        )}
      </div>

      <SectionLabel>Connections</SectionLabel>
      <div className="space-y-2.5">
        {linked.map((edge) => {
          const other = characters.find((x) => x.id === edge.otherId);
          if (!other) return null;
          return (
            <div
              key={`${edge.a}-${edge.b}`}
              className="flex items-center justify-between rounded-md border border-subtle bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <div className="font-body text-sm text-primary truncate">
                  {other.emoji} {other.name}
                </div>
                <div className="font-mono text-[10px] text-secondary uppercase tracking-[0.08em]">
                  {edge.type} · strength {edge.strength}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveConnection(edge.otherId)}
              >
                Remove
              </Button>
            </div>
          );
        })}
        {linked.length === 0 && (
          <p className="font-body text-xs text-muted">No connections yet.</p>
        )}
      </div>

      <div className="mt-3 rounded-md border border-subtle bg-surface p-3 space-y-3">
        <div className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
          Add Connection
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={targetId ?? ""}
            onChange={(e) => setTargetId(Number(e.target.value))}
            className="h-10 rounded-md border border-subtle bg-void px-3 font-body text-sm text-primary outline-none"
            disabled={connectable.length === 0}
          >
            {connectable.length === 0 && <option value="">No unlinked characters</option>}
            {connectable.map((x) => (
              <option key={x.id} value={x.id}>
                {x.emoji} {x.name}
              </option>
            ))}
          </select>
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            className="h-10 rounded-md border border-subtle bg-void px-3 font-body text-sm text-primary outline-none"
          >
            <option value="serves">serves</option>
            <option value="buys_from">buys_from</option>
            <option value="sells_to">sells_to</option>
            <option value="depends_on">depends_on</option>
            <option value="teaches">teaches</option>
            <option value="patrols">patrols</option>
            <option value="supplies">supplies</option>
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
            <span>Strength</span>
            <span className="font-mono">{strength}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          disabled={!targetId || connectable.length === 0}
          onClick={() => onAddConnection(targetId, linkType, strength)}
        >
          Add link
        </Button>
      </div>

      <div className="mt-7 pt-4 border-t border-subtle">
        <Button
          variant="danger"
          onClick={onDelete}
          iconLeft={<Trash2 className="h-4 w-4" />}
        >
          Delete character
        </Button>
      </div>
    </motion.div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-secondary mt-6 mb-3">
      {children}
    </div>
  );
}

function numberOr(prev, raw) {
  const n = Number(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : prev;
}
