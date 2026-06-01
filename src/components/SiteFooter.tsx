export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="text-sm font-semibold text-ink">A11ai</div>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Adaptive color accessibility infrastructure for the modern web.
          </p>
        </div>
        {[
          { title: "Product", items: ["Live Studio", "Dashboard", "Palette Generator", "Browser Extension"] },
          { title: "Developers", items: ["SDK", "API reference", "Integration guide", "Changelog"] },
          { title: "Company", items: ["About", "Customers", "Security", "Contact"] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink">{col.title}</div>
            <ul className="mt-3 space-y-2">
              {col.items.map((i) => (
                <li key={i} className="text-sm text-muted-foreground hover:text-ink">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} A11ai, Inc.</span>
          <span>WCAG 2.2 AA · SOC 2 · GDPR</span>
        </div>
      </div>
    </footer>
  );
}
