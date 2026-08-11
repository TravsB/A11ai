import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LivePage {
  url: string;
  score: number;
  issueCount: number;
}

interface FullPage extends LivePage {
  result: { issues: ScanIssue[] };
}

interface ScanIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  wcag: string;
  title: string;
  description: string;
  count: number;
}

interface HistoryAudit {
  id: string;
  domain: string;
  avgScore: number | null;
  totalPages: number;
  criticalCount: number;
  status: string;
  createdAt: string;
}

type State =
  | { type: "idle" }
  | { type: "scanning"; domain: string; auditId: string; pages: LivePage[] }
  | {
      type: "done";
      auditId: string;
      domain: string;
      pages: LivePage[];
      avgScore: number;
      totalPages: number;
      criticalCount: number;
    }
  | { type: "viewing"; auditId: string; domain: string; pages: FullPage[]; avgScore: number; totalPages: number; criticalCount: number };

const SEV_COLOR: Record<ScanIssue["severity"], string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-accent",
  low: "bg-muted-foreground",
};
const SEV_BADGE: Record<ScanIssue["severity"], string> = {
  critical: "text-destructive border-destructive/30 bg-destructive/5",
  high: "text-warning border-warning/30 bg-warning/5",
  medium: "text-accent border-accent/30 bg-accent/5",
  low: "text-muted-foreground border-border bg-muted/40",
};

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 90 ? "text-success" : score >= 70 ? "text-warning" : "text-destructive";
  return <span className={`text-lg font-bold tabular-nums ${color}`}>{score}</span>;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-success" : score >= 70 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <ScoreChip score={score} />
    </div>
  );
}

function BigScoreRing({ score }: { score: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const stroke =
    score >= 90
      ? "var(--color-success)"
      : score >= 70
        ? "var(--color-warning)"
        : "var(--color-destructive)";
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-ink">{score}</div>
        <div className="text-[10px] text-muted-foreground">avg / 100</div>
      </div>
    </div>
  );
}

