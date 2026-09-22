"use client";

import { STAGES, StageEvent, Stage } from "@/lib/models";
import { useI18n } from "@/lib/i18n";
import { IconCheck, IconClock } from "./icons";

export default function Timeline({ history, currentStage }: { history: StageEvent[]; currentStage: Stage }) {
  const { t, locale } = useI18n();
  const currentIdx = STAGES.indexOf(currentStage);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <ol className="relative ms-3 border-s border-line ps-6 space-y-6">
      {STAGES.map((stage, idx) => {
        const event = history.find((h) => h.stage === stage);
        const done = idx <= currentIdx;
        return (
          <li key={stage} className="relative">
            <span
              className={`absolute -start-[31px] flex h-6 w-6 items-center justify-center rounded-full border ${
                done ? "bg-mark border-mark text-night-foreground" : "bg-paper-raised border-line text-muted"
              }`}
            >
              {done ? <IconCheck className="h-3.5 w-3.5" /> : <IconClock className="h-3.5 w-3.5" />}
            </span>
            <p className={`text-sm font-semibold ${done ? "text-ink" : "text-muted"}`}>{t.stages[stage]}</p>
            {event && <p className="text-xs text-muted mt-0.5">{formatDate(event.at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}
