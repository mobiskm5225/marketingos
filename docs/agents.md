# Agents

Two agents are live. A third (Wireframe Builder) is scaffolded for Phase 2.

---

## Agent 1 — SEO Analyzer

**Purpose:** Pre-publish SEO review of draft blog content. Input is raw text/markdown (no live URL needed).

**File:** `backend/src/agents/seo-analyzer/`

### Execution Paths

| Path | Entry | Input | Notion Write |
|---|---|---|---|
| Webhook | `run(pageId, jobId, source)` | Notion page blocks | Yes — creates "SEO Analysis" sub-page |
| Direct API | `runSeoAnalyzerDirect(title, content, url, jobId)` | Request body | No |

### Trigger Conditions (Webhook path)

The agent only processes a page if:
- Parent database ID matches `NOTION_DATABASE_ID`
- `SEO Status` property = `"Pending"`
- Page is not archived or in trash

### Pipeline Steps

```
1. Update SEO Status → "Processing"
2. getPageContent(pageId)             — fetch all block text
3. Strip metadata sections            — remove "Meta Elements", "Schema Markup", "Visual Suggestions"
4. getPageProperties(pageId)          — extract "Blog URL" value
5. callOpenAI(SEO_SYSTEM_PROMPT, content, url)
6. createSubpage(pageId, "SEO Analysis", result.text)
7. Update SEO Status → "Done"
8. Update agentJobs: status, tokens, costUsd
9. Insert agentResults: full markdown output
```

On any error: status → `"Error"`, errorMessage saved.

### Notion Database Requirements

The watched database must have:

| Property | Type | Required Values |
|---|---|---|
| `Blog URL` | URL | Optional — used for canonical analysis |
| `SEO Status` | Select | Pending, Processing, Done, Error |

### Analysis Framework — 5 Layers

Each layer scored /10. Output includes per-layer breakdown, specific issues, and priority actions.

**Layer 1: Technical Structure**
- Title tag: 50–60 chars, keyword in first 3 words
- Meta description: 150–160 chars, includes CTA
- URL slug: readable, keyword-rich, no stop words
- H1 count and target keyword presence
- H2/H3 hierarchy and logical flow

**Layer 2: Content Quality & Depth**
- Word count (minimum 1,500 for competitive terms)
- E-E-A-T signals (Experience, Expertise, Authoritativeness, Trust)
- Content freshness indicators
- Coverage gaps vs. top-ranking competitors
- Intro hook strength (first 100 words)

**Layer 3: Keyword Optimization**
- Primary keyword placement (title, first 100 words, ≥1 H2)
- Keyword density (target 1–2%, flags stuffing)
- LSI/semantic keywords (checks for 5–8+ related terms)
- Secondary keyword coverage in subheadings
- Cannibalization risk check

**Layer 4: Readability & UX**
- Flesch reading ease (target 60–70)
- Average sentence length (<20 words recommended)
- Paragraph length (2–4 sentences)
- List/table usage for scannability
- Visual break frequency (H2 or H3 every 300 words)

**Layer 5: Links & SERP Features**
- Internal links: 3–5, descriptive anchor text
- External links: 1–2 authority sources
- Featured snippet opportunity assessment
- Image alt text coverage
- Schema markup recommendation
- CTA placement and clarity

### Output Format

```markdown
# SEO Analysis: [Blog Title]

## Overall Score: X/50

## Layer 1: Technical Structure — X/10
[findings]

## Layer 2: Content Quality & Depth — X/10
[findings]

## Layer 3: Keyword Optimization — X/10
[findings]

## Layer 4: Readability & UX — X/10
[findings]

## Layer 5: Links & SERP Features — X/10
[findings]

## Priority Actions
1. [highest impact fix]
2. ...
```

Severity markers in headings automatically become colored callouts in Notion:
- `🔴` → red (Critical)
- `🟡` → amber (Warning)
- `🔵` → blue (Info)
- `🟢` → green (Good)

### Direct API

```
POST /api/agents/seo-analyzer
Content-Type: application/json

{
  "title": "string (required)",
  "content": "string (required)",
  "url": "string (optional)"
}

→ 200 { "jobId": "...", "status": "accepted" }
```

---

## Agent 2 — Existing Blog Reviewer

**Purpose:** Post-publish audit of a live blog URL. Crawls the page, then runs a multi-lens SEO+AEO+AIO review.

**File:** `backend/src/agents/blog-reviewer/`

### Execution Paths

| Path | Entry | Input | Notion Write |
|---|---|---|---|
| Webhook | `run(pageId, jobId, source)` | Notion page (with Blog URL) | Yes — creates "SEO Review" sub-page |
| Direct API | `runBlogReviewerDirect(title, url, jobId)` | Request body | No |

### Trigger Conditions (Webhook path)

- Parent database ID matches `BLOG_REVIEW_DB_ID`
- `Review Status` property = `"Pending"`
- Page has a valid `Blog URL` property

### Pipeline Steps

```
1. Update Review Status → "Processing"
2. getPageProperties(pageId)           — fetch "Blog URL"
3. crawlUrl(blogUrl)                   — Cheerio + Readability scrape
4. Build structured crawl summary      — headings, meta, word count, links
5. callOpenAI(BLOG_REVIEW_PROMPT, crawlData)
6. createSubpage(pageId, "SEO Review", result.text)
7. Update Review Status → "Done"
8. Update agentJobs: status, tokens, costUsd
9. Insert agentResults: full markdown output
```

