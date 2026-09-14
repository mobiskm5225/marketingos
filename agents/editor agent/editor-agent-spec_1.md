# Editor Agent — Spec

**Component**: Agent 7 — Editor Agent (Quality Gate)
**Project**: Marketing Agent OS
**Version**: 1.0 | September 2026
**Owner**: Ritwik (prompt, rubric) + Mobi (trigger + UI integration)
**Status**: Spec complete. Ready for build.
**Companion file**: `editor-agent-system-prompt.md`

---

## 1. BLUF

The Editor Agent is the **last machine gate before the human gate**. Every draft produced by the Blog Agent, Email Campaign Skill, and Li Agent is automatically routed to it. It runs a brand voice check and a weighted quality rubric, applies twelve hard-fail compliance gates, returns a numeric score with a PASS / REVISE / FAIL verdict, and writes a structured review layer back to Notion — never overwriting the draft. Every verdict is logged and reconciled against the human reviewer's decision, producing the calibration data that improves both the Editor and the generating agents.

**What it does not do**: it does not rewrite content, it does not publish, and it does not edit its own rubric.

---

## 2. Field summary

| Field | Detail |
|---|---|
| **Deliverable** | Editorial QA layer on every content output (blog, email, LinkedIn) |
| **Volume** | ~12 blogs + 2 email campaigns + 12–16 LinkedIn posts = **26–30 runs/month**, plus revision cycles |
| **Trigger** | Notion status webhook — fires on `SEO Review Complete` (blog), `Draft Complete` (email, LinkedIn) |
| **Inputs** | Draft (Notion), KB (voice profile, ICP, positioning, funnel stages), Content Template matched on `Format Key`, rubric file, source URLs cited in draft |
| **Outputs** | Review layer on the same Notion page: score card, gate results, verdict, prioritised revision brief. Plus one row in Editor Log. |
| **Tools** | Claude Sonnet, Notion MCP, Web Fetch (source verification only) |
| **Human gate** | Human reads draft + review layer, accepts or overrides the verdict, logs the override reason |
| **Execution model** | One API call per draft per cycle. Never batched across drafts or profiles. |
| **Learning loop** | Weekly calibration routine reconciles Editor verdicts against human decisions; rubric changes are human-approved, never self-applied |
| **Hard constraints** | Never edits the draft body. Never publishes. Never modifies its own rubric. Max 2 revision cycles per draft. |
| **Routines eligible** | ❌ No for the review call (needs Web Fetch on arbitrary source URLs). ✅ Yes for the weekly calibration routine (Notion MCP only). |

---

## 3. Where it sits in the pipeline

```
BLOG
  Blog Agent → "Draft Complete"
    → SEO Review Agent → "SEO Review Complete"
      → EDITOR AGENT → "Editor Approved" | "Revision Required" | "Rejected"
        → Human gate → "Approved" → Publish

EMAIL
  Email Campaign Skill → "Draft Complete"
    → EDITOR AGENT → verdict
      → Human gate → send

LINKEDIN
  Li Agent → "Draft Complete" (2–3 variants)
    → EDITOR AGENT → scores each variant, ranks them, verdict per variant
      → Human gate → variant selection + reasoning
```

**Why Editor runs after SEO Review, not before**: SEO Review can add a recommended title tag, meta description and structural adjustments. Editing before that means the Editor scores a draft that is about to change. Running last means the Editor scores what the human will actually read.

**Why it is a separate call, not embedded**: same rationale as Decision 5 in the master architecture. A failed edit pass must never delete or block a draft that already landed in Notion. The draft survives; only the verdict changes.

---

## 4. Brand voice check

The voice check is the first module the Editor runs, because a voice breach is cheap to detect and expensive to leave in.

### 4.1 Inputs
- **Client/brand voice doc** (KB) — tone attributes, banned terminology, approved terminology, sentence rhythm, POV rules
- **Profile voice doc** (LinkedIn only) — one per profile, never blended
- **Positioning + Differentiators** (KB) — for claim consistency
- **Last 5 approved outputs** in the same format — the live drift reference

### 4.2 What it checks

