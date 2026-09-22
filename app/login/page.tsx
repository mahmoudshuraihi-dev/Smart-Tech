"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { createRequest } from "@/lib/mock-store";
import { ServiceId } from "@/lib/mock-data";
import Logo from "@/components/Logo";
import LoginVideoBackground from "@/components/LoginVideoBackground";
import {
  IconArrow,
  IconUser,
  IconPhone,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconGoogle,
  IconMicrosoft,
  IconApple,
} from "@/components/icons";

// Google/Microsoft/Apple aren't wired to real OAuth yet — decorative placeholders only,
// matching the same "inert for now" pattern already used for ContactFooter's social row.
const SOCIAL_PROVIDERS = [
  { Icon: IconGoogle, label: "Google" },
  { Icon: IconMicrosoft, label: "Microsoft" },
  { Icon: IconApple, label: "Apple" },
];

type Mode = "login" | "signup";

function LoginInner() {
  const { t, locale, toggleLocale } = useI18n();
  const { session, ready, login, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = searchParams.get("pending") as ServiceId | null;

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // set right before a successful login/signup, consumed by the effect below once the
  // live role subscription in useAuth() actually resolves session.role/ready
  const [awaitingRedirect, setAwaitingRedirect] = useState(false);

  useEffect(() => {
    if (!awaitingRedirect || !ready || !session.role || !session.id) return;

    const finish = async () => {
      if (session.role === "client" && pending) {
        await createRequest(session.id!, pending);
        router.push("/dashboard/client");
        return;
      }
      router.push(session.role === "admin" ? "/dashboard/admin" : "/dashboard/client");
    };
    finish();
  }, [awaitingRedirect, ready, session.role, session.id, pending, router]);

  const errorText = (key: string): string => {
    switch (key) {
      case "invalid-credential":
        return t.login.errorInvalidCredential;
      case "email-already-in-use":
        return t.login.errorEmailInUse;
      case "weak-password":
        return t.login.errorWeakPassword;
      case "too-many-requests":
        return t.login.errorTooManyRequests;
      case "network-request-failed":
        return t.login.errorNetwork;
      default:
        return t.login.errorGeneric;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorKey(null);

    const result =
      mode === "signup"
        ? await signup(name.trim(), phone.trim(), email, password, remember)
        : await login(email, password, remember);

    setSubmitting(false);
    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }
    setAwaitingRedirect(true);
  };

  return (
    <main className="relative h-screen flex items-center justify-center px-5 py-3 overflow-hidden">
      <LoginVideoBackground />

      <div className="relative z-10 w-full max-w-md max-h-full overflow-y-auto">
        <div className="flex justify-center mb-3">
          <Link href="/#home" className="flex flex-col items-center gap-1.5">
            <Logo size={40} />
            <span className="font-display text-base text-night-foreground">Smart Tech</span>
          </Link>
        </div>

        <div
          className="rounded-2xl p-5 bg-night/25 backdrop-blur-xl border border-night-foreground/20"
          style={{ boxShadow: "inset 0 1px 0 rgba(248,246,240,0.15), 0 8px 32px rgba(0,0,0,0.4)" }}
        >
          <h1 className="font-display text-xl text-center text-night-foreground">
            {mode === "signup" ? t.login.headingSignup : t.login.heading}
          </h1>
          <p className="text-xs text-night-foreground/60 text-center mt-1">
            {mode === "signup" ? t.login.subheadingSignup : t.login.subheading}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
            {mode === "signup" && (
              <>
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold mb-1 text-night-foreground/80">
                    {t.login.nameLabel}
                  </label>
                  <div className="relative">
                    <IconUser className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-night-foreground/40" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-night-foreground/15 bg-night-foreground/5 ps-10 pe-3 py-2 text-sm text-night-foreground placeholder-night-foreground/30 outline-none focus-visible:border-[color:var(--logo-blue)] transition-colors"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold mb-1 text-night-foreground/80">
                    {t.login.phoneLabel}
                  </label>
                  <div className="relative">
                    <IconPhone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-night-foreground/40" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-night-foreground/15 bg-night-foreground/5 ps-10 pe-3 py-2 text-sm text-night-foreground placeholder-night-foreground/30 outline-none focus-visible:border-[color:var(--logo-blue)] transition-colors"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold mb-1 text-night-foreground/80">
                {t.login.emailLabel}
              </label>
              <div className="relative">
                <IconMail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-night-foreground/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-night-foreground/15 bg-night-foreground/5 ps-10 pe-3 py-2 text-sm text-night-foreground placeholder-night-foreground/30 outline-none focus-visible:border-[color:var(--logo-blue)] transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold mb-1 text-night-foreground/80">
                {t.login.passwordLabel}
              </label>
              <div className="relative">
                <IconLock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-night-foreground/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-night-foreground/15 bg-night-foreground/5 ps-10 pe-10 py-2 text-sm text-night-foreground placeholder-night-foreground/30 outline-none focus-visible:border-[color:var(--logo-blue)] transition-colors"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-night-foreground/40 hover:text-night-foreground transition-colors"
                >
                  {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={remember}
                aria-label={t.login.remember}
                onClick={() => setRemember((v) => !v)}
                className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200 ${
                  remember ? "justify-end" : "justify-start"
                }`}
                style={{ backgroundColor: remember ? "var(--logo-blue)" : "rgba(248, 246, 240, 0.18)" }}
              >
                <span className="h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200" />
              </button>
              <span className="text-xs text-night-foreground/70">{t.login.remember}</span>
            </div>

            {errorKey && <p className="text-xs text-red-400">{errorText(errorKey)}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
            >
              {mode === "signup" ? t.login.submitSignup : t.login.submit}
              <IconArrow className="h-4 w-4 rtl:rotate-180" />
            </button>
          </form>

          <div className="mt-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-full border-t border-night-foreground/10" />
              <span className="relative bg-transparent px-3 text-xs text-night-foreground/50">{t.login.continueWith}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SOCIAL_PROVIDERS.map(({ Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="flex items-center justify-center p-2 rounded-lg bg-night-foreground/5 border border-night-foreground/10 text-night-foreground/70 hover:bg-night-foreground/10 hover:text-night-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-night-foreground/10 text-center">
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "login" ? "signup" : "login"));
                setErrorKey(null);
              }}
              className="text-xs text-night-foreground/70 hover:text-night-foreground transition-colors"
            >
              {mode === "login" ? t.login.switchToSignup : t.login.switchToLogin}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs pb-1">
          <Link href="/#home" className="text-night-foreground/60 hover:text-night-foreground transition-colors">
            {t.login.backHome}
          </Link>
          <button onClick={toggleLocale} className="text-night-foreground/60 hover:text-night-foreground transition-colors">
            {locale === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
