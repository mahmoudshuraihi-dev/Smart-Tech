"use client";

import { useI18n } from "@/lib/i18n";

export default function Loading() {
  const { t } = useI18n();
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-20">
      <p className="text-sm text-muted">{t.common.loading}</p>
    </main>
  );
}
