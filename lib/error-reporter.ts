export interface ErrorReportInput {
  message: string;
  stack?: string | null;
  digest?: string | null;
  source: "boundary" | "window.onerror" | "unhandledrejection" | "manual";
}

const MAX_MESSAGE = 2000;
const MAX_STACK = 4000;

// Self-hosted, dependency-free error reporting (no Sentry/etc.) — POSTs to our own API route,
// which writes to Firestore via firebase-admin. Must never itself throw: a failing reporter
// inside a global error handler would just create a new unhandled error.
export async function reportError(input: ErrorReportInput): Promise<void> {
  try {
    await fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        message: input.message.slice(0, MAX_MESSAGE),
        stack: input.stack ? input.stack.slice(0, MAX_STACK) : null,
        digest: input.digest ?? null,
        source: input.source,
        url: typeof location !== "undefined" ? location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "",
      }),
    });
  } catch {
    // ignore — a broken reporting pipeline must not surface as a user-visible error
  }
}

export function installGlobalErrorHandlers(): () => void {
  const onError = (e: ErrorEvent) => {
    reportError({ message: e.message, stack: e.error?.stack ?? null, source: "window.onerror" });
  };
  const onRejection = (e: PromiseRejectionEvent) => {
    const reason = e.reason;
    reportError({
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack ?? null : null,
      source: "unhandledrejection",
    });
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