| # | Check | Method |
|---|---|---|
| V1 | Tone attribute match | Score draft against each named tone attribute (e.g. "direct", "practitioner", "no hype") 1–5, average |
| V2 | Banned terminology | Exact + fuzzy match against the KB banned list; every hit cited with line reference |
| V3 | Approved terminology usage | Product, feature and category names spelled and cased as the KB defines |
| V4 | Sentence rhythm | Mean sentence length and variance vs the last 5 approved outputs; flag if outside ±25% |
| V5 | POV and person | First/second/third person consistent with the format's rule; no drift mid-piece |
| V6 | Claim posture | No superlatives or category claims the Positioning doc does not authorise |
| V7 | AI-tell language | Detects the standard register: "delve", "in today's fast-paced", "it's not just X, it's Y", "unlock/leverage/robust" stacking, tricolon overuse, empty transitional throat-clearing, uniform paragraph length |
| V8 | Profile fidelity (LinkedIn) | Draft matches the named profile's voice doc only. Cross-profile bleed = automatic gate breach |

### 4.3 Output
A voice sub-score (0–12, folded into core dimension C2) plus a line-referenced list of every breach with the KB rule it violates and a suggested fix. The Editor suggests; it does not apply.

---

## 5. Quality rubric

Structure: **Shared Editorial Core (60 pts) + Channel Module (40 pts) = 100**.

### 5.1 Shared Editorial Core — 60 pts

| ID | Dimension | Pts | What earns full marks |
|---|---|---|---|
| C1 | **Factual integrity & sourcing** | 15 | Every statistic, date, figure and named claim traces to a live, named, primary-where-possible source. No orphan numbers. Sources dated and current. |
| C2 | **Brand voice & tone fidelity** | 12 | Passes V1–V8 above with zero banned-term hits and no AI-tell register |
| C3 | **Structural template compliance** | 10 | Every mandatory module of the mapped Content Template is present and in order; optional modules dropped deliberately, not by omission |
| C4 | **Clarity & readability** | 8 | Paragraphs 2–3 lines; sentence length varied; no unexplained jargon on first use; one idea per paragraph; active voice dominant |
| C5 | **Audience & funnel fit** | 8 | Matches the mapped ICP's reader-state and the TOFU/MOFU/BOFU goal from the Funnel Stages KB. CTA matches stage. |
| C6 | **Originality & differentiation** | 7 | Carries a POV or first-party detail no competitor piece has. Not a restatement of the top 3 SERP results. |

### 5.2 Blog / long-form module — 40 pts

| ID | Dimension | Pts | Standard |
|---|---|---|---|
| B1 | **AI-answer readiness (GEO/AEO)** | 14 | Answer-first block of 40–60 words under each question heading; strict H1→H2→H3 hierarchy; headings framed as questions where natural; a verifiable, sourced fact roughly every 150–200 words; at least one list or table; an FAQ block where the format allows |
| B2 | **E-E-A-T signals** | 10 | Byline/credentials excluded from scoring — added by the client's CMS at publish, never present in a draft. Scored instead on: "who / how / why" answerable from the page content; first-hand experience or original data present; claims specific rather than generic; AI assistance disclosed where the format requires it |
| B3 | **Search metadata & keyword discipline** | 8 | Title tag ≤60 chars, meta description 140–160 chars, primary keyword in H1 and first 100 words, semantic coverage of the SERP's subtopics, no stuffing |
| B4 | **Internal linking & conversion path** | 8 | 3+ contextual internal links to existing KB-registered content; one CTA matched to funnel stage; no dead or placeholder links |

### 5.3 Email module — 40 pts

| ID | Dimension | Pts | Standard |
|---|---|---|---|
| E1 | **Subject line & preview text** | 10 | 3+ subject variants supplied; ≤50 chars preferred; preview text written, not auto-truncated body; subject accurately describes the content (deception is a gate, not a deduction) |
| E2 | **Offer clarity & single CTA** | 8 | One primary action per email; value stated before the ask; sequence logic coherent across emails |
| E3 | **Deliverability hygiene** | 12 | Spam-trigger vocabulary within threshold; ≤3 links per email plus unsubscribe; text-to-image ratio ≥60:40; no URL shorteners; plain-text alternative present; alt text on every image; no all-image emails |
| E4 | **Compliance block** | 10 | Valid physical postal address; working unsubscribe honoured within 10 business days; RFC 8058 one-click `List-Unsubscribe` header on marketing sends; accurate From/Reply-To identifying the sender; advertising nature clear; recorded lawful basis for the segment |

