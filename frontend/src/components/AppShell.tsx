import { Link } from "@tanstack/react-router";
import {
  Bot,
  Brain,
  Cpu,
  LayoutDashboard,
  FileBarChart,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/skills", label: "Skills", icon: Wrench },
  { to: "/knowledge", label: "Knowledge", icon: Brain },
  { to: "/models", label: "Models", icon: Cpu },
  { to: "/runs", label: "Results", icon: FileBarChart },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen w-full">
        {/* ── Desktop sidebar ── */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2 px-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Marketing OS</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Workspace</p>
            <p className="mt-1">Northstar · 5 agents · 4 bases</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
            {/* Title row */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">{title}</h1>
                {subtitle && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground sm:mt-1 sm:line-clamp-1">
                    {subtitle}
                  </p>
                )}
              </div>
              {action && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
              )}
            </div>

            {/* Mobile nav strip (icons + labels) */}
            <div className="flex gap-0.5 overflow-x-auto px-3 pb-2 md:hidden">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="flex shrink-0 flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{
                    className:
                      "flex shrink-0 flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] bg-secondary text-foreground font-medium transition-colors",
                  }}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </header>

          <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
