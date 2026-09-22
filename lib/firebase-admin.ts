import { getApps, initializeApp, cert, type App } from "firebase-admin/app";

// server-only — never import this from a "use client" file. The service account key grants
// full admin access to the whole Firebase project, so it's read from a base64-encoded env var
// (no NEXT_PUBLIC_ prefix) rather than committed anywhere, and base64 sidesteps the newline-
// escaping problems that come from putting raw multi-line JSON/PEM content in a .env file.
//
// Initialization is deferred to first call (not run at module import time) — Next.js's build
// step statically analyzes route handlers, which would otherwise fail the whole build in any
// environment where this env var isn't set yet, even though it's only ever needed at request
// time for this one route.
let app: App | undefined;

export function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set");
  }
  const credentials = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
  app = initializeApp({ credential: cert(credentials) });
  return app;
}
