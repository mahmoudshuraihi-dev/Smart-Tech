"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const KEY = "st_theme";

// No live cross-tab sync needed (matches the previous behavior), so subscribe is a no-op —
// useSyncExternalStore is used purely for its SSR-safe read: it renders the server snapshot
// ("light") on the first pass and resyncs to the real stored value before paint, with no
// flash-of-wrong-theme and no setState-in-effect.
function subscribe() {
  return () => {};
}
function getSnapshot(): Theme {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "light";
}
function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const persisted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? persisted;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // ignore
    }
    setOverride(next);
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
