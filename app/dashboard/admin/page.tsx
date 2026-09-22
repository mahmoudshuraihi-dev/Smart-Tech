"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import ProgressBar from "@/components/ProgressBar";
import Timeline from "@/components/Timeline";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { subscribeToAllRequests, advanceStage, attachFile } from "@/lib/request-store";
import { ProjectRequest, STAGES } from "@/lib/models";
import { useClientDirectory, getClientName } from "@/lib/user-directory";
import { IconUpload, IconArrow } from "@/components/icons";

export default function AdminDashboard() {
  const { session, ready } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const directory = useClientDirectory();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("final-deliverable.pdf");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (session.role !== "admin") {
      router.replace("/login");
      return;
    }
    const unsubscribe = subscribeToAllRequests((list) => {
      setRequests(list);
      setSelectedId((current) => current ?? list[0]?.id ?? null);
    });
    return unsubscribe;
  }, [ready, session.role, router]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleAdvance = async (id: string) => {
    setPending(true);
    await advanceStage(id);
    setPending(false);
  };

  const handleComplete = async (id: string) => {
    setPending(true);
    await attachFile(id, fileName.trim() || "final-deliverable.pdf");
    await advanceStage(id);
    setPending(false);
  };

  if (!ready || session.role !== "admin") return null;

  const nextStageLabel = (stage: ProjectRequest["stage"]) => {
    const idx = STAGES.indexOf(stage);
    const next = STAGES[idx + 1];
    return next ? t.stages[next] : null;
  };

  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
          <EmailVerificationBanner />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">{t.dashboardAdmin.heading}</h1>
              <p className="text-muted mt-2">{t.dashboardAdmin.subheading}</p>
            </div>
            <Link
              href="/dashboard/admin/errors"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-mark hover:text-ink transition-colors"
            >
              {t.errorsPage.navLink}
              <IconArrow className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="card rounded-md overflow-hidden">
              <p className="px-5 py-4 text-sm font-semibold border-b border-line">{t.dashboardAdmin.listTitle}</p>
              <ul>
                {requests.map((req) => {
                  const service = t.services.items.find((s) => s.id === req.serviceId);
                  const isActive = req.id === selectedId;
                  return (
                    <li key={req.id}>
                      <button
                        onClick={() => setSelectedId(req.id)}
                        className={`w-full text-start px-5 py-4 border-b border-line last:border-0 transition-colors ${
                          isActive ? "bg-mark/10" : "hover:bg-ink/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{req.id}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-line text-mark">
                            {t.stages[req.stage]}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {t.dashboardAdmin.client}: {getClientName(directory, req.clientId)}
                        </p>
                        <p className="text-xs text-muted">
                          {t.dashboardAdmin.service}: {service?.title ?? req.serviceId}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="card rounded-md p-6 sm:p-8">
              {!selected ? (
                <p className="text-muted">{t.dashboardAdmin.selectPrompt}</p>
              ) : (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">{selected.id}</p>
                      <h2 className="font-display text-lg mt-1">
                        {t.services.items.find((s) => s.id === selected.serviceId)?.title ?? selected.serviceId}
                      </h2>
                      <p className="text-xs text-muted mt-1">{formatDate(selected.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <ProgressBar stage={selected.stage} label={t.stages[selected.stage]} />
                  </div>

                  <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-mark mb-4">{t.dashboardAdmin.timeline}</p>
                      <Timeline history={selected.history} currentStage={selected.stage} />
                    </div>

                    <div className="flex flex-col justify-end gap-4">
                      {selected.stage === "completed" ? (
                        <div className="border border-line rounded-md p-4 text-sm text-muted">
                          <p>{t.dashboardAdmin.doneAll}</p>
                          {selected.file && (
                            <p className="mt-2 text-mark">
                              {t.dashboardAdmin.fileAttached}: {selected.file.name}
                            </p>
                          )}
                        </div>
                      ) : selected.stage === "revision" ? (
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-muted">
                            {t.dashboardAdmin.fileNameLabel}
                          </label>
                          <input
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm outline-none focus-visible:border-mark"
                          />
                          <button
                            onClick={() => handleComplete(selected.id)}
                            disabled={pending}
                            className="btn-glow w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper-raised hover:bg-mark transition-colors disabled:opacity-50"
                          >
                            <IconUpload className="h-4 w-4" />
                            {t.dashboardAdmin.completeAndAttach}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAdvance(selected.id)}
                          disabled={pending}
                          className="w-full rounded-full border border-mark/40 px-5 py-2.5 text-sm font-semibold text-mark hover:bg-mark/10 transition-colors disabled:opacity-50"
                        >
                          {t.dashboardAdmin.advanceTo}: {nextStageLabel(selected.stage)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
