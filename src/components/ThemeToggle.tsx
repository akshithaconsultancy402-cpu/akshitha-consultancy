"use client";

import { useTheme } from "@/src/components/ThemeProvider";
import { transitionTheme } from "@/src/lib/ui-classes";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 ${transitionTheme}`}
    >
      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
