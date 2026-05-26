import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/studio", label: "Live Studio" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/palette", label: "Palette" },
  { to: "/docs", label: "Developers" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-background">
            <Eye className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-ink">VisionAdapt</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Color Engine
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
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button size="sm" className="bg-ink text-background hover:bg-ink/90">
            Request demo
          </Button>
        </div>
      </div>
    </header>
  );
}
