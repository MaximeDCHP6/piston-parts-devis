"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
];

function applyTheme(choice: ThemeChoice) {
  if (choice === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    document.documentElement.setAttribute("data-theme", choice);
    localStorage.setItem("theme", choice);
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    // Lecture ponctuelle de localStorage au montage (état externe non
    // disponible côté serveur) : usage légitime, pas de mise à jour en
    // cascade puisqu'aucune autre valeur ne dépend de `choice` en amont.
    const stored = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "light" || stored === "dark") setChoice(stored);
  }, []);

  function select(next: ThemeChoice) {
    setChoice(next);
    applyTheme(next);
  }

  return (
    <div className="inline-flex overflow-hidden rounded-sm border border-border">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => select(opt.value)}
          className={cn(
            "px-3 py-2 text-sm transition-colors",
            choice === opt.value ? "bg-ink text-paper" : "bg-surface text-ink hover:bg-overlay",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
