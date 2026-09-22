"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { subscribeToBookings, setBookingStatus } from "@/lib/booking-store";
import { BookingLead } from "@/lib/mock-data";
import { IconArrow, IconPhone } from "@/components/icons";

export default function AdminBookingsPage() {
  const { session, ready } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingLead[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (session.role !== "admin") {
      router.replace("/login");
      return;
    }
    return subscribeToBookings(setBookings);
  }, [ready, session.role, router]);

  if (!ready || session.role !== "admin") return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const toggleStatus = async (lead: BookingLead) => {
    setPendingId(lead.id);
    await setBookingStatus(lead.id, lead.status === "new" ? "contacted" : "new");
    setPendingId(null);
  };

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

          <h1 className="font-display text-2xl sm:text-3xl mt-4">{t.dashboardBookings.heading}</h1>
          <p className="text-muted mt-2">{t.dashboardBookings.subheading}</p>

          <div className="mt-10 card rounded-md overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1.2fr_1fr_1.4fr_1fr_1.3fr] gap-4 px-5 py-3 text-[11px] font-semibold text-muted border-b border-line">
              <span>{t.dashboardBookings.columnName}</span>
              <span>{t.dashboardBookings.columnPhone}</span>
              <span>{t.dashboardBookings.columnService}</span>
              <span>{t.dashboardBookings.columnSubmitted}</span>
              <span>{t.dashboardBookings.columnStatus}</span>
            </div>

            {bookings.length === 0 ? (
              <p className="px-5 py-8 text-center text-muted">{t.dashboardBookings.empty}</p>
            ) : (
              <ul>
                {bookings.map((lead) => {
                  const service = t.services.items.find((s) => s.id === lead.serviceId);
                  return (
                    <li
                      key={lead.id}
                      className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1.4fr_1fr_1.3fr] gap-2 sm:gap-4 items-center px-5 py-4 border-b border-line last:border-0"
                    >
                      <p className="text-sm font-semibold">{lead.name}</p>
                      <a
                        href={`tel:${lead.phone}`}
                        dir="ltr"
                        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-mark transition-colors"
                      >
                        <IconPhone className="h-3 w-3" />
                        {lead.phone}
                      </a>
                      <p className="text-xs text-muted">{service?.title ?? lead.serviceId}</p>
                      <p className="text-xs text-muted">{formatDate(lead.createdAt)}</p>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full border ${
                            lead.status === "new" ? "border-mark/40 text-mark" : "border-line text-muted"
                          }`}
                        >
                          {lead.status === "new" ? t.dashboardBookings.statusNew : t.dashboardBookings.statusContacted}
                        </span>
                        <button
                          onClick={() => toggleStatus(lead)}
                          disabled={pendingId === lead.id}
                          className="text-xs font-semibold text-ink hover:text-mark transition-colors disabled:opacity-50"
                        >
                          {lead.status === "new" ? t.dashboardBookings.markContacted : t.dashboardBookings.markNew}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
