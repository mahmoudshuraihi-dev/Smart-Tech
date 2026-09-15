"use client";

import { useI18n } from "@/lib/i18n";
import Reveal from "./Reveal";
import Logo from "./Logo";
import FooterTextEffect from "./FooterTextEffect";
import { IconMail, IconPhone, IconLinkedIn, IconInstagram, IconTwitterX, IconWhatsapp } from "./icons";

const SOCIALS = [
  { Icon: IconLinkedIn, label: "LinkedIn", href: "#" },
  { Icon: IconInstagram, label: "Instagram", href: "#" },
  { Icon: IconTwitterX, label: "X", href: "#" },
  { Icon: IconWhatsapp, label: "WhatsApp", href: "#" },
];

export default function ContactFooter() {
  const { t } = useI18n();

  const quickLinks = [
    { href: "/#home", label: t.nav.home },
    { href: "/#services", label: t.nav.services },
    { href: "/#testimonials", label: t.nav.testimonials },
  ];
  const companyLinks = [
    { href: "/#about", label: t.nav.about },
    { href: "/#faq", label: t.nav.faq },
  ];

  return (
    <footer id="contact" className="relative overflow-hidden">
      {/* solid dark base for the whole footer, full page width. In dark mode this becomes
          a gradient instead (see .footer-base in globals.css) so the fixed aurora glow
          fades in naturally at the top edge rather than being cut off by an opaque fill. */}
      <div className="footer-base absolute inset-0 bg-night" />
      {/* gradual blend from the page's own light background into the dark footer.
          A plain 2-stop linear gradient has a CONSTANT rate of color change, then an
          abrupt jump to zero change the instant it meets the flat ink layer below —
          that derivative discontinuity is exactly what the eye reads as a hard seam
          ("Mach banding"), independent of which color space interpolates the hues.
          Easing the stops along a smoothstep curve (3x²−2x³) makes the rate of change
          taper to zero at BOTH ends, so it blends into the flat paper above and the
          flat ink below with no perceptible edge at either boundary. Dark mode hides
          this (see .footer-blend in globals.css): .footer-base's own gradient already
          handles the transition there, blending with the real aurora instead of a
          synthetic paper color that no longer matches what's actually behind it. */}
      <div
        className="footer-blend pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-32"
        style={{
          background: `linear-gradient(to bottom,
            var(--paper) 0%,
            color-mix(in oklch, var(--paper), var(--night) 6%) 15%,
            color-mix(in oklch, var(--paper), var(--night) 22%) 30%,
            color-mix(in oklch, var(--paper), var(--night) 50%) 50%,
            color-mix(in oklch, var(--paper), var(--night) 78%) 70%,
            color-mix(in oklch, var(--paper), var(--night) 94%) 85%,
            var(--night) 100%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pt-28 sm:pt-36">
        <Reveal stagger={90} y={24}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 pb-12">
              <div className="col-span-2 lg:col-span-1 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <Logo size={36} />
                  <span className="text-night-foreground text-xl font-display">Smart Tech</span>
                </div>
                <p className="text-sm text-night-foreground/60 leading-relaxed max-w-xs">{t.footer.tagline}</p>
              </div>

              <div>
                <h4 className="text-night-foreground text-sm font-semibold mb-5">{t.footer.quickLinks}</h4>
                <ul className="space-y-3 text-sm">
                  {quickLinks.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-night-foreground/60 hover:text-night-foreground transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-night-foreground text-sm font-semibold mb-5">{t.footer.company}</h4>
                <ul className="space-y-3 text-sm">
                  {companyLinks.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-night-foreground/60 hover:text-night-foreground transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <h4 className="text-night-foreground text-sm font-semibold mb-5">{t.nav.contact}</h4>
                <ul className="space-y-4 text-sm">
                  <li>
                    <a
                      href={`mailto:${t.contact.email}`}
                      className="flex items-center gap-2.5 text-night-foreground/60 hover:text-night-foreground transition-colors"
                    >
                      <IconMail className="h-4 w-4 shrink-0" />
                      {t.contact.email}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`tel:${t.contact.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2.5 text-night-foreground/60 hover:text-night-foreground transition-colors"
                    >
                      <IconPhone className="h-4 w-4 shrink-0" />
                      {t.contact.phone}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-night-foreground/10" />

            <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {SOCIALS.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-night-foreground/15 text-night-foreground/60 hover:text-night-foreground hover:border-night-foreground/40 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-night-foreground/50 text-center">
                © {new Date().getFullYear()} Smart Tech — {t.footer.rights}
              </p>
            </div>
          </Reveal>
        </div>

      <div className="relative z-10 hidden lg:flex h-[14rem] -mt-16 -mb-6">
        <FooterTextEffect text="Smart Tech" />
      </div>
    </footer>
  );
}
