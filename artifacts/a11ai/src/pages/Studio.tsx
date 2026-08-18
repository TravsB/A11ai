import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
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

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function Studio() {
  const [mode, setMode] = useState<VisionMode>("deuteranopia");
  const [contrast, setContrast] = useState([110]);
  const [fontScale, setFontScale] = useState([100]);
  const [linkHighlight, setLinkHighlight] = useState(true);
  const [dyslexia, setDyslexia] = useState(false);
  const [daltonize, setDaltonize] = useState(false);

  const [urlInput, setUrlInput] = useState(
    "https://en.wikipedia.org/wiki/Color_blindness",
  );
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [mutations, setMutations] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentUrl = cursor >= 0 ? history[cursor] : "";

  // Allow explicit backend API base via Vite env (VITE_API_URL). When set
  // this will be used to construct the proxy URL (useful in dev where the
  // frontend dev server may not proxy /api to the backend).
  const envApiBase = (import.meta.env as any).VITE_API_URL as string | undefined;
  const apiBaseFallback = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : undefined;
  const apiBase = envApiBase ?? apiBaseFallback;

  const proxySrc = useMemo(() => {
    if (!currentUrl) return "";
    const encoded = encodeURIComponent(currentUrl);
    if (apiBase) return `${apiBase.replace(/\/$/, '')}/api/public/proxy?url=${encoded}`;
    return `/api/public/proxy?url=${encoded}`;
  }, [currentUrl, apiBase]);

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
      "*",
    );
    setMutations((n) => n + 1);
  }, [ready, mode, contrast, fontScale, linkHighlight, dyslexia, daltonize]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // Accept messages only from the preview iframe window and that match the expected protocol
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as { __va?: string; url?: string };
      if (!data || !data.__va) return;
      if (data.__va === "ready") {
        setReady(true);
        setLoading(false);
      }
      if (data.__va === "navigate" && data.url) loadUrl(data.url);
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
    setMode("normal" as VisionMode);
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
          Load any URL through the secure server-side preview. The accessibility
          engine rewrites the page, injects a MutationObserver, and applies
          vision-deficiency transformations to the live DOM in real time.
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
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vision profile
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {VISION_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    mode === m.id
                      ? "bg-ink text-background"
                      : "bg-surface text-muted-foreground hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contrast
                </Label>
                <span className="text-xs text-muted-foreground">
                  {contrast[0]}%
                </span>
              </div>
              <Slider
                className="mt-3"
                min={70}
                max={150}
                step={5}
                value={contrast}
                onValueChange={setContrast}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Font scale
                </Label>
                <span className="text-xs text-muted-foreground">
                  {fontScale[0]}%
                </span>
              </div>
              <Slider
                className="mt-3"
                min={80}
                max={150}
                step={5}
                value={fontScale}
                onValueChange={setFontScale}
              />
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              label="Highlight links"
              hint="Add underline + outline to all links"
              checked={linkHighlight}
              onChange={setLinkHighlight}
            />
            <ToggleRow
              label="Dyslexic font"
              hint="Switch to OpenDyslexic typeface"
              checked={dyslexia}
              onChange={setDyslexia}
            />
            <ToggleRow
              label="Daltonize"
              hint="Color-shift algorithm for CVD"
              checked={daltonize}
              onChange={setDaltonize}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={reset}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to defaults
          </Button>
        </aside>

        {/* Preview */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-soft">
          <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={cursor <= 0}
              onClick={goBack}
              className="h-7 w-7 p-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={cursor >= history.length - 1}
              onClick={goForward}
              className="h-7 w-7 p-0"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              <span className="truncate">{currentUrl || "No page loaded"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {ready && <Sparkles className="h-3.5 w-3.5 text-accent" />}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ready ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
              >
                {ready ? "Adapted" : loading ? "Loading" : "Idle"}
              </span>
            </div>
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
                    Enter any URL above. The accessibility engine will fetch the
                    page, inject the DOM observer, and apply your selected
                    vision profile.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 bg-ink text-background hover:bg-ink/90"
                    onClick={() => loadUrl(urlInput)}
                  >
                    Load example
                  </Button>
                </div>
              </div>
            )}
            {proxySrc && (
              <iframe
                ref={iframeRef}
                key={proxySrc}
                src={proxySrc}
                title="A11ai preview"
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              {mutations} transformations dispatched · MutationObserver active
            </span>
            <span>
              Profile: <strong className="text-ink">{mode}</strong> · WCAG 2.2
              AA target
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
