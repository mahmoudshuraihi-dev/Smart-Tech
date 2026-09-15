"use client";

import { useI18n } from "@/lib/i18n";
import Reveal from "./Reveal";
import TestimonialsCarousel from "./TestimonialsCarousel";

export default function Testimonials() {
  const { t } = useI18n();

  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28">
      <Reveal y={24}>
        <p className="text-sm font-semibold text-mark">{t.nav.testimonials}</p>
        <h2 className="font-display text-2xl sm:text-4xl mt-3 max-w-xl">{t.testimonials.heading}</h2>
        <p className="text-muted mt-4 max-w-xl">{t.testimonials.subheading}</p>
      </Reveal>

      <Reveal className="mt-4" y={28}>
        <TestimonialsCarousel items={t.testimonials.items} />
      </Reveal>
    </section>
  );
}
