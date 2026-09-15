"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { subscribeToConversation, subscribeToAllConversations } from "@/lib/chat-store";
import Logo from "./Logo";
import { IconMenu, IconClose, IconGlobe, IconSun, IconMoon, IconChat } from "./icons";

const THEME_ICON_TRANSITION = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const;

function ThemeIcon({ theme, reduce }: { theme: "light" | "dark"; reduce: boolean | null }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={theme}
        initial={reduce ? false : { opacity: 0, rotate: -90, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
        transition={reduce ? { duration: 0 } : THEME_ICON_TRANSITION}
        className="inline-flex"
      >
        {theme === "dark" ? <IconSun className="h-3.5 w-3.5" /> : <IconMoon className="h-3.5 w-3.5" />}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Navbar() {
  const { t, locale, dir, toggleLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const { session, logout, ready } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [limelightReady, setLimelightReady] = useState(false);
  const [unread, setUnread] = useState(0);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const limelightRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // scroll-spy: keep the nav's active-link indicator in sync with whichever section is
  // actually in view while scrolling, not just the last-clicked link. Sections only exist
  // on the home page — on other pages (dashboards) this simply finds nothing and no-ops.
  useEffect(() => {
    const sectionIds = ["home", "services", "testimonials", "faq", "about", "contact"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = sectionIds.indexOf(entry.target.id);
          if (idx !== -1) setActiveIndex(idx);
        });
      },
      // a thin detection band near the top third of the viewport — a section becomes
      // "active" once its boundary crosses that band while scrolling
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!ready || !session.role) {
      setUnread(0);
      return;
    }
    if (session.role === "admin") {
      return subscribeToAllConversations((list) => {
        setUnread(list.reduce((sum, c) => sum + c.unreadForAdmin, 0));
      });
    }
    if (session.id) {
      return subscribeToConversation(session.id, (c) => setUnread(c?.unreadForClient ?? 0));
    }
  }, [ready, session.role, session.id]);

  const links = [
    { href: "/#home", label: t.nav.home },
    { href: "/#services", label: t.nav.services },
    { href: "/#testimonials", label: t.nav.testimonials },
    { href: "/#faq", label: t.nav.faq },
    { href: "/#about", label: t.nav.about },
    { href: "/#contact", label: t.nav.contact },
  ];

  useLayoutEffect(() => {
    const positionLimelight = () => {
      const limelight = limelightRef.current;
      const activeItem = navItemRefs.current[activeIndex];
      if (limelight && activeItem) {
        const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
        limelight.style.left = `${newLeft}px`;
      }
    };

    positionLimelight();
    if (!limelightReady) {
      setTimeout(() => setLimelightReady(true), 50);
    }

    // Arabic/English web fonts can swap in after first paint and shift link widths —
    // re-measure once they're ready so the very first position lands correctly.
    document.fonts?.ready?.then(positionLimelight);
    window.addEventListener("resize", positionLimelight);
    return () => window.removeEventListener("resize", positionLimelight);
  }, [activeIndex, limelightReady, locale]);

  const dashboardHref = session.role === "admin" ? "/dashboard/admin" : "/dashboard/client";
  const messagesHref = session.role === "admin" ? "/dashboard/admin/messages" : "/dashboard/client/messages";

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push("/");
  };

  return (
    <>
      <header
        className={`site-header sticky top-0 z-50 bg-paper transition-colors duration-300 ${
          scrolled ? "border-b border-line" : "border-b border-transparent"
        }`}
      >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-[72px] items-center justify-between py-3">
          <Link href="/#home" className="flex items-center gap-3">
            <Logo size={40} />
            <span className="font-display text-lg tracking-tight">Smart Tech</span>
          </Link>

          <nav className="relative hidden lg:flex items-center gap-7">
            {links.map((l, index) => (
              <a
                key={l.href}
                ref={(el) => {
                  navItemRefs.current[index] = el;
                }}
                href={l.href}
                onClick={() => setActiveIndex(index)}
                className="text-sm text-muted hover:text-mark transition-colors"
              >
                {l.label}
              </a>
            ))}

            <span
              ref={limelightRef}
              className={`pointer-events-none absolute bottom-[-9px] z-0 h-[3px] w-8 rounded-full bg-mark shadow-[0_6px_10px_var(--mark)] ${
                limelightReady ? "transition-[left] duration-400 ease-in-out" : ""
              }`}
              style={{ left: "-999px" }}
            >
              <span className="absolute inset-x-[-100%] bottom-[3px] h-8 [clip-path:polygon(20%_100%,40%_0,60%_0,80%_100%)] bg-gradient-to-t from-mark/25 to-transparent" />
            </span>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleLocale}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-mark hover:border-mark/50 transition-colors"
              aria-label="Toggle language"
            >
              <IconGlobe className="h-3.5 w-3.5" />
              {locale === "ar" ? "EN" : "AR"}
            </button>

            <button
              onClick={toggleTheme}
              className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line text-muted hover:text-mark hover:border-mark/50 transition-colors"
              aria-label="Toggle theme"
            >
              <ThemeIcon theme={theme} reduce={reduceMotion} />
            </button>

            {ready && session.role ? (
              <div className="flex items-center gap-2">
                <Link
                  href={messagesHref}
                  aria-label={t.chat.heading}
                  className="relative inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line text-muted hover:text-mark hover:border-mark/50 transition-colors"
                >
                  <IconChat className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -end-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[9px] font-semibold text-paper-raised">
                      {unread}
                    </span>
                  )}
                </Link>
                <Link
                  href={dashboardHref}
                  className="rounded-full border border-mark/40 px-4 py-1.5 text-sm font-semibold text-mark hover:bg-mark/10 transition-colors"
                >
                  {t.nav.dashboard}
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink transition-colors"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-glow rounded-full bg-ink px-5 py-1.5 text-sm font-semibold text-paper-raised hover:bg-mark transition-colors"
              >
                {t.nav.login}
              </Link>
            )}
          </div>

          <button
            className="lg:hidden text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="site-header-mobile fixed inset-y-0 end-0 z-50 flex w-[82%] max-w-[320px] flex-col bg-paper border-s border-line lg:hidden"
              initial={{ x: dir === "rtl" ? -340 : 340 }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? -340 : 340 }}
              transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line h-[72px] shrink-0">
              <Link href="/#home" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                <Logo size={34} />
                <span className="font-display text-base tracking-tight">Smart Tech</span>
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-ink">
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 flex flex-col gap-4 overflow-y-auto">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-ink/90">
                  {l.label}
                </a>
              ))}
              <div className="section-divider" />
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLocale}
                  className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted"
                >
                  <IconGlobe className="h-3.5 w-3.5" />
                  {locale === "ar" ? "English" : "العربية"}
                </button>
                <button
                  onClick={toggleTheme}
                  className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line text-muted"
                  aria-label="Toggle theme"
                >
                  <ThemeIcon theme={theme} reduce={reduceMotion} />
                </button>
              </div>
              {ready && session.role ? (
                <div className="flex flex-col items-start gap-3">
                  <Link
                    href={messagesHref}
                    onClick={() => setOpen(false)}
                    className="relative inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-muted"
                  >
                    <IconChat className="h-4 w-4" />
                    {t.chat.heading}
                    {unread > 0 && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[9px] font-semibold text-paper-raised">
                        {unread}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={dashboardHref}
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-mark/40 px-4 py-1.5 text-sm font-semibold text-mark"
                  >
                    {t.nav.dashboard}
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-muted">
                    {t.nav.logout}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-glow w-fit rounded-full bg-ink px-5 py-1.5 text-sm font-semibold text-paper-raised"
                >
                  {t.nav.login}
                </Link>
              )}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