function IssueAggregation({ pages }: { pages: LivePage[] }) {
  const map = new Map<string, { title: string; severity: ScanIssue["severity"]; pages: number; instances: number }>();

  (pages as FullPage[]).forEach((p) => {
    if (!("result" in p)) return;
    p.result.issues.forEach((issue) => {
      const existing = map.get(issue.id);
      if (existing) {
        existing.pages++;
        existing.instances += issue.count;
      } else {
        map.set(issue.id, { title: issue.title, severity: issue.severity, pages: 1, instances: issue.count });
      }
    });
  });

  const sorted = [...map.entries()].sort((a, b) => b[1].pages - a[1].pages).slice(0, 8);
  if (sorted.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold text-ink">Most common issues across all pages</h3>
      <div className="space-y-2">
        {sorted.map(([id, issue]) => (
          <div key={id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
            <span className={`h-2 w-2 shrink-0 rounded-full ${SEV_COLOR[issue.severity]}`} />
            <span className="flex-1 text-sm text-ink">{issue.title}</span>
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase ${SEV_BADGE[issue.severity]}`}>
              {issue.severity}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{issue.pages} page{issue.pages !== 1 ? "s" : ""}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{issue.instances}×</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageRow({ page, index }: { page: LivePage; index: number }) {
  const [open, setOpen] = useState(false);
  const full = page as FullPage;
  const hasIssues = "result" in full && full.result.issues.length > 0;

  const shortUrl = page.url.replace(/^https?:\/\//, "").replace(/\/$/, "") || page.url;

  return (
    <>
      <tr
        className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${hasIssues ? "cursor-pointer" : ""}`}
        onClick={() => hasIssues && setOpen((o) => !o)}
      >
        <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{index + 1}</td>
        <td className="px-4 py-3 max-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {hasIssues ? (
              open ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
            )}
            <span className="truncate text-sm text-ink font-mono">{shortUrl}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <ScoreBar score={page.score} />
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground text-right">{page.issueCount}</td>
      </tr>
      {open && hasIssues && (
        <tr>
          <td colSpan={4} className="bg-muted/20 px-10 pb-4 pt-2">
            <div className="space-y-2">
              {full.result.issues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-3 text-xs">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${SEV_COLOR[issue.severity]}`} />
                  <div className="min-w-0">
                    <span className="font-medium text-ink">{issue.title}</span>
                    <span className="ml-2 text-muted-foreground">WCAG {issue.wcag}</span>
                    <p className="mt-0.5 text-muted-foreground leading-relaxed">{issue.description}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-muted-foreground">×{issue.count}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ResultsView({
  state,
  onReset,
}: {
  state: Extract<State, { type: "done" | "viewing" }>;
  onReset: () => void;
}) {
  const grade =
    state.avgScore >= 90 ? "AA Pass" : state.avgScore >= 70 ? "Partial" : "Fail";
  const gradeColor =
    state.avgScore >= 90 ? "text-success" : state.avgScore >= 70 ? "text-warning" : "text-destructive";

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span className="font-medium text-ink">{state.domain}</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-ink">Audit complete</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New audit
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <BigScoreRing score={state.avgScore} />
          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-ink">{state.totalPages}</div>
              <div className="text-xs text-muted-foreground">Pages scanned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">{state.criticalCount}</div>
              <div className="text-xs text-muted-foreground">Critical issues</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${gradeColor}`}>{grade}</div>
              <div className="text-xs text-muted-foreground">WCAG 2.2 level</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink">
                {(state.pages as Array<{ issueCount: number }>).reduce((s, p) => s + p.issueCount, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total issues</div>
            </div>
          </div>
        </div>
      </div>

      <IssueAggregation pages={state.pages} />

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">Pages — sorted by score</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground w-8">#</th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">URL</th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground w-36">Score</th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground w-20">Issues</th>
              </tr>
            </thead>
            <tbody>
              {[...state.pages]
                .sort((a, b) => a.score - b.score)
                .map((page, i) => (
                  <PageRow key={page.url} page={page} index={i} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScanningView({ state }: { state: Extract<State, { type: "scanning" }> }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <div>
          <p className="text-sm font-semibold text-ink">Auditing {state.domain}</p>
          <p className="text-xs text-muted-foreground">
            {state.pages.length === 0
              ? "Connecting…"
              : `${state.pages.length} page${state.pages.length !== 1 ? "s" : ""} scanned so far`}
          </p>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">up to 12 pages</div>
      </div>

      {state.pages.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">URL</th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground w-36">Score</th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground w-20">Issues</th>
              </tr>
            </thead>
            <tbody>
              {state.pages.map((page) => {
                const shortUrl = page.url.replace(/^https?:\/\//, "").replace(/\/$/, "") || page.url;
                return (
                  <tr key={page.url} className="border-b border-border/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
                        <span className="truncate text-xs font-mono text-ink max-w-xs">{shortUrl}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><ScoreBar score={page.score} /></td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{page.issueCount}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={3} className="px-4 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Scanning next page…</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Audit() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ type: "idle" });
  const [history, setHistory] = useState<HistoryAudit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const loadHistory = useCallback(() => {
    fetch("/api/audits", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { audits: HistoryAudit[] }) => setHistory(d.audits))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function startAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || state.type === "scanning") return;
    setError(null);

    const target = url.trim();
    let domain = target;
    try {
      domain = new URL(target.startsWith("http") ? target : `https://${target}`).hostname;
    } catch {}

    const es = new EventSource(`/api/audits/scan?url=${encodeURIComponent(target)}`, {
      withCredentials: true,
    });
    esRef.current = es;

    setState({ type: "scanning", domain, auditId: "", pages: [] });

    es.addEventListener("start", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as { auditId: string };
      setState((prev) =>
        prev.type === "scanning" ? { ...prev, auditId: data.auditId } : prev,
      );
    });

    es.addEventListener("page", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as {
        url: string;
        score: number;
        issueCount: number;
      };
      setState((prev) => {
        if (prev.type !== "scanning") return prev;
        return { ...prev, pages: [...prev.pages, data] };
      });
    });

    es.addEventListener("done", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as {
        auditId: string;
        avgScore: number;
        totalPages: number;
        criticalCount: number;
      };
      es.close();
      setState((prev) => {
        if (prev.type !== "scanning") return prev;
        return {
          type: "done",
          auditId: data.auditId,
          domain: prev.domain,
          pages: prev.pages,
          avgScore: data.avgScore,
          totalPages: data.totalPages,
          criticalCount: data.criticalCount,
        };
      });
      loadHistory();
    });

    es.addEventListener("error", (evt) => {
      es.close();
      try {
        const data = JSON.parse((evt as MessageEvent).data) as { message: string };
        setError(data.message);
      } catch {
        setError("Audit failed. Check the URL and try again.");
      }
      setState({ type: "idle" });
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return;
      es.close();
      setError("Connection lost. Please try again.");
      setState({ type: "idle" });
    };
  }

  async function viewHistorical(audit: HistoryAudit) {
    const res = await fetch(`/api/audits/${audit.id}`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json() as { audit: HistoryAudit; pages: FullPage[] };
    setState({
      type: "viewing",
      auditId: audit.id,
      domain: audit.domain,
      pages: data.pages,
      avgScore: audit.avgScore ?? 0,
      totalPages: audit.totalPages,
      criticalCount: audit.criticalCount,
    });
  }

  async function deleteAudit(id: string) {
    await fetch(`/api/audits/${id}`, { method: "DELETE", credentials: "include" });
    setHistory((h) => h.filter((a) => a.id !== id));
    if ((state as { auditId?: string }).auditId === id) setState({ type: "idle" });
  }

  function reset() {
    esRef.current?.close();
    setState({ type: "idle" });
    setError(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <Zap className="h-3.5 w-3.5" /> Site-Wide Audit
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Crawl & audit your entire website
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Enter any domain — A11ai crawls up to 12 pages and runs a full WCAG 2.2 scan on
          each one. No manual page-by-page scanning.
        </p>
      </div>

      {state.type === "idle" || state.type === "done" || state.type === "viewing" ? (
        <form onSubmit={startAudit} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full rounded-xl border border-border bg-surface-elevated py-2.5 pl-9 pr-3 text-sm text-ink shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>
          <Button
            type="submit"
            disabled={!url.trim()}
            className="shrink-0 bg-ink text-background hover:bg-ink/90 disabled:opacity-50"
          >
            <Search className="mr-2 h-4 w-4" /> Audit site
          </Button>
        </form>
      ) : null}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      {state.type === "scanning" && <ScanningView state={state} />}
      {(state.type === "done" || state.type === "viewing") && (
        <ResultsView state={state} onReset={reset} />
      )}

      {state.type === "idle" && history.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold text-ink">Past audits</h2>
          <div className="space-y-2">
            {history.map((audit) => (
              <div
                key={audit.id}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-muted/40"
                onClick={() => viewHistorical(audit)}
              >
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{audit.domain}</p>
                  <p className="text-xs text-muted-foreground">
                    {audit.totalPages} page{audit.totalPages !== 1 ? "s" : ""} ·{" "}
                    {new Date(audit.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {audit.status === "scanning" ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> In progress
                  </div>
                ) : audit.status === "error" ? (
                  <span className="text-xs text-destructive">Failed</span>
                ) : (
                  <div className="flex items-center gap-3">
                    {audit.criticalCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <TrendingDown className="h-3 w-3" /> {audit.criticalCount} critical
                      </span>
                    )}
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        (audit.avgScore ?? 0) >= 90
                          ? "text-success"
                          : (audit.avgScore ?? 0) >= 70
                            ? "text-warning"
                            : "text-destructive"
                      }`}
                    >
                      {audit.avgScore ?? "—"}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAudit(audit.id);
                  }}
                  className="ml-2 rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.type === "idle" && history.length === 0 && (
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Globe, title: "Automatic crawling", body: "A11ai follows internal links and discovers pages on your site — no sitemap needed." },
            { icon: Search, title: "13 WCAG checks", body: "Every page is scanned for missing alt text, unlabelled forms, broken headings, and more." },
            { icon: TrendingDown, title: "Site-wide ranking", body: "See every page ranked from worst to best, with issues expandable per page." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-ink" />
              </div>
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
