import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, User as UserIcon, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — A11ai" },
      { name: "description", content: "Manage your A11ai account, accessibility preferences, and profile information." },
    ],
  }),
  component: ProfilePage,
});

const VISION_PROFILES = [
  { value: "normal", label: "Normal vision" },
  { value: "protanopia", label: "Protanopia (red-blind)" },
  { value: "deuteranopia", label: "Deuteranopia (green-blind)" },
  { value: "tritanopia", label: "Tritanopia (blue-blind)" },
  { value: "low-vision", label: "Low vision" },
];

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required").max(80),
  bio: z.string().trim().max(280).optional(),
  avatar_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  vision_profile: z.string(),
  contrast_level: z.number().min(0.5).max(2),
  font_scale: z.number().min(0.8).max(1.6),
  reduce_motion: z.boolean(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const DEFAULTS: ProfileForm = {
  display_name: "",
  bio: "",
  avatar_url: "",
  vision_profile: "normal",
  contrast_level: 1,
  font_scale: 1,
  reduce_motion: false,
};

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfileForm>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { mode: "signin", redirect: "/profile" }, replace: true });
    }
  }, [authLoading, user, navigate]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_url, vision_profile, contrast_level, font_scale, reduce_motion")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else if (data) {
        setForm({
          display_name: data.display_name ?? "",
          bio: data.bio ?? "",
          avatar_url: data.avatar_url ?? "",
          vision_profile: data.vision_profile ?? "normal",
          contrast_level: Number(data.contrast_level ?? 1),
          font_scale: Number(data.font_scale ?? 1),
          reduce_motion: !!data.reduce_motion,
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setError(null);
    setNotice(null);
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          display_name: parsed.data.display_name,
          bio: parsed.data.bio || null,
          avatar_url: parsed.data.avatar_url || null,
          vision_profile: parsed.data.vision_profile,
          contrast_level: parsed.data.contrast_level,
          font_scale: parsed.data.font_scale,
          reduce_motion: parsed.data.reduce_motion,
        },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setNotice("Settings saved.");
      setTimeout(() => setNotice(null), 3000);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    // Delete profile row; auth user removal requires admin — sign out after.
    await supabase.from("profiles").delete().eq("user_id", user.id);
    await signOut();
    navigate({ to: "/", replace: true });
  }

  if (authLoading || (user && loading)) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-3xl items-center justify-center px-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-6 w-6" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile & Settings</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profile</h2>
          <div className="mt-4 space-y-4">
            <Field label="Display name" htmlFor="display_name">
              <Input
                id="display_name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Your name"
                maxLength={80}
              />
            </Field>
            <Field label="Avatar URL" htmlFor="avatar_url">
              <Input
                id="avatar_url"
                type="url"
                value={form.avatar_url ?? ""}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Bio" htmlFor="bio">
              <Textarea
                id="bio"
                value={form.bio ?? ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="A short bio"
                maxLength={280}
                rows={3}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Accessibility preferences</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Defaults applied across Studio and the extension when you're signed in.
          </p>
          <div className="mt-4 space-y-5">
            <Field label="Vision profile" htmlFor="vision_profile">
              <Select
                value={form.vision_profile}
                onValueChange={(v) => setForm({ ...form, vision_profile: v })}
              >
                <SelectTrigger id="vision_profile"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISION_PROFILES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={`Contrast level — ${form.contrast_level.toFixed(2)}×`}>
              <Slider
                min={0.5} max={2} step={0.05}
                value={[form.contrast_level]}
                onValueChange={([v]) => setForm({ ...form, contrast_level: v })}
              />
            </Field>

            <Field label={`Font scale — ${Math.round(form.font_scale * 100)}%`}>
              <Slider
                min={0.8} max={1.6} step={0.05}
                value={[form.font_scale]}
                onValueChange={([v]) => setForm({ ...form, font_scale: v })}
              />
            </Field>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm font-medium text-ink">Reduce motion</Label>
                <p className="text-xs text-muted-foreground">Minimize animations and transitions.</p>
              </div>
              <Switch
                checked={form.reduce_motion}
                onCheckedChange={(v) => setForm({ ...form, reduce_motion: v })}
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-3 text-xs text-success">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete profile data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your profile data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears your profile and preferences and signs you out. Your account can be removed by contacting support.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={saving} className="bg-ink text-background hover:bg-ink/90">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
