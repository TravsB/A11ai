import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignIn() {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      if (tab === "signup") {
        const result = await signUp(name || email.split("@")[0], email, password);
        if (!result.success) {
          setError(result.error ?? "Sign up failed.");
          return;
        }
        setLocation("/dashboard");
      } else {
        const result = await signIn(email, password);
        if (!result.success) {
          setError(result.error ?? "Invalid email or password.");
          return;
        }
        setLocation("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-background">
            <Eye className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink">A11ai</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
          {tab === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {tab === "signin"
            ? "Sign in to download the extension and access the platform."
            : "Sign up to unlock the A11ai extension and Studio."}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); setNotice(null); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-background text-ink shadow-sm" : "text-muted-foreground hover:text-ink"
              }`}
            >
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "signup" && (
            <div>
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1.5"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="rounded-md border border-success/30 bg-success/5 p-3 text-xs text-success">
              {notice}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="h-10 w-full bg-ink text-background hover:bg-ink/90">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tab === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {tab === "signin" ? (
            <>Don&apos;t have an account?{" "}
              <button type="button" onClick={() => setTab("signup")} className="font-medium text-ink hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => setTab("signin")} className="font-medium text-ink hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
