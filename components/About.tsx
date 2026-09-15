"use client";

import { useI18n } from "@/lib/i18n";
import Reveal from "./Reveal";
import Logo from "./Logo";
import AboutShowcase from "./AboutShowcase";
import Counter from "./Counter";

export default function About() {
  const { t } = useI18n();
  const heroStat = t.about.stats[0];

  return (
    <section id="about" className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28">
      <Reveal
        className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-5 sm:gap-6 lg:min-h-[560px]"
        stagger={120}
        y={28}
      >
        <div className="lg:col-start-1 lg:row-start-1 card rounded-2xl p-6 sm:p-8 flex flex-col justify-center">
          <p className="text-sm font-semibold text-mark">{t.nav.about}</p>
          <h2 className="font-display text-2xl sm:text-4xl mt-3 max-w-lg">{t.about.heading}</h2>
          <p className="text-muted mt-5 leading-relaxed max-w-lg">{t.about.body}</p>
        </div>

        <div className="lg:col-start-1 lg:row-start-2 card rounded-2xl p-6 sm:p-8 flex items-center justify-center">
          <Logo size={112} />
        </div>

        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 rounded-2xl overflow-hidden bg-night min-h-[320px]">
          <AboutShowcase items={t.testimonials.items} statValue={heroStat.value} statLabel={heroStat.label} />
        </div>
      </Reveal>

      <Reveal className="mt-10 sm:mt-14" y={24}>
        <div className="rounded-2xl bg-night px-6 sm:px-10 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-night-foreground/15 text-center sm:text-start">
            {t.about.stats.map((stat) => (
              <div
                key={stat.label}
                className="pt-6 sm:pt-0 first:pt-0 flex flex-col items-center sm:items-start gap-1 sm:px-6 first:sm:ps-0"
              >
                <p className="font-display text-4xl sm:text-5xl text-night-foreground">
                  <Counter value={stat.value} />
                </p>
                <p className="text-sm text-night-foreground/70 leading-snug max-w-[16rem]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
