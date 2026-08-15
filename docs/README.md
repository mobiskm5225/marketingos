# Marketing OS — Documentation

Internal multi-agent SEO and marketing platform. AI agents analyze content, gather market data, and log every run to PostgreSQL for cost tracking and observability. The frontend serves as a centralized hub for managing agents, knowledge bases, and models.

---

## Docs Index

| File | Contents |
|---|---|
| [setup.md](./setup.md) | **Start here.** Prerequisites, install, env vars, running locally, ngrok webhook setup, troubleshooting |
| [architecture.md](./architecture.md) | System overview, data flow diagrams, directory structure, design patterns |
| [agents.md](./agents.md) | Pipeline steps, analysis frameworks, prompt structure, how to add a new agent |
| [api.md](./api.md) | All HTTP endpoints with request/response examples |
| [database.md](./database.md) | PostgreSQL schema, Drizzle definitions, indexes, useful queries |
| [frontend.md](./frontend.md) | React component structure, TanStack Start routing, mock data, styles |

---

## Quick Reference

**Start everything:**
```bash
docker-compose up -d
cd backend && npm run dev
cd frontend && npm run dev   # new terminal
```

**API health check:**
```bash
curl http://localhost:8000/health
```

**Active agents:**
- `atlas` — Campaign Strategist
- `quill` — Long-form Writer
- `scout` — Market Researcher

**Stack:** Node.js 18 · Express 5 · TypeScript · PostgreSQL 16 · Drizzle ORM · React 19 · TanStack Start · Tailwind CSS v4 · GPT-4o
