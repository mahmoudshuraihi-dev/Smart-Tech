"use client";

import { useEffect } from "react";
import { installGlobalErrorHandlers } from "@/lib/error-reporter";

// Registers window-level error/rejection listeners once. Never calls setState, so this effect
// doesn't trip the react-hooks/set-state-in-effect rule.
export default function GlobalErrorListener() {
  useEffect(() => installGlobalErrorHandlers(), []);
  return null;
}
