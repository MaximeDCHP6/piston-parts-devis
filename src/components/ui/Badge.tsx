import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "danger" | "warning";

const toneClass: Record<Tone, string> = {
  neutral: "bg-overlay text-ink ring-1 ring-inset ring-border",
  accent: "bg-accent/10 text-accent ring-1 ring-inset ring-accent/20",
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
  danger: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/20",
  warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}
