import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  Chrome,
  FolderOpen,
  ToggleRight,
  Eye,
  Settings,
  ShieldCheck,
  Monitor,
  Keyboard,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: ShieldCheck,
    step: "01",
    title: "Create a free account",
    description:
      "Sign up with your email and a password. Your account lets you download the extension and saves your vision preferences across sessions.",
    detail: "Free forever — no credit card required.",
    action: { label: "Sign up now", to: "/sign-up" },
  },
  {
    icon: Download,
    step: "02",
    title: "Download the extension",
    description:
      'Once signed in, click "Sign in to download" on the homepage or visit the Developers page. You\'ll receive a ZIP file called visionadapt-extension.zip.',
    detail: "File size: ~48 KB. No third-party dependencies.",
    action: { label: "Go to Developers", to: "/docs" },
  },
  {
    icon: FolderOpen,
    step: "03",
    title: "Unzip the file",
    description:
      'Extract the ZIP to a permanent folder on your computer — somewhere you won\'t accidentally delete it, like Documents/VisionAdapt. The extracted folder contains manifest.json, content.js, popup.html, and icons.',
    detail: "Keep the folder in place. Chrome loads from it directly.",
  },
  {
    icon: Chrome,
    step: "04",
    title: "Open Chrome's extension page",
    description:
      'In Chrome, go to the address bar and type chrome://extensions then press Enter. You can also reach it via the puzzle-piece icon ▸ Manage Extensions.',
    detail: 'Works on Chrome 100+, Edge 100+, and Brave.',
  },
  {
    icon: ToggleRight,
    step: "05",
    title: "Enable Developer Mode",
    description:
      'In the top-right corner of the Extensions page, toggle on "Developer mode". This unlocks the ability to load your own extensions that aren\'t from the Chrome Web Store.',
    detail: "You only need to do this once.",
  },
  {
    icon: FolderOpen,
    step: "06",
    title: 'Click "Load unpacked"',
    description:
      'A button labelled "Load unpacked" appears in the top-left. Click it, then select the folder you extracted in step 03 (the one containing manifest.json). Chrome loads the extension immediately.',
    detail: "The A11ai icon appears in your toolbar.",
  },
  {
    icon: Eye,
    step: "07",
    title: "Pin the extension",
    description:
      "Click the puzzle-piece icon in Chrome's toolbar, find VisionAdapt, and click the pin icon. This keeps the A11ai eye icon always visible for one-click access.",
    detail: "Optional but recommended.",
  },
  {
    icon: Settings,
    step: "08",
    title: "Use it on any website",
    description:
      'Visit any website. Click the A11ai icon in your toolbar to open the popup. Choose your vision mode, then adjust contrast, font size, and line height with the sliders. Changes apply instantly — no page reload needed.',
    detail: "The extension remembers your last-used settings.",
  },
];

const VISION_MODES = [
  {
    label: "Protanopia",
    color: "bg-red-100 text-red-800",
    description: "Reduced sensitivity to red light",
  },
  {
    label: "Deuteranopia",
    color: "bg-green-100 text-green-800",
    description: "Reduced sensitivity to green light — most common form",
  },
  {
    label: "Tritanopia",
    color: "bg-blue-100 text-blue-800",
    description: "Reduced sensitivity to blue light",
  },
  {
    label: "Achromatopsia",
    color: "bg-gray-100 text-gray-800",
    description: "Complete color blindness — sees in greyscale",
  },
  {
    label: "Low Vision",
    color: "bg-yellow-100 text-yellow-800",
    description: "High-contrast mode for low visual acuity",
  },
];

const BROWSERS = [
  { name: "Google Chrome", version: "100+", supported: true },
  { name: "Microsoft Edge", version: "100+", supported: true },
  { name: "Brave Browser", version: "1.40+", supported: true },
  { name: "Arc Browser", version: "All versions", supported: true },
  { name: "Firefox", version: "—", supported: false },
  { name: "Safari", version: "—", supported: false },
];

const FAQ = [
  {
    q: "Does the extension collect any of my browsing data?",
    a: "No. The extension runs entirely in your browser and never transmits page content, URLs, or personal data to any server. Your vision preferences are stored locally using Chrome's built-in storage.",
  },
  {
    q: "Will it slow down my browser?",
    a: "No measurable impact in normal use. The extension uses a single SVG filter injected once per page. The MutationObserver is debounced and only fires on visible DOM changes.",
  },
  {
    q: 'Why does it say "Developer mode" — is it safe?',
    a: "Developer mode just means the extension wasn't installed from the Web Store. The code is the same extension you downloaded directly from A11ai — you can inspect every file yourself. When we publish to the Chrome Web Store, you'll be able to install with one click instead.",
  },
  {
    q: "The extension stopped working after I navigated to a new page on a site.",
    a: "Some single-page apps (like Gmail or Twitter) swap content without a full page reload. The extension uses a MutationObserver to detect this and reapply filters automatically. If it misses a case, toggling the popup off and back on re-applies immediately.",
  },
  {
    q: "Can I use different modes on different websites?",
    a: "Currently the extension applies one global mode across all sites. Per-site profiles are on the roadmap.",
  },
  {
    q: "My extension disappeared after I restarted Chrome.",
    a: "This happens if Developer mode was turned off or the source folder was moved or deleted. Re-enable Developer mode and reload the extension from the original extracted folder.",
  },
];

