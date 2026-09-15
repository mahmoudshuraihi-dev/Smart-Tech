"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n, ServiceCopy } from "@/lib/i18n";
import { createRequest } from "@/lib/mock-store";
import { IconEdit, IconChart, IconCompass, IconBooks, IconClock, IconArrow } from "./icons";

const ICONS: Record<string, typeof IconEdit> = {
  editing: IconEdit,
  statistics: IconChart,
  methodology: IconCompass,
  literature: IconBooks,
  formatting: IconEdit,
  coaching: IconClock,
};

export default function ServiceCard({ service }: { service: ServiceCopy }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const Icon = ICONS[service.id] ?? IconEdit;

  const handleRequest = async () => {
    if (!session.role) {
      router.push(`/login?pending=${service.id}`);
      return;
    }
    if (session.role === "client" && session.id) {
      setSubmitting(true);
      await createRequest(session.id, service.id);
      router.push("/dashboard/client");
      return;
    }
    router.push("/dashboard/admin");
  };

  return (
    <div className="card rounded-md p-6 flex flex-col h-full hover:border-ink/30 transition-colors">
      <span className="inline-flex h-10 w-10 items-center justify-center text-ink mb-5">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="font-display text-lg mb-2">{service.title}</h3>
      <p className="text-sm text-muted leading-relaxed flex-1">{service.description}</p>
      <button
        onClick={handleRequest}
        disabled={submitting}
        className="mt-6 inline-flex items-center justify-between gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:border-mark hover:text-mark transition-colors disabled:opacity-50"
      >
        {session.role ? t.services.requestCta : t.services.loginRequired}
        <IconArrow className="h-4 w-4 rtl:rotate-180" />
      </button>
    </div>
  );
}