### 5.4 LinkedIn module — 40 pts

| ID | Dimension | Pts | Standard |
|---|---|---|---|
| L1 | **Hook strength** | 12 | First 2 lines (~200 characters before "see more") create a specific, honest reason to expand. No clickbait, no bait-and-switch against the payoff. |
| L2 | **Dwell-time architecture** | 10 | 150–300 words; single-line breaks; scannable blocks; the payoff lands at the end, not the middle; reads in 30+ seconds without padding |
| L3 | **Profile voice fidelity** | 10 | Matches the named profile's voice doc; the structural signature the profile uses (for Ritwik: Moment → People → Meaning → Open Door, em-dashes, P.S. closer); no first-person experience the profile owner did not have |
| L4 | **Distribution hygiene** | 8 | No external link in the post body (first comment instead); 3–5 relevant hashtags maximum; CTA invites a substantive comment, not "thoughts?"; no engagement-bait phrasing |

---

## 6. Pass / fail gate

### 6.1 Two-layer decision

**Layer 1 — Critical gates.** Binary. Any breach = FAIL regardless of score, **unless a scoped, human-declared exception covers that specific element** (§6.4).

Gates fall into two classes:

- **Waivable (G1–G8, G11)** — a declared exception in the brief suppresses the breach for the named element only.
- **Absolute (G9, G10, G12)** — email compliance and confidentiality. Never waivable, by anyone, for any reason. A declared exception naming one of these is ignored and logged as an invalid waiver.

| ID | Gate | Applies to | Class |
|---|---|---|---|
| G1 | Fabricated, uncited or unverifiable statistic, figure or named claim | All | Waivable |
| G2 | Cited source is dead, paywalled beyond verification, or does not contain the claim | All | Waivable |
| G3 | Verbatim reuse beyond a quoted-and-attributed passage; benchmark structure copied as copy | All | Waivable |
| G4 | Political, religious or socio-economic content | All | Waivable |
| G5 | Banned terminology, competitor disparagement, or a claim the Positioning doc does not authorise | All | Waivable |
| G6 | A mandatory module of the mapped Content Template is missing | All | Waivable |
| G7 | Unsubstantiated performance or ROI claim — no named source, or a customer result used without recorded consent | All | Waivable |
| G8 | Competitor comparison claim without dated, cited evidence | All | Waivable |
| G9 | Email: missing physical address, missing or broken unsubscribe, missing one-click `List-Unsubscribe`, or deceptive subject/header | Email | **Absolute** |
| G10 | Email: no recorded lawful basis (consent or documented legitimate interest) for the target segment | Email | **Absolute** |
| G11 | LinkedIn: external link in the post body, cross-profile voice bleed, or fabricated first-person experience | LinkedIn | Waivable |
| G12 | PII, client-confidential data, or unreleased product information exposed | All | **Absolute** |

**Layer 2 — Weighted score.**

| Score | Verdict | Notion status | Action |
|---|---|---|---|
| ≥ 85 | **PASS** | `Editor Approved` | Routes to human gate |
| 70–84 | **REVISE** | `Revision Required` | Prioritised revision brief written back; generating agent re-runs |
| < 70 | **FAIL** | `Rejected — Rewrite` | Draft returned with a rewrite brief; counts against the agent's monthly quality metric |
| any gate breach | **FAIL** | `Rejected — Gate` | Named gate + evidence written back. Never routes to human gate. |

### 6.2 Cycle limits
Maximum **2 revision cycles** per draft. A draft still below 85 after cycle 2 is escalated to the human with the full score history rather than looping again. Every run carries a `cycle_no` and an idempotency key so a webhook re-fire cannot restart the loop.

### 6.3 Floor rule
No channel module dimension may score below 50% of its weight, even if the total clears 85. A draft with a perfect core and a broken hook is not a pass.

### 6.4 Exception register

Content will legitimately deviate from a template. A client category with no meaningful evaluation criteria, a client-supplied figure sourced internally, an approved quote reproduced verbatim — these are correct decisions, not defects. Without a way to declare them, the Editor hard-fails on G6 or G1, the generating agent resubmits the same deviation, and the pipeline loops.

**Exceptions are declared by a human, at brief stage, in the brief.** The Editor reads them at context load. **It never asks — not on webhook runs, not on manual runs.** An interactive prompt would block an async pipeline on a human who is not there.

