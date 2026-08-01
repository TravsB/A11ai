import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import {
  CheckCircle2,
  AlertTriangle,
  Globe,
  Loader2,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  wcag: string;
  title: string;
  description: string;
  count: number;
  remediation?: string;
  elementSnippet?: string;
}

interface Scan {
  id: string;
  url: string;
  score: number;
  issueCount: number;
  createdAt: string;
  result: { issues: ScanIssue[] };
}

const SEVERITY_STYLES: Record<ScanIssue["severity"], { dot: string; badge: string; label: string }> = {
  critical: { dot: "bg-destructive", badge: "text-destructive border-destructive/30 bg-destructive/5", label: "Critical" },
  high: { dot: "bg-warning", badge: "text-warning border-warning/30 bg-warning/5", label: "High" },
  medium: { dot: "bg-accent", badge: "text-accent border-accent/30 bg-accent/5", label: "Medium" },
  low: { dot: "bg-muted-foreground", badge: "text-muted-foreground border-border bg-muted/50", label: "Low" },
};

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = score >= 90 ? "var(--color-success)" : score >= 70 ? "var(--color-warning)" : "var(--color-destructive)";
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-bold text-ink">{score}</div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}

export default function Report() {
  const [, params] = useRoute("/report/:id");
  const id = params?.id;

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/report/${id}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json() as { scan: Scan };
        setScan(data.scan);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !scan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-6">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-ink">Report not found</h2>
        <p className="text-sm text-muted-foreground">This report may have been deleted or the link is invalid.</p>
        <Button className="bg-ink text-background hover:bg-ink/90" asChild>
          <Link to="/">Back to A11ai</Link>
        </Button>
      </div>
    );
  }

  const scannedAt = new Date(scan.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const criticalCount = scan.result.issues.filter((i) => i.severity === "critical").length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-background">
            <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
          </div>
          <span className="text-sm font-semibold text-ink">A11ai Accessibility Report</span>
        </Link>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span className="font-medium text-ink break-all">{scan.url}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Scanned on {scannedAt}</p>
      </div>

      {/* Score + stats */}
      <div className="mb-10 rounded-2xl border border-border bg-surface p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <ScoreRing score={scan.score} />
          <div className="grid flex-1 grid-cols-2 gap-4 text-center sm:text-left">
            <div>
              <div className="text-3xl font-bold text-ink">{scan.issueCount}</div>
              <div className="text-sm text-muted-foreground">Total issues</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-destructive">{criticalCount}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">
                {scan.score >= 90 ? "AA Pass" : scan.score >= 70 ? "Partial" : "Fail"}
              </div>
              <div className="text-xs text-muted-foreground">WCAG 2.2 level</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">
                {scan.result.issues.filter((i) => i.severity === "high").length} High
              </div>
              <div className="text-xs text-muted-foreground">severity issues</div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {scan.result.issues.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-success" />
          <p className="font-semibold text-ink">No issues detected</p>
          <p className="mt-1 text-sm text-muted-foreground">This site passed all WCAG 2.2 checks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="mb-4 text-lg font-semibold text-ink">Issues found</h2>
          {scan.result.issues.map((issue) => (
            <div key={issue.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start gap-4">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_STYLES[issue.severity].dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{issue.title}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${SEVERITY_STYLES[issue.severity].badge}`}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] text-muted-foreground">WCAG {issue.wcag}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">×{issue.count}</span>
              </div>
              {issue.remediation && (
                <div className="ml-6 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
                  <div className="font-medium text-ink mb-1">💡 Recommended Fix:</div>
                  <code className="block text-[11px] font-mono text-ink/90 bg-background/80 p-2 rounded border border-border/40 overflow-x-auto">
                    {issue.remediation}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-border bg-ink p-8 text-center text-background">
        <h3 className="mb-2 text-xl font-bold">Run your own accessibility audit</h3>
        <p className="mb-6 text-sm text-background/70">
          A11ai scans any website for WCAG 2.2 issues in seconds. Free account required.
        </p>
        <Button size="lg" className="bg-background text-ink hover:bg-background/90" asChild>
          <Link to="/sign-up">
            Get started free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
