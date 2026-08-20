import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-1 shrink-0 rounded-full bg-accent" style={{ boxShadow: "0 0 6px var(--accent)" }} />
          <h1 className="font-display text-2xl font-medium tracking-tight text-ink">{title}</h1>
        </div>
        {description && <p className="mt-1.5 pl-3 font-mono text-xs text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