#### Fields (on the brief, propagated into the draft record by the generating agent)

| Field | Type | Content |
|---|---|---|
| `template_exceptions` | multi-select | Scoped waivers, one per line: `drop:<module>` · `add:<element>` · `waive:<gate_id>:<element>` |
| `exception_rationale` | text | One line per exception. Mandatory — an exception without a rationale is invalid and does not suppress its gate. |
| `exception_author` | person | Who declared it. Must be a human. |

Example:

```
template_exceptions:  drop:evaluation_criteria_block
                      waive:G1:q3_pipeline_figure
                      waive:G3:client_boilerplate_para
exception_rationale:  Category has no meaningful eval criteria — comparison is
                      price and support tier only.
                      Q3 pipeline figure is client-internal, sourced to their
                      CRM export dated 12 Aug. No public source exists.
                      Boilerplate paragraph is the client's own approved copy,
                      supplied for verbatim use.
exception_author:     Ritwik
```

#### Rules

1. **Human-authored only.** A generating agent may **flag** a conflict it encountered (`exception_flagged`) but may not declare one. A flagged-not-declared conflict routes to the human on cycle 2; it never suppresses a gate.
2. **Scoped, never blanket.** `waive:G1:q3_pipeline_figure` suppresses G1 for that named element alone. Every other unsourced figure in the same draft still fires G1. There is no way to disable a gate wholesale.
3. **Rationale mandatory.** No rationale = invalid exception = gate fires normally.
4. **Absolute gates cannot be waived.** A waiver naming G9, G10 or G12 is ignored, the gate fires, and the invalid waiver is logged for weekly calibration.
5. **Never silent.** Every applied waiver is stamped on the score card, written to the Editor Log, and reported in weekly calibration. A draft that passed on three waivers reads differently from one that passed clean, and the human gate must be able to see that.
6. **C3 denominator adjusts.** A `drop:<module>` exception removes that module from C3's required set, so C3 scores out of what is genuinely mandatory for this piece rather than penalising a deliberate choice.
7. **Expiry.** Exceptions are per-draft. They do not carry forward to the next piece on the same `Format Key`. A deviation recurring across three or more drafts is surfaced in calibration as a **template amendment request** — the right fix for a recurring exception is a better template, not a standing waiver.

#### Loop prevention — cycle-aware G6

| Cycle | Undeclared missing mandatory module |
|---|---|
| 1 | G6 fires as normal. `Rejected — Gate`, returned to the agent. Most of the time it genuinely is an omission. |
| 2 | If the module is still missing **and** the agent has attached `exception_flagged` with a rationale, G6 downgrades to a soft flag. Score proceeds; verdict routes to the human as `exception_pending` with the rationale attached. |

A draft can therefore bounce **at most once** on the same structural issue. Cycle 3 does not exist for G6.

---

## 7. Trigger architecture

### 7.1 Mechanism
Notion native automation on status change → webhook → Mobi's orchestration layer → one Claude API call.

| Producing component | Fires on status | Editor input |
|---|---|---|
| Blog Research + Writing Agent → SEO Review Agent | `SEO Review Complete` | Draft + SEO layer + brief |
| Email Campaign Skill | `Draft Complete` | Full sequence, all emails in one call |
| Li Agent | `Draft Complete` | All variants for one profile in one call |

### 7.2 Rules
1. **One draft = one call.** Email sequences are one call because the Editor must judge sequence coherence. LinkedIn variants for a single profile are one call because it must rank them. Never batch across profiles or clients.
2. **Idempotency.** Key = `page_id + cycle_no`. A duplicate webhook returns the cached verdict.
3. **Never overwrite.** The review layer is written to dedicated fields on the same page. The draft body is read-only to the Editor.
4. **Failure handling.** Max 3 fetch attempts per source URL. On persistent failure the source is flagged `unverified` and G2 fires. On agent failure, a row is written to the Notion Error Log and status reverts to the pre-Editor value — the draft is never left in limbo.
5. **Kill switch.** A `Skip Editor` checkbox on the draft page allows the human to bypass the gate for urgent work; every bypass is logged and reviewed weekly.

---

## 8. Content template mapping

The Editor loads its rubric profile by matching the draft's `Format Key` against the Content Templates database (`data_source_id: c86208a8-b69d-464d-b5e4-7adfbce14418`), then layers the channel module on top.

