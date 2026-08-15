import { Link } from "@tanstack/react-router";
import {
  Bot,
  Brain,
  Cpu,
  LayoutDashboard,
  FileBarChart,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/agents", label: "Agents", icon: Bot },
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
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
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

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {action}
            </div>
            <div className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </header>
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
