import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Link2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/extension-link")({
  head: () => ({
    meta: [
      { title: "Link Extension — A11ai" },
      { name: "description", content: "Connect the A11ai browser extension to sync your accessibility settings across devices." },
    ],
  }),
  component: ExtensionLinkPage,
});

function ExtensionLinkPage() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: "/extension-link" } as any, replace: true });
    }
  }, [loading, user, navigate]);

  // Tell the extension we're here. The extension's content script reads
  // the data-* attributes and sends them to its background worker.
  useEffect(() => {
    if (!session) return;
    // Notify the extension via a CustomEvent — its content script listens.
    const evt = new CustomEvent("a11ai-extension-link", {
      detail: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user_id: session.user.id,
        email: session.user.email,
      },
    });
    window.dispatchEvent(evt);
    // Also expose on a known element for fallback polling.
    const el = document.getElementById("a11ai-session-bridge");
    if (el) {
      el.dataset.access = session.access_token;
      el.dataset.refresh = session.refresh_token ?? "";
      el.dataset.user = session.user.id;
    }
    // Listen for an ACK from the extension
    const onAck = () => setLinked(true);
    window.addEventListener("a11ai-extension-linked", onAck);
    return () => window.removeEventListener("a11ai-extension-linked", onAck);
  }, [session]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-2xl border border-border bg-surface-elevated p-8 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-ink text-bg">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Link your extension</h1>
            <p className="text-sm text-muted-foreground">Sync per-site profiles between this account and the browser.</p>
          </div>
        </div>

        {/* Hidden bridge element the extension content script reads */}
        <div
          id="a11ai-session-bridge"
          data-ready="1"
          data-user={user.id}
          style={{ display: "none" }}
        />

        <div className="mt-8 space-y-4">
          {linked ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-bg p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-sm font-semibold text-ink">Connected!</div>
                <div className="text-xs text-muted-foreground">
                  Your extension will now sync settings to {user.email}.
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-bg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <div className="text-sm text-ink">Waiting for the extension to detect this page…</div>
              </div>
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                <li>Make sure the A11ai extension is installed in this browser.</li>
                <li>Open the extension popup once so the service worker is awake.</li>
                <li>Reload this page if you don't see a confirmation in ~5 seconds.</li>
              </ol>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild>
              <a href="/visionadapt-extension.zip" download>
                Download extension
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
