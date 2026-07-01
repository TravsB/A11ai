import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  FolderOpen,
  Puzzle,
  ToggleRight,
  Upload,
  Sparkles,
  Settings2,
  RefreshCw,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "How to install & use the A11ai extension — Step-by-step guide" },
      {
        name: "description",
        content:
          "A clear, illustrated walkthrough for downloading, unzipping, and loading the A11ai browser extension in Chrome, Edge, Brave, or any Chromium browser — plus how to use every feature.",
      },
      { property: "og:title", content: "A11ai extension — Installation & Usage guide" },
      {
        property: "og:description",
        content:
          "Never installed an unpacked extension before? Follow these steps to get A11ai running on every website in under 2 minutes.",
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const { user } = useAuth();

  function downloadExtension() {
    fetch("/visionadapt-extension.zip")
      .then((r) => {
        if (!r.ok) throw new Error(`Download failed (${r.status})`);
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "a11ai-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((e) => alert(e.message));
  }

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b border-border/70 bg-surface/40">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> Installation & Usage Guide
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            How to install the A11ai extension
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            The A11ai browser extension is distributed as an{" "}
            <span className="font-medium text-ink">unpacked extension</span> — a folder you
            load directly into your browser. It takes about 2 minutes and works in Chrome,
            Edge, Brave, Arc, and Opera.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <Button size="lg" onClick={downloadExtension} className="bg-ink text-background hover:bg-ink/90">
                <Download className="mr-2 h-4 w-4" /> Download extension (.zip)
              </Button>
            ) : (
              <Button size="lg" asChild className="bg-ink text-background hover:bg-ink/90">
                <Link to="/login" search={{ mode: "signin" }}>
                  <Download className="mr-2 h-4 w-4" /> Sign in to download
                </Link>
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              ~26 KB · Chromium browsers · Manifest V3
            </span>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Installation in 5 steps</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Follow these in order. Each step includes the exact wording you'll see in your browser.
        </p>

        <ol className="mt-10 space-y-6">
          <Step
            n={1}
            icon={<Download className="h-5 w-5" />}
            title="Download the extension"
            body={
              <>
                Click <span className="font-medium text-ink">Download extension (.zip)</span> above.
                Your browser saves a file called{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-ink">
                  a11ai-extension.zip
                </code>{" "}
                — usually to your <span className="font-medium text-ink">Downloads</span> folder.
              </>
            }
          />

          <Step
            n={2}
            icon={<FolderOpen className="h-5 w-5" />}
            title="Unzip the file"
            body={
              <>
                <div>Extract the zip so you get a plain folder — not a compressed archive.</div>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    <span className="font-medium text-ink">Windows:</span> right-click the zip →{" "}
                    <em>Extract All…</em> → <em>Extract</em>.
                  </li>
                  <li>
                    <span className="font-medium text-ink">macOS:</span> double-click the zip. A
                    folder called <code className="rounded bg-muted px-1 text-[12px]">a11ai-extension</code>{" "}
                    appears next to it.
                  </li>
                  <li>
                    <span className="font-medium text-ink">Linux:</span>{" "}
                    <code className="rounded bg-muted px-1 text-[12px]">unzip a11ai-extension.zip</code>
                    .
                  </li>
                </ul>
                <div className="mt-3 rounded-md border border-border bg-surface/60 px-4 py-3 text-xs text-muted-foreground">
                  Remember where the folder is — you'll point your browser at it in step 5.
                </div>
              </>
            }
          />

          <Step
            n={3}
            icon={<Puzzle className="h-5 w-5" />}
            title="Open the extensions page"
            body={
              <>
                <div>
                  In your browser's address bar, paste one of these and press Enter:
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <BrowserRow browser="Chrome" url="chrome://extensions" />
                  <BrowserRow browser="Edge" url="edge://extensions" />
                  <BrowserRow browser="Brave" url="brave://extensions" />
                  <BrowserRow browser="Arc / Opera" url="chrome://extensions" />
                </div>
              </>
            }
          />

          <Step
            n={4}
            icon={<ToggleRight className="h-5 w-5" />}
            title="Enable Developer mode"
            body={
              <>
                In the top-right corner of the extensions page, flip the{" "}
                <span className="font-medium text-ink">Developer mode</span> toggle to{" "}
                <span className="font-medium text-ink">on</span>. Three new buttons appear —
                <em> Load unpacked</em>, <em>Pack extension</em>, and <em>Update</em>.
                <div className="mt-3 rounded-md border border-border bg-surface/60 px-4 py-3 text-xs text-muted-foreground">
                  This mode is safe. It lets you install extensions that aren't on the Chrome
                  Web Store — the same mechanism developers use every day.
                </div>
              </>
            }
          />

          <Step
            n={5}
            icon={<Upload className="h-5 w-5" />}
            title="Load unpacked → pick the folder"
            body={
              <>
                Click <span className="font-medium text-ink">Load unpacked</span>. A file
                picker opens. Select the <span className="font-medium text-ink">unzipped folder</span>{" "}
                from step 2 (not the .zip itself, and not a file inside it — the folder that{" "}
                <em>contains</em> <code className="rounded bg-muted px-1 text-[12px]">manifest.json</code>
                ).
                <div className="mt-3">
                  A11ai now appears in your extension list. Pin it to your toolbar so you can
                  reach the popup quickly — click the puzzle-piece icon in the toolbar and hit
                  the pin next to A11ai.
                </div>
              </>
            }
          />
        </ol>
      </section>

      {/* Usage */}
      <section className="border-t border-border/70 bg-surface/40">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Using the extension</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open any website, then click the A11ai icon in your toolbar to open the popup.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Feature
              icon={<Sparkles className="h-4 w-4" />}
              title="Polymorph AI (recommended)"
              body="Leave this on. A11ai analyses each page's contrast and typography and picks the best profile automatically — including SPAs like YouTube, Gmail, and X."
            />
            <Feature
              icon={<Settings2 className="h-4 w-4" />}
              title="Manual vision profile"
              body="Pick Protanopia, Deuteranopia, Tritanopia, or High-Contrast to force a specific colour matrix on every site."
            />
            <Feature
              icon={<ToggleRight className="h-4 w-4" />}
              title="Font size & contrast sliders"
              body="Bump text size and contrast globally. Your settings save per-site, so news.example.com can be different from docs.example.com."
            />
            <Feature
              icon={<RefreshCw className="h-4 w-4" />}
              title="Sync with your account"
              body="Signed in? Your profiles sync between devices via A11ai on the web. Open the popup on a new machine and everything is already there."
            />
            <Feature
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Master toggle"
              body="The switch at the top of the popup disables A11ai on the current page instantly — useful for banking, video calls, or anything sensitive."
            />
            <Feature
              icon={<Puzzle className="h-4 w-4" />}
              title="Works everywhere"
              body="A11ai runs on every http(s) page and inside embedded iframes. Browser system pages (chrome://, edge://) are blocked by the browser itself — that's not us."
            />
          </div>
        </div>
      </section>

      {/* Updating */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Updating to a new version</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Download the latest zip using the button at the top.</li>
          <li>Unzip it and <span className="font-medium text-ink">replace</span> the old folder (or keep both and repoint the browser).</li>
          <li>
            Open <code className="rounded bg-muted px-1 text-[12px]">chrome://extensions</code> and click the{" "}
            <span className="font-medium text-ink">reload</span> (circular arrow) icon on the A11ai card.
          </li>
        </ol>
      </section>

      {/* Troubleshooting */}
      <section className="border-t border-border/70">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Troubleshooting</h2>
          <div className="mt-6 space-y-4">
            <Trouble
              q={`"Manifest file is missing or unreadable"`}
              a="You selected the .zip or a subfolder. Unzip first, then pick the folder that directly contains manifest.json."
            />
            <Trouble
              q={`Load unpacked isn't visible`}
              a="Developer mode is off. Turn on the toggle in the top-right of the extensions page."
            />
            <Trouble
              q={`The extension doesn't change chrome:// or the Chrome Web Store`}
              a="Browsers forbid every extension from running on their internal pages. This is a security rule, not an A11ai limitation. Try it on any normal website."
            />
            <Trouble
              q={`Nothing happens on a page after installing`}
              a="Reload the tab once — content scripts don't inject retroactively into tabs that were open before installation."
            />
            <Trouble
              q={`My settings don't sync between devices`}
              a="Make sure you're signed in on both the extension popup and the A11ai website with the same account."
            />
          </div>

          <div className="mt-10 rounded-lg border border-border bg-surface/50 p-6">
            <h3 className="text-base font-semibold text-ink">Still stuck?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Head to the developer docs for an under-the-hood look, or reach us from your profile page.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/docs">Developer docs</Link>
              </Button>
              <Button asChild size="sm" className="bg-ink text-background hover:bg-ink/90">
                <Link to="/studio">Try the Live Studio instead</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-5 rounded-lg border border-border bg-background p-6">
      <div className="flex flex-col items-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-ink text-background">
          <span className="text-sm font-semibold">{n}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-ink">
          {icon}
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</div>
      </div>
    </li>
  );
}

function BrowserRow({ browser, url }: { browser: string; url: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface/50 px-3 py-2">
      <span className="text-sm font-medium text-ink">{browser}</span>
      <code className="rounded bg-muted px-2 py-0.5 text-[12px] text-ink">{url}</code>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-ink">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-muted">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Trouble({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="text-sm font-semibold text-ink">{q}</div>
      <div className="mt-1 text-sm text-muted-foreground">{a}</div>
    </div>
  );
}
