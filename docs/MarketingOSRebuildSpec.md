# Marketing OS — Complete Rebuild Specification

A pixel- and behaviour-accurate specification of the **"Marketing OS" (Agent Hub)** web app, captured directly from its source so it can be rebuilt anywhere. Everything below reflects the app exactly as it is: the tech stack, the design tokens, the data, the layout of every page, and the interactions.

> **What it is:** A dark, single-workspace dashboard for a small marketing team to build AI "agents", wire them to knowledge bases and model providers, and review every run (report) with inline comments. It is a front-end-only prototype — all data is seeded from a single TypeScript file and all mutations live in React state (nothing is persisted to a backend).

---

## 1. Tech stack

| Concern | Choice |
|---|---|
| Framework | **TanStack Start** (full-stack React, SSR) — `@tanstack/react-start` |
| Routing | **TanStack Router** (file-based) — `@tanstack/react-router` + `@tanstack/router-plugin` |
| Server runtime | **Nitro** (via TanStack Start); custom SSR server entry at `src/server.ts` |
| Build tool | **Vite** with `@lovable.dev/vite-tanstack-config` |
| UI library | **React 19** |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` config, no `tailwind.config.js`) + `tw-animate-css` |
| Components | **shadcn/ui** ("new-york" style, base color slate, Radix UI primitives) |
| Data fetching | **@tanstack/react-query** (provider wired at root; data itself is static) |
| Icons | **lucide-react** |
| Toasts | **sonner** |
| Utilities | `clsx`, `tailwind-merge`, `class-variance-authority` |
| Fonts | **Space Grotesk** (Google Fonts) |
| Package manager | **Bun** (`bun.lock`, `bunfig.toml`) |
| Language | **TypeScript** (strict) |

### 1.1 Exact dependencies (`package.json`)

```json
{
  "name": "tanstack_start_ts",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.2.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tailwindcss/vite": "^4.2.1",
    "@tanstack/react-query": "^5.101.1",
    "@tanstack/react-router": "1.170.18",
    "@tanstack/react-start": "1.168.32",
    "@tanstack/router-plugin": "1.168.23",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.575.0",
    "react": "^19.2.0",
    "react-day-picker": "^9.14.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.71.2",
    "react-resizable-panels": "^4.6.5",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.1",
    "tw-animate-css": "^1.3.4",
    "vaul": "^1.1.2",
    "vite-tsconfig-paths": "^6.0.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@lovable.dev/vite-tanstack-config": "^2.13.1",
    "@types/node": "^22.16.5",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.2.0",
    "eslint": "^9.32.0",
    "eslint-config-prettier": "^10.1.1",
    "eslint-plugin-prettier": "^5.2.6",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "nitro": "3.0.260603-beta",
    "prettier": "^3.7.3",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.56.1",
    "vite": "^8.2.0"
  }
}
```

> The full Radix set is present because the shadcn/ui component library (`src/components/ui/*`) is installed wholesale. Only a subset is actually used by the pages (Badge, Button, Input, Textarea, Label, Dialog, Select, Tabs, Progress, Slider, Switch, Sonner/Toaster). If rebuilding lean, install only those.

---

## 2. Project structure

```
.lovable/
  project.json
public/
  favicon.ico
  robots.txt
src/
  components/
    ui/                 # standard shadcn/ui primitives (accordion, alert-dialog, alert,
                        #   aspect-ratio, avatar, badge, breadcrumb, button, calendar, card,
                        #   carousel, chart, checkbox, collapsible, command, dialog, ... sonner,
                        #   select, slider, switch, tabs, textarea, tooltip, etc.)
    AppShell.tsx        # app frame: sidebar + header + mobile nav (wraps every page)
  data/
    marketing-os.ts     # ALL seed data + TypeScript types (single source of truth)
  hooks/
    use-mobile.tsx      # standard shadcn useIsMobile hook
  lib/
    error-capture.ts        # Lovable dev helpers (safe to omit when rebuilding)
    error-page.ts
    lovable-error-reporting.ts
    utils.ts            # cn() = twMerge(clsx(...))
  routes/
    __root.tsx          # root document, providers, <head>, fonts, error/404 boundaries
    index.tsx           # "/"           → Overview
    agents.tsx          # "/agents"     → Agents (interactive master-detail)
    knowledge.tsx       # "/knowledge"  → Knowledge (tabbed)
    models.tsx          # "/models"     → Models
    runs.tsx            # "/runs"       → layout route (renders <Outlet/>)
    runs.index.tsx      # "/runs/"      → Results list
    runs.$runId.tsx     # "/runs/$runId"→ Run detail (interactive)
  router.tsx            # createRouter(...) with the generated route tree
  routeTree.gen.ts      # generated by @tanstack/router-plugin
  server.ts             # SSR server entry (wraps errors)
  start.ts              # TanStack Start entry
  styles.css            # Tailwind v4 + full design system
components.json         # shadcn config
vite.config.ts
tsconfig.json
package.json
```

### 2.1 `components.json` (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "css": "src/styles.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

### 2.2 `vite.config.ts`

```ts
// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them
// manually or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss,
//     tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @
//     path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection
//     (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error
    // wrapper). nitro/vite builds from this
    server: { entry: "server" },
  },
});
```

### 2.3 `src/router.tsx`

```tsx
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
```

> `routeTree.gen.ts` is auto-generated by the TanStack Router plugin from the files in `src/routes/`. `src/start.ts` and `src/server.ts` are the framework entry points (Start entry + SSR server wrapper) and don't need custom logic to reproduce the UI.

---

## 3. Design system (`src/styles.css`) — verbatim

This is the complete design system. It uses **Tailwind v4's CSS-first configuration** (`@theme inline`) and defines all colors in **oklch**. The app is dark-first (the values live on `:root`; a `.dark` override block also exists but the app renders the `:root` dark palette by default). Reproduce this file exactly.

```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/*
 * Design system definition.
 *
 * The @theme inline block maps CSS custom properties to Tailwind utility
 * classes (e.g. --color-primary -> bg-primary, text-primary).
 *
 * The :root and .dark blocks define the actual color values using oklch.
 * All colors MUST use oklch format.
 *
 * To add a new semantic color:
 * 1. Add the variable to :root (light value) and .dark (dark value)
 * 2. Register it in @theme inline as --color-<name>: var(--<name>)
 */

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ring-offset-background: var(--background);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.5rem;
  --background: oklch(0.16 0.012 260);
  --foreground: oklch(0.96 0.005 250);
  --card: oklch(0.2 0.014 260);
  --card-foreground: oklch(0.96 0.005 250);
  --popover: oklch(0.2 0.014 260);
  --popover-foreground: oklch(0.96 0.005 250);
  --primary: oklch(0.82 0.17 84);
  --primary-foreground: oklch(0.2 0.03 70);
  --secondary: oklch(0.26 0.016 260);
  --secondary-foreground: oklch(0.94 0.005 250);
  --muted: oklch(0.24 0.014 260);
  --muted-foreground: oklch(0.68 0.015 258);
  --accent: oklch(0.7 0.13 195);
  --accent-foreground: oklch(0.18 0.02 200);
  --destructive: oklch(0.62 0.21 25);
  --destructive-foreground: oklch(0.98 0.003 250);
  --border: oklch(0.3 0.016 260);
  --input: oklch(0.3 0.016 260);
  --ring: oklch(0.82 0.17 84);
  --chart-1: oklch(0.82 0.17 84);
  --chart-2: oklch(0.7 0.13 195);
  --chart-3: oklch(0.72 0.15 145);
  --chart-4: oklch(0.68 0.16 25);
  --chart-5: oklch(0.75 0.1 300);
  --sidebar: oklch(0.13 0.012 260);
  --sidebar-foreground: oklch(0.9 0.005 250);
  --sidebar-primary: oklch(0.82 0.17 84);
  --sidebar-primary-foreground: oklch(0.2 0.03 70);
  --sidebar-accent: oklch(0.24 0.014 260);
  --sidebar-accent-foreground: oklch(0.96 0.005 250);
  --sidebar-border: oklch(0.26 0.016 260);
  --sidebar-ring: oklch(0.82 0.17 84);
  --surface-grid:
    linear-gradient(oklch(1 0 0 / 3%) 1px, transparent 1px),
    linear-gradient(90deg, oklch(1 0 0 / 3%) 1px, transparent 1px);
  --gradient-hero: linear-gradient(135deg, oklch(0.82 0.17 84 / 18%), oklch(0.7 0.13 195 / 12%));
  --shadow-panel: 0 1px 0 oklch(1 0 0 / 5%) inset, 0 18px 40px -24px oklch(0 0 0 / 80%);
}

