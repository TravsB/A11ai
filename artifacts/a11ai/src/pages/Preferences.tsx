import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  Monitor,
  Type,
  AlignLeft,
  Link as LinkIcon,
  FileText,
  Cloud,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const VISION_OPTIONS = [
  { value: "none", label: "Normal vision", description: "No filter applied" },
  { value: "protanopia", label: "Protanopia", description: "Red-blind correction" },
  { value: "deuteranopia", label: "Deuteranopia", description: "Green-blind correction (most common)" },
  { value: "tritanopia", label: "Tritanopia", description: "Blue-blind correction" },
  { value: "achromatopsia", label: "Achromatopsia", description: "Full greyscale mode" },
  { value: "lowvision", label: "Low Vision", description: "High-contrast boost" },
];

function Slider({
  label,
  value,
  min,
  max,
  unit,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  icon: React.ElementType;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          {label}
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ink"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  icon: Icon,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  icon: React.ElementType;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-muted/30"
      onClick={() => onChange(!checked)}
    >
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${checked ? "bg-ink text-background" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className={`h-5 w-9 rounded-full transition-colors ${checked ? "bg-ink" : "bg-muted"} relative`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </div>
    </div>
  );
}

export default function Preferences() {
  const { user } = useAuth();
  const { prefs, isLoading, isSaving, updatePrefs } = usePreferences();

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-6">
        <Eye className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-ink">Sign in to sync preferences</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your vision settings are saved to your account so they follow you across any device or browser.
        </p>
        <Button className="bg-ink text-background hover:bg-ink/90" asChild>
          <Link to="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Synced to your account
          </span>
          {isSaving ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Vision preferences</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          These settings are stored in your A11ai account and automatically applied in the Live Studio.
          Once the extension supports account sync, they'll load on every site you visit too.
        </p>
      </div>

      {/* Sync badge */}
      <div className="mb-8 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <Cloud className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-ink">{user.email}</span> —
          preferences sync instantly across all your devices.
        </p>
      </div>

      {/* Vision mode */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-ink">Vision mode</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {VISION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updatePrefs({ visionMode: opt.value })}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                prefs.visionMode === opt.value
                  ? "border-ink bg-ink/5"
                  : "border-border bg-surface hover:bg-muted/40"
              }`}
            >
              <div
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  prefs.visionMode === opt.value ? "bg-ink" : "bg-muted-foreground/30"
                }`}
              />
              <div>
                <p className={`text-sm font-medium ${prefs.visionMode === opt.value ? "text-ink" : "text-ink/80"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {prefs.visionMode === opt.value && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-ink" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Sliders */}
      <section className="mb-8 space-y-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold text-ink">Display adjustments</h2>
        <Slider
          label="Contrast"
          value={prefs.contrast}
          min={80}
          max={200}
          unit="%"
          icon={Monitor}
          onChange={(v) => updatePrefs({ contrast: v })}
        />
        <Slider
          label="Font size"
          value={prefs.fontSize}
          min={80}
          max={150}
          unit="%"
          icon={Type}
          onChange={(v) => updatePrefs({ fontSize: v })}
        />
        <Slider
          label="Line height"
          value={prefs.lineHeight}
          min={100}
          max={200}
          unit="%"
          icon={AlignLeft}
          onChange={(v) => updatePrefs({ lineHeight: v })}
        />
      </section>

      {/* Toggles */}
      <section className="mb-8 space-y-3">
        <h2 className="mb-4 text-base font-semibold text-ink">Enhancements</h2>
        <Toggle
          label="Readable font"
          description="Replace decorative typefaces with a clean system sans-serif."
          checked={prefs.readableFont}
          icon={FileText}
          onChange={(v) => updatePrefs({ readableFont: v })}
        />
        <Toggle
          label="Highlight links"
          description="Underline and tint all links so they're visible without relying on color alone."
          checked={prefs.highlightLinks}
          icon={LinkIcon}
          onChange={(v) => updatePrefs({ highlightLinks: v })}
        />
      </section>

      {/* Reset */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            updatePrefs({
              visionMode: "none",
              contrast: 100,
              fontSize: 100,
              lineHeight: 100,
              readableFont: false,
              highlightLinks: false,
            })
          }
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
