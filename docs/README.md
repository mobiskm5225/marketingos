# Acefone Intelligence — Documentation

Internal multi-agent SEO and content analysis platform. AI agents analyze blog content and live URLs, write results to Notion, and log every run to PostgreSQL for cost tracking and observability.

---

## Docs Index

| File | Contents |
|---|---|
| [setup.md](./setup.md) | **Start here.** Prerequisites, install, env vars, running locally, ngrok webhook setup, troubleshooting |
| [architecture.md](./architecture.md) | System overview, data flow diagrams, directory structure, design patterns |
| [agents.md](./agents.md) | SEO Analyzer and Existing Blog Reviewer — pipeline steps, analysis frameworks, prompt structure, how to add a new agent |
| [api.md](./api.md) | All HTTP endpoints with request/response examples, auth details, error shapes |
| [database.md](./database.md) | PostgreSQL schema, Drizzle definitions, indexes, useful queries |
| [frontend.md](./frontend.md) | React component structure, routing, state management, API client, styles |

---

## Quick Reference

**Start everything:**
```bash
docker-compose up -d
cd backend && npm run dev
cd frontend && npm run dev   # new terminal
```

**Trigger an agent:**
```
http://localhost:3000/trigger
```

**API health check:**
```bash
curl http://localhost:8000/health
```

**Active agents:**
- `seo-analyzer` — Pre-publish draft content review (5-layer SEO framework)
- `blog-reviewer` — Post-publish live URL audit (SEO + AEO + AIO, 8 modules)

**Stack:** Node.js 18 · Express 5 · TypeScript · PostgreSQL 16 · Drizzle ORM · React 19 · Vite 8 · TanStack Query v5 · GPT-4o