.dark {
  --background: oklch(0.129 0.042 264.695);
  --foreground: oklch(0.984 0.003 247.858);
  --card: oklch(0.208 0.042 265.755);
  --card-foreground: oklch(0.984 0.003 247.858);
  --popover: oklch(0.208 0.042 265.755);
  --popover-foreground: oklch(0.984 0.003 247.858);
  --primary: oklch(0.929 0.013 255.508);
  --primary-foreground: oklch(0.208 0.042 265.755);
  --secondary: oklch(0.279 0.041 260.031);
  --secondary-foreground: oklch(0.984 0.003 247.858);
  --muted: oklch(0.279 0.041 260.031);
  --muted-foreground: oklch(0.704 0.04 256.788);
  --accent: oklch(0.279 0.041 260.031);
  --accent-foreground: oklch(0.984 0.003 247.858);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.984 0.003 247.858);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.551 0.027 264.364);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.208 0.042 265.755);
  --sidebar-foreground: oklch(0.984 0.003 247.858);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
  --sidebar-accent: oklch(0.279 0.041 260.031);
  --sidebar-accent-foreground: oklch(0.984 0.003 247.858);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.551 0.027 264.364);
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  }

  h1,
  h2,
  h3 {
    letter-spacing: -0.02em;
  }
}

@utility panel {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel);
}

@utility grid-bg {
  background-image: var(--surface-grid);
  background-size: 32px 32px;
}

@utility hero-gradient {
  background-image: var(--gradient-hero);
}
```

### 3.1 Design language cheat-sheet

- **Theme:** dark, near-black blue-tinted background (`oklch(0.16 0.012 260)`), light near-white text.
- **Primary / brand:** warm amber-gold `oklch(0.82 0.17 84)` — used for the logo chip, the "New agent" button, active nav, stat icons, links, focus ring.
- **Accent:** teal/cyan `oklch(0.7 0.13 195)` — used sparingly (e.g. "draft" agent status, open-source model icon).
- **Radius:** base `0.5rem`; utilities scale from `sm` (−4px) up to `4xl` (+16px).
- **Custom utilities:** `panel` (card surface: card bg + border + subtle inset/drop shadow), `grid-bg` (32px faint dotted-grid background applied to the whole app frame), `hero-gradient` (diagonal amber→teal wash used behind hero blocks).
- **Signature shadow:** `--shadow-panel` = `0 1px 0 oklch(1 0 0 / 5%) inset, 0 18px 40px -24px oklch(0 0 0 / 80%)`.

### 3.2 Typography

- **Font family:** `"Space Grotesk", ui-sans-serif, system-ui, sans-serif` on `body`.
- **Loaded via** `<head>` (see `__root.tsx`): weights 400, 500, 600, 700.
  `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap`
- **Headings** (`h1/h2/h3`) use `letter-spacing: -0.02em` (tight tracking).
- Common sizes in use: page title `text-xl font-semibold`; hero headline `text-2xl font-semibold`; stat numbers `text-2xl font-semibold`; body `text-sm`; meta/labels `text-xs text-muted-foreground`; eyebrow labels `text-xs uppercase tracking-widest text-primary` (or `tracking-widest text-muted-foreground`).

---

## 4. App frame — `src/components/AppShell.tsx` — verbatim

Wraps **every** page. Provides the fixed left sidebar (desktop), the sticky page header with title/subtitle/action slot, and a horizontally-scrolling nav bar on mobile. The whole frame sits on the `grid-bg` dotted background, centered at `max-w-[1400px]`.

```tsx
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
    <div className="min-h-screen grid-bg">
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
```

**Nav (sidebar + mobile), in order:** Overview `/` · Agents `/agents` · Knowledge `/knowledge` · Models `/models` · **Results** `/runs`. (Note the label "Results" maps to the `/runs` route.)
Logo: amber rounded square with a `Sparkles` icon + "Marketing OS" wordmark. Sidebar footer card: **Workspace** — "Northstar · 5 agents · 4 bases".

---

## 5. Root document — `src/routes/__root.tsx` — verbatim

Defines the HTML document (`<head>` meta + fonts + stylesheet), wraps the app in the React Query provider + `<Toaster />`, and provides the 404 (`NotFoundComponent`) and error (`ErrorComponent`) boundaries.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Marketing OS" },
      {
        name: "description",
        content: "Agents, knowledge bases and models for a small marketing team.",
      },
      { property: "og:title", content: "Marketing OS" },
      {
        property: "og:description",
        content: "Agents, knowledge bases and models for a small marketing team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
```

