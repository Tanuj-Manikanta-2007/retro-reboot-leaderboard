
"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("retro-theme");
    const initialTheme: Theme =
      savedTheme === "light" ? "light" : "dark";

    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );

    setTheme(initialTheme);
    setReady(true);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme =
      theme === "dark" ? "light" : "dark";

    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );

    localStorage.setItem("retro-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!ready}
      aria-label={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="inline-flex items-center justify-center gap-2 rounded-lg
        border border-arcade-border bg-arcade-surface px-3 py-2
        text-slate-300 transition-colors hover:text-cogaan-gold
        disabled:opacity-50"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline text-sm">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