| `deliverable_type` | `Format Key` | Core | Channel module | Template-specific mandatory modules |
|---|---|---|---|---|
| blog_post (TOFU) | `tofu_educational` | ✔ | Blog | Definition block, scannable subheads, no hard sell, next-step link to MOFU |
| blog_post (MOFU) | `mofu_comparison_buyers_guide` | ✔ | Blog | Comparison table, evaluation criteria, differentiator angle from KB, balanced framing |
| blog_post (BOFU) | `bofu_objection_competitor_comparison` | ✔ | Blog | Objection→response pairs, dated competitor evidence, migration/switch path, direct CTA |
| case_study | `case_study` | ✔ | Blog | Client context, problem, intervention, named metric with consent, quote, outcome |
| landing_page | `landing_page` | ✔ | **Website** (added 13 Sept) | Hero, benefit stack, social proof, FAQ, single conversion goal |
| feature_page | `feature_page` | ✔ | **Website** | Four-question above-fold test, workflow-ordered deep-dives, proof, security badges where technical |
| faq_block | `faq_block` | ✔ | **Website** (W1/W4 often n/a — component format, see rubric note) | Real objections, answer-first, every answer adds information, no marketing evasion |
| social_proof_stack | `social_proof_stack` | ✔ | **Website** (W1/W4 often n/a — component format) | Named attribution, consent recorded, no fabricated testimonials |
| lean_hero_benefit_copy | `lean_hero_benefit_copy` | ✔ | **Website** (component format) | Single-sentence value prop, benefit not feature, one CTA |
| email_campaign | `email_campaign` | ✔ | Email | Sequence goal, per-email structure (subject/preheader/CTA/compliance), trigger logic, exit conditions |
| linkedin_post | `linkedin_post` | ✔ | LinkedIn | Moment, People, Meaning, Open Door — all four required; ≤200-char hook before "see more"; no external link in body; single profile voice doc only |
| thought_leadership | *(pending)* | ✔ | Blog (B3 dropped, C6 weighted up) | Contrarian POV, first-party evidence, named stake |
| sales_enablement | *(pending)* | ✔ | Core only, ×1.67 | Objection coverage, positioning accuracy, no unauthorised claims |
| competitor_content | *(pending)* | ✔ | Blog | Dated evidence per claim, visible metrics only, no reach/impression claims |
| performance_report | *(pending)* | ✔ | Core only, ×1.67 | Period comparison, data provenance, recommendation tied to a number |

**Unmapped `Format Key`**: the Editor runs Core + best-matching channel module, scores it, and flags `template_unmapped` in the review layer so the gap surfaces in the weekly calibration.

> **Update (13 Sept 2026)**: added the **Website module** (W1–W4, 40 pts — above-fold clarity/CTA discipline, trust & proof signals, technical/Core-Web-Vitals hygiene, form/conversion-path friction) to `editor-rubric-v1.0.md`, covering the 5 website-format templates above, which previously scored Core only. **Open question, not yet resolved**: none of these 5 formats currently appear in the trigger list (§7) — the Editor only auto-fires on Blog Agent, Email Campaign Skill and Li Agent output. The Website module is ready to score them the moment they're either (a) added to the trigger list, or (b) run manually. Decide which before shadow mode includes website formats.

---

## 9. Quality scoring framework

### 9.1 Score card written to Notion

```
EDITOR REVIEW — cycle 1 of 2
Verdict: REVISE (78/100)
Format: mofu_comparison_buyers_guide | Channel: Blog

CRITICAL GATES              PASS (12/12)
  Waivers applied           1 — G1:q3_pipeline_figure (Ritwik, 04 Sep)

SHARED CORE                 44/60
  C1 Factual integrity      11/15   2 unsourced figures — §3, §5
  C2 Brand voice             9/12   "leverage" ×3 (banned); AI-tell in intro
  C3 Template compliance     8/10   Comparison table present; criteria block missing
  C4 Clarity                 7/8
  C5 Audience & funnel fit   6/8    CTA is TOFU-level for a MOFU piece
  C6 Originality             3/7    Restates top-3 SERP framing; no first-party angle

BLOG MODULE                 34/40
  B1 AI-answer readiness    11/14   No answer-first block under H2 #2 and #4
  B2 E-E-A-T                 8/10   "How" implicit rather than stated (byline/credentials excluded from scoring — CMS-added at publish)
  B3 Metadata                7/8    Title tag 68 chars
  B4 Internal links & CTA    8/8

FLOOR RULE                  PASS (no dimension below 50%)

REVISION BRIEF (priority order)
1. [C1] Source or remove the two figures in §3 and §5.
2. [C6] Add the first-party angle — Acefone migration data is in the KB.
3. [B1] Add 40–60 word answer-first blocks under H2 #2 and #4.
4. [C2] Replace 3× "leverage"; rewrite the intro's first two sentences.
5. [C5] Swap the CTA to the MOFU demo path.
6. [B3] Cut the title tag to ≤60 characters.
```