> `lib/lovable-error-reporting` is a Lovable-platform dev helper. When rebuilding elsewhere, replace `reportLovableError(...)` with a no-op or your own error reporter.

---

## 6. Data model + all seed data — `src/data/marketing-os.ts` — verbatim

This single file is the source of truth for everything the UI shows. Reproduce it exactly.

```ts
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  BookOpen,
  FileText,
  Layers,
  Megaphone,
  PenLine,
  Search,
  Share2,
} from "lucide-react";

export type AgentStatus = "active" | "draft" | "paused";

export type Agent = {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  icon: LucideIcon;
  model: string;
  skills: string[];
  knowledgeBases: string[];
  runs: number;
  successRate: number;
  lastRun: string;
};

export const agents: Agent[] = [
  {
    id: "atlas",
    name: "Atlas",
    role: "Campaign Strategist",
    description:
      "Turns a rough brief into a positioning angle, channel mix and a week-by-week campaign calendar.",
    status: "active",
    icon: Megaphone,
    model: "claude-sonnet-4.5",
    skills: ["Positioning", "Channel planning", "Budget split", "ICP research"],
    knowledgeBases: ["Brand Bible", "Q3 Campaign Archive"],
    runs: 148,
    successRate: 94,
    lastRun: "2h ago",
  },
  {
    id: "quill",
    name: "Quill",
    role: "Long-form Writer",
    description: "Drafts blog posts, landing copy and newsletters in your tone of voice.",
    status: "active",
    icon: PenLine,
    model: "gpt-5.4",
    skills: ["SEO writing", "Tone matching", "Editing pass", "Headline variants"],
    knowledgeBases: ["Brand Bible", "Product Docs"],
    runs: 412,
    successRate: 91,
    lastRun: "18m ago",
  },
  {
    id: "scout",
    name: "Scout",
    role: "Market Researcher",
    description: "Crawls competitors, pricing pages and reviews, then reports what changed.",
    status: "active",
    icon: Search,
    model: "llama-3.3-70b (local)",
    skills: ["Competitor scan", "Review mining", "Pricing diff", "Trend digest"],
    knowledgeBases: ["Competitor Intel"],
    runs: 76,
    successRate: 88,
    lastRun: "yesterday",
  },
  {
    id: "echo",
    name: "Echo",
    role: "Social Distributor",
    description:
      "Slices one asset into channel-native posts with hooks and scheduling notes.",
    status: "paused",
    icon: Share2,
    model: "gemini-3.6-flash",
    skills: ["Repurposing", "Hook writing", "Thread building"],
    knowledgeBases: ["Brand Bible"],
    runs: 233,
    successRate: 86,
    lastRun: "3d ago",
  },
  {
    id: "ledger",
    name: "Ledger",
    role: "Performance Analyst",
    description: "Reads campaign exports and writes the weekly performance narrative.",
    status: "draft",
    icon: Layers,
    model: "gpt-5.4-mini",
    skills: ["Metric rollup", "Anomaly notes", "Exec summary"],
    knowledgeBases: ["Q3 Campaign Archive"],
    runs: 0,
    successRate: 0,
    lastRun: "never",
  },
];

export const skillLibrary = [
  { name: "SEO writing", category: "Content" },
  { name: "Tone matching", category: "Content" },
  { name: "Hook writing", category: "Social" },
  { name: "Repurposing", category: "Social" },
  { name: "Competitor scan", category: "Research" },
  { name: "Review mining", category: "Research" },
  { name: "Pricing diff", category: "Research" },
  { name: "Positioning", category: "Strategy" },
  { name: "Channel planning", category: "Strategy" },
  { name: "Budget split", category: "Strategy" },
  { name: "Metric rollup", category: "Analytics" },
  { name: "Anomaly notes", category: "Analytics" },
];

export type Integration = {
  id: string;
  name: string;
  blurb: string;
  status: "connected" | "available";
  detail: string;
};

export const integrations: Integration[] = [
  {
    id: "notion",
    name: "Notion",
    blurb: "Sync pages and databases from shared workspaces.",
    status: "connected",
    detail: "42 pages · synced 12m ago",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    blurb: "Watch a local vault folder and index markdown notes.",
    status: "connected",
    detail: "318 notes · vault: /marketing",
  },
  {
    id: "msoffice",
    name: "Microsoft Office",
    blurb: "Pull Word, Excel and PowerPoint files from OneDrive/SharePoint.",
    status: "available",
    detail: "Not connected",
  },
  {
    id: "gdrive",
    name: "Google Drive",
    blurb: "Index docs, sheets and slides from a shared drive.",
    status: "available",
    detail: "Not connected",
  },
];

export type KnowledgeBase = {
  id: string;
  name: string;
  type: "Raw corpus" | "Curated notes" | "Distilled memory";
  source: string;
  docs: number;
  chunks: number;
  updated: string;
  usedBy: string[];
  icon: LucideIcon;
};

export const knowledgeBases: KnowledgeBase[] = [
  {
    id: "brand-bible",
    name: "Brand Bible",
    type: "Curated notes",
    source: "Notion",
    docs: 42,
    chunks: 1_284,
    updated: "12m ago",
    usedBy: ["Atlas", "Quill", "Echo"],
    icon: BookOpen,
  },
  {
    id: "product-docs",
    name: "Product Docs",
    type: "Raw corpus",
    source: "Obsidian vault",
    docs: 318,
    chunks: 9_640,
    updated: "1h ago",
    usedBy: ["Quill"],
    icon: FileText,
  },
  {
    id: "competitor-intel",
    name: "Competitor Intel",
    type: "Distilled memory",
    source: "Scout crawls + uploads",
    docs: 87,
    chunks: 2_150,
    updated: "yesterday",
    usedBy: ["Scout", "Atlas"],
    icon: Search,
  },
  {
    id: "q3-archive",
    name: "Q3 Campaign Archive",
    type: "Raw corpus",
    source: "Uploads · CSV, PDF",
    docs: 64,
    chunks: 3_002,
    updated: "4d ago",
    usedBy: ["Atlas", "Ledger"],
    icon: Boxes,
  },
];

export const memoryLayers = [
  {
    key: "raw",
    title: "Raw context",
    blurb: "Everything dropped in as-is: docs, transcripts, exports, crawls.",
    stat: "511 files",
  },
  {
    key: "notes",
    title: "Working notes",
    blurb: "Agent-written summaries of each source, refreshed on every sync.",
    stat: "1,204 notes",
  },
  {
    key: "distilled",
    title: "Distilled facts",
    blurb: "Deduped, conflict-checked statements the agents treat as truth.",
    stat: "386 facts",
  },
  {
    key: "core",
    title: "Core memory",
    blurb: "Always-in-prompt essentials: brand voice, ICP, non-negotiables.",
    stat: "18 entries",
  },
];

export type ModelProvider = {
  id: string;
  name: string;
  kind: "Hosted API" | "Open source";
  models: string[];
  status: "connected" | "available";
  note: string;
};

export const modelProviders: ModelProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    kind: "Hosted API",
    models: ["claude-sonnet-4.5", "claude-opus-4.1", "claude-haiku-4"],
    status: "connected",
    note: "Default for strategy work",
  },
  {
    id: "openai",
    name: "OpenAI",
    kind: "Hosted API",
    models: ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"],
    status: "connected",
    note: "Default for writing",
  },
  {
    id: "google",
    name: "Google Gemini",
    kind: "Hosted API",
    models: ["gemini-3.6-flash", "gemini-3.1-pro"],
    status: "available",
    note: "Add an API key to enable",
  },
  {
    id: "ollama",
    name: "Ollama (local)",
    kind: "Open source",
    models: ["llama-3.3-70b", "mistral-small", "qwen2.5-32b"],
    status: "connected",
    note: "http://localhost:11434",
  },
  {
    id: "vllm",
    name: "vLLM endpoint",
    kind: "Open source",
    models: ["deepseek-v3", "llama-3.1-8b"],
    status: "available",
    note: "Point to any OpenAI-compatible URL",
  },
];

export type Run = {
  id: string;
  title: string;
  agent: string;
  status: "complete" | "running" | "needs review";
  started: string;
  duration: string;
  model: string;
  summary: string;
  metrics: { label: string; value: string; hint: string }[];
  sections: { heading: string; body: string; bullets?: string[] }[];
  sources: { name: string; kind: string }[];
  attachments: { name: string; kind: "image" | "doc"; size: string }[];
  comments: {
    id: string;
    author: string;
    initials: string;
    time: string;
    body: string;
    anchor?: string;
  }[];
};

export const runs: Run[] = [
  {
    id: "run-2041",
    title: "Q4 launch campaign plan — Northstar 2.0",
    agent: "Atlas",
    status: "needs review",
    started: "Today, 09:12",
    duration: "3m 41s",
    model: "claude-sonnet-4.5",
    summary:
      "A four-week launch plan anchored on the 'setup in an afternoon' angle, weighted toward founder-led social and lifecycle email, with paid held back until week three.",
    metrics: [
      { label: "Reach forecast", value: "180k", hint: "across 4 channels" },
      { label: "Budget", value: "$24k", hint: "62% paid, 38% content" },
      { label: "Assets needed", value: "17", hint: "6 owned by Quill" },
      { label: "Confidence", value: "High", hint: "12 sources cited" },
    ],
    sections: [
      {
        heading: "Positioning angle",
        body: "Lead with time-to-value instead of feature count. Competitor teardown shows every rival opens on integrations, so 'live in an afternoon' is uncontested in the category.",
      },
      {
        heading: "Channel mix",
        body: "Sequenced rather than simultaneous — earn signal first, then amplify it.",
        bullets: [
          "Week 1 — founder-led LinkedIn + changelog post",
          "Week 2 — lifecycle email to 8.4k dormant trials",
          "Week 3 — paid retargeting on warm audiences only",
          "Week 4 — customer story + webinar replay push",
        ],
      },
      {
        heading: "Risks",
        body: "Two competitors historically ship pricing changes in early November; keep 15% of budget unallocated to respond.",
      },
    ],
    sources: [
      { name: "Brand Bible / Voice & tone", kind: "Notion" },
      { name: "Competitor pricing diff — Oct", kind: "Scout crawl" },
      { name: "Q3 campaign results.csv", kind: "Upload" },
    ],
    attachments: [
      { name: "launch-timeline.png", kind: "image", size: "412 KB" },
      { name: "budget-split.xlsx", kind: "doc", size: "88 KB" },
    ],
    comments: [
      {
        id: "c1",
        author: "Moballighul",
        initials: "MI",
        time: "24m ago",
        body: "Push paid to week two — we have warm retargeting pools ready already.",
        anchor: "Channel mix",
      },
      {
        id: "c2",
        author: "Atlas",
        initials: "AT",
        time: "22m ago",
        body: "Noted. Moving paid to week two drops forecast reach ~8% but pulls first conversions forward by nine days.",
      },
    ],
  },
  {
    id: "run-2039",
    title: "Competitor pricing sweep — October",
    agent: "Scout",
    status: "complete",
    started: "Yesterday, 18:40",
    duration: "8m 02s",
    model: "llama-3.3-70b (local)",
    summary:
      "Three of seven tracked competitors changed pricing pages this month; two moved usage-based tiers upward.",
    metrics: [
      { label: "Sites crawled", value: "7", hint: "pricing + changelog" },
      { label: "Changes found", value: "9", hint: "3 material" },
      { label: "Runtime", value: "8m", hint: "local model" },
      { label: "Confidence", value: "Medium", hint: "2 pages JS-gated" },
    ],
    sections: [
      {
        heading: "Material changes",
        body: "Two vendors raised entry tiers, one removed its free plan entirely.",
        bullets: [
          "Vendor A: $29 → $39 starter, seat cap unchanged",
          "Vendor B: free plan removed, 14-day trial instead",
          "Vendor C: added usage add-on at $0.004/credit",
        ],
      },
      {
        heading: "So what",
        body: "Our starter tier is now the only free-forever option among the top three — worth making explicit in launch messaging.",
      },
    ],
    sources: [
      { name: "Competitor Intel base", kind: "Knowledge base" },
      { name: "7 pricing pages", kind: "Live crawl" },
    ],
    attachments: [{ name: "pricing-matrix.png", kind: "image", size: "236 KB" }],
    comments: [
      {
        id: "c3",
        author: "Priya",
        initials: "PR",
        time: "9h ago",
        body: "Can you re-run with the JS-gated pages using the browser tool?",
      },
    ],
  },
  {
    id: "run-2038",
    title: "Newsletter draft — 'Ship faster, not louder'",
    agent: "Quill",
    status: "running",
    started: "Today, 10:02",
    duration: "running…",
    model: "gpt-5.4",
    summary: "Drafting a 700-word issue with three subject-line variants.",
    metrics: [
      { label: "Words", value: "418", hint: "target 700" },
      { label: "Variants", value: "3", hint: "subject lines" },
      { label: "Tone match", value: "92%", hint: "vs Brand Bible" },
      { label: "Sources", value: "5", hint: "product docs" },
    ],
    sections: [
      {
        heading: "Working draft",
        body: "Opens with the afternoon-setup story from the Northstar beta, then pivots to the three habits that make small teams ship weekly.",
      },
    ],
    sources: [{ name: "Product Docs", kind: "Obsidian" }],
    attachments: [],
    comments: [],
  },
];

export const activity = [
  { id: "a1", text: "Atlas finished Q4 launch campaign plan", time: "2h ago" },
  { id: "a2", text: "Notion sync added 6 pages to Brand Bible", time: "3h ago" },
  { id: "a3", text: "Scout flagged 3 material pricing changes", time: "yesterday" },
  { id: "a4", text: "Echo paused by Moballighul", time: "3d ago" },
];
```

