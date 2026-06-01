import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Copy, Terminal } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Developer SDK — A11ai" },
      { name: "description", content: "Drop-in SDK and Chrome extension for adaptive color accessibility." },
    ],
  }),
  component: DocsPage,
});

const NAV = [
  { id: "install", label: "Installation" },
  { id: "init", label: "Initialize" },
  { id: "profiles", label: "Vision profiles" },
  { id: "events", label: "API hooks" },
  { id: "extension", label: "Browser extension" },
];

function DocsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Developers</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">SDK & integration guide</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Add adaptive accessibility to any website with one script tag or a single npm package.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </div>
          <nav className="mt-3 space-y-1">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-10">
          <section id="install">
            <h2 className="text-xl font-semibold text-ink">Installation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Install via npm or load the universal script.
            </p>
            <CodeBlock code={`npm install @a11ai/engine`} lang="bash" />
            <CodeBlock
              code={`<script src="https://cdn.a11ai.io/v3/engine.js" data-key="va_pk_live_..."></script>`}
              lang="html"
            />
          </section>

          <section id="init">
            <h2 className="text-xl font-semibold text-ink">Initialize</h2>
            <CodeBlock
              code={`import { A11ai } from "@a11ai/engine";

const engine = A11ai.init({
  apiKey: process.env.VA_PUBLIC_KEY!,
  autoProfile: true,        // detect from system + user preference
  preserveBrand: true,      // keep brand identity within WCAG bounds
  observeMutations: true,   // react to SPA updates
});

engine.start();`}
              lang="ts"
            />
          </section>

          <section id="profiles">
            <h2 className="text-xl font-semibold text-ink">Vision profiles</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Switch profiles imperatively or let the engine resolve from user settings.
            </p>
            <CodeBlock
              code={`engine.setProfile("deuteranopia");
engine.setContrast(1.2);
engine.setTypography({ scale: 1.1, dyslexicFont: false });`}
              lang="ts"
            />
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-3 py-2 text-left">Profile</th><th className="px-3 py-2 text-left">Targets</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["protanopia", "Red-blind. Remaps red hues, increases luminance separation."],
                    ["deuteranopia", "Green-blind. Disambiguates semantic states."],
                    ["tritanopia", "Blue-yellow. Rebalances cool/warm tones."],
                    ["achromatopsia", "Monochrome. Adds patterns and borders."],
                    ["low-contrast", "Sharpens typography, lifts contrast."],
                  ].map(([id, t]) => (
                    <tr key={id}>
                      <td className="px-3 py-2.5 font-mono text-ink">{id}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="events">
            <h2 className="text-xl font-semibold text-ink">API hooks</h2>
            <CodeBlock
              code={`engine.on("transform", (e) => {
  analytics.track("a11y_transform", {
    elements: e.elementsTransformed,
    profile: e.profile,
    score: e.wcagScore,
  });
});

engine.on("issue", (e) => console.warn(e.severity, e.message));`}
              lang="ts"
            />
          </section>

          <section id="extension">
            <h2 className="text-xl font-semibold text-ink">Browser extension</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The Chrome (Manifest V3) extension applies the same engine to any website your
              users visit. Profiles sync via the A11ai account.
            </p>
            <div className="mt-4 flex gap-3">
              <Button className="bg-ink text-background hover:bg-ink/90">Get for Chrome</Button>
              <Button variant="outline">Get for Firefox</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-ink text-background">
      <div className="flex items-center justify-between border-b border-background/10 px-3 py-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5 font-mono text-background/60">
          <Terminal className="h-3.5 w-3.5" /> {lang}
        </span>
        <button className="inline-flex items-center gap-1 text-background/60 hover:text-background">
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">{code}</pre>
    </div>
  );
}
