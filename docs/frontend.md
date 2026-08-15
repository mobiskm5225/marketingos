# Frontend

React 19 + TanStack Start + Tailwind CSS v4 + shadcn/ui.
This is currently a front-end-only prototype — all data is seeded from a single local file and mutations live in React state.

**Dev server:** `http://localhost:8080` (or 8081 if in use)

---

## Tech Choices

| Concern | Library | Why |
|---|---|---|
| Framework | TanStack Start | Full-stack React framework with SSR and file-based routing |
| Routing | TanStack Router | Type-safe file-based routing, integrated closely with Start |
| Styling | Tailwind CSS v4 | `@theme inline` configuration for standard oklch color palettes |
| Components | shadcn/ui | Unstyled accessible components built on Radix UI primitives |
| Icons | lucide-react | Standard icon set used across shadcn/ui |

---

## File Map

```
frontend/
├── src/
│   ├── components/                # shadcn/ui components (ui/) and custom components (AppShell.tsx)
│   ├── data/
│   │   └── marketing-os.ts        # Local mock seed data (Agents, Knowledge Bases, Models, Runs)
│   ├── routes/                    # File-based routing tree
│   │   ├── __root.tsx             # Root layout with <AppShell>
│   │   ├── index.tsx              # Overview dashboard
│   │   ├── agents.tsx             # Agent creation and management
│   │   ├── knowledge.tsx          # Knowledge base integrations
│   │   ├── models.tsx             # LLM provider settings
│   │   └── runs/                  # Execution results
│   ├── lib/                       # Utilities (`cn` helper, error reporting)
│   ├── router.tsx                 # TanStack Router instance configuration
│   ├── client.tsx                 # Client entry point
│   ├── server.ts                  # SSR entry point
│   └── styles.css                 # Tailwind v4 theme configuration
├── vite.config.ts                 # TanStack Start plugin configuration
├── components.json                # shadcn configuration
└── package.json
```

---

## Data Layer (`src/data/marketing-os.ts`)

Because this is a frontend prototype, all application state originates from `src/data/marketing-os.ts`.
It exports default arrays of:
- `agents`: Available AI personas and their configured skills
- `knowledgeBases`: Uploaded documents, Notion integrations, and Obsidian vault links
- `models`: Configured AI models (Claude 3.5, GPT-4o, Ollama local)
- `runs`: Historical and active agent executions with detailed inputs and markdown results

In a future phase, this data file will be replaced by API calls to the backend via TanStack Query.

---

## App Shell (`src/components/AppShell.tsx`)

The main layout is constructed using `AppShell.tsx`, which provides:
1. A collapsed sidebar navigation using `lucide-react` icons
2. An animated mobile sidebar for smaller screens
3. A main content area with a max-width wrapper
4. Custom user dropdowns and settings menus

The `AppShell` component wraps the `<Outlet />` inside `src/routes/__root.tsx`.

---

## Styling (`src/styles.css`)

The application uses Tailwind v4's new CSS-first configuration model.
All colors are defined using `oklch` syntax within a `@theme inline` block to match the "Northstar workspace" design system.

Key color tokens:
- `--color-brand-*`: Primary brand colors (dark backgrounds)
- `--color-accent-*`: Vibrant accent colors (buttons, highlights)
- `--color-surface-*`: Card and panel backgrounds
- `--color-text-*`: Typography hierarchy

Radix UI CSS variables are also defined in the `:root` block to integrate with `shadcn/ui` primitives.
