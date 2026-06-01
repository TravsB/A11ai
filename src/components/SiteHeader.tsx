import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/studio", label: "Live Studio" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/palette", label: "Palette" },
  { to: "/docs", label: "Developers" },
];

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-background">
            <Eye className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-ink">A11ai</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              A11y Platform
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-sm font-semibold text-ink bg-muted" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-xs sm:flex">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-[160px] truncate text-ink">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/login" search={{ mode: "signin" }}>Sign in</Link>
              </Button>
              <Button size="sm" className="bg-ink text-background hover:bg-ink/90" asChild>
                <Link to="/login" search={{ mode: "signup" }}>Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
