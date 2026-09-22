"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PendingImportModal from "@/components/chat/PendingImportModal";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { listPendingImports, type PendingImportSummary } from "@/lib/pending-import-store";
import { IconArrow, IconWhatsapp } from "@/components/icons";

export default function PendingImportsPage() {
  const { session, ready } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<PendingImportSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(() => {
    listPendingImports().then(setItems);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (session.role !== "admin") {
      router.replace("/login");
      return;
    }
    refresh();
  }, [ready, session.role, router, refresh]);

  if (!ready || session.role !== "admin") return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14">
          <Link
            href="/dashboard/admin/messages"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
          >
            <IconArrow className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {t.pendingImports.backToMessages}
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl">{t.pendingImports.heading}</h1>
              <p className="text-muted mt-1 max-w-md text-sm">{t.pendingImports.subheading}</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-glow inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper-raised hover:bg-mark transition-colors shrink-0"
            >
              <IconWhatsapp className="h-4 w-4" />
              {t.pendingImports.add}
            </button>
          </div>

          <div className="card rounded-md overflow-hidden mt-8">
            {items.length === 0 ? (
              <p className="text-sm text-muted text-center p-10">{t.pendingImports.empty}</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li
                    key={item.phone}
                    className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{item.studentNameHint}</p>
                      <p className="text-xs text-muted mt-0.5" dir="ltr">
                        {item.phone}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs text-muted">
                        {t.pendingImports.messageCount}: {item.messageCount}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">{formatDate(item.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <PendingImportModal
        open={modalOpen}
        onClose={(didSave) => {
          setModalOpen(false);
          if (didSave) refresh();
        }}
      />
    </>
  );
}
