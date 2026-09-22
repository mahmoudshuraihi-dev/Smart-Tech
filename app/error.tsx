"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportError } from "@/lib/error-reporter";
import { useI18n } from "@/lib/i18n";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    reportError({
      message: error.message,
      stack: error.stack ?? null,
      digest: error.digest ?? null,
      source: "boundary",
    });
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-5 py-20 text-center">
      <div>
        <h1 className="font-display text-xl">{t.errors.boundaryHeading}</h1>
        <p className="text-muted mt-2">{t.errors.boundaryBody}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper-raised hover:bg-mark transition-colors"
          >
            {t.errors.tryAgain}
          </button>
          <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">
            {t.common.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
