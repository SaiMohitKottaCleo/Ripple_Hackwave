import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";
import { AvatarToken } from "../components/ripple/AvatarToken.jsx";
import { WaveMarker } from "../components/ripple/WaveMarker.jsx";
import { StatReadout } from "../components/ripple/StatReadout.jsx";
import { characterReply } from "../lib/cascade.js";
import { vulnerability } from "../data/society.js";

const TONE = {
  amber: "var(--wave-amber)",
  orange: "var(--wave-orange)",
  red: "var(--wave-red)",
  green: "var(--wave-green)",
};

export function StoryPanel({ character, impacts, event, cracked, onClose }) {
  const [tab, setTab] = useState("story");

  // Reset to story view whenever a new character is selected
  useEffect(() => {
    if (character) setTab("story");
  }, [character?.id]);

  return (
    <motion.aside
      initial={false}
      animate={{ x: character ? "0%" : "100%" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] z-40 bg-surface border-l border-subtle shadow-lg flex flex-col"
    >
      {character && (
        <>
          <header className="px-5 py-4 border-b border-subtle flex items-center gap-3">
            <AvatarToken
              emoji={character.emoji}
              vulnerability={vulnerability(character)}
              size={44}
              cracked={cracked}
            />
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-lg text-primary truncate">
                {character.name}
              </div>
              <div className="font-body text-xs text-secondary truncate">
                {character.archetype} · {character.location}
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-subtle text-secondary hover:text-primary hover:border-active"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex gap-2 px-5 pt-3">
            {["story", "chat"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-body text-[13px] font-semibold capitalize px-3.5 py-2 rounded-full border transition-colors ${
                  tab === t
                    ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                    : "border-subtle bg-transparent text-secondary hover:text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "story" ? (
              <motion.div
                key="story"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto px-5 py-4"
              >
                <div className="font-mono text-xs text-secondary tracking-[0.06em] text-center">
                  ━━━ Day 0 ━━━{" "}
                  <span style={{ color: TONE[event?.tone || "amber"] }}>
                    {event?.emoji} {event?.name}
                  </span>
                </div>
                {impacts.length === 0 ? (
                  <p className="font-body text-sm text-muted mt-6 italic text-center">
                    This character isn&apos;t in the cascade — their world held steady.
                  </p>
                ) : (
                  impacts.map(({ wave, im }) => (
                    <div key={wave.n} className="mt-5">
                      <WaveMarker number={wave.n} title={wave.title} />
                      <p className="font-body text-sm text-primary leading-relaxed italic mt-3 mb-3.5">
                        “{im.diary}”
                      </p>
                      <div className="grid gap-2.5">
                        {im.rows.map((r, i) => (
                          <StatReadout
                            key={i}
                            icon={r[0]}
                            label={r[1]}
                            value={r[2]}
                            tone={r[3]}
                            size="sm"
                          />
                        ))}
                      </div>
                      <div className="border-t border-subtle mt-4" />
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <ChatTab key="chat" character={character} />
            )}
          </AnimatePresence>
        </>
      )}
    </motion.aside>
  );
}

function ChatTab({ character }) {
  const [msgs, setMsgs] = useState([
    {
      role: "char",
      text: `Namaste. ${character.name} bol raha hoon. Poochho, kya jaanna hai?`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  // Reset per character
  useEffect(() => {
    setMsgs([
      {
        role: "char",
        text: `Namaste. ${character.name} bol raha hoon. Poochho, kya jaanna hai?`,
      },
    ]);
    setDraft("");
  }, [character.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs.length, thinking]);

  const send = async () => {
    const q = draft.trim();
    if (!q || thinking) return;
    const userMsg = { role: "user", text: q };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setDraft("");
    setThinking(true);
    try {
      const reply = await characterReply({
        character,
        question: q,
        history: msgs,
      });
      setMsgs((m) => [...m, { role: "char", text: reply }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col min-h-0"
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[82%] font-body text-[13px] leading-normal px-3.5 py-2.5 rounded-2xl border ${
              m.role === "user"
                ? "self-end bg-accent-blue text-white border-transparent rounded-br-md"
                : "self-start bg-elevated text-primary border-subtle rounded-bl-md"
            }`}
          >
            {m.text}
          </div>
        ))}
        {thinking && (
          <div className="self-start bg-elevated text-secondary border border-subtle font-body text-[13px] px-3.5 py-2.5 rounded-2xl rounded-bl-md inline-flex gap-1.5">
            <span className="animate-pulse">·</span>
            <span className="animate-pulse" style={{ animationDelay: "0.15s" }}>
              ·
            </span>
            <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>
              ·
            </span>
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="px-5 py-3.5 border-t border-subtle flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask ${character.name} anything...`}
          className="flex-1 bg-void border border-subtle rounded-full px-3.5 py-2 text-primary font-body text-[13px] outline-none focus:border-accent-blue"
        />
        <button
          type="submit"
          disabled={!draft.trim() || thinking}
          className="bg-accent-blue text-white rounded-full px-4 inline-flex items-center justify-center disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}