---

## 7. Routing map

| URL | File | Component | Notes |
|---|---|---|---|
| `/` | `routes/index.tsx` | Overview | Static dashboard |
| `/agents` | `routes/agents.tsx` | Agents | Interactive master-detail + "create agent" dialog (React state) |
| `/knowledge` | `routes/knowledge.tsx` | Knowledge | 4 tabs: Bases / Integrations / Memory builder / Files |
| `/models` | `routes/models.tsx` | Models | Provider cards + run-defaults aside |
| `/runs` | `routes/runs.tsx` | (layout) | Renders `<Outlet/>` only |
| `/runs/` | `routes/runs.index.tsx` | Results list | Cards linking to each run |
| `/runs/$runId` | `routes/runs.$runId.tsx` | Run detail | Report + comments (React state); `loader` throws `notFound()` on bad id |

All pages render inside `<AppShell>`. Interactivity is local React state only — no persistence.

---

## 8. Pages — verbatim source

### 8.1 Overview — `src/routes/index.tsx`

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Brain, Cpu, FileBarChart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activity, agents, knowledgeBases, modelProviders, runs } from "@/data/marketing-os";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marketing OS — Agent workspace overview" },
      {
        name: "description",
        content:
          "Build marketing agents, wire them to knowledge bases and models, and review every result in one workspace.",
      },
      { property: "og:title", content: "Marketing OS — Agent workspace overview" },
      {
        property: "og:description",
        content: "Agents, knowledge bases, models and reports for a small marketing team.",
      },
    ],
  }),
  component: Index,
});

