# Reachify — Email Marketing Agent: Spec

*Last updated: 2026-09-06*
*Author: Ritwik (with Claude, Reachify Marketing OS build)*

## 1. Purpose & Scope

The Email Marketing Agent drafts email campaigns for Reachify clients — onboarding/nurture sequences, cold outreach/sales sequences, and newsletters, to start. It is a **separate agent from the Content Marketing Agent**, not a skill bolted onto it.

**Why separate:** email campaigns vary by use case (onboarding vs. outreach vs. newsletter) *and* by client industry far more than website/blog content does. A landing page or blog post follows one of ~9 structural shells regardless of client; an email campaign needs a different structural shell *and* different tone/cadence rules depending on both the use case and the vertical. Bundling that into the Content Marketing Agent's routing table would have overloaded a single `Content Format` dimension with a second, orthogonal variable (industry). A separate agent keeps both agents' routing logic simple.

**In scope (v1):** Onboarding & Nurture Sequence, Cold Outreach / Sales Sequence, Newsletter — Editorial / Insight Format.

**Explicitly out of scope (v1), queued for later:** re-engagement/win-back, product launch, cart abandonment, event/webinar invite, renewal/upsell. Add these the same way the first 3 were built — research a benchmark, get it approved, add a Format Key + skill.

## 2. Architecture

Mirrors the Content Marketing Agent's S1–S3 pipeline pattern (S1 Brand KB Loader → S2 Routing → S3 LLM Router), adapted for the extra industry/use-case dimension:

```
┌─────────────────────┐     ┌──────────────────────┐     ┌───────────────────────┐
│  S1 — KB Loader      │     │  S2 — Routing         │     │  S3 — LLM Router /     │
│                      │     │                       │     │  Generation            │
│ • Client Brand KB    │────▶│ Match request to:     │────▶│ Load matching skill    │
│   (ICP, positioning, │     │  - Email Type          │     │  (SKILL.md) +          │
│   voice — reused     │     │    (Format Key)        │     │  Email Templates page  │
│   from Content Agent)│     │  - Primary Industry Fit│     │  + Fundamentals doc +  │
│ • Email Templates DB │     │    (if client industry │     │  client Brand KB       │
│ • Email Copywriting  │     │    has a closer-fit    │     │  → generate draft      │
│   Fundamentals doc   │     │    template later)     │     │                        │
└─────────────────────┘     └──────────────────────┘     └───────────────────────┘
                                                                       │
                                                                       ▼
                                                          ┌───────────────────────┐
                                                          │  QA / Review layer     │
                                                          │  (human approval before│
                                                          │  send — no autonomous  │
                                                          │  sending in v1)        │
                                                          └───────────────────────┘
```

**S1 — KB Loader** pulls three inputs per job: (1) the client's existing Brand KB — ICP, positioning, voice — already built for the Content Marketing Agent, reused here rather than duplicated; (2) the matched Email Templates page (structural shell); (3) the Email Copywriting Fundamentals doc (cross-cutting technique — subject lines, hooks, tone — layered on top of whichever structural shell is in play).

**S2 — Routing** matches the request to a `Format Key` the same way the Content Agent's S2 does, keyed on `Email Type` first. `Primary Industry Fit` is currently descriptive text on each template (not yet a routing dimension) — treat it as a *v2 routing key* once enough industry-specific templates exist to route on. Until then, all 3 templates are industry-agnostic shells the skill adapts per client.

**S3 — LLM Router / Generation** loads the skill file matching the routed Format Key (see §6) and generates the draft using the loaded KB. One skill per Format Key, not one consolidated skill — keeps each skill file self-contained and independently testable/updatable.

**QA/Review layer:** no autonomous sending in v1. Every draft returns to a human for approval, same as the Content Marketing Agent's current state (0 active clients, Phase 1 — Build).

## 3. Knowledge Base Inputs

| Source | Type | URL |
|---|---|---|
| Email Templates | Notion database (structural shells, keyed by Format Key) | https://app.notion.com/p/9740b71aa5e943098f24b27a267ab5d8 |
| Email Copywriting Fundamentals | Notion page (technique-level, cross-cutting) | https://app.notion.com/p/3cb892c0700f81e19b8cd74dd43f6c78 |
| Reachify Command Center | Parent hub (both linked under Quick Navigation) | https://app.notion.com/p/355892c0700f818ba015dc329d25357f |
| Content Templates (reference pattern) | Notion database — the Content Marketing Agent's analogous KB | https://app.notion.com/p/c4c651c7c1d34b6e883aff82b2560d2e |
| Client Brand KB (per client) | Notion — ICP, positioning, differentiators, funnel stages | Reused from Content Marketing Agent structure, not rebuilt |

## 4. Format Key / Routing Table (v1)

| Format Key | Email Type | Skill file | Status |
|---|---|---|---|
| `onboarding_nurture_sequence` | Onboarding / Nurture Sequence | `email-onboarding-nurture-sequence` | Approved |
| `cold_outreach_sales_sequence` | Cold Outreach / Sales Sequence | `email-cold-outreach-sequence` | Approved |
| `newsletter_editorial_format` | Newsletter | `email-newsletter` | Approved |

Each Format Key row in the Email Templates DB carries: Name, Email Type, Primary Industry Fit, Source Site (benchmark), YC Batch, Status, Benchmark Report, Shortlist Review, Last Updated. See the DB itself for the live schema.

## 5. Skill Files (this package)

Three Claude Skill packages, one per Format Key, in `skills/`. Each `SKILL.md` is self-contained: structure, copy rules, a fields-to-fill checklist, the relevant cross-cutting fundamental(s) folded in as an optional pattern, and a source note. They're written to work two ways:

1. **As installable Claude Skills** — drop each folder into a Claude Skills directory (or a Cowork plugin) and Claude will trigger the matching skill from its `description` frontmatter.
2. **As structured prompt content for the custom LLM router** — the body of each `SKILL.md` is plain markdown with no Claude-specific syntax, so Mobi's S3 router can load the same file as a system-prompt fragment/reference doc without translation.

If the skill content and the Notion template content ever drift, **Notion is the source of truth** — these skill files are a snapshot as of this doc's date. Re-export when a template page changes materially.

## 6. Output Contract

Every generated draft should return:
- Subject line (2–3 options where the format calls for one — onboarding and cold outreach; newsletters typically need only one, tied to the issue's hook)
- Full body copy for each email in the sequence (or the single newsletter issue)
- The Fields to fill checklist from the matching template, filled in with the actual client inputs used (for QA traceability)
- A one-line note if an optional fundamental (e.g. the Hormozi compression, or Matt Gray's plain-text pattern) was applied, and why

## 7. Open Items / Next Steps

- Build S1/S2/S3 as actual code (this spec describes the target architecture; nothing here is wired up yet — Notion KB + skill files are the content layer, not the pipeline).
- Add remaining Format Keys as client demand surfaces: re-engagement/win-back, product launch, cart abandonment, event/webinar invite, renewal/upsell.
- Once 2+ industry-specific variants of the same Email Type exist, promote `Primary Industry Fit` from descriptive text to a routing dimension (mirrors how `Content Format` works today — will need the same "add to schema before creating pages" discipline).
- Keep growing the Email Copywriting Fundamentals doc; re-sync into skill files periodically rather than on every single addition (avoid churn).
