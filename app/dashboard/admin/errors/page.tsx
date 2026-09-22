"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  subscribeToErrorLogs,
  deleteErrorLog,
  subscribeToPendingImportClaims,
  type ErrorLogEntry,
  type PendingImportClaimEntry,
} from "@/lib/error-log-store";
import { IconArrow } from "@/components/icons";

export default function AdminErrorsPage() {
  const { session, ready } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [claims, setClaims] = useState<PendingImportClaimEntry[]>([]);

  useEffect(() => {
    if (!ready) return;
    if (session.role !== "admin") {
      router.replace("/login");
      return;
    }
    const unsubLogs = subscribeToErrorLogs(setLogs);
    const unsubClaims = subscribeToPendingImportClaims(setClaims);
    return () => {
      unsubLogs();
      unsubClaims();
    };
  }, [ready, session.role, router]);

  if (!ready || session.role !== "admin") return null;

  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
          >
            <IconArrow className="h-3.5 w-3.5 rotate-180 rtl:rotate-0" />
            {t.dashboardAdmin.heading}
          </Link>

          <h1 className="font-display text-2xl sm:text-3xl mt-4">{t.errorsPage.heading}</h1>
          <p className="text-muted mt-2">{t.errorsPage.subheading}</p>

          <div className="mt-10 card rounded-md overflow-hidden">
            {logs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">{t.errorsPage.empty}</p>
            ) : (
              <ul>
                {logs.map((log) => (
                  <li key={log.id} className="px-5 py-4 border-b border-line last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold break-words">{log.message}</p>
                        <p className="text-xs text-muted mt-1 truncate">
                          {log.source} · {log.url}
                        </p>
                        <p className="text-xs text-muted">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => deleteErrorLog(log.id)}
                        className="text-xs text-muted hover:text-ink transition-colors shrink-0"
                      >
                        {t.errorsPage.dismiss}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h2 className="font-display text-lg mt-12">{t.errorsPage.claimsHeading}</h2>
          <p className="text-muted mt-2 text-sm">{t.errorsPage.claimsSubheading}</p>

          <div className="mt-6 card rounded-md overflow-hidden">
            {claims.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">{t.errorsPage.claimsEmpty}</p>
            ) : (
              <ul>
                {claims.map((claim) => (
                  <li key={claim.id} className="px-5 py-4 border-b border-line last:border-0">
                    <p className="text-sm font-semibold" dir="ltr">
                      {claim.phone}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {t.errorsPage.claimedBy}: {claim.claimedByUid} — {claim.messageCount} {t.errorsPage.claimMessages}
                      {claim.studentNameHint ? ` — ${claim.studentNameHint}` : ""}
                    </p>
                    <p className="text-xs text-muted">{new Date(claim.claimedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