const stats = [
  { label: "Agents", value: agents.length, icon: Bot, to: "/agents" as const },
  { label: "Knowledge bases", value: knowledgeBases.length, icon: Brain, to: "/knowledge" as const },
  {
    label: "Model providers",
    value: modelProviders.filter((m) => m.status === "connected").length,
    icon: Cpu,
    to: "/models" as const,
  },
  { label: "Runs this week", value: 23, icon: FileBarChart, to: "/runs" as const },
];

function Index() {
  return (
    <AppShell
      title="Overview"
      subtitle="Everything your marketing agents know, use and produce."
      action={
        <Button asChild>
          <Link to="/agents">New agent</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="panel hero-gradient p-6">
          <p className="text-xs uppercase tracking-widest text-primary">Northstar workspace</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold">
            Five agents, four knowledge bases, one place to review the work.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Give an agent skills, point it at the memory you trust, pick a model, then read the
            report and comment inline where it needs a twist.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="panel p-4 transition-colors hover:border-primary/50">
              <s.icon className="size-4 text-primary" />
              <p className="mt-3 text-2xl font-semibold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="panel p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Latest results</h3>
              <Link to="/runs" className="flex items-center gap-1 text-sm text-primary">
                All results <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {runs.map((run) => (
                <li key={run.id}>
                  <Link
                    to="/runs/$runId"
                    params={{ runId: run.id }}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{run.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.agent} · {run.started} · {run.duration}
                      </p>
                    </div>
                    <Badge variant={run.status === "complete" ? "secondary" : "outline"}>
                      {run.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Activity</h3>
            <ul className="mt-4 space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p>{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
```

**Layout:** hero panel (amber→teal `hero-gradient`) → 4 stat cards (`grid` 1/2/4 cols) → 2-column row: "Latest results" list (2/3 width, links to run detail, status badge) + "Activity" feed (1/3 width, amber dot bullets). The "Model providers" stat counts only `status === "connected"` (→ 3). "Runs this week" is a hard-coded 23.

### 8.2 Agents — `src/routes/agents.tsx`

Interactive master-detail. Left column: "create agent" dialog trigger + selectable agent cards. Right column: the selected agent's editor (activate/pause, run, description, metrics grid, skills editor with add/remove + skill-library chips, knowledge-base toggles). All mutations are local `useState`; `sonner` toasts confirm actions.

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  agents as seedAgents,
  knowledgeBases,
  modelProviders,
  skillLibrary,
  type Agent,
} from "@/data/marketing-os";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents — Marketing OS" },
      { name: "description", content: "Create marketing agents, assign skills, knowledge bases and a model." },
      { property: "og:title", content: "Agents — Marketing OS" },
      { property: "og:description", content: "Create marketing agents, assign skills, knowledge bases and a model." },
    ],
  }),
  component: AgentsPage,
});

const statusTone: Record<Agent["status"], string> = {
  active: "border-primary/40 text-primary",
  paused: "border-border text-muted-foreground",
  draft: "border-accent/40 text-accent",
};

const allModels = modelProviders.flatMap((p) => p.models);

function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(seedAgents);
  const [selectedId, setSelectedId] = useState(seedAgents[0]!.id);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", role: "", description: "", model: allModels[0]! });
  const [newSkill, setNewSkill] = useState("");

  const selected = (agents.find((a) => a.id === selectedId) ?? agents[0]) as Agent;

  const update = (id: string, patch: Partial<Agent>) =>
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const addSkill = (skill: string) => {
    const value = skill.trim();
    if (!value || selected.skills.includes(value)) return;
    update(selected.id, { skills: [...selected.skills, value] });
    setNewSkill("");
  };

  const toggleBase = (name: string) => {
    const has = selected.knowledgeBases.includes(name);
    update(selected.id, {
      knowledgeBases: has
        ? selected.knowledgeBases.filter((k) => k !== name)
        : [...selected.knowledgeBases, name],
    });
  };

  const createAgent = () => {
    if (!draft.name.trim()) return;
    const agent: Agent = {
      id: draft.name.toLowerCase().replace(/\s+/g, "-"),
      name: draft.name,
      role: draft.role || "Custom agent",
      description: draft.description || "No description yet.",
      status: "draft",
      icon: seedAgents[0]!.icon,
      model: draft.model,
      skills: [],
      knowledgeBases: [],
      runs: 0,
      successRate: 0,
      lastRun: "never",
    };
    setAgents((prev) => [agent, ...prev]);
    setSelectedId(agent.id);
    setOpen(false);
    setDraft({ name: "", role: "", description: "", model: allModels[0]! });
    toast.success(`${agent.name} created`);
  };

  return (
    <AppShell
      title="Agents"
      subtitle="Each agent is a role, a skill set, the memory it can read and the model it runs on."
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create an agent</DialogTitle>
              <DialogDescription>Skills and knowledge can be added after.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Beacon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  placeholder="Lifecycle email writer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">What it does</Label>
                <Textarea
                  id="desc"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Writes onboarding sequences from product docs."
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={draft.model}
                  onValueChange={(model) => setDraft({ ...draft, model })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createAgent}>Create agent</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedId(agent.id)}
              className={`panel w-full p-4 text-left transition-colors ${
                agent.id === selected.id ? "border-primary/60" : "hover:border-border/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                  <agent.icon className="size-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
                </div>
                <Badge variant="outline" className={`ml-auto ${statusTone[agent.status]}`}>
                  {agent.status}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {agent.skills.length} skills · {agent.runs} runs · {agent.lastRun}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">{selected.role}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    update(selected.id, {
                      status: selected.status === "active" ? "paused" : "active",
                    })
                  }
                >
                  {selected.status === "active" ? "Pause" : "Activate"}
                </Button>
                <Button onClick={() => toast.success(`${selected.name} run queued`)}>Run agent</Button>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{selected.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Model", selected.model],
                ["Runs", String(selected.runs)],
                ["Success", `${selected.successRate}%`],
                ["Last run", selected.lastRun],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-border bg-secondary/40 p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-1 truncate text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Skills</h3>
            <p className="text-sm text-muted-foreground">
              What this agent is allowed to do during a run.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs"
                >
                  {skill}
                  <button
                    onClick={() =>
                      update(selected.id, {
                        skills: selected.skills.filter((s) => s !== skill),
                      })
                    }
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                </span>
              ))}
              {selected.skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills yet.</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill(newSkill)}
                placeholder="Add a custom skill…"
              />
              <Button variant="secondary" onClick={() => addSkill(newSkill)}>
                Add
              </Button>
            </div>
            <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
              Skill library
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skillLibrary
                .filter((s) => !selected.skills.includes(s.name))
                .map((s) => (
                  <button
                    key={s.name}
                    onClick={() => addSkill(s.name)}
                    className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    + {s.name}
                    <span className="ml-1 opacity-50">{s.category}</span>
                  </button>
                ))}
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Knowledge access</h3>
            <p className="text-sm text-muted-foreground">
              Bases this agent can read during a run.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {knowledgeBases.map((kb) => {
                const on = selected.knowledgeBases.includes(kb.name);
                return (
                  <button
                    key={kb.id}
                    onClick={() => toggleBase(kb.name)}
                    className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                      on ? "border-primary/60 bg-primary/5" : "border-border hover:border-border/80"
                    }`}
                  >
                    <kb.icon className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {kb.type} · {kb.docs} docs
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
```

> Note: the create-agent "Name" input placeholder is `Beacon`; grid is `lg:grid-cols-[320px_1fr]`. Status tones: active = amber-tinted border/text, paused = muted, draft = teal/accent-tinted.

### 8.3 Knowledge — `src/routes/knowledge.tsx`

Header action: "Sync all". Body is a 4-tab `Tabs` component: **Bases**, **Integrations**, **Memory builder**, **Files** (uploads are stored in local state; drag-drop label + hidden file input).

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileUp, Layers, Plus, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { integrations, knowledgeBases, memoryLayers } from "@/data/marketing-os";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge base — Marketing OS" },
      {
        name: "description",
        content: "Connect Notion, Obsidian and Microsoft Office, upload files, and build layered agent memory.",
      },
      { property: "og:title", content: "Knowledge base — Marketing OS" },
      {
        property: "og:description",
        content: "Connect Notion, Obsidian and Office, upload files, build layered agent memory.",
      },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const [files, setFiles] = useState<string[]>([
    "q3-campaign-results.csv",
    "brand-voice-guide.pdf",
    "webinar-transcript.docx",
  ]);
  const [name, setName] = useState("");

  return (
    <AppShell
      title="Knowledge"
      subtitle="Sources, uploads and the layered memory your agents actually read."
      action={
        <Button onClick={() => toast.success("Sync started for all sources")}>
          <RefreshCw className="size-4" /> Sync all
        </Button>
      }
    >
      <Tabs defaultValue="bases">
        <TabsList>
          <TabsTrigger value="bases">Bases</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="memory">Memory builder</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="bases" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {knowledgeBases.map((kb) => (
              <div key={kb.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                      <kb.icon className="size-4 text-primary" />
                    </span>
                    <div>
                      <p className="font-medium">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">{kb.source}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{kb.type}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Docs</p>
                    <p className="font-medium">{kb.docs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Chunks</p>
                    <p className="font-medium">{kb.chunks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Updated</p>
                    <p className="font-medium">{kb.updated}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Used by {kb.usedBy.join(", ")}
                </p>
              </div>
            ))}
            <div className="panel flex flex-col items-start justify-center gap-3 border-dashed p-5">
              <Layers className="size-5 text-primary" />
              <p className="text-sm font-medium">New knowledge base</p>
              <div className="flex w-full gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Customer interviews"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!name.trim()) return;
                    toast.success(`${name} created`);
                    setName("");
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map((i) => (
              <div key={i.id} className="panel flex items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{i.name}</p>
                    {i.status === "connected" && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{i.blurb}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{i.detail}</p>
                </div>
                <Button
                  variant={i.status === "connected" ? "secondary" : "default"}
                  onClick={() =>
                    toast.success(
                      i.status === "connected" ? `${i.name} re-synced` : `Connect ${i.name}`,
                    )
                  }
                >
                  {i.status === "connected" ? "Manage" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <div className="panel hero-gradient p-5">
            <h3 className="font-semibold">Layered memory</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Raw files are not a knowledge base. Sources get summarised into notes, get
              distilled into deduped facts, and only the essentials stay in core memory that every
              agent carries into every run.
            </p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {memoryLayers.map((layer, idx) => (
              <div key={layer.key} className="panel p-5">
                <p className="text-xs uppercase tracking-widest text-primary">
                  Layer {idx + 1}
                </p>
                <p className="mt-2 font-medium">{layer.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{layer.blurb}</p>
                <p className="mt-4 text-sm font-medium">{layer.stat}</p>
                <Progress value={100 - idx * 22} className="mt-2" />
              </div>
            ))}
          </div>
          <div className="panel mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              Last distillation pass: today 08:30 · 42 new facts, 6 conflicts resolved.
            </p>
            <Button variant="secondary" onClick={() => toast.success("Distillation pass queued")}>
              Run distillation
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <div className="panel p-5">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
              <FileUp className="size-5 text-primary" />
              <span className="text-sm font-medium">Drop images or documents</span>
              <span className="text-xs text-muted-foreground">
                PDF, DOCX, XLSX, MD, PNG — indexed into the selected base
              </span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const names = Array.from(e.target.files ?? []).map((f) => f.name);
                  if (names.length) {
                    setFiles((prev) => [...names, ...prev]);
                    toast.success(`${names.length} file(s) queued for indexing`);
                  }
                }}
              />
            </label>
            <ul className="mt-4 divide-y divide-border">
              {files.map((f) => (
                <li key={f} className="flex items-center justify-between py-3 text-sm">
                  <span>{f}</span>
                  <Badge variant="outline">indexed</Badge>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
```

### 8.4 Models — `src/routes/models.tsx`

Left: provider cards (Server icon for open-source, Cloud icon for hosted; model list as mono pills; Configure/Add-key button). Right aside: "Run defaults" (Temperature `Slider` 0–1 step 0.1, "Local fallback" `Switch`) and "Custom endpoint" (`Input` + Test connection).

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cloud, Server } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { modelProviders } from "@/data/marketing-os";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Models — Marketing OS" },
      {
        name: "description",
        content: "Connect Claude, ChatGPT, Gemini or a self-hosted open-source model and set run defaults.",
      },
      { property: "og:title", content: "Models — Marketing OS" },
      { property: "og:description", content: "Hosted APIs and open-source endpoints your agents can run on." },
    ],
  }),
  component: ModelsPage,
});

function ModelsPage() {
  const [temperature, setTemperature] = useState([0.4]);
  const [fallback, setFallback] = useState(true);
  const [endpoint, setEndpoint] = useState("http://localhost:11434");

  return (
    <AppShell
      title="Models"
      subtitle="Hosted APIs and open-source endpoints available to your agents."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          {modelProviders.map((p) => (
            <div key={p.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                    {p.kind === "Open source" ? (
                      <Server className="size-4 text-accent" />
                    ) : (
                      <Cloud className="size-4 text-primary" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.kind}</p>
                  </div>
                </div>
                <Badge variant={p.status === "connected" ? "secondary" : "outline"}>
                  {p.status}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.models.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{p.note}</p>
                <Button
                  size="sm"
                  variant={p.status === "connected" ? "secondary" : "default"}
                  onClick={() => toast.success(`${p.name} settings opened`)}
                >
                  {p.status === "connected" ? "Configure" : "Add key"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="panel p-5">
            <h3 className="font-semibold">Run defaults</h3>
            <div className="mt-4 space-y-5">
              <div>
                <Label>Temperature — {temperature[0]?.toFixed(1)}</Label>
                <Slider
                  className="mt-3"
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Local fallback</Label>
                  <p className="text-xs text-muted-foreground">
                    Use Ollama if a hosted API fails.
                  </p>
                </div>
                <Switch checked={fallback} onCheckedChange={setFallback} />
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Custom endpoint</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Any OpenAI-compatible URL — vLLM, LM Studio, llama.cpp.
            </p>
            <Input
              className="mt-3"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={() => toast.success("Endpoint reachable · 3 models found")}
            >
              Test connection
            </Button>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
```

### 8.5 Results layout — `src/routes/runs.tsx`

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/runs")({
  component: () => <Outlet />,
});
```

### 8.6 Results list — `src/routes/runs.index.tsx`

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Cpu } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { runs } from "@/data/marketing-os";

export const Route = createFileRoute("/runs/")({
  head: () => ({
    meta: [
      { title: "Results — Marketing OS" },
      {
        name: "description",
        content: "Every agent run, its report, sources, attachments and review comments.",
      },
      { property: "og:title", content: "Results — Marketing OS" },
      {
        property: "og:description",
        content: "Every agent run, its report, sources, attachments and review comments.",
      },
    ],
  }),
  component: RunsPage,
});

function RunsPage() {
  return (
    <AppShell title="Results" subtitle="What the agents produced, and what still needs a human.">
      <div className="space-y-4">
        {runs.map((run) => (
          <Link
            key={run.id}
            to="/runs/$runId"
            params={{ runId: run.id }}
            className="panel block p-5 transition-colors hover:border-primary/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{run.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{run.summary}</p>
              </div>
              <Badge variant={run.status === "complete" ? "secondary" : "outline"}>
                {run.status}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>{run.agent}</span>
              <span className="flex items-center gap-1">
                <Cpu className="size-3" /> {run.model}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {run.started} · {run.duration}
              </span>
              <span>{run.comments.length} comments</span>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
```

### 8.7 Run detail — `src/routes/runs.$runId.tsx`

`loader` looks the run up by `params.runId` and throws `notFound()` if missing. Two-column body: main report (hero with status + summary + metrics grid; then each `section` with optional bullets) and an aside (Comments panel with add-comment `Textarea` + attach-file label; Sources; Attachments). Comments and attachments are editable local state.

```tsx
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, ImageIcon, Paperclip, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { runs, type Run } from "@/data/marketing-os";

export const Route = createFileRoute("/runs/$runId")({
  loader: ({ params }) => {
    const run = runs.find((r) => r.id === params.runId);
    if (!run) throw notFound();
    return { run };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.run.title} — Marketing OS` : "Result — Marketing OS";
    const description = loaderData?.run.summary ?? "Agent run report.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: RunDetail,
});

function RunDetail() {
  const { run } = Route.useLoaderData() as { run: Run };
  const [comments, setComments] = useState(run.comments);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState(run.attachments);

  const post = () => {
    if (!draft.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c${prev.length + 1}`, author: "You", initials: "YO", time: "just now", body: draft },
    ]);
    setDraft("");
    toast.success("Comment added — agent will re-run affected sections");
  };

  return (
    <AppShell
      title={run.title}
      subtitle={`${run.agent} · ${run.model} · ${run.started} · ${run.duration}`}
      action={
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link to="/runs">
              <ArrowLeft className="size-4" /> All results
            </Link>
          </Button>
          <Button onClick={() => toast.success("Re-run queued with the latest comments")}>
            Re-run with edits
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="panel hero-gradient p-5">
            <div className="flex items-center gap-3">
              <Badge variant={run.status === "complete" ? "secondary" : "outline"}>
                {run.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{run.id}</span>
            </div>
            <p className="mt-3 max-w-3xl text-sm">{run.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {run.metrics.map((m) => (
                <div key={m.label} className="rounded-md border border-border bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="mt-1 text-lg font-semibold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.hint}</p>
                </div>
              ))}
            </div>
          </section>

          {run.sections.map((section) => (
            <section key={section.heading} className="panel p-5">
              <h2 className="font-semibold">{section.heading}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
              {section.bullets && (
                <ul className="mt-3 space-y-2 text-sm">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {comments.some((c) => c.anchor === section.heading) && (
                <p className="mt-3 text-xs text-primary">
                  {comments.filter((c) => c.anchor === section.heading).length} comment on this
                  section
                </p>
              )}
            </section>
          ))}

          <section className="panel p-5">
            <h2 className="font-semibold">Sources used</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {run.sources.map((s) => (
                <li key={s.name} className="flex items-center justify-between py-2.5">
                  <span>{s.name}</span>
                  <Badge variant="outline">{s.kind}</Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="panel flex flex-col p-5">
            <h2 className="font-semibold">Comments</h2>
            <p className="text-xs text-muted-foreground">
              Twist the output — the agent reads these on the next run.
            </p>
            <ul className="mt-4 space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                    {c.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {c.author} · {c.time}
                    </p>
                    {c.anchor && (
                      <p className="mt-1 border-l-2 border-primary/60 pl-2 text-xs text-primary">
                        on "{c.anchor}"
                      </p>
                    )}
                    <p className="mt-1 text-sm">{c.body}</p>
                  </div>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-sm text-muted-foreground">No comments yet.</li>
              )}
            </ul>
            <Textarea
              className="mt-4"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask for a change…"
            />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="size-3.5" /> Attach
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const added = Array.from(e.target.files ?? []).map((f) => ({
                      name: f.name,
                      kind: (f.type.startsWith("image/") ? "image" : "doc") as "image" | "doc",
                      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
                    }));
                    if (added.length) {
                      setAttachments((prev) => [...prev, ...added]);
                      toast.success(`${added.length} file(s) attached`);
                    }
                  }}
                />
              </label>
              <Button size="sm" onClick={post}>
                <Send className="size-3.5" /> Comment
              </Button>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="font-semibold">Attachments</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {attachments.map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-2 rounded-md border border-border p-2.5"
                >
                  {a.kind === "image" ? (
                    <ImageIcon className="size-4 text-accent" />
                  ) : (
                    <FileText className="size-4 text-primary" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.size}</span>
                </li>
              ))}
              {attachments.length === 0 && (
                <li className="text-sm text-muted-foreground">Nothing attached yet.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
```

---

## 9. How to rebuild

1. **Scaffold** a TanStack Start + React 19 + TS project (or copy `package.json`, `vite.config.ts`, `tsconfig.json`, `components.json` above). Install with `bun install` (or npm/pnpm).
2. **Tailwind v4 + shadcn/ui:** create `src/styles.css` exactly as in §3, then add shadcn/ui with the `new-york` style / `slate` base color. Install the primitives used: `badge, button, input, textarea, label, dialog, select, tabs, progress, slider, switch, sonner` (plus `card`, `tooltip`, etc. if you want the full set). Ensure `cn()` lives at `src/lib/utils.ts`.
3. **Fonts:** add the Space Grotesk `<link>` tags to the document head (§5) and set the `body` font-family (already in `styles.css`).
4. **Data:** drop in `src/data/marketing-os.ts` verbatim (§6).
5. **Shell:** add `src/components/AppShell.tsx` verbatim (§4).
6. **Root:** add `src/routes/__root.tsx` (§5). Replace `reportLovableError` with your own reporter or a no-op.
7. **Pages:** add the eight route files (§8). The TanStack Router plugin regenerates `routeTree.gen.ts` automatically.
8. `bun run dev` → the app serves at the dev URL, identical to the original.

### Fidelity notes
- The app is **front-end only**: every "Run", "Sync", "Connect", "Create", comment, upload, etc. is local React state + a `sonner` toast. There is no API/database.
- Icons are all from `lucide-react`. Exact icons per surface: sidebar (LayoutDashboard, Bot, Brain, Cpu, FileBarChart, Sparkles); agents Megaphone/PenLine/Search/Share2/Layers (per-agent `icon`); knowledge BookOpen/FileText/Search/Boxes; models Cloud/Server; run detail ImageIcon/FileText/Paperclip/Send/ArrowLeft.
- Numeric literals in the data use JS numeric separators (`1_284`, `9_640`, etc.).
- Header stats on Overview: Agents = `agents.length` (5), Knowledge bases = `knowledgeBases.length` (4), Model providers = connected count (3), Runs this week = literal 23.
- The `.dark` block in `styles.css` exists (shadcn default slate palette) but the app's live look comes from the `:root` values; keep both to match the file exactly.