### 9.2 Fields

**On the brief** (human-authored, propagated into the draft record by the generating agent):
`template_exceptions` (multi-select) · `exception_rationale` (text) · `exception_author` (person)

**On the draft page** (Editor-written):
`editor_verdict` (select) · `editor_score` (number) · `editor_cycle` (number) · `gate_breaches` (multi-select) · `waivers_applied` (multi-select) · `invalid_waivers` (multi-select) · `exception_flagged` (text — agent-raised conflict, never a waiver) · `score_card` (text) · `revision_brief` (text) · `editor_run_at` (date) · `template_matched` (text) · `human_override` (select) · `override_reason` (select) · `human_notes` (text)

### 9.3 Rolling metrics (Editor Log)
Per agent, per month: pass rate at cycle 1, mean score, mean cycles to pass, top-3 failing dimensions, gate breach frequency by gate ID, human override rate, **waiver frequency by gate ID, and share of passes that depended on a waiver**.

---

## 10. Feedback framework — self-learning loop

The Editor improves by being **measured against the human**, not by editing itself. Nothing in this loop changes a prompt or a rubric without human approval.

### 10.1 Capture — at the human gate
The human records one of four override codes when they act on the Editor's verdict:

| Code | Meaning | Signal |
|---|---|---|
| `agree` | Verdict was right | Editor calibrated |
| `false_block` | Editor failed/flagged something acceptable | Editor too strict — false positive |
| `missed_issue` | Editor passed something the human had to fix | Editor too lenient — false negative |
| `wrong_priority` | Verdict right, revision brief mis-ranked | Weighting drift |

Plus free-text notes. This is the only human input the loop requires — roughly 20 seconds per draft.

### 10.2 Weekly calibration routine
Runs Monday. Notion MCP only, so it is Routines-eligible.

1. **Editor precision/recall** — `false_block` and `missed_issue` rates overall and per gate. Any gate above a 15% false-positive rate over 20+ runs is flagged for rubric review.
2. **Dimension validity** — correlation between each dimension's score and the human's actual edit volume. A dimension that does not predict human edits is a candidate for reweighting or removal.
3. **Generating-agent drift** — top-3 recurring failure dimensions per agent. Delivered as a "known weaknesses" block appended to that agent's next-cycle context, so the Blog Agent stops repeating the same C6 failure.
4. **Threshold check** — distribution of scores against the 85/70 thresholds. A bimodal or over-clustered distribution means the thresholds are mis-set.
5. **Template gaps** — every `template_unmapped` flag from the week, queued as a Content Template build request.
6. **Waiver audit** — every waiver applied, by gate. Three or more waivers of the same gate on the same `Format Key` is a template amendment request, not a standing exception. Any invalid waiver (an attempt to waive G9, G10 or G12) is reported by name, because it means someone believes a compliance gate is negotiable.
7. **Waiver dependence** — share of passes that required a waiver. A rising trend means the templates are drifting away from the work, not that the content is improving.

Output: one **Editor Calibration Report** page in Notion with proposed rubric changes.

### 10.3 Rubric change control
- The rubric is a **versioned file**, not agent memory. `editor-rubric-v1.x.md`.
- The Editor may **propose** weight changes, new checks, or gate retirements in the calibration report. It may not apply them.
- Ritwik approves or rejects each proposal. Approved changes bump the version, and the version is stamped on every subsequent score card so historical scores stay interpretable.
- Rubric changes are frozen for 4 weeks after a change, to accumulate clean comparison data.

