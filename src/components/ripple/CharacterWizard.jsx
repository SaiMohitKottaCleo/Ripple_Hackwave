import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Card } from "../ui/Card.jsx";
import { ARCHETYPES, vulnerability } from "../../data/society.js";
import { AvatarToken } from "./AvatarToken.jsx";
import { VulnerabilityBar } from "./VulnerabilityBar.jsx";

const EMOJI_SUGGESTIONS = [
  "🚗", "🎓", "🏪", "🧑‍🌾", "👩‍🏫", "👮", "🥛", "☕", "🏭", "🚚", "💊", "👷",
  "🚖", "👨‍💼", "🛵", "📱", "🏥", "🏠", "🌾", "🚜", "⚙️", "🔧", "📚", "💻"
];

const INCOME_BRACKETS = [
  { name: "Below 10K", min: 3000, max: 10000 },
  { name: "10K - 20K", min: 10000, max: 20000 },
  { name: "20K - 35K", min: 20000, max: 35000 },
  { name: "35K - 50K", min: 35000, max: 50000 },
  { name: "50K+", min: 50000, max: 100000 },
];

function validateProfile(profile) {
  const errors = [];
  const warnings = [];

  if (!profile.name?.trim()) errors.push("Name is required");
  if (!profile.archetype?.trim()) errors.push("Role/Archetype is required");
  if (profile.income <= 0) errors.push("Income must be greater than 0");
  if (profile.fixed < 0) errors.push("Fixed expenses cannot be negative");
  if (profile.emi < 0) errors.push("EMI cannot be negative");
  if (profile.savings < 0) errors.push("Savings cannot be negative");

  // Warnings for unrealistic profiles
  const totalExpenses = profile.fixed + profile.emi;
  if (totalExpenses > profile.income * 0.95) {
    warnings.push("Total expenses exceed 95% of income — no room for discretionary spending or emergencies");
  }
  if (profile.emi > profile.income * 0.3) {
    warnings.push("EMI is over 30% of income — financially stressed");
  }
  if (profile.savings > profile.income * 0.5) {
    warnings.push("Savings seem very high relative to income — verify realism");
  }
  if (profile.savings === 0) {
    warnings.push("Zero savings makes this person extremely vulnerable");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function CharacterWizard({ onCreate, onCancel }) {
  const [step, setStep] = useState(1); // 1: emoji & name, 2: role, 3: finances, 4: review
  const [profile, setProfile] = useState({
    emoji: "🚗",
    name: "",
    archetype: "",
    location: "—",
    income: 20000,
    fixed: 9000,
    emi: 2000,
    savings: 3000,
  });

  const validation = validateProfile(profile);
  const v = vulnerability(profile);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onCreate(profile);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-elevated border border-subtle rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-xl text-primary">Create Character</h2>
            <p className="text-xs text-secondary mt-1">Step {step} of 4: {["Emoji & Name", "Role", "Finances", "Review"][step - 1]}</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-6 rounded-full transition-colors ${
                  s <= step ? "bg-accent-blue" : "bg-subtle"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block font-body text-xs font-semibold uppercase tracking-[0.08em] text-secondary mb-3">
                      Choose an Emoji
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                      {EMOJI_SUGGESTIONS.map((emoji) => (
                        <motion.button
                          key={emoji}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setProfile({ ...profile, emoji })}
                          className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center text-2xl ${
                            profile.emoji === emoji
                              ? "border-accent-blue bg-accent-blue/10"
                              : "border-subtle hover:border-active"
                          }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Character Name"
                      placeholder="e.g., Ramesh, Priya, Suresh"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      big
                    />
                  </div>

                  <div>
                    <Input
                      label="Location"
                      placeholder="e.g., Pune, Maharashtra, Mumbai"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-surface border border-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl">{profile.emoji}</div>
                      <div>
                        <div className="font-semibold text-primary">{profile.name || "Your Character"}</div>
                        <div className="text-xs text-secondary">{profile.location}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block font-body text-xs font-semibold uppercase tracking-[0.08em] text-secondary mb-3">
                      Archetype / Role (or Custom)
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Object.entries(ARCHETYPES).map(([key, meta]) => (
                        <motion.button
                          key={key}
                          whileHover={{ x: 2 }}
                          onClick={() => setProfile({ ...profile, archetype: meta.label })}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                            profile.archetype === meta.label
                              ? "border-accent-blue bg-accent-blue/10"
                              : "border-subtle hover:border-active"
                          }`}
                        >
                          <div className="text-2xl">{meta.emoji}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-primary text-sm">{meta.label}</div>
                          </div>
                          {profile.archetype === meta.label && (
                            <CheckCircle2 className="h-4 w-4 text-accent-blue flex-none" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-subtle">
                    <Input
                      label="Or Create Custom Role"
                      placeholder="e.g., NGO Coordinator, Electrician"
                      value={profile.archetype}
                      onChange={(e) => setProfile({ ...profile, archetype: e.target.value })}
                    />
                    <p className="text-xs text-muted mt-2">Type to create a custom role instead</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block font-body text-xs font-semibold uppercase tracking-[0.08em] text-secondary mb-3">
                      Income Bracket (Quick Set)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {INCOME_BRACKETS.map((bracket) => (
                        <motion.button
                          key={bracket.name}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setProfile({ ...profile, income: (bracket.min + bracket.max) / 2 })}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            profile.income >= bracket.min && profile.income <= bracket.max
                              ? "border-accent-blue bg-accent-blue/10"
                              : "border-subtle hover:border-active"
                          }`}
                        >
                          <div className="font-semibold text-sm text-primary">{bracket.name}</div>
                          <div className="text-xs text-secondary">₹{bracket.min.toLocaleString()} – {bracket.max.toLocaleString()}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Monthly Income"
                      prefix="₹"
                      mono
                      inputMode="numeric"
                      value={String(profile.income)}
                      onChange={(e) => setProfile({ ...profile, income: numberOr(profile.income, e.target.value) })}
                    />
                    <Input
                      label="Fixed Expenses"
                      prefix="₹"
                      mono
                      inputMode="numeric"
                      value={String(profile.fixed)}
                      onChange={(e) => setProfile({ ...profile, fixed: numberOr(profile.fixed, e.target.value) })}
                    />
                    <Input
                      label="EMI (Loan)"
                      prefix="₹"
                      mono
                      inputMode="numeric"
                      value={String(profile.emi)}
                      onChange={(e) => setProfile({ ...profile, emi: numberOr(profile.emi, e.target.value) })}
                    />
                    <Input
                      label="Monthly Savings"
                      prefix="₹"
                      mono
                      inputMode="numeric"
                      value={String(profile.savings)}
                      onChange={(e) => setProfile({ ...profile, savings: numberOr(profile.savings, e.target.value) })}
                    />
                  </div>

                  {/* Warnings */}
                  {validation.warnings.length > 0 && (
                    <div className="space-y-2">
                      {validation.warnings.map((warning, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                        >
                          <AlertCircle className="h-4 w-4 text-amber-400 flex-none mt-0.5" />
                          <p className="text-xs text-amber-200">{warning}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-surface border border-subtle text-center">
                    <div className="flex justify-center mb-4">
                      <AvatarToken emoji={profile.emoji} vulnerability={v} size={72} />
                    </div>
                    <div className="font-display font-bold text-2xl text-primary mb-1">{profile.name}</div>
                    <div className="text-sm text-secondary mb-4">{profile.archetype} · {profile.location}</div>
                    <VulnerabilityBar score={v} showLabel />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card padding="p-4">
                      <div className="font-body text-xs text-secondary mb-1">Monthly Income</div>
                      <div className="font-display font-bold text-lg text-accent-cyan">
                        ₹{profile.income.toLocaleString("en-IN")}
                      </div>
                    </Card>
                    <Card padding="p-4">
                      <div className="font-body text-xs text-secondary mb-1">Total Expenses</div>
                      <div className="font-display font-bold text-lg text-wave-orange">
                        ₹{(profile.fixed + profile.emi).toLocaleString("en-IN")}
                      </div>
                    </Card>
                    <Card padding="p-4">
                      <div className="font-body text-xs text-secondary mb-1">Monthly Savings</div>
                      <div className="font-display font-bold text-lg text-wave-green">
                        ₹{profile.savings.toLocaleString("en-IN")}
                      </div>
                    </Card>
                    <Card padding="p-4">
                      <div className="font-body text-xs text-secondary mb-1">Savings Rate</div>
                      <div className="font-display font-bold text-lg text-accent-blue">
                        {((profile.savings / profile.income) * 100).toFixed(1)}%
                      </div>
                    </Card>
                  </div>

                  {validation.errors.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-none mt-0.5" />
                      <p className="text-xs text-green-200">Profile looks good! Ready to create.</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <div className="px-6 sm:px-8 py-4 bg-red-500/10 border-t border-red-500/30">
            {validation.errors.map((error, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 mb-2 last:mb-0"
              >
                <AlertCircle className="h-4 w-4 text-red-400 flex-none mt-0.5" />
                <p className="text-xs text-red-200">{error}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-subtle flex items-center justify-between bg-surface/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}
                onClick={handlePrev}
              >
                Back
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={validation.errors.length > 0}
              iconRight={step === 4 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
              onClick={handleNext}
            >
              {step === 4 ? "Create Character" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function numberOr(prev, raw) {
  const n = Number(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : prev;
}
