# Frontend

React 19 · TanStack Start (SSR via Nitro) · TanStack Router · Tailwind CSS v4 · shadcn/ui.

The UI is **finished and is the contract**. The backend is being built to serve it. When the two
disagree, the frontend wins — do not redesign pages to make a backend response easier.

What is not finished is the wiring: every mutation is currently a `toast.success(...)` that changes
React state only. Phase 6 replaces those handlers with real calls, keeping every component, layout and
class exactly as it stands.

**Dev server:** `http://localhost:8081` (Vite takes the next free port from 8080).

---

## Tech choices

| Concern | Library | Why |
|---|---|---|
| Framework | TanStack Start | Full-stack React with SSR and file-based routing |
| Routing | TanStack Router | Type-safe file-based routes, route loaders for data |
| Server state | TanStack Query | Wired at the root; used for mutations from Phase 6 |
| Styling | Tailwind CSS v4 | CSS-first `@theme` config, no `tailwind.config.js` |
| Components | shadcn/ui ("new-york", slate) | Unstyled accessible primitives on Radix |
| Icons | lucide-react | Ships with shadcn/ui |
| Toasts | sonner | |
| Dates | date-fns | Formats the ISO timestamps the API returns |

---

## File map

```
frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx        # Sidebar + mobile nav + page header, wraps every page
│   │   └── ui/                 # shadcn primitives
│   ├── routes/                 # File-based route tree
│   │   ├── __root.tsx          # <html> shell, head tags, QueryClientProvider, error + 404 boundaries
│   │   ├── index.tsx           # Overview
│   │   ├── agents.tsx          # Agent list + detail editor
│   │   ├── knowledge.tsx       # Bases · Integrations · Memory builder · Files
│   │   ├── models.tsx          # Providers + run defaults
│   │   ├── runs.tsx            # Layout route (<Outlet/> only)
│   │   ├── runs.index.tsx      # Results list
│   │   └── runs.$runId.tsx     # Run detail: report, sources, comments, attachments
│   ├── lib/
│   │   ├── api.ts              # Typed fetch wrappers + response types
│   │   └── utils.ts            # `cn` helper
│   ├── router.tsx              # Router factory + Register type augmentation
│   ├── client.tsx              # Hydration entry
│   ├── server.ts               # SSR entry
│   ├── styles.css              # Tailwind v4 theme
│   └── vite-env.d.ts           # vite/client types + VITE_API_URL
├── components.json             # shadcn config
├── vite.config.ts
└── Dockerfile                  # Node server — needs NITRO_PRESET=node-server
```

There is no `src/data/` directory. Demo fixtures live in `backend/scripts/seed-data.ts`; the frontend
gets everything from the API.

---

## Routing map

| Path | File | Loads |
|---|---|---|
| `/` | `index.tsx` | agents, knowledge bases, models, runs, activity |
| `/agents` | `agents.tsx` | agents, knowledge bases, models |
| `/knowledge` | `knowledge.tsx` | knowledge bases, integrations |
| `/models` | `models.tsx` | models |
| `/runs` | `runs.index.tsx` | runs |
| `/runs/$runId` | `runs.$runId.tsx` | one run (throws `notFound()` on failure) |

Each route fetches in its `loader`, so data is resolved during SSR. Loaders run on the server for the
initial request and in the browser on client-side navigation — which is why the API needs CORS.

---

## Data contract

`src/lib/api.ts` defines the response types. The backend conforms to these; they are not up for
redesign. Full field-level reference is in [api.md](./api.md).

`Agent` · `KnowledgeBase` · `ModelProvider` · `Integration` · `Run` (with `Metric`, `Section`,
`Source`, `Attachment`, `Comment`) · `Activity`.

Two things to know:

- **`KnowledgeBase.type`** is `Raw corpus` / `Curated notes` / `Distilled memory` — the memory layer.
  The union still written in `api.ts` (`"notion" | "docs" | ...`) is stale and gets corrected in
  Phase 6.
- **Times are ISO strings.** The UI reads `kb.updated`, `agent.lastRun`, `run.started` and
  `activity.time` as display strings, so until Phase 6 adds `date-fns` formatting they render as raw
  ISO. The fix belongs in the frontend, not in the API.

`API_BASE` is hardcoded to `http://localhost:8000/api` today; Phase 6 moves it to
`import.meta.env.VITE_API_URL`. Vite inlines `VITE_*` at build time, so the Docker build passes it as
a build arg and it must be a URL the *browser* can reach — not an in-network service name.

---

## App shell

`AppShell.tsx` gives every page a sidebar (Overview · Agents · Knowledge · Models · Results), a mobile
nav, and a header taking `title`, `subtitle` and an optional `action` node — which is how each page
puts its primary button ("New agent", "Sync all", "Re-run with edits") in the header.

---

## Design system

Defined in `src/styles.css` using Tailwind v4's CSS-first `@theme` block. All colors are `oklch`.

- **Theme** — dark, near-black blue-tinted background `oklch(0.16 0.012 260)`, near-white text.
- **Primary** — warm amber-gold `oklch(0.82 0.17 84)`. Logo chip, primary buttons, active nav, stat
  icons, links, focus ring.
- **Accent** — teal/cyan `oklch(0.7 0.13 195)`. Used sparingly: `draft` agent status, open-source
  model icon.
- **Radius** — base `0.5rem`; utilities scale from `sm` (−4px) to `4xl` (+16px).
- **Signature shadow** — `--shadow-panel`:
  `0 1px 0 oklch(1 0 0 / 5%) inset, 0 18px 40px -24px oklch(0 0 0 / 80%)`.

Three custom utilities carry most of the look:

| Utility | What it does |
|---|---|
| `panel` | The card surface — card background, border, inset highlight + drop shadow |
| `grid-bg` | 32px faint dotted grid behind the whole app frame |
| `hero-gradient` | Diagonal amber→teal wash behind hero blocks |

### Typography

**Space Grotesk**, loaded in `__root.tsx` at weights 400/500/600/700. Headings use
`letter-spacing: -0.02em`.

| Use | Classes |
|---|---|
| Page title | `text-xl font-semibold` |
| Hero headline / stat number | `text-2xl font-semibold` |
| Body | `text-sm` |
| Meta, labels | `text-xs text-muted-foreground` |
| Eyebrow | `text-xs uppercase tracking-widest text-primary` |

---

## Build and deploy

```bash
npm run dev        # Vite dev server
npm run build      # Nitro build → .output/
npm run lint
```

The Docker build **must** set `NITRO_PRESET=node-server`. Without it Nitro auto-detects a Cloudflare
Worker preset and emits `wrangler.json` instead of a runnable `.output/server/index.mjs`. The runtime
image serves it with `node .output/server/index.mjs` on port 3000 — there is no nginx stage, because
this is SSR and not a static SPA.

---

## Known frontend gaps

Cleared in Phase 6 unless noted.

- Every mutation is a toast stub — nothing survives a refresh.
- `skillLibrary` (`agents.tsx`) and `memoryLayers` (`knowledge.tsx`) are hardcoded arrays; both move
  to API endpoints.
- The Memory builder tab shows fixed counts (511 files, 1,204 notes, 386 facts, 18 entries) that come
  from nowhere.
- Timestamps render as raw ISO until `date-fns` formatting is added.
- No polling for `running` runs — the Results page never updates on its own.
- `KnowledgeBase.type` union in `api.ts` is stale.
