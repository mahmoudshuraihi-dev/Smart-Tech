"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import ProgressBar from "@/components/ProgressBar";
import Timeline from "@/components/Timeline";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { subscribeToRequestsForClient } from "@/lib/mock-store";
import { ProjectRequest } from "@/lib/mock-data";
import { IconDownload } from "@/components/icons";

export default function ClientDashboard() {
  const { session, ready } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);

  useEffect(() => {
    if (!ready) return;
    if (session.role !== "client") {
      router.replace("/login");
      return;
    }
    if (!session.id) return;
    return subscribeToRequestsForClient(session.id, setRequests);
  }, [ready, session.role, session.id, router]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (!ready || session.role !== "client") return null;

  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14">
          <h1 className="font-display text-2xl sm:text-3xl">{t.dashboardClient.heading}</h1>
          <p className="text-muted mt-2">{t.dashboardClient.subheading}</p>

          {requests.length === 0 ? (
            <div className="card rounded-md p-10 text-center mt-10">
              <p className="text-muted">{t.dashboardClient.empty}</p>
              <Link
                href="/#services"
                className="btn-glow inline-block mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper-raised hover:bg-mark transition-colors"
              >
                {t.dashboardClient.browseServices}
              </Link>
            </div>
          ) : (
            <div className="mt-10 space-y-6">
              {requests.map((req) => {
                const service = t.services.items.find((s) => s.id === req.serviceId);
                return (
                  <div key={req.id} className="card rounded-md p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">{req.id}</p>
                        <h2 className="font-display text-lg mt-1">{service?.title ?? req.serviceId}</h2>
                        <p className="text-xs text-muted mt-1">
                          {t.dashboardClient.requestedOn}: {formatDate(req.createdAt)}
                        </p>
                      </div>
                      {req.file ? (
                        <a
                          href="/deliverable.txt"
                          download={`${req.id}-deliverable.txt`}
                          className="btn-glow inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper-raised hover:bg-mark transition-colors"
                        >
                          <IconDownload className="h-4 w-4" />
                          {t.dashboardClient.download}
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-6">
                      <ProgressBar stage={req.stage} label={t.dashboardClient.progress} />
                    </div>

                    <div className="mt-8 grid gap-8 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-mark mb-4">{t.dashboardClient.timeline}</p>
                        <Timeline history={req.history} currentStage={req.stage} />
                      </div>
                      <div className="flex flex-col justify-end">
                        {!req.file && (
                          <p className="text-xs text-muted border border-line rounded-md p-4">
                            {t.dashboardClient.fileWaiting}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
