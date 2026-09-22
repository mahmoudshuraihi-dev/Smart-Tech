"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-reporter";

// Catches a crash in the root layout itself (including its providers) — so this must NOT rely
// on useI18n() or any other context that might be the very thing that crashed. It renders its
// own <html>/<body>, replacing the whole tree, and uses inline styles only (no dependency on
// globals.css class tokens that assume the provider tree rendered).
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reportError({
      message: error.message,
      stack: error.stack ?? null,
      digest: error.digest ?? null,
      source: "boundary",
    });
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          background: "#ede9df",
          color: "#201d17",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          <p style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>حدث خطأ غير متوقع / Something went wrong</p>
          <p style={{ fontSize: "14px", opacity: 0.7, marginTop: "8px" }}>
            حاول إعادة تحميل الصفحة / Try reloading the page
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this boundary catches
              a crash in the root layout itself, so it must not depend on next/link's router
              context possibly being the thing that's broken; a plain <a> is the more resilient
              choice here specifically. */}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "16px",
              fontSize: "14px",
              textDecoration: "underline",
              color: "#201d17",
            }}
          >
            الرئيسية / Home
          </a>
        </div>
      </body>
    </html>
  );
}
