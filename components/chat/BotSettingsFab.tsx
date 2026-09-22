"use client";

import { useEffect, useState, FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { AutoReplyRule } from "@/lib/models";
import { getBotSettingsOnce, updateWelcomeMessage, addRule, updateRule, deleteRule } from "@/lib/bot-store";
import { IconBot, IconClose, IconEdit } from "@/components/icons";

const PANEL_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

export default function BotSettingsFab() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [welcomeDraft, setWelcomeDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formQ, setFormQ] = useState("");
  const [formA, setFormA] = useState("");

  const refresh = async () => {
    const settings = await getBotSettingsOnce();
    setRules(settings.rules);
    setWelcomeDraft(settings.welcomeMessage);
  };

  useEffect(() => {
    // Fetch-on-open: loads the latest bot settings each time the panel opens. Fires at most
    // once per open/close toggle, not in a loop; there's no data-fetching library in this
    // project to route it through instead (see lib/bot-store.ts's plain getBotSettingsOnce()).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) refresh();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSaveWelcome = async () => {
    await updateWelcomeMessage(welcomeDraft);
    refresh();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormQ("");
    setFormA("");
  };

  const handleEditRule = (rule: AutoReplyRule) => {
    setEditingId(rule.id);
    setFormQ(rule.q);
    setFormA(rule.a);
  };

  const handleDeleteRule = async (id: string) => {
    await deleteRule(id);
    if (editingId === id) resetForm();
    refresh();
  };

  const handleSubmitRule = async (e: FormEvent) => {
    e.preventDefault();
    if (!formQ.trim() || !formA.trim()) return;
    if (editingId) {
      await updateRule(editingId, formQ.trim(), formA.trim());
    } else {
      await addRule(formQ.trim(), formA.trim());
    }
    resetForm();
    refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t.chat.botSettingsTitle}
        className="fixed bottom-6 end-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
        style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
      >
        <IconBot className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : PANEL_TRANSITION}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.chat.botSettingsTitle}
              className="card w-full max-w-lg max-h-full overflow-y-auto rounded-2xl p-5 sm:p-6"
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 12 }}
              transition={reduceMotion ? { duration: 0 } : PANEL_TRANSITION}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg">{t.chat.botSettingsTitle}</h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label={t.chat.cancel}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5">
                <label htmlFor="welcome-message" className="block text-xs font-semibold mb-1.5 text-muted">
                  {t.chat.welcomeMessageLabel}
                </label>
                <textarea
                  id="welcome-message"
                  value={welcomeDraft}
                  onChange={(e) => setWelcomeDraft(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:border-mark"
                />
                <button
                  onClick={handleSaveWelcome}
                  className="mt-2 rounded-full bg-mark px-4 py-1.5 text-xs font-semibold text-paper-raised hover:opacity-90 transition-opacity"
                >
                  {t.chat.save}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-line">
                <p className="text-xs font-semibold mb-2.5 text-muted">{t.chat.rulesLabel}</p>

                {rules.length === 0 ? (
                  <p className="text-sm text-muted">{t.chat.noRules}</p>
                ) : (
                  <ul className="space-y-2">
                    {rules.map((rule) => (
                      <li
                        key={rule.id}
                        className="flex items-start justify-between gap-2 rounded-lg border border-line px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{rule.q}</p>
                          <p className="text-xs text-muted line-clamp-2 mt-0.5">{rule.a}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditRule(rule)}
                            aria-label="Edit rule"
                            className="text-muted hover:text-mark transition-colors"
                          >
                            <IconEdit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            aria-label="Delete rule"
                            className="text-muted hover:text-red-500 transition-colors"
                          >
                            <IconClose className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={handleSubmitRule} className="mt-3 space-y-2">
                  <input
                    value={formQ}
                    onChange={(e) => setFormQ(e.target.value)}
                    placeholder={t.chat.ruleQuestionPlaceholder}
                    className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder-muted/70 outline-none focus-visible:border-mark"
                  />
                  <textarea
                    value={formA}
                    onChange={(e) => setFormA(e.target.value)}
                    placeholder={t.chat.ruleAnswerPlaceholder}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder-muted/70 outline-none focus-visible:border-mark"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="rounded-full bg-mark px-4 py-1.5 text-xs font-semibold text-paper-raised hover:opacity-90 transition-opacity"
                    >
                      {editingId ? t.chat.saveEdit : t.chat.addRule}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-xs text-muted hover:text-ink transition-colors"
                      >
                        {t.chat.cancel}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
