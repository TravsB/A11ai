import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowDownToLine, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VisionAdapt" },
      { name: "description", content: "Accessibility score, detected issues, and compliance analytics." },
    ],
  }),
  component: DashboardPage,
});

const ISSUES = [
  { severity: "Critical", count: 3, color: "destructive", text: "Insufficient contrast on primary CTAs" },
  { severity: "High", count: 8, color: "warning", text: "Color-only semantic indicators detected" },
  { severity: "Medium", count: 14, color: "accent", text: "Focus ring contrast below 3:1" },
  { severity: "Low", count: 22, color: "muted-foreground", text: "Decorative imagery missing alt text" },
];

function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Analytics</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Accessibility dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">acme-health.example.com · last scan 2 minutes ago</p>
        </div>
        <Button variant="outline">
          <ArrowDownToLine className="mr-2 h-4 w-4" /> Download audit report
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <ScoreCard />
        {[
          { l: "Elements transformed", v: "1,284", icon: TrendingUp, sub: "across 42 routes" },
          { l: "Compliance pass", v: "98.4%", icon: CheckCircle2, sub: "WCAG 2.2 AA" },
          { l: "Issues open", v: "47", icon: AlertTriangle, sub: "3 critical" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.l}</span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-ink">{c.v}</div>
            <div className="text-xs text-muted-foreground">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Contrast improvements (30 days)</h2>
            <span className="text-xs text-muted-foreground">+24.8% week over week</span>
          </div>
          <div className="mt-6 grid h-48 grid-cols-12 items-end gap-2">
            {[35, 42, 38, 55, 48, 60, 58, 72, 68, 80, 85, 92].map((h, i) => (
              <div key={i} className="rounded-t bg-gradient-to-t from-accent to-accent/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
          <h2 className="text-base font-semibold text-ink">Detected issues</h2>
          <div className="mt-4 space-y-3">
            {ISSUES.map((i) => (
              <div key={i.severity} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full bg-${i.color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{i.severity}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{i.count}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{i.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
        <h2 className="text-base font-semibold text-ink">AI recommendations</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "Navigation menu lacks contrast for protanopia users — bump foreground to oklch(0.22 0.03 260).",
            "Buttons become indistinguishable under deuteranopia simulation — pair color with icon affordance.",
            "Chart series 3 relies on color alone — apply diagonal hatch pattern in addition to hue.",
            "Form error states share luminance with warning state — increase by Δ12 to disambiguate.",
          ].map((r) => (
            <div key={r} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-[10px] font-semibold text-background">
                AI
              </span>
              <div className="text-sm text-foreground">{r}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreCard() {
  const score = 92;
  return (
    <div className="rounded-2xl border border-border bg-ink p-5 text-background shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-background/60">Accessibility score</span>
        <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-medium text-success">A</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">{score}</span>
        <span className="text-sm text-background/60">/100</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-background/10">
        <div className="h-1.5 rounded-full bg-success" style={{ width: `${score}%` }} />
      </div>
      <div className="mt-2 text-xs text-background/60">+6 since last scan</div>
    </div>
  );
}
