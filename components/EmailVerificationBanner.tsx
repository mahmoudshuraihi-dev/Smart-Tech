"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { auth } from "@/lib/firebase";

export default function EmailVerificationBanner() {
  const { session, resendVerification } = useAuth();
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!session.role || session.emailVerified) return null;

  const handleResend = async () => {
    const result = await resendVerification();
    if (result.ok) setSent(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await auth.currentUser?.reload();
    // reload() updates auth.currentUser but auth-context's own session state only refreshes
    // on the next onAuthStateChanged/onSnapshot tick — a full reload is the simplest way to
    // guarantee the banner re-evaluates against the now-current emailVerified flag
    window.location.reload();
  };

  return (
    <div className="mb-6 rounded-md border border-line bg-paper-raised px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink">{t.login.verifyEmailBanner}</p>
      <div className="flex items-center gap-3 text-xs font-semibold">
        {sent ? (
          <span className="text-mark">{t.login.verifyEmailSent}</span>
        ) : (
          <button onClick={handleResend} className="text-mark hover:text-ink transition-colors">
            {t.login.verifyEmailResend}
          </button>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-muted hover:text-ink transition-colors disabled:opacity-50"
        >
          {t.login.verifyEmailRefresh}
        </button>
      </div>
    </div>
  );
}
