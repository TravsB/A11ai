import { Link, useLocation } from "wouter";
import { Eye, LogOut, User as UserIcon, Settings, Key, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { to: "/studio", label: "Live Studio" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/audit", label: "Site Audit" },
  { to: "/palette", label: "Palette" },
  { to: "/docs", label: "Developers" },
];

const userMenuItems = [
  { to: "/preferences", label: "My Settings", icon: Settings },
  { to: "/api-keys", label: "API Keys", icon: Key },
  { to: "/guide", label: "Get Started", icon: BookOpen },
];

export function SiteHeader() {
  const { user, isLoading, signOut } = useAuth();
  const [location, setLocation] = useLocation();

  function handleSignOut() {
    signOut();
    setLocation("/");
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
              Accessibility Platform
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                location === item.to
                  ? "bg-muted text-ink font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden max-w-[140px] truncate text-ink sm:block">{user.email}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" className="bg-ink text-background hover:bg-ink/90" asChild>
                <Link to="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
