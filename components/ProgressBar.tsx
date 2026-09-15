"use client";

import { STAGES, Stage } from "@/lib/mock-data";

export function stageProgress(stage: Stage): number {
  const idx = STAGES.indexOf(stage);
  return Math.round(((idx + 1) / STAGES.length) * 100);
}

export default function ProgressBar({ stage, label }: { stage: Stage; label: string }) {
  const percent = stageProgress(stage);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="text-ink font-semibold">{percent}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-line overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-mark transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
