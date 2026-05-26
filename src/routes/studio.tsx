import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, RotateCcw, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { VISION_MODES, type VisionMode, visionClass } from "@/lib/vision";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Live Studio — VisionAdapt" },
      { name: "description", content: "Preview adaptive accessibility transformations on any website in real time." },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const [mode, setMode] = useState<VisionMode>("deuteranopia");
  const [contrast, setContrast] = useState([110]);
  const [fontScale, setFontScale] = useState([100]);
  const [url, setUrl] = useState("https://acme-health.example.com");

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Live Studio</div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Adaptive accessibility preview
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Load any URL into the secure preview environment, choose a vision profile, and
          fine-tune the transformation engine.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <aside className="space-y-5 rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Website URL
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-8"
                  placeholder="https://example.com"
                />
              </div>
              <Button size="sm" className="bg-ink text-background hover:bg-ink/90">Load</Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vision profile
            </label>
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
                  <div className={`text-xs ${mode === m.id ? "text-background/70" : "text-muted-foreground"}`}>
                    {m.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contrast intensity
              </label>
              <span className="text-xs tabular-nums text-muted-foreground">{contrast[0]}%</span>
            </div>
            <Slider value={contrast} min={50} max={200} step={5} onValueChange={setContrast} className="mt-3" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Typography scale
              </label>
              <span className="text-xs tabular-nums text-muted-foreground">{fontScale[0]}%</span>
            </div>
            <Slider value={fontScale} min={80} max={160} step={5} onValueChange={setFontScale} className="mt-3" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setMode("normal"); setContrast([100]); setFontScale([100]); }}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Apply
            </Button>
          </div>
        </aside>

        {/* Preview */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-2 shadow-elegant">
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <div className="mx-auto h-7 max-w-md flex-1 rounded-md border border-border bg-background px-3 py-1 text-center text-xs leading-5 text-muted-foreground">
                {url}
              </div>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                Adapted
              </span>
            </div>
            <div
              className={`p-8 ${visionClass(mode)}`}
              style={{
                filter:
                  mode === "normal"
                    ? `contrast(${contrast[0]}%)`
                    : undefined,
                fontSize: `${fontScale[0]}%`,
              }}
            >
              <FakeSite />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" /> 42 transformations applied
            </span>
            <span>WCAG 2.2 AA · 98.4% pass</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FakeSite() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-accent" />
          <div>
            <div className="text-sm font-semibold text-ink">Acme Health</div>
            <div className="text-xs text-muted-foreground">Patient dashboard</div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">3 critical</span>
          <span className="rounded bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground">7 review</span>
          <span className="rounded bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">42 stable</span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { l: "Active patients", v: "1,284", d: "+8.2%", k: "success" },
          { l: "Avg. wait time", v: "14m", d: "−3.4%", k: "success" },
          { l: "Alerts open", v: "23", d: "+12", k: "destructive" },
        ].map((c) => (
          <div key={c.l} className="rounded-lg border border-border bg-surface-elevated p-4">
            <div className="text-xs text-muted-foreground">{c.l}</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-ink">{c.v}</span>
              <span className={`text-xs font-medium text-${c.k}`}>{c.d}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface-elevated p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">Weekly trend</div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Admissions</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Discharges</span>
          </div>
        </div>
        <div className="grid h-32 grid-cols-7 items-end gap-2">
          {[60, 75, 55, 85, 70, 90, 65].map((h, i) => (
            <div key={i} className="flex h-full flex-col justify-end gap-0.5">
              <div className="rounded-sm bg-accent" style={{ height: `${h}%` }} />
              <div className="rounded-sm bg-warning" style={{ height: `${100 - h}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
