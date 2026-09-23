"use client";

import { useI18n } from "@/lib/i18n";
import Reveal from "./Reveal";
import { IconArrow } from "./icons";

export default function Hero() {
  const { t } = useI18n();

  return (
    <section id="home">
      <Reveal className="mx-auto max-w-4xl px-5 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32" stagger={100} y={28}>
        <p className="text-sm font-semibold text-mark">{t.hero.eyebrow}</p>

        <h1 className="font-display mt-5 max-w-2xl text-4xl sm:text-6xl leading-[2]">
          {t.hero.title} {t.hero.highlight}
        </h1>

        <p className="mt-6 max-w-xl text-base sm:text-lg text-muted leading-relaxed">{t.hero.subtitle}</p>

        <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
          <a
            href="#services"
            className="btn-glow group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-semibold text-paper-raised hover:bg-mark transition-colors"
          >
            {t.hero.ctaPrimary}
            <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </a>
          <a
            href="/login"
            className="rounded-full border border-line px-7 py-3 text-sm font-semibold text-ink hover:border-mark hover:text-mark transition-colors"
          >
            {t.hero.ctaSecondary}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
