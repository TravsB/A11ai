import { useState, useEffect, useRef } from "react";
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Terminal, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface NewKeyResult {
  key: ApiKeyRecord;
  fullKey: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="ml-2 rounded p-1 text-muted-foreground hover:text-ink transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    try {
      const res = await fetch("/api/keys", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { keys: ApiKeyRecord[] };
        setKeys(data.keys);
      }
    } finally {
      setLoading(false);
    }
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = (await res.json()) as { key: ApiKeyRecord; fullKey: string } | { error: string };
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Failed to create key.");
        return;
      }
      setNewKey(data as NewKeyResult);
      setKeys((prev) => [data.key, ...prev]);
      setName("");
      setShowFull(false);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    const res = await fetch(`/api/keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (newKey?.key.id === id) setNewKey(null);
    }
  }

  const maskedKey = newKey
    ? newKey.fullKey.slice(0, 17) + "••••••••••••••••••••••••••••••••••••••••"
    : "";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-background">
            <Key className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-ink">API Keys</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Use API keys to run accessibility scans from CI/CD pipelines or scripts without signing in.
        </p>
      </div>

      {/* Create new key */}
      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Create a new key</h2>
        <form onSubmit={createKey} className="flex gap-3">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GitHub Actions, Staging CI…"
            className="flex-1"
            disabled={creating}
          />
          <Button type="submit" disabled={creating || !name.trim()} className="bg-ink text-background hover:bg-ink/90">
            <Plus className="mr-1.5 h-4 w-4" />
            {creating ? "Creating…" : "Create"}
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </section>

      {/* Newly created key reveal */}
      {newKey && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Copy your key now — it won't be shown again
              </p>
              <p className="text-xs text-amber-700 mb-3">
                We only store a hash of this key. If you lose it, revoke it and create a new one.
              </p>
              <div className="flex items-center rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-ink overflow-x-auto">
                <span className="flex-1 select-all whitespace-nowrap">
                  {showFull ? newKey.fullKey : maskedKey}
                </span>
                <button
                  onClick={() => setShowFull((v) => !v)}
                  className="ml-2 shrink-0 text-muted-foreground hover:text-ink transition-colors"
                  title={showFull ? "Hide" : "Reveal"}
                >
                  {showFull ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <CopyButton text={newKey.fullKey} />
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setNewKey(null)}
              className="text-xs text-amber-700 underline hover:text-amber-900"
            >
              I've saved it, dismiss
            </button>
          </div>
        </div>
      )}

      {/* Existing keys list */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-ink">Your keys</h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface py-10 text-center">
            <Key className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{k.name}</span>
                    {newKey?.key.id === k.id && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                        New
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{k.keyPrefix}</span>
                    <span>Created {formatDate(k.createdAt)}</span>
                    {k.lastUsedAt ? (
                      <span>Last used {formatDate(k.lastUsedAt)}</span>
                    ) : (
                      <span>Never used</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeKey(k.id)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Usage docs */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-ink">Using your key</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Pass your key as the <code className="rounded bg-muted px-1 py-0.5 font-mono">X-API-Key</code> header.
          The scan endpoint accepts both cookie sessions and API keys.
        </p>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink">Run a scan</p>
            <div className="flex items-start rounded-lg bg-ink px-4 py-3">
              <pre className="flex-1 overflow-x-auto text-[11px] leading-relaxed text-green-400 whitespace-pre-wrap break-all">
{`curl -X POST https://YOUR_DOMAIN/api/scans \\
  -H "X-API-Key: a11ai_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com"}'`}
              </pre>
              <CopyButton
                text={`curl -X POST https://YOUR_DOMAIN/api/scans \\\n  -H "X-API-Key: a11ai_sk_YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://example.com"}'`}
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink">List recent scans</p>
            <div className="flex items-start rounded-lg bg-ink px-4 py-3">
              <pre className="flex-1 overflow-x-auto text-[11px] leading-relaxed text-green-400">
{`curl https://YOUR_DOMAIN/api/scans \\
  -H "X-API-Key: a11ai_sk_YOUR_KEY"`}
              </pre>
              <CopyButton
                text={`curl https://YOUR_DOMAIN/api/scans \\\n  -H "X-API-Key: a11ai_sk_YOUR_KEY"`}
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink">Response</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 text-[11px] leading-relaxed text-ink">
{`{
  "scan": {
    "id": "...",
    "url": "https://example.com",
    "score": 87,
    "issueCount": 4,
    "createdAt": "2026-07-19T..."
  }
}`}
            </pre>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-ink">{user?.email}</span>. 
          All scans made with your API keys are stored in your account.
        </p>
      </section>
    </div>
  );
}
