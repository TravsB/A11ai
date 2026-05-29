import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Link2,
  Loader2,
  RotateCcw,
  Sparkles,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VISION_MODES, type VisionMode } from "@/lib/vision";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Live Studio — VisionAdapt" },
      {
        name: "description",
        content:
          "Load any URL into a secure preview and apply adaptive accessibility transformations to the live DOM in real time.",
      },
    ],
  }),
  component: StudioPage,
});

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function StudioPage() {
  const [mode, setMode] = useState<VisionMode>("deuteranopia");
  const [contrast, setContrast] = useState([110]);
  const [fontScale, setFontScale] = useState([100]);
  const [linkHighlight, setLinkHighlight] = useState(true);
  const [dyslexia, setDyslexia] = useState(false);
  const [daltonize, setDaltonize] = useState(false);

  const [urlInput, setUrlInput] = useState("https://en.wikipedia.org/wiki/Color_blindness");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [mutations, setMutations] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentUrl = cursor >= 0 ? history[cursor] : "";

  const proxySrc = useMemo(
    () => (currentUrl ? `/api/public/proxy?url=${encodeURIComponent(currentUrl)}` : ""),
    [currentUrl]
  );

  // Push config to iframe whenever settings change
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      {
        __va: "config",
        config: {
          mode,
          contrast: contrast[0],
          fontScale: fontScale[0],
          link: linkHighlight,
          dyslexia,
          daltonize,
        },
      },
      "*"
    );
    setMutations((n) => n + 1);
  }, [ready, mode, contrast, fontScale, linkHighlight, dyslexia, daltonize]);

  // Listen for ready + navigation messages from the proxied site
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // Only trust messages from our own origin (the proxy iframe is same-origin).
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as { __va?: string; url?: string };
      if (!data || !data.__va) return;
      if (data.__va === "ready") {
        setReady(true);
        setLoading(false);
      }
      if (data.__va === "navigate" && data.url) {
        loadUrl(data.url);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });

  function loadUrl(rawUrl: string) {
    const url = normalizeUrl(rawUrl);
    if (!url) return;
    setUrlInput(url);
    setReady(false);
    setLoading(true);
    setHistory((h) => {
      const next = h.slice(0, cursor + 1);
      next.push(url);
      setCursor(next.length - 1);
      return next;
    });
  }

  function goBack() {
    if (cursor > 0) {
      setCursor(cursor - 1);
      setUrlInput(history[cursor - 1]);
      setReady(false);
      setLoading(true);
    }
  }
  function goForward() {
    if (cursor < history.length - 1) {
      setCursor(cursor + 1);
      setUrlInput(history[cursor + 1]);
      setReady(false);
      setLoading(true);
    }
  }

  function reset() {
    setMode("normal");
    setContrast([100]);
    setFontScale([100]);
    setLinkHighlight(false);
    setDyslexia(false);
    setDaltonize(false);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Live Studio
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Adaptive accessibility preview
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Load any URL through the secure server-side preview. The accessibility engine
          rewrites the page, injects a MutationObserver, and applies vision-deficiency
          transformations to the live DOM in real time.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <aside className="space-y-5 rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Website URL
            </Label>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                loadUrl(urlInput);
              }}
            >
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="pl-8"
                  placeholder="https://example.com"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-ink text-background hover:bg-ink/90"
              >
                Load
              </Button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                ["Wikipedia", "https://en.wikipedia.org/wiki/Color_blindness"],
                ["MDN", "https://developer.mozilla.org/en-US/docs/Web/Accessibility"],
                ["W3C WAI", "https://www.w3.org/WAI/"],
              ].map(([label, url]) => (
                <button
                  key={url}
                  onClick={() => loadUrl(url)}
                  className="rounded border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-ink"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vision profile
            </Label>
            <div className="mt-2 grid gap-1">
              {VISION_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    mode === m.id
                      ? "border-ink bg-ink text-background"
                      : "border-border bg-surface-elevated text-ink hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{m.label}</div>
                  <div
                    className={`text-xs ${
                      mode === m.id ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {m.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contrast intensity
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {contrast[0]}%
              </span>
            </div>
            <Slider
              value={contrast}
              min={50}
              max={200}
              step={5}
              onValueChange={setContrast}
              className="mt-3"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Typography scale
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {fontScale[0]}%
              </span>
            </div>
            <Slider
              value={fontScale}
              min={80}
              max={200}
              step={5}
              onValueChange={setFontScale}
              className="mt-3"
            />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <ToggleRow
              label="Daltonize colors"
              hint="Shift hues to recover lost channels"
              checked={daltonize}
              onChange={setDaltonize}
            />
            <ToggleRow
              label="Highlight links & focus"
              hint="Underline links, amber focus ring"
              checked={linkHighlight}
              onChange={setLinkHighlight}
            />
            <ToggleRow
              label="Dyslexia-friendly type"
              hint="Hyperlegible font, looser spacing"
              checked={dyslexia}
              onChange={setDyslexia}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => loadUrl(urlInput)}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Reapply
            </Button>
          </div>
        </aside>

        {/* Preview */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-2 shadow-elegant">
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
              <button
                onClick={goBack}
                disabled={cursor <= 0}
                className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-ink disabled:opacity-40"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goForward}
                disabled={cursor >= history.length - 1}
                className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-ink disabled:opacity-40"
                aria-label="Forward"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="mx-1 flex h-7 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{currentUrl || "No URL loaded"}</span>
                {loading && (
                  <Loader2 className="ml-auto h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
                )}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  ready
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {ready ? "Adapted" : loading ? "Loading" : "Idle"}
              </span>
            </div>
            <div className="relative h-[640px] bg-background">
              {!currentUrl && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <div className="max-w-sm">
                    <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium text-ink">
                      Load a website to begin
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter any URL above. The accessibility engine will fetch the page,
                      inject the DOM observer, and apply your selected vision profile.
                    </p>
                  </div>
                </div>
              )}
              {proxySrc && (
                <iframe
                  ref={iframeRef}
                  key={proxySrc}
                  src={proxySrc}
                  title="VisionAdapt preview"
                  className="h-full w-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              {mutations} transformations dispatched · MutationObserver active
            </span>
            <span>
              Profile: <strong className="text-ink">{mode}</strong> · WCAG 2.2 AA target
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
