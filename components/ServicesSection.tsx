"use client";

import { useI18n } from "@/lib/i18n";
import ServicesCarousel from "./ServicesCarousel";
import Reveal from "./Reveal";

export default function ServicesSection() {
  const { t } = useI18n();

  return (
    <section id="services" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal y={24}>
          <p className="text-sm font-semibold text-mark">{t.nav.services}</p>
          <h2 className="font-display text-2xl sm:text-4xl mt-3 max-w-xl">{t.services.heading}</h2>
          <p className="text-muted mt-4 max-w-xl">{t.services.subheading}</p>
        </Reveal>
      </div>

      {/* full-bleed (not constrained to max-w-6xl) so the arc has room to show every card */}
      <Reveal className="mt-14" y={28}>
        <ServicesCarousel items={t.services.items} />
      </Reveal>
    </section>
  );
}
