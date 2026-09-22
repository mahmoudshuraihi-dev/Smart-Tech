"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { createRequest } from "@/lib/request-store";
import { ServiceId } from "@/lib/models";
import { isStrongPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { isPlausiblePhone, normalizePhone } from "@/lib/phone";
import Logo from "@/components/Logo";
import LoginVideoBackground from "@/components/LoginVideoBackground";
import { IconArrow, IconUser, IconPhone, IconMail, IconLock, IconEye, IconEyeOff } from "@/components/icons";

type Mode = "login" | "signup" | "reset";

function LoginInner() {
  const { t, locale, toggleLocale } = useI18n();
  const { session, ready, login, signup, resetPassword } = useAuth();
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
  const [resetSent, setResetSent] = useState(false);
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
      case "weak-password-custom":
        return t.login.errorWeakPasswordCustom;
      case "phone-implausible":
        return t.login.errorPhoneImplausible;
      default:
        return t.login.errorGeneric;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

    if (mode === "reset") {
      setSubmitting(true);
      const result = await resetPassword(email);
      setSubmitting(false);
      if (!result.ok) {
        setErrorKey(result.error);
        return;
      }
      setResetSent(true);
      return;
    }

    if (mode === "signup") {
      if (!isStrongPassword(password)) {
        setErrorKey("weak-password-custom");
        return;
      }
      if (!isPlausiblePhone(normalizePhone(phone))) {
        setErrorKey("phone-implausible");
        return;
      }
    }

    setSubmitting(true);
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
            {mode === "signup" ? t.login.headingSignup : mode === "reset" ? t.login.resetHeading : t.login.heading}
          </h1>
          <p className="text-xs text-night-foreground/60 text-center mt-1">
            {mode === "signup"
              ? t.login.subheadingSignup
              : mode === "reset"
                ? t.login.resetSubheading
                : t.login.subheading}
          </p>

          {mode === "reset" && resetSent ? (
            <div className="mt-4 text-center">
              <p className="text-sm text-night-foreground/90">{t.login.resetSentMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setResetSent(false);
                  setErrorKey(null);
                }}
                className="mt-4 text-xs text-night-foreground/70 hover:text-night-foreground transition-colors"
              >
                {t.login.backToLogin}
              </button>
            </div>
          ) : (
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
                      placeholder="9665XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-night-foreground/15 bg-night-foreground/5 ps-10 pe-3 py-2 text-sm text-night-foreground placeholder-night-foreground/30 outline-none focus-visible:border-[color:var(--logo-blue)] transition-colors"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-night-foreground/50">{t.login.phoneHint}</p>
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

            {mode !== "reset" && (
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
                    minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
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
                {mode === "signup" && (
                  <p className="mt-1 text-[11px] text-night-foreground/50">{t.login.passwordHint}</p>
                )}
              </div>
            )}

            {mode !== "reset" && (
              <div className="flex items-center justify-between gap-2.5">
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
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("reset");
                      setErrorKey(null);
                    }}
                    className="text-xs text-night-foreground/70 hover:text-night-foreground transition-colors"
                  >
                    {t.login.forgotPassword}
                  </button>
                )}
              </div>
            )}

            {errorKey && <p className="text-xs text-red-400">{errorText(errorKey)}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
            >
              {mode === "signup" ? t.login.submitSignup : mode === "reset" ? t.login.resetSubmit : t.login.submit}
              <IconArrow className="h-4 w-4 rtl:rotate-180" />
            </button>
          </form>
          )}

          <div className="mt-4 pt-4 border-t border-night-foreground/10 text-center">
            {mode === "reset" ? (
              !resetSent && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorKey(null);
                  }}
                  className="text-xs text-night-foreground/70 hover:text-night-foreground transition-colors"
                >
                  {t.login.backToLogin}
                </button>
              )
            ) : (
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
            )}
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
