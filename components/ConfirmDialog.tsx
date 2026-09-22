"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { IconClose } from "@/components/icons";

const PANEL_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const handleClose = () => {
    if (pending) return;
    setError(false);
    onClose();
  };

  const handleConfirm = async () => {
    setPending(true);
    setError(false);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : PANEL_TRANSITION}
          onClick={handleClose}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className="card w-full max-w-sm rounded-2xl p-5 sm:p-6"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 12 }}
            transition={reduceMotion ? { duration: 0 } : PANEL_TRANSITION}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">{title}</h2>
              <button
                onClick={handleClose}
                aria-label={t.chat.cancel}
                className="text-muted hover:text-ink transition-colors"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted leading-relaxed">{message}</p>
            {error && <p className="mt-2 text-xs text-red-500">{t.chat.actionFailed}</p>}

            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={handleConfirm}
                disabled={pending}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold text-paper-raised transition-opacity disabled:opacity-50 ${
                  danger ? "bg-red-500 hover:opacity-90" : "bg-mark hover:opacity-90"
                }`}
              >
                {pending ? t.chat.actionPending : confirmLabel}
              </button>
              <button
                onClick={handleClose}
                disabled={pending}
                className="text-xs text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                {t.chat.cancel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