### 10.4 Voice-drift feedback
Every human edit made *after* an `Editor Approved` verdict is diffed against the approved draft. Recurring edit patterns (a phrase always cut, a structure always reordered) are surfaced monthly as proposed additions to the KB voice doc's banned/approved lists — closing the loop back into C2 and V2.

---

## 11. Hard constraints

1. The Editor never edits the draft body. It scores and briefs; the generating agent or the human rewrites.
2. The Editor never publishes and never changes status to `Approved` — only to its own three verdict states.
3. The Editor never modifies its own rubric, thresholds, or gate list.
4. Maximum 2 revision cycles; escalate to human on cycle 3.
5. Every claim the Editor makes about a draft is line-referenced. No unevidenced verdicts.
6. Every run writes an Editor Log row, pass or fail.
7. Every failure writes to the Notion Error Log with timestamp, component and error type.
8. A gate breach never routes to the human gate as approved — it always returns to the agent.
9. The Editor never asks a question mid-run, in any trigger mode. Exceptions come from the brief or they do not exist.
10. The Editor never creates, edits or infers an exception. It reads declared exceptions and applies them; it cannot waive a gate on its own judgement.
11. G9, G10 and G12 are never waivable, whatever the brief says. An attempt is ignored and logged.
12. Every applied waiver is stamped on the score card and in the Editor Log. No silent passes.

---

## 12. Build sequence

| Step | Task | Owner |
|---|---|---|
| 1 | Create Editor Log + Editor Calibration Report tables in Notion | Ritwik |
| 2 | Add the 11 editor fields to Blog Drafts, Email Drafts, LinkedIn Drafts | Ritwik |
| 3 | Write `editor-rubric-v1.0.md` as a standalone versioned file | Ritwik |
| 4 | Finalise system prompt; test against 10 historical drafts with known human verdicts | Ritwik |
| 5 | Build the status-change webhook + idempotency + cycle counter | Mobi |
| 6 | Wire the review-layer write-back and score card rendering | Mobi |
| 7 | Build the human-gate override capture UI (4 codes + notes) | Mobi |
| 8 | Configure the weekly calibration routine | Mobi |
| 9 | Shadow mode: 2 weeks scoring without blocking, to calibrate thresholds | Both |
| 10 | Go live as a blocking gate | Both |

**Shadow mode is not optional.** Thresholds set without calibration data will either block good work or wave through bad work, and both erode trust in the gate on week one.

---

## 13. Research basis

Standards encoded in the rubric, with sources:

| Rubric element | Source |
|---|---|
| B2 E-E-A-T, "who/how/why", AI disclosure, originality over rewriting | [Google — Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| B1 answer-first blocks, strict heading hierarchy, fact density, lists/tables/FAQ, named authorship | [WRITER — GEO, AEO, and SEO in 2026](https://writer.com/blog/geo-aeo-optimization/) |
| E4 one-click List-Unsubscribe (RFC 8058), 48-hour unsubscribe processing, spam rate <0.1%, SPF/DKIM/DMARC, 5,000/day bulk threshold | [Google — Email sender guidelines FAQ](https://support.google.com/a/answer/14229414?hl=en) |
| E4 / G9 accurate headers, non-deceptive subject, advertising disclosure, physical address, opt-out honoured within 10 business days | [FTC — CAN-SPAM Act: A Compliance Guide for Business](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) |
| G10 lawful basis, consent standard, Art. 21(2) objection right, B2B individual addresses in scope | [GDPR email marketing — consent, legal bases and ePrivacy](https://www.igdpr.eu/en/gdpr-email-marketing-consent/) |
| L1/L2/L4 dwell time, 150–300 words, first-hour engagement, external-link suppression, format performance | [Teract — LinkedIn Algorithm 2026 technical deep dive](https://www.teract.ai/resources/linkedin-algorithm-2026) |
| C6 originality weighting; rationale for a human-calibrated rather than autonomous loop | [CMI — B2B Content and Marketing Trends 2026](https://contentmarketinginstitute.com/b2b-research/b2b-content-marketing-trends-research) (n=1,015; 95% AI adoption, 12% report *decreased* quality, 74% credit strategy refinement over technology) |

**Confidence note**: Google, FTC and CMI figures are primary-source. The LinkedIn algorithm numbers are from a secondary analysis — LinkedIn does not publish algorithm weights — so L-module thresholds should be treated as directional and re-tuned against Reachify's own post performance during shadow mode.
