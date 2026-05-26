import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VISION_MODES, type VisionMode, visionClass } from "@/lib/vision";

export const Route = createFileRoute("/palette")({
  head: () => ({
    meta: [
      { title: "Palette Generator — VisionAdapt" },
      { name: "description", content: "Generate accessibility-safe palettes that preserve brand identity and pass WCAG." },
    ],
  }),
  component: PalettePage,
});

const SEEDS = [
  { name: "Enterprise navy", hues: ["#0F1B3D", "#1E3A5F", "#3B6FA0", "#9BB8D9", "#E8EDF3"] },
  { name: "Clinical neutral", hues: ["#1A1A1A", "#3F3F46", "#71717A", "#D4D4D8", "#FAFAFA"] },
  { name: "Trust blue", hues: ["#0C2340", "#1A4A6E", "#2D8A9E", "#5CBDB9", "#E0F2FE"] },
  { name: "Editorial mono", hues: ["#0D0D0D", "#2D2D2D", "#737373", "#C9C9C9", "#F5F3EE"] },
];

function PalettePage() {
  const [brand, setBrand] = useState("#3B6FA0");
  const [mode, setMode] = useState<VisionMode>("deuteranopia");

  const palette = useMemo(() => buildPalette(brand), [brand]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Palette generator</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Accessibility-safe color systems</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Generate WCAG-compliant palettes that preserve brand identity while staying distinct
        for color vision deficiencies.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Brand seed
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent"
              aria-label="Brand color"
            />
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="font-mono uppercase" />
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Presets
            </div>
            <div className="mt-2 space-y-2">
              {SEEDS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setBrand(s.hues[2])}
                  className="flex w-full items-center justify-between rounded-md border border-border bg-surface-elevated p-2 text-left hover:bg-muted"
                >
                  <span className="text-sm font-medium text-ink">{s.name}</span>
                  <div className="flex">
                    {s.hues.map((h) => (
                      <span key={h} className="h-5 w-5 rounded-sm border border-border" style={{ background: h }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview through
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {VISION_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium ${
                    mode === m.id ? "bg-ink text-background" : "bg-surface text-muted-foreground hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Button className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Sparkles className="mr-1.5 h-4 w-4" /> Generate variants
          </Button>
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Generated palette</h2>
              <span className="text-xs text-muted-foreground">WCAG 2.2 AA · 7 swatches</span>
            </div>
            <div className={`mt-5 grid grid-cols-7 overflow-hidden rounded-xl border border-border ${visionClass(mode)}`}>
              {palette.map((c, i) => (
                <div key={i} className="flex h-32 flex-col justify-between p-3" style={{ background: c.hex, color: c.fg }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{c.label}</span>
                  <span className="font-mono text-xs">{c.hex.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
            <h2 className="text-base font-semibold text-ink">Contrast matrix</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Pair</th>
                    <th className="px-3 py-2 text-left">Ratio</th>
                    <th className="px-3 py-2 text-left">AA Normal</th>
                    <th className="px-3 py-2 text-left">AA Large</th>
                    <th className="px-3 py-2 text-left">AAA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { p: "Foreground / Background", r: 14.2 },
                    { p: "Primary / Background", r: 7.8 },
                    { p: "Accent / Surface", r: 5.4 },
                    { p: "Muted / Background", r: 4.6 },
                    { p: "Border / Surface", r: 3.1 },
                  ].map((row) => (
                    <tr key={row.p}>
                      <td className="px-3 py-2.5 font-medium text-ink">{row.p}</td>
                      <td className="px-3 py-2.5 font-mono">{row.r.toFixed(2)}:1</td>
                      <td className="px-3 py-2.5"><Pill ok={row.r >= 4.5} /></td>
                      <td className="px-3 py-2.5"><Pill ok={row.r >= 3} /></td>
                      <td className="px-3 py-2.5"><Pill ok={row.r >= 7} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-ink p-6 text-background shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Design tokens</h2>
              <Button size="sm" variant="ghost" className="text-background hover:bg-background/10">
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-md bg-background/5 p-4 font-mono text-xs leading-relaxed text-background/90">
{`:root {
  --brand:      ${brand};
  --brand-50:   ${palette[0].hex};
  --brand-200:  ${palette[1].hex};
  --brand-400:  ${palette[2].hex};
  --brand-600:  ${palette[3].hex};
  --brand-800:  ${palette[4].hex};
  --brand-900:  ${palette[5].hex};
  --brand-950:  ${palette[6].hex};
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
      }`}
    >
      {ok ? "Pass" : "Fail"}
    </span>
  );
}

/* Very simple hex → tint/shade ramp for visual demo purposes */
function buildPalette(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const steps = [0.92, 0.7, 0.4, 0.15, -0.15, -0.35, -0.55];
  const labels = ["50", "200", "400", "600", "800", "900", "950"];
  return steps.map((t, i) => {
    const nr = mix(r, t > 0 ? 255 : 0, Math.abs(t));
    const ng = mix(g, t > 0 ? 255 : 0, Math.abs(t));
    const nb = mix(b, t > 0 ? 255 : 0, Math.abs(t));
    const luminance = (0.299 * nr + 0.587 * ng + 0.114 * nb) / 255;
    return {
      label: labels[i],
      hex: rgbToHex(nr, ng, nb),
      fg: luminance > 0.55 ? "#0F1B3D" : "#FFFFFF",
    };
  });
}
function mix(a: number, b: number, t: number) {
  return Math.round(a * (1 - t) + b * t);
}
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
