import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  TrendingUp,
  Search,
  Loader2,
  Globe,
  Trash2,
  RefreshCw,
  Plus,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  wcag: string;
  title: string;
  description: string;
  count: number;
}

interface ScanSummary {
  id: string;
  url: string;
  score: number;
  issueCount: number;
  createdAt: string;
}

interface ScanDetail extends ScanSummary {
  result: { issues: ScanIssue[] };
}

const SEVERITY_STYLES: Record<
  ScanIssue["severity"],
  { dot: string; badge: string; label: string }
> = {
  critical: { dot: "bg-destructive", badge: "text-destructive", label: "Critical" },
  high: { dot: "bg-warning", badge: "text-warning", label: "High" },
  medium: { dot: "bg-accent", badge: "text-accent", label: "Medium" },
  low: { dot: "bg-muted-foreground", badge: "text-muted-foreground", label: "Low" },
};

async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color =
    score >= 90
      ? "var(--color-success)"
      : score >= 70
      ? "var(--color-warning)"
      : "var(--color-destructive)";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        Overall score
      </span>
      <div className="relative mt-3 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle
            cx="50" cy="50" r={r}
            fill="none" stroke="var(--color-muted)" strokeWidth="10"
          />
          <circle
            cx="50" cy="50" r={r}
            fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-3xl font-semibold text-ink">{score}</div>
          <div className="text-[10px] text-muted-foreground">/ 100</div>
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">WCAG 2.2 AA</p>
    </div>
  );
}

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface">
        <Globe className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-ink">No scans yet</h3>
      <p className="mb-5 max-w-xs text-sm text-muted-foreground">
        Enter any URL above to run a real WCAG 2.2 accessibility audit in seconds.
      </p>
      <Button
        size="sm"
        className="bg-ink text-background hover:bg-ink/90"
        onClick={onScan}
      >
        <Plus className="mr-1.5 h-4 w-4" /> Scan your first site
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [selected, setSelected] = useState<ScanDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const fetchScans = useCallback(async () => {
    const res = await apiFetch("/scans");
    if (res.ok) {
      const data = (await res.json()) as { scans: ScanSummary[] };
      setScans(data.scans);
      if (data.scans.length > 0 && !selected) {
        loadDetail(data.scans[0].id);
      }
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  async function loadDetail(id: string) {
    setLoadingDetail(true);
    const res = await apiFetch(`/scans/${id}`);
    if (res.ok) {
      const data = (await res.json()) as { scan: ScanDetail };
      setSelected(data.scan);
    }
    setLoadingDetail(false);
  }

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || scanning) return;
    setScanError(null);
    setScanning(true);
    const res = await apiFetch("/scans", {
      method: "POST",
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = (await res.json()) as { scan?: ScanDetail; error?: string };
    if (!res.ok) {
      setScanError(data.error ?? "Scan failed.");
    } else if (data.scan) {
      setScans((prev) => [data.scan as ScanSummary, ...prev]);
      setSelected(data.scan as ScanDetail);
      setUrl("");
    }
    setScanning(false);
  }

  async function deleteScan(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await apiFetch(`/scans/${id}`, { method: "DELETE" });
    setScans((prev) => prev.filter((s) => s.id !== id));
    if (selected?.id === id) {
      const remaining = scans.filter((s) => s.id !== id);
      if (remaining.length > 0) loadDetail(remaining[0].id);
      else setSelected(null);
    }
  }

  function exportReport() {
    if (!selected) return;
    const lines = [
      `A11ai Accessibility Report`,
      `URL: ${selected.url}`,
      `Score: ${selected.score}/100`,
      `Scanned: ${new Date(selected.createdAt).toLocaleString()}`,
      ``,
      `Issues (${selected.result.issues.length} total):`,
      ...selected.result.issues.map(
        (i) =>
          `[${i.severity.toUpperCase()}] WCAG ${i.wcag} — ${i.title}\n  ${i.description}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `a11ai-report-${new URL(selected.url.startsWith("http") ? selected.url : `https://${selected.url}`).hostname}.txt`;
    a.click();
  }

  const criticalCount = selected
    ? selected.result.issues.filter((i) => i.severity === "critical").length
    : 0;

  const severityCounts = selected
    ? (["critical", "high", "medium", "low"] as const).map((sev) => ({
        sev,
        count: selected.result.issues.filter((i) => i.severity === sev).length,
        issues: selected.result.issues.filter((i) => i.severity === sev),
      }))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Analytics
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            Accessibility dashboard
          </h1>
          {selected ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {selected.url} · last scan {timeAgo(selected.createdAt)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Scan any URL to get a real WCAG 2.2 audit
            </p>
          )}
        </div>
        {selected && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const url = `${window.location.origin}/report/${selected.id}`;
              navigator.clipboard.writeText(url).catch(() => {});
              window.open(url, "_blank");
            }}>
              <Share2 className="mr-2 h-4 w-4" /> Share report
            </Button>
            <Button variant="outline" onClick={exportReport}>
              <ArrowDownToLine className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        )}
      </div>

      {/* URL scan input */}
      <form onSubmit={runScan} className="mt-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>
          <Button
            type="submit"
            disabled={scanning || !url.trim()}
            className="bg-ink text-background hover:bg-ink/90 disabled:opacity-50"
          >
            {scanning ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning…</>
            ) : (
              "Run audit"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={fetchScans}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {scanError && (
          <p className="mt-2 text-xs text-destructive">{scanError}</p>
        )}
      </form>

      {loadingList ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : scans.length === 0 ? (
        <EmptyState onScan={() => document.querySelector("input")?.focus()} />
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {selected ? (
              <ScoreRing score={selected.score} />
            ) : (
              <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft animate-pulse" />
            )}
            {[
              {
                l: "Sites scanned",
                v: String(scans.length),
                icon: Globe,
                sub: "across your account",
              },
              {
                l: "Compliance pass",
                v: selected
                  ? `${selected.score >= 90 ? "AA" : selected.score >= 70 ? "Partial" : "Fail"}`
                  : "—",
                icon: CheckCircle2,
                sub: "WCAG 2.2 level",
              },
              {
                l: "Issues found",
                v: selected ? String(selected.issueCount) : "—",
                icon: AlertTriangle,
                sub: criticalCount > 0 ? `${criticalCount} critical` : "none critical",
              },
            ].map((c) => (
              <div
                key={c.l}
                className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {c.l}
                  </span>
                  <c.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {c.v}
                </div>
                <div className="text-xs text-muted-foreground">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Score history bar chart */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink">
                  Score history — all scans
                </h2>
                <span className="text-xs text-muted-foreground">
                  {scans.length} scan{scans.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-6 flex h-48 items-end gap-1.5 overflow-x-auto pb-1">
                {[...scans].reverse().map((s) => {
                  const pct = s.score;
                  const isSelected = selected?.id === s.id;
                  const color =
                    pct >= 90
                      ? "from-success to-success/40"
                      : pct >= 70
                      ? "from-warning to-warning/40"
                      : "from-destructive to-destructive/40";
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadDetail(s.id)}
                      className="group relative flex shrink-0 flex-col items-center gap-1"
                      style={{ width: `${Math.max(28, Math.min(60, 400 / scans.length))}px` }}
                      title={`${s.url} — ${s.score}`}
                    >
                      <span className="mb-1 hidden text-[10px] text-muted-foreground group-hover:block">
                        {pct}
                      </span>
                      <div
                        className={`w-full rounded-t bg-gradient-to-t ${color} ${isSelected ? "ring-2 ring-ink ring-offset-1" : ""}`}
                        style={{ height: `${pct}%` }}
                      />
                      <span className="mt-1 block max-w-full truncate text-[9px] text-muted-foreground">
                        {new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`).hostname.replace("www.", "")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Issues by severity */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
              <h2 className="text-base font-semibold text-ink">Detected issues</h2>
              {loadingDetail ? (
                <div className="mt-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : selected && selected.result.issues.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {severityCounts
                    .filter((s) => s.count > 0)
                    .map(({ sev, count, issues }) => (
                      <div key={sev} className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_STYLES[sev].dot}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-ink">
                              {SEVERITY_STYLES[sev].label}
                            </span>
                            <span className="text-xs text-muted-foreground">{count}</span>
                          </div>
                          {issues.slice(0, 1).map((i) => (
                            <p
                              key={i.id}
                              className="mt-0.5 truncate text-[11px] text-muted-foreground"
                            >
                              {i.title}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-6 text-center text-sm text-success">
                  <CheckCircle2 className="mx-auto mb-1 h-5 w-5" />
                  No issues found
                </p>
              )}
            </div>
          </div>

          {/* Scans table */}
          <div className="mt-6 rounded-2xl border border-border bg-surface-elevated shadow-soft">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Scan history</h2>
              <span className="text-xs text-muted-foreground">{scans.length} site{scans.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-border">
              {scans.map((scan) => {
                const isActive = selected?.id === scan.id;
                return (
                  <div
                    key={scan.id}
                    onClick={() => loadDetail(scan.id)}
                    className={`flex cursor-pointer items-center justify-between px-6 py-3.5 transition-colors hover:bg-muted/40 ${
                      isActive ? "bg-muted/60" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium text-ink">
                        {scan.url}
                      </span>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-6 text-sm">
                      <span className="hidden text-muted-foreground sm:block">
                        {timeAgo(scan.createdAt)}
                      </span>
                      <span className="text-muted-foreground">
                        {scan.issueCount} issue{scan.issueCount !== 1 ? "s" : ""}
                      </span>
                      <span
                        className={`w-8 text-right font-semibold ${
                          scan.score >= 90
                            ? "text-success"
                            : scan.score >= 70
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
                        {scan.score}
                      </span>
                      <button
                        onClick={(e) => deleteScan(scan.id, e)}
                        className="text-muted-foreground/40 transition-colors hover:text-destructive"
                        title="Delete scan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full issue detail for selected scan */}
          {selected && selected.result.issues.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-surface-elevated shadow-soft">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-base font-semibold text-ink">
                  Issue detail — {selected.url}
                </h2>
              </div>
              <div className="divide-y divide-border">
                {selected.result.issues.map((issue) => (
                  <div key={issue.id} className="flex items-start gap-4 px-6 py-4">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_STYLES[issue.severity].dot}`}
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {issue.title}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${SEVERITY_STYLES[issue.severity].badge}`}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          WCAG {issue.wcag}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {issue.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ×{issue.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected && selected.result.issues.length === 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-surface-elevated p-10 text-center shadow-soft">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-success" />
              <p className="font-semibold text-ink">No issues detected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.url} passed all WCAG 2.2 checks.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