export default function Guide() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">

      {/* Header */}
      <div className="mb-14 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> Extension Guide
        </span>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink">
          Get started with A11ai
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
          From zero to accessible browsing in under 5 minutes. Follow the steps
          below to install, configure, and use the VisionAdapt extension.
        </p>
      </div>

      {/* Progress bar hint */}
      <div className="mb-12 flex items-center gap-2 overflow-x-auto pb-2">
        {["Account", "Download", "Install", "Use"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface border border-border px-3 py-1 text-xs font-medium text-ink">
              <span className="text-muted-foreground">{i + 1}.</span> {label}
            </div>
            {i < 3 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step-by-step */}
      <section className="mb-16 space-y-6">
        {STEPS.map(({ icon: Icon, step, title, description, detail, action }) => (
          <div
            key={step}
            className="flex gap-5 rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-background">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  STEP {step}
                </span>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">{title}</h3>
              <p className="mb-2 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
              <p className="text-xs text-muted-foreground/70">{detail}</p>
              {action && !user && (
                <Button size="sm" className="mt-3 bg-ink text-background hover:bg-ink/90" asChild>
                  <Link to={action.to}>
                    {action.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Vision modes reference */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-ink">
          Vision modes explained
        </h2>
        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
          The extension offers five modes. Each applies a different SVG
          color-matrix filter tuned to the specific type of color vision
          deficiency. You can switch between them at any time from the popup.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {VISION_MODES.map(({ label, color, description }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <span className={`mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
                {label}
              </span>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Adjustable controls */}
      <section className="mb-16 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-ink">
          <Settings className="h-5 w-5" /> Popup controls
        </h2>
        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
          Beyond vision modes, the popup gives you fine-grained controls to personalise your experience on every site.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Monitor,
              name: "Contrast",
              desc: "Boosts contrast between foreground and background colors. Useful on low-contrast sites or in bright ambient light.",
            },
            {
              icon: Eye,
              name: "Font size",
              desc: "Scales all text on the page. Runs from 90 % to 150 % of the site's default size.",
            },
            {
              icon: Keyboard,
              name: "Line height",
              desc: "Increases vertical spacing between lines of text. Helps with readability for low-vision users.",
            },
            {
              icon: ToggleRight,
              name: "Readable font",
              desc: "Replaces the site's typeface with a system sans-serif. Reduces visual noise on pages with decorative fonts.",
            },
            {
              icon: Eye,
              name: "Highlight links",
              desc: "Underlines and tints all anchor elements so links are visible even when color alone distinguished them.",
            },
          ].map(({ icon: Icon, name, desc }) => (
            <div key={name} className="flex gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-semibold text-ink">{name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browser compatibility */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-ink">
          Browser compatibility
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-ink">Browser</th>
                <th className="px-4 py-3 text-left font-semibold text-ink">Min. version</th>
                <th className="px-4 py-3 text-left font-semibold text-ink">Status</th>
              </tr>
            </thead>
            <tbody>
              {BROWSERS.map(({ name, version, supported }, i) => (
                <tr
                  key={name}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-surface/50"}`}
                >
                  <td className="px-4 py-3 font-medium text-ink">{name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{version}</td>
                  <td className="px-4 py-3">
                    {supported ? (
                      <span className="inline-flex items-center gap-1.5 text-success font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Supported
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" /> Not supported
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Firefox and Safari use different extension APIs (WebExtensions MV2 / Safari Web Extensions). Support is on the roadmap.
        </p>
      </section>

      {/* Privacy */}
      <section className="mb-16 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold tracking-tight text-ink">
          <ShieldCheck className="h-5 w-5 text-success" /> Privacy &amp; data
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "The extension never reads or transmits the content of pages you visit.",
            "No keystrokes, form values, or browsing history are collected.",
            "Your vision preferences are stored in Chrome's local extension storage — on your device only.",
            "The A11ai account system (email + hashed password) is used solely for extension download gating. We do not sell or share your data.",
            "All API communication uses HTTPS and session tokens are stored in httpOnly cookies, never accessible to JavaScript.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
          <HelpCircle className="h-6 w-6" /> Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-2 font-semibold text-ink text-sm">{q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border border-border bg-ink p-8 text-center text-background">
        <Eye className="mx-auto mb-4 h-8 w-8 opacity-80" />
        <h2 className="mb-2 text-2xl font-bold">Ready to get started?</h2>
        <p className="mb-6 text-sm text-background/70">
          Create your free account, download the extension, and make the web accessible in minutes.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button
              size="lg"
              className="bg-background text-ink hover:bg-background/90"
              asChild
            >
              <Link to="/docs">
                <Download className="mr-2 h-4 w-4" /> Download Extension
              </Link>
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="bg-background text-ink hover:bg-background/90"
                asChild
              >
                <Link to="/sign-up">Create free account</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-background hover:bg-background/10"
                asChild
              >
                <Link to="/sign-in">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
