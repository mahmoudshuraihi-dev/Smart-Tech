"use client";

import { useI18n } from "@/lib/i18n";
import Reveal from "./Reveal";
import BookingForm from "./BookingForm";

export default function BookingSection() {
  const { t } = useI18n();

  return (
    <section id="book" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 grid gap-10 lg:grid-cols-2 lg:items-start">
        <Reveal y={24}>
          <h2 className="font-display text-2xl sm:text-4xl max-w-md">{t.booking.heading}</h2>
          <p className="text-muted mt-4 max-w-md">{t.booking.subheading}</p>
        </Reveal>

        <Reveal y={28}>
          <BookingForm />
        </Reveal>
      </div>
    </section>
  );
}
