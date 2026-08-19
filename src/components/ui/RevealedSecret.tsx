"use client";

import { useState } from "react";

export function RevealedSecret({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink">{label}</p>
      <div className="flex items-center gap-2 rounded-sm border border-border bg-paper px-3 py-2 font-mono text-sm">
        {value}
      </div>
      <button
        type="button"
        className="self-start text-sm text-accent hover:underline"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
        }}
      >
        {copied ? "Copié !" : "Copier"}
      </button>
    </div>
  );
}
