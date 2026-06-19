import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { EVENTS } from "../data/events.js";

export function EventSelector({ go, society, onTrigger }) {
  const [picked, setPicked] = useState(null);
  const [custom, setCustom] = useState("");
  const characters = society?.characters || [];

  const trigger = () => {
    const ev =
      EVENTS.find((e) => e.id === picked) ||
      (custom.trim()
        ? {
            id: "custom",
            emoji: "✨",
            name: custom.trim(),
            description: "Custom scenario",
          }
        : null);
    if (ev) onTrigger(ev);
  };

  return (
    <div className="relative h-full overflow-hidden bg-void">
      {/* Blurred network backdrop */}
      <div className="absolute inset-0 opacity-50 blur-[7px]">
        <svg className="h-full w-full">
          {characters.map((c) => (
            <circle
              key={c.id}
              cx={`${(c.x ?? 0.5) * 100}%`}
              cy={`${(c.y ?? 0.5) * 100}%`}
              r="22"
              fill="#16161c"
              stroke="var(--border-active)"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
      <div className="absolute inset-0 bg-void/55" />

      <div className="relative h-full flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[640px] max-h-[90%] overflow-y-auto"
        >
          <Card elevated padding="p-5 sm:p-8" className="!rounded-xl">
            <div className="text-center mb-5">
              <h2 className="font-display font-semibold text-2xl sm:text-[28px] text-primary m-0">
                Choose your event
              </h2>
              <p className="font-body text-sm text-secondary mt-2">
                Watch how it cascades through your society
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EVENTS.map((e) => (
                <div key={e.id} onClick={() => { setPicked(e.id); setCustom(""); }}>
                  <Card
                    interactive
                    glow={picked === e.id ? "amber" : null}
                    padding="p-3.5"
                    className="h-full"
                  >
                    <div className="flex gap-2.5">
                      <div className="text-[22px] leading-tight">{e.emoji}</div>
                      <div className="min-w-0">
                        <div className="font-display font-medium text-[15px] text-primary">
                          {e.name}
                        </div>
                        <div className="font-body text-xs text-secondary mt-1 leading-snug">
                          {e.description}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Input
                big
                placeholder="What if..."
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setPicked(null);
                }}
              />
              <p className="font-body text-xs text-muted mt-2 px-0.5">
                Be specific — &quot;onion prices triple&quot; works better than &quot;things get expensive&quot;.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => go("builder")}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                glow
                disabled={!picked && !custom.trim()}
                onClick={trigger}
                iconLeft={<Sparkles className="h-4 w-4" />}
                iconRight={<ArrowRight className="h-4 w-4" />}
                className="flex-1"
              >
                Trigger Event
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
