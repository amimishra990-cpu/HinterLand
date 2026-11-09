"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "hinterland-admin-theme";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the attribute is set before paint by the boot script */
    if (document.documentElement.dataset.theme === "dark") setTheme("dark");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still applies for this page view.
    }
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded p-1.5 text-[var(--adm-muted)] transition-colors hover:bg-[var(--adm-panel-strong)] hover:text-[var(--adm-ink)]"
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? (
        <Sun size={15} aria-hidden="true" />
      ) : (
        <Moon size={15} aria-hidden="true" />
      )}
    </button>
  );
}