### Notion Database Requirements

| Property | Type | Required Values |
|---|---|---|
| `Name` | Title | Blog post name |
| `Blog URL` | URL | Live published URL |
| `Review Status` | Select | Pending, Processing, Done, Error |

### Crawl Data Collected

The crawler (`core/crawler.ts`) extracts via Cheerio + @mozilla/readability:

| Field | Description |
|---|---|
| `title` | `<title>` tag text |
| `metaDescription` | `<meta name="description">` content |
| `h1[]` | All H1 texts |
| `h2[]` | All H2 texts |
| `h3[]` | All H3 texts |
| `bodyText` | Clean article text (Readability algorithm) |
| `wordCount` | Word count of bodyText |
| `internalLinks[]` | Links to same domain (deduplicated) |
| `externalLinks[]` | Links to other domains (deduplicated) |
| `imageAlts[]` | All image alt attributes |

Body text is capped at 12,000 characters before sending to GPT-4o to stay within context limits.

### Analysis Framework — 3-Lens, 8-Module

The prompt first determines the primary optimization lens, then scores accordingly.

**Step 0: Strategic Intent Assessment**

| Lens | Description | Best for |
|---|---|---|
| SEO | Classic search ranking | High-volume, competitive keywords |
| AEO | Answer Engine Optimization | Featured snippets, PAA, voice search |
| AIO | AI Optimization | ChatGPT/Perplexity/Gemini citation |

**Scoring Matrix**

| Module | SEO Weight | AEO Weight | AIO Weight |
|---|---|---|---|
| On-Page SEO | 20 | 12 | 10 |
| Content Quality & E-E-A-T | 20 | 18 | 22 |
| Keyword & Query Analysis | 15 | 12 | 8 |
| AEO Signals | 10 | 22 | 15 |
| AIO & Citation Readiness | 8 | 10 | 22 |
| Readability & UX | 12 | 12 | 12 |
| Technical Signals | 8 | 7 | 5 |
| Conversion Alignment | 7 | 7 | 6 |
| **Total** | **100** | **100** | **100** |

**Module Details**

| # | Module | Key checks |
|---|---|---|
| 1 | On-Page SEO | Title tag, meta desc, H1, H2/H3 structure, URL slug, keyword in first 100 words |
| 2 | Content Quality & E-E-A-T | Word count, author credentials, source citations, originality, conversion relevance |
| 3 | Keyword & Query Analysis | Primary keyword placement, density, LSI coverage, intent match, cannibalization |
| 4 | AEO Signals | Direct answer paragraph (40–60 words), question-based headings, lists/tables, FAQ schema |
| 5 | AIO Citation Readiness | Factual density, named author, quotable statements, topical completeness, source credibility |
| 6 | Readability & UX | Flesch-Kincaid score, sentence/paragraph length, active voice, subheading frequency |
| 7 | Technical Signals | Internal/external link count, image alt coverage, schema types, canonical tag, intro length |
| 8 | Conversion Alignment | CTA presence and clarity, next-step path, commercial links, lead magnet opportunity |

### Output Format

```markdown
# SEO Review: [Blog Title]
**URL:** [crawled URL]  **Date:** [ISO date]  **Primary lens:** SEO/AEO/AIO

## Overall Score: XX/100

## Module Scores
| Module | Weight | Score | Severity |
|--------|--------|-------|----------|
| On-Page SEO | 20 | 15 | 🟡 |
...

## Detailed Findings
[per-module analysis]

## Missing Topics
[5–7 content gap suggestions]

## Priority Action List
1. [highest impact, quickest win]
...7.

## Machine-Readable Summary
\`\`\`json
{ "score": 74, "lens": "SEO", "topIssues": [...] }
\`\`\`
```

### Direct API

```
POST /api/agents/blog-reviewer
Content-Type: application/json

{
  "title": "string (required)",
  "url": "string (required — must be publicly accessible)"
}

→ 200 { "jobId": "...", "status": "accepted" }
```

---

## Agent 3 — Wireframe Builder (Placeholder)

**Status:** Scaffolded, not implemented. Phase 2.

**Planned purpose:** Generate content wireframes from a brief or keyword target. Output: structured page layout with section recommendations and content guidelines.

**File:** `backend/src/agents/wireframe-builder/index.ts`

---

## Adding a New Agent

1. Create folder: `backend/src/agents/<name>/`
2. Create `index.ts` — export object implementing `AgentHandler`:
   ```typescript
   export const myAgent: AgentHandler = {
     agentName: 'my-agent',
     statusProperty: 'My Status',
     async run(pageId: string, jobId: string, source?: string) {
       // pipeline here
     },
   };
   ```
3. Create `prompt.ts` — export `MY_SYSTEM_PROMPT: string`
4. Register in `backend/src/registry.ts`:
   ```typescript
   if (process.env.MY_DB_ID) {
     map.set(process.env.MY_DB_ID.replace(/-/g, ''), myAgent);
   }
   ```
5. Add route in `backend/src/routes/agents.ts` for direct API access
6. Add `MY_DB_ID` to `.env` and `.env.example`
7. Create Notion database with correct status property

No other files change.
