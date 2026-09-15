"use client";

import { useI18n } from "@/lib/i18n";
import Reveal from "./Reveal";
import FAQAccordion from "./FAQAccordion";

export default function FAQ() {
  const { t } = useI18n();

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 sm:px-8 py-20 sm:py-28">
      <Reveal y={24}>
        <p className="text-sm font-semibold text-mark">{t.nav.faq}</p>
        <h2 className="font-display text-2xl sm:text-4xl mt-3">{t.faq.heading}</h2>
        <p className="text-muted mt-4">{t.faq.subheading}</p>
      </Reveal>

      <Reveal className="mt-12" y={24}>
        <FAQAccordion items={t.faq.items} />
      </Reveal>
    </section>
  );
}
