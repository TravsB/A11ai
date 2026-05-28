import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  Eye,
  Gauge,
  Layers,
  LineChart,
  Palette,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VISION_MODES, type VisionMode, visionClass } from "@/lib/vision";

function downloadExtension() {
  fetch("/reform-labs-a11y.zip")
    .then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "reform-labs-a11y.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VisionAdapt Color Engine — Adaptive Accessibility Platform" },
      {
        name: "description",
        content:
          "Transform any website for color vision deficiencies in real time. WCAG-compliant adaptive color engine, browser extension, and developer SDK.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Hero />
      <LogoStrip />
      <DemoSection />
      <Features />
      <SimulationStrip />
      <Stats />
      <Pricing />
      <FAQ />
      <CTA />
    </>
  );
}

/* ------------------------- Hero ------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            New · Adaptive Engine v3 with semantic preservation
          </div>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7xl">
            Accessibility, rendered{" "}
            <span className="bg-gradient-to-br from-ink to-accent bg-clip-text text-transparent">
              for every eye.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            VisionAdapt is an adaptive color engine that transforms any website in real
            time for protanopia, deuteranopia, tritanopia, and low-vision users —
            without breaking layout, branding, or function.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-11 bg-ink px-5 text-background hover:bg-ink/90" onClick={downloadExtension}>
              Download Reform Labs A11y <Download className="ml-1.5 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-5" asChild>
              <Link to="/studio">Open Live Studio</Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-11 px-5" asChild>
              <Link to="/docs">Developer SDK</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Chrome, Edge, Brave · Manifest V3 · v4.0.0 · Reading Focus Ruler included
          </p>
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> WCAG 2.2 AA</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> SOC 2 Type II</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Section 508</span>
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-6xl">
      <div className="rounded-2xl border border-border bg-surface-elevated p-2 shadow-elegant">
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          {/* Browser chrome */}
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </div>
            <div className="hidden flex-1 px-6 sm:block">
              <div className="mx-auto h-7 max-w-md rounded-md border border-border bg-background px-3 py-1 text-center text-xs leading-5 text-muted-foreground">
                https://visionadapt.io/studio
              </div>
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Adapted
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <PreviewPane mode="normal" label="Original" />
            <PreviewPane mode="deuteranopia" label="Deuteranopia · Adapted" highlight />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewPane({
  mode,
  label,
  highlight = false,
}: {
  mode: VisionMode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-6 md:p-8 ${highlight ? "bg-surface/60" : ""} border-b md:border-b-0 md:border-l border-border first:border-l-0`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            <Sparkles className="h-3 w-3" /> Engine on
          </span>
        )}
      </div>
      <div className={visionClass(mode)}>
        <MockDashboard />
      </div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-ink">$184,920</div>
        </div>
        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">+12.4%</span>
      </div>
      <div className="mt-4 grid h-24 grid-cols-7 items-end gap-1.5">
        {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
          <div key={i} className="rounded-sm bg-accent/80" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border border-border bg-surface px-2 py-1.5">
          <div className="text-muted-foreground">Sessions</div>
          <div className="font-semibold text-ink">12.4k</div>
        </div>
        <div className="rounded-md border border-success/30 bg-success/5 px-2 py-1.5">
          <div className="text-success">Success</div>
          <div className="font-semibold text-ink">98%</div>
        </div>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5">
          <div className="text-destructive">Errors</div>
          <div className="font-semibold text-ink">14</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Logos ------------------------- */

function LogoStrip() {
  const logos = ["NORDIC GOV", "HELION", "ATLAS EDU", "QUARTZ", "LUMEN BANK", "OAKLINE"];
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Trusted by accessibility teams at
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((l) => (
            <span key={l} className="text-sm font-semibold tracking-widest text-muted-foreground/70">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Interactive demo ------------------------- */

function DemoSection() {
  const [mode, setMode] = useState<VisionMode>("protanopia");
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionLabel>Interactive demo</SectionLabel>
      <SectionTitle>See the engine adapt in real time.</SectionTitle>
      <SectionLead>
        Switch a vision profile and watch the same interface re-render with semantically
        preserved color, contrast, and emphasis.
      </SectionLead>

      <div className="mt-10 rounded-2xl border border-border bg-surface-elevated p-2 shadow-elegant">
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-surface p-2">
            {VISION_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m.id
                    ? "bg-ink text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="bg-background p-6 md:p-10">
            <div className={visionClass(mode)}>
              <DemoWebsite />
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {VISION_MODES.find((m) => m.id === mode)?.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoWebsite() {
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-surface-elevated p-6 shadow-soft">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="font-semibold text-ink">Acme Health Portal</div>
        <div className="flex gap-2">
          <span className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
            Critical
          </span>
          <span className="rounded bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground">
            Review
          </span>
          <span className="rounded bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
            Resolved
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Patient outcomes</div>
          <div className="mt-3 space-y-2">
            {[
              { label: "Stable", value: 72, color: "var(--color-success)" },
              { label: "Monitored", value: 18, color: "var(--color-warning)" },
              { label: "Urgent", value: 10, color: "var(--color-destructive)" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{r.label}</span>
                  <span>{r.value}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full" style={{ width: `${r.value}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <button className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground">
            Schedule consultation
          </button>
          <button className="w-full rounded-md border border-border bg-background px-4 py-2 font-medium text-ink">
            Download report
          </button>
          <button className="w-full rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground">
            Cancel admission
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Features ------------------------- */

const FEATURES = [
  {
    icon: Layers,
    title: "DOM-aware transformation",
    body: "Scans stylesheets and live DOM, maps inaccessible color pairs, and injects override rules without breaking layout.",
  },
  {
    icon: Palette,
    title: "Semantic color preservation",
    body: "Errors stay urgent. Success stays positive. Color shifts are paired with icons, borders, and patterns.",
  },
  {
    icon: Workflow,
    title: "MutationObserver pipeline",
    body: "Reacts to SPA route changes and async content. Works with React, Vue, Svelte, and modern frameworks.",
  },
  {
    icon: Gauge,
    title: "Sub-frame performance",
    body: "Transformations cached per-domain. Median injection cost under 4ms on mid-tier hardware.",
  },
  {
    icon: ShieldCheck,
    title: "WCAG 2.2 scoring",
    body: "Continuous compliance scoring with downloadable audit reports for legal and procurement.",
  },
  {
    icon: Zap,
    title: "One-line SDK",
    body: "Drop in a script tag or install the npm package. Profiles propagate automatically to authenticated users.",
  },
];

function Features() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionLabel>Platform</SectionLabel>
        <SectionTitle>An accessibility layer engineered for production.</SectionTitle>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group bg-surface-elevated p-7 transition-colors hover:bg-background">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-background">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Simulation strip ------------------------- */

function SimulationStrip() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionLabel>Simulation studio</SectionLabel>
      <SectionTitle>Preview the same page through five visual profiles.</SectionTitle>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(["normal", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as VisionMode[]).map(
          (m) => (
            <div key={m} className="overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-soft">
              <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {VISION_MODES.find((v) => v.id === m)?.label}
              </div>
              <div className={`p-4 ${visionClass(m)}`}>
                <div className="grid h-20 grid-cols-4 gap-1.5">
                  <div className="rounded bg-destructive" />
                  <div className="rounded bg-warning" />
                  <div className="rounded bg-success" />
                  <div className="rounded bg-accent" />
                </div>
                <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-destructive via-warning to-success" />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

/* ------------------------- Stats ------------------------- */

function Stats() {
  const stats = [
    { v: "300M+", l: "People with color vision deficiency worldwide" },
    { v: "1 in 12", l: "Men affected globally" },
    { v: "98.4%", l: "WCAG 2.2 AA pass rate after adaptation" },
    { v: "<4ms", l: "Median engine injection time" },
  ];
  return (
    <section className="border-y border-border bg-ink text-background">
      <div className="mx-auto grid max-w-7xl gap-y-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="text-4xl font-semibold tracking-tight">{s.v}</div>
            <div className="mt-2 max-w-[14rem] text-sm text-background/60">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------- Pricing ------------------------- */

const TIERS = [
  {
    name: "Starter",
    price: "Free",
    note: "For individuals and small projects",
    features: ["Browser extension", "5 vision profiles", "Community support"],
    cta: "Install extension",
  },
  {
    name: "Team",
    price: "$49",
    suffix: "/mo",
    note: "For product and design teams",
    features: ["Live Studio", "Palette generator", "WCAG reports", "Up to 10 seats"],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "Compliance-grade deployment",
    features: ["SDK & API", "SSO + SCIM", "SLA & DPA", "Dedicated CSM"],
    cta: "Talk to sales",
  },
];

function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionLabel>Pricing</SectionLabel>
      <SectionTitle>Simple, accessible by default.</SectionTitle>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-7 ${
              t.featured
                ? "border-ink bg-ink text-background shadow-elegant"
                : "border-border bg-surface-elevated"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h3 className={`text-sm font-semibold ${t.featured ? "" : "text-ink"}`}>{t.name}</h3>
              {t.featured && (
                <span className="rounded-full bg-background/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                  Popular
                </span>
              )}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{t.price}</span>
              {t.suffix && <span className={t.featured ? "text-background/60" : "text-muted-foreground"}>{t.suffix}</span>}
            </div>
            <p className={`mt-1 text-sm ${t.featured ? "text-background/70" : "text-muted-foreground"}`}>{t.note}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className={`h-4 w-4 ${t.featured ? "text-background" : "text-success"}`} />
                  <span className={t.featured ? "text-background/90" : "text-foreground"}>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className={`mt-7 w-full ${
                t.featured
                  ? "bg-background text-ink hover:bg-background/90"
                  : "bg-ink text-background hover:bg-ink/90"
              }`}
            >
              {t.cta}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------- FAQ ------------------------- */

const FAQS = [
  {
    q: "Does VisionAdapt break my site's layout?",
    a: "No. The engine performs scoped CSS overrides and runs a layout-integrity check after each injection. Branding tokens are preserved within accessibility bounds.",
  },
  {
    q: "How is this different from a hue-rotate filter?",
    a: "Hue filters distort imagery and lose semantic meaning. Our engine analyzes contrast pairs, semantic states, and DOM context to remap only the components that need it.",
  },
  {
    q: "Which frameworks are supported?",
    a: "Any framework producing HTML. The SDK ships with first-class adapters for React, Vue, Svelte, and Next.js.",
  },
  {
    q: "Are reports admissible for compliance audits?",
    a: "Yes. Reports include WCAG 2.2 criterion mapping, evidence snapshots, and signed timestamps suitable for legal review.",
  },
];

function FAQ() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <SectionLabel>FAQ</SectionLabel>
        <SectionTitle>Common questions.</SectionTitle>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface-elevated">
          {FAQS.map((f) => (
            <details key={f.q} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium text-ink">
                {f.q}
                <span className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- CTA ------------------------- */

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="overflow-hidden rounded-3xl border border-border bg-ink p-12 text-background md:p-16">
        <div className="mx-auto max-w-2xl text-center">
          <Eye className="mx-auto h-8 w-8" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Make every interface visible to every user.
          </h2>
          <p className="mt-3 text-background/70">
            Ship adaptive accessibility in days, not quarters. No replatforming required.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-11 bg-background px-5 text-ink hover:bg-background/90" asChild>
              <Link to="/studio">Launch Live Studio</Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-11 px-5 text-background hover:bg-background/10" onClick={downloadExtension}>
              Download Extension <Download className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Section helpers ------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{children}</div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink md:text-4xl">
      {children}
    </h2>
  );
}
function SectionLead({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-2xl text-base text-muted-foreground">{children}</p>;
}
