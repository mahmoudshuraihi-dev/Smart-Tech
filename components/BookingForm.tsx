"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SERVICE_IDS, type ServiceId } from "@/lib/mock-data";
import { SERVICE_ICONS } from "./service-icons";
import { IconUser, IconPhone, IconCheck, IconArrow } from "./icons";
import Turnstile from "./Turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function BookingForm() {
  const { t, locale } = useI18n();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState<ServiceId | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const errorText = (key: string): string => {
    if (key === "captcha-failed") return t.booking.errorCaptcha;
    if (key === "network") return t.booking.errorNetwork;
    return t.booking.errorGeneric;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;
    setSubmitting(true);
    setErrorKey(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          serviceId,
          locale,
          turnstileToken,
          company: honeypot,
        }),
      });
      const data = await res.json().catch(() => ({}) as { ok?: boolean; error?: string });
      if (!res.ok || !data.ok) {
        setErrorKey(data.error ?? "generic");
        return;
      }
      setSuccess(true);
      setName("");
      setPhone("");
      setServiceId(null);
      setTurnstileToken("");
    } catch {
      setErrorKey("network");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card rounded-md p-6 sm:p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mark/10 text-mark mb-4">
          <IconCheck className="h-6 w-6" />
        </span>
        <h3 className="font-display text-lg">{t.booking.successHeading}</h3>
        <p className="text-sm text-muted mt-2">{t.booking.successBody}</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-mark hover:text-mark transition-colors"
        >
          {t.booking.submitAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-md p-6 sm:p-8 space-y-5">
      {/* honeypot — invisible to a real visitor, some bots still fill every field they find */}
      <input
        type="text"
        name="company"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div>
        <label htmlFor="booking-name" className="block text-xs font-semibold mb-1.5 text-muted">
          {t.booking.nameLabel}
        </label>
        <div className="relative">
          <IconUser className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/60" />
          <input
            id="booking-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-line bg-ink/5 ps-10 pe-3 py-2.5 text-sm text-ink placeholder-muted/40 outline-none focus-visible:border-mark transition-colors"
            autoComplete="name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="booking-phone" className="block text-xs font-semibold mb-1.5 text-muted">
          {t.booking.phoneLabel}
        </label>
        <div className="relative">
          <IconPhone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/60" />
          <input
            id="booking-phone"
            type="tel"
            dir="ltr"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-line bg-ink/5 ps-10 pe-3 py-2.5 text-sm text-ink placeholder-muted/40 outline-none focus-visible:border-mark transition-colors"
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-2.5 text-muted">{t.booking.serviceLabel}</p>
        <div role="radiogroup" aria-label={t.booking.serviceLabel} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SERVICE_IDS.map((id) => {
            const service = t.services.items.find((s) => s.id === id);
            const Icon = SERVICE_ICONS[id];
            const checked = serviceId === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setServiceId(id)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center text-[11px] leading-snug font-medium transition-colors ${
                  checked
                    ? "border-mark bg-mark/10 text-mark"
                    : "border-line text-muted hover:border-mark/40 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {service?.title}
              </button>
            );
          })}
        </div>
      </div>

      {TURNSTILE_SITE_KEY && (
        <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      )}

      {errorKey && <p className="text-xs text-red-500">{errorText(errorKey)}</p>}

      <button
        type="submit"
        disabled={submitting || !serviceId || !turnstileToken}
        className="btn-glow w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper-raised hover:bg-mark transition-colors disabled:opacity-50"
      >
        {t.booking.submit}
        <IconArrow className="h-4 w-4 rtl:rotate-180" />
      </button>

      <p className="text-[11px] text-muted text-center">{t.booking.privacyNote}</p>
    </form>
  );
}
