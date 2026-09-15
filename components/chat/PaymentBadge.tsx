"use client";

import { useI18n } from "@/lib/i18n";
import type { PaymentStatus } from "@/lib/mock-data";

const STATUS_META: Record<PaymentStatus, { dot: string; bg: string; text: string; border: string; labelKey: "paymentPaid" | "paymentUnpaid" | "paymentPartial" }> = {
  paid: { dot: "bg-mark", bg: "bg-mark/12", text: "text-mark", border: "border-mark/30", labelKey: "paymentPaid" },
  partial: { dot: "bg-amber-500", bg: "bg-amber-500/12", text: "text-amber-600", border: "border-amber-500/30", labelKey: "paymentPartial" },
  unpaid: { dot: "bg-red-500", bg: "bg-red-500/12", text: "text-red-500", border: "border-red-500/30", labelKey: "paymentUnpaid" },
};

export function PaymentBadge({ status, className = "" }: { status: PaymentStatus; className?: string }) {
  const { t } = useI18n();
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.bg} ${meta.text} ${meta.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {t.chat[meta.labelKey]}
    </span>
  );
}

export function PaymentStatusToggle({
  status,
  onChange,
}: {
  status: PaymentStatus;
  onChange: (status: PaymentStatus) => void;
}) {
  const { t } = useI18n();
  const order: PaymentStatus[] = ["unpaid", "partial", "paid"];

  return (
    <div role="group" aria-label={t.chat.paymentLabel} className="inline-flex items-center gap-1 rounded-full border border-line p-0.5">
      {order.map((s) => {
        const meta = STATUS_META[s];
        const active = s === status;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              active ? `${meta.bg} ${meta.text}` : "text-muted hover:text-ink"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? meta.dot : "bg-line"}`} aria-hidden="true" />
            {t.chat[meta.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
