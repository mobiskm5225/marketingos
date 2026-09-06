# Editor Rubric

**Version**: 1.0
**Status**: Unvalidated — pre-shadow-mode. Every band boundary and weight in this file is a design estimate, not a measured threshold.
**Owner**: Ritwik
**Change control**: §7. The Editor Agent may propose changes to this file. It may not apply them.
**Consumed by**: `editor-agent-system-prompt.md`. Loaded per run. Version stamped on every score card.

---

## CHANGE LOG

| Version | Date | Change | Approved by |
|---|---|---|---|
| 1.0 | Sept 2026 | Initial rubric. 18 dimensions, 12 gates, 5-band scoring model. | Ritwik |

**Freeze rule**: after any version bump, this file is frozen for 4 weeks so comparison data accumulates against a stable rubric. Mid-window changes make the calibration report meaningless.

---

## 1. THE BAND MODEL

Every dimension is scored on the same five bands. Only the point values differ.

| Band | Name | Share | Meaning |
|---|---|---|---|
| **L4** | Full | 100% | Meets every criterion. Nothing for a human to do here. |
| **L3** | Strong | ~75% | One minor miss. Shippable without rework; a human might tweak it. |
| **L2** | Adequate | ~50% | Meets the dimension's intent but needs targeted fixes. |
| **L1** | Weak | ~25% | Fails the dimension's purpose. Needs rework, not editing. |
| **L0** | Absent | 0% | Not attempted, or actively wrong. |

### Point conversion

| Max | L4 | L3 | L2 | L1 | L0 |
|---|---|---|---|---|---|
| 15 | 15 | 11 | 8 | 4 | 0 |
| 14 | 14 | 11 | 7 | 4 | 0 |
| 12 | 12 | 9 | 6 | 3 | 0 |
| 10 | 10 | 8 | 5 | 3 | 0 |
| 8 | 8 | 6 | 4 | 2 | 0 |
| 7 | 7 | 5 | 4 | 2 | 0 |

**No intermediate values.** The Editor picks a band; it does not award 13/15. Half-bands are how a rubric becomes vibes with numbers attached — the discipline of choosing L3 or L4 is what makes scores comparable across runs.

**Floor rule interaction**: L2 is the floor for channel-module dimensions. Any channel dimension at L1 or L0 breaches the floor rule and blocks a pass regardless of total. Core dimensions have no floor.

---

## 2. SHARED EDITORIAL CORE — 60 points

### C1 — Factual integrity & sourcing (15)

*Purpose: nothing in this piece can be shown to be false or unsupported.*

| Band | Descriptor |
|---|---|
| **L4** (15) | Every statistic, date, figure and named claim carries a live, named source. Primary sources used where one exists. All sources current for the claim's context. Zero orphan numbers. |
| **L3** (11) | All claims sourced, but one or more relies on a secondary source where a primary was available, or one source is materially dated without acknowledgement. |
| **L2** (8) | One or two unsourced figures or claims, each individually fixable by adding a citation or cutting a sentence. |
| **L1** (4) | Three or more unsourced claims, or the piece's central argument rests on an unsupported assertion. |
| **L0** (0) | Sourcing largely absent, or sources present but decorative — cited pages don't support the claims attached to them. |

> **Relationship to G1/G2**: a single unsourced figure scores L2 *and* fires G1. The gate governs whether it ships; the score governs how far the draft is from good. They are not redundant — a draft can clear all gates and still score L2 here through dated or secondary sourcing.

### C2 — Brand voice & tone fidelity (12)

*Purpose: it sounds like the client, not like a language model.*

| Band | Descriptor |
|---|---|
| **L4** (12) | Passes V1–V8. Zero banned-term hits. Sentence rhythm within ±25% of the last 5 approved outputs. No AI-tell register anywhere. Claim posture matches Positioning. |
| **L3** (9) | One banned-term hit, or one isolated AI-tell construction, or rhythm marginally outside the band. Voice is recognisable throughout. |
| **L2** (6) | Two to three banned terms, or AI-tell register concentrated in one section (typically the intro or conclusion). Voice recognisable but inconsistent. |
| **L1** (3) | AI-tell register throughout, or the piece reads as generic B2B copy that could belong to any vendor in the category. |
| **L0** (0) | Wrong voice entirely — wrong person, wrong posture, or (LinkedIn) another profile's voice. |

**AI-tell reference list** (non-exhaustive; extend from calibration data):
`delve` · `in today's fast-paced` · `it's not just X, it's Y` · stacked `leverage / unlock / robust / seamless / streamline` · tricolon overuse (three-item lists as a default rhythm) · empty transitional sentences (`Let's dive in`, `But here's the thing`) · uniform paragraph length across the whole piece · `In conclusion` · hedged non-claims (`can potentially help`)

### C3 — Structural template compliance (10)

*Purpose: the piece is built to the shape the format requires.*

| Band | Descriptor |
|---|---|
| **L4** (10) | Every mandatory module of the mapped template present, in the template's order. Optional modules included or dropped as deliberate choices. |
| **L3** (8) | All mandatory modules present, one out of sequence, or one optional module dropped where it would clearly have helped. |
| **L2** (5) | One mandatory module missing or present in name only (heading with no substance under it). |
| **L1** (3) | Two or more mandatory modules missing, or the piece follows a different format's shape entirely. |
| **L0** (0) | No discernible relationship to the mapped template. |

**Denominator adjustment**: a valid `drop:<module>` exception removes that module from the required set before scoring. C3 scores out of what is genuinely mandatory *for this piece*. A declared drop never costs points.

**If `template_unmapped: true`**: score C3 against the nearest channel's general structural expectations, cap at L3, and note the cap on the score card. The piece cannot be held to a template that does not exist.

### C4 — Clarity & readability (8)

*Purpose: a busy reader gets it on one pass.*

| Band | Descriptor |
|---|---|
| **L4** (8) | Paragraphs 2–3 lines. Sentence length visibly varied. Every term of art explained on first use. One idea per paragraph. Active voice dominant. |
| **L3** (6) | Broadly clean; one or two long paragraphs, or one unexplained term. |
| **L2** (4) | Recurring long paragraphs or uniform sentence length; passive constructions frequent; two or more terms assumed rather than explained. |
| **L1** (2) | Dense throughout. Reader must re-read to follow the argument. |
| **L0** (0) | Incoherent, or so jargon-dense the intended reader cannot parse it. |

> **Known weakness**: this is the most subjective dimension in the rubric and the most likely to be scored inconsistently run-to-run. Flagged for shadow-mode review — if it doesn't predict human edits, reweight or replace with a computed readability measure.

### C5 — Audience & funnel fit (8)

*Purpose: right reader, right stage, right ask.*

| Band | Descriptor |
|---|---|
| **L4** (8) | Reader-state matches the ICP profile. Content goal matches the TOFU/MOFU/BOFU definition in Funnel Stages. CTA is stage-appropriate. Assumed knowledge level correct throughout. |
| **L3** (6) | Correct stage and audience; CTA slightly off-stage, or one section pitched at the wrong knowledge level. |
| **L2** (4) | CTA belongs to a different funnel stage, or the piece addresses a secondary persona rather than the ICP. |
| **L1** (2) | Stage and content are mismatched — e.g. a TOFU educational brief written as a bottom-funnel pitch. |
| **L0** (0) | Wrong audience entirely. |

### C6 — Originality & differentiation (7)

*Purpose: this piece could not have been produced by any competitor's AI.*

| Band | Descriptor |
|---|---|
| **L4** (7) | Carries a stated POV, first-party data, or a practitioner detail found nowhere in the SERP. A reader learns something the top three results don't teach. |
| **L3** (5) | Familiar material, but organised or framed in a way that adds genuine clarity. One original angle or example. |
| **L2** (4) | Competent synthesis of existing sources. Nothing wrong, nothing new. |
| **L1** (2) | Restates the top-three SERP results in different words. |
| **L0** (0) | Generic category content. Swap the brand name and it belongs to anyone. |

> **Scoring discipline**: L2 is the *default* for a clean, well-written piece with no original input. Do not award L3 for good prose. The question is not "is this well made" — C4 asks that — it is "does this exist elsewhere already".

---

## 3. BLOG / LONG-FORM MODULE — 40 points

### B1 — AI-answer readiness / GEO-AEO (14)

| Band | Descriptor |
|---|---|
| **L4** (14) | Answer-first block of 40–60 words under every question heading. Strict H1→H2→H3, no skipped levels. Headings framed as questions where natural. A sourced, verifiable fact roughly every 150–200 words. At least one list or table. FAQ block present where the format allows. |
| **L3** (11) | All structural elements present; one or two headings lack an answer-first block, or fact density thins in one section. |
| **L2** (7) | Answer-first blocks present in under half the sections, or heading hierarchy skips a level, or no list/table anywhere. |
| **L1** (4) | Prose-only. No extractable structure. Headings are topical labels with no question framing and no lead answers. |
| **L0** (0) | No heading structure at all. |

### B2 — E-E-A-T signals (10)

| Band | Descriptor |
|---|---|
| **L4** (10) | Named author with a credentials line. Who/how/why all answerable from the page. First-hand experience or original data present. Claims specific rather than categorical. AI assistance disclosed where the format requires it. |
| **L3** (8) | Byline present but thin (name, no credentials), or "how" is implicit rather than stated. Everything else in place. |
| **L2** (5) | Byline only, no experience signal, claims generic. The page does not establish why this source should be believed. |
| **L1** (3) | Anonymous, no experience signal, and claims stated categorically without support. |
| **L0** (0) | Anonymous and the content contradicts the brand's own stated expertise. |

### B3 — Search metadata & keyword discipline (8)

**Largely deterministic — compute before the model reads the draft.**

| Band | Descriptor |
|---|---|
| **L4** (8) | Title tag ≤60 chars. Meta description 140–160 chars. Primary keyword in H1 and within the first 100 words. Subtopics from the SERP covered. No stuffing. |
| **L3** (6) | One measurement out of band (e.g. title at 64 chars), everything else correct. |
| **L2** (4) | Two or more out of band, or a significant SERP subtopic uncovered. |
| **L1** (2) | Metadata missing or auto-generated; keyword absent from H1. |
| **L0** (0) | No metadata, or keyword stuffing that would read as manipulative. |

### B4 — Internal linking & conversion path (8)

| Band | Descriptor |
|---|---|
| **L4** (8) | Three or more contextual internal links to KB-registered content, anchored in relevant text. One CTA, matched to funnel stage. All links resolve. |
| **L3** (6) | Two internal links, or one link anchored on generic text ("click here"), CTA correct. |
| **L2** (4) | One internal link, or CTA present but stage-mismatched. |
| **L1** (2) | No internal links, or a placeholder/dead link present. |
| **L0** (0) | No internal links and no CTA. |

---

## 4. EMAIL MODULE — 40 points

### E1 — Subject line & preview text (10)

| Band | Descriptor |
|---|---|
| **L4** (10) | Three or more distinct subject variants (distinct in *angle*, not just wording). Preferred length ≤50 chars. Preview text purpose-written. Subject accurately describes the body. |
| **L3** (8) | Three variants but two are near-identical, or preview text present but weak. |
| **L2** (5) | Fewer than three variants, or preview text left to auto-truncate from the body. |
| **L1** (3) | Single subject line, no preview text. |
| **L0** (0) | No subject line, or a subject that misrepresents the content (also fires G9). |

### E2 — Offer clarity & single CTA (8)

| Band | Descriptor |
|---|---|
| **L4** (8) | One primary action per email. Value established before the ask. Sequence logic coherent — each email earns the next. |
| **L3** (6) | Single CTA per email; one email in the sequence asks before it gives, or sequence pacing is slightly off. |
| **L2** (4) | One email carries two competing CTAs, or the sequence's narrative doesn't build. |
| **L1** (2) | Multiple competing CTAs across the sequence; no clear primary action. |
| **L0** (0) | No discernible offer or action. |

> **Scored across the whole sequence, not per email.** A campaign is one artefact.

### E3 — Deliverability hygiene (12)

**Largely deterministic — compute before the model reads the draft.**

| Band | Descriptor |
|---|---|
| **L4** (12) | Spam-trigger vocabulary within threshold. ≤3 links plus unsubscribe. Text-to-image ≥60:40. No URL shorteners. Plain-text alternative present. Alt text on every image. |
| **L3** (9) | One measurement marginally out (4 links, or 55:45 text-to-image), no shorteners, plain-text present. |
| **L2** (6) | Two out of band, or plain-text alternative missing. |
| **L1** (3) | URL shortener present, or image-heavy with minimal text, or spam vocabulary concentrated in subject and first paragraph. |
| **L0** (0) | All-image email, or a construction that would predictably land in spam. |

### E4 — Compliance block (10)

**Deterministic presence checks. Absence fires G9 — this dimension scores completeness and quality, the gate scores existence.**

| Band | Descriptor |
|---|---|
| **L4** (10) | Valid physical postal address. Working unsubscribe, honoured within 10 business days. RFC 8058 one-click `List-Unsubscribe` header on marketing sends. Accurate From/Reply-To identifying the sender. Advertising nature clear. Lawful basis recorded for the segment. |
| **L3** (8) | All elements present; one is technically compliant but poorly placed or hard to find. |
| **L2** (5) | All statutory elements present but the advertising nature is ambiguous, or the unsubscribe requires more than one click. |
| **L1** (3) | An element present in form only — e.g. an unsubscribe link that routes to a preference centre requiring login. |
| **L0** (0) | A statutory element missing. Also fires G9 (absolute — not waivable). |

---

## 5. LINKEDIN MODULE — 40 points

### L1 — Hook strength (12)

| Band | Descriptor |
|---|---|
| **L4** (12) | First two lines (~200 chars before "see more") give a specific, concrete reason to expand. The body delivers exactly what the hook promised. |
| **L3** (9) | Hook works but opens on a general observation before reaching the specific. Body delivers. |
| **L2** (6) | Generic opening ("Most marketers get this wrong"), or the hook promises more than the body delivers. |
| **L1** (3) | No hook — the post opens mid-thought or with context nobody asked for. Or clickbait with an unrelated payoff. |
| **L0** (0) | First two lines are throat-clearing or a restated headline. |

### L2 — Dwell-time architecture (10)

| Band | Descriptor |
|---|---|
| **L4** (10) | 150–300 words. Single-line breaks. Scannable blocks. Payoff lands at the end. Reads in 30+ seconds without padding. |
| **L3** (8) | Length correct, structure sound; the payoff arrives slightly early or the closing tails off. |
| **L2** (5) | Outside the word band, or wall-of-text formatting, or the strongest line is buried mid-post. |
| **L1** (3) | Too short to earn dwell time, or padded to length with filler. |
| **L0** (0) | Unformatted block with no reading structure. |

### L3 — Profile voice fidelity (10)

| Band | Descriptor |
|---|---|
| **L4** (10) | Matches the named profile's voice doc and structural signature. *(Ritwik: Moment → People → Meaning → Open Door; em-dashes; P.S. closer; 150–210 words.)* No first-person experience the owner didn't have. |
| **L3** (8) | Voice correct; structural signature partially applied (e.g. no P.S., or Meaning underweighted). |
| **L2** (5) | Recognisably the right person but the signature structure is absent — reads as a generic post in their tone. |
| **L1** (3) | Generic professional voice with no profile identity. |
| **L0** (0) | Another profile's voice, or a fabricated first-person claim. Also fires G11. |

### L4 — Distribution hygiene (8)

**Largely deterministic.**

| Band | Descriptor |
|---|---|
| **L4** (8) | No external link in the post body. 3–5 relevant hashtags. CTA invites a substantive comment. No engagement bait. |
| **L3** (6) | Hashtag count slightly off (2, or 6–7), everything else clean. |
| **L2** (4) | Generic CTA ("Thoughts?"), or hashtags irrelevant to the content. |
| **L1** (2) | Engagement bait ("Comment YES if you agree"), or no CTA at all. |
| **L0** (0) | External link in the post body. Also fires G11. |

### Multiple variants
Score each variant independently and completely. Then rank, and state in one sentence why the top variant wins — naming the dimension that separates them, not a general impression. The human still chooses.

---

## 6. CRITICAL GATES — detection and evidence

### 6.1 Evidence format

Every gate result uses one line:

```
G{n} | {PASS | FAIL | WAIVED} | §{location} | {observation} | {rule reference}
```

Examples:

```
G1 | FAIL | §3 ¶2 | "43% of teams report..." — no citation | C1/G1: all figures sourced
G2 | FAIL | §5 ¶1 | forrester.com/... returns 404 after 3 attempts | source must be live
G6 | PASS | — | all 7 mandatory modules present | mofu_comparison_buyers_guide
G1 | WAIVED | §4 ¶3 | q3_pipeline_figure — client CRM export, 12 Aug | Ritwik, 04 Sep
G9 | FAIL | footer | no physical postal address | ABSOLUTE — not waivable
```

**A FAIL with no evidence line is invalid.** The Editor may not fail a draft on an unevidenced judgement.

### 6.2 Gate reference

| ID | Class | Detection method | Common false positive |
|---|---|---|---|
| **G1** | Waivable | Scan for numerals, percentages, dates, named entities and definitive claims. Each requires an adjacent citation. Orphan number = fail. | Rounded illustrative figures ("a handful of vendors"); the brand's own product specs |
| **G2** | Waivable | Web Fetch every cited URL, max 3 attempts. Then containment check: does the page support the claim? Persistent fetch failure → `unverified` → fail. | Paywalled sources that are legitimate; JS-rendered pages that fetch empty |
| **G3** | Waivable | Compare against the benchmark source behind the mapped template. Structure permitted, copy not. Quoted-and-attributed passages exempt. | Standard industry phrasing that has no alternative wording |
| **G4** | Waivable | Topic classification against the off-limits list. | Legitimate mentions of regulation, market conditions or public policy affecting the client's category |
| **G5** | Waivable | Exact + fuzzy match on the KB banned list; claim posture checked against the Positioning doc's authorised claim set. | Banned term appearing inside a quotation or a competitor's own product name |
| **G6** | Waivable | Structural diff against the template's required modules. Declared `drop:` exceptions removed from the set first. **Cycle-aware — see §6.3.** | A module present under a differently-worded heading |
| **G7** | Waivable | Every quantified outcome claim must resolve to a cited source or a consent-flagged client record. | Qualitative language read as a performance claim ("cut handling time significantly") — **tighten to quantified claims only if this misfires in shadow mode** |
| **G8** | Waivable | Every comparative assertion needs both a source and a date. Undated = fail. | Comparisons against the client's own prior state rather than a competitor |
| **G9** | **ABSOLUTE** | Presence checks: physical address, functioning unsubscribe, RFC 8058 header, From/Reply-To accuracy, subject-body consistency. | — |
| **G10** | **ABSOLUTE** | Lawful basis field on the target segment record must be populated and valid. **Cannot be checked from the draft alone.** If the field does not exist in Notion, G10 cannot run — decide at build time whether it fails open or blocks. | — |
| **G11** | Waivable | Link detection in post body; profile voice-doc cross-check; first-person experience claims flagged for human confirmation. | A first-person claim the owner *did* live but which isn't in their voice doc |
| **G12** | **ABSOLUTE** | PII pattern matching; client-confidential markers; unreleased product name matching against the roadmap. | Publicly announced features misread as unreleased |

### 6.3 G6 cycle logic

| Cycle | Undeclared missing mandatory module |
|---|---|
| 1 | Fires normally → `Rejected — Gate` → returned to the generating agent |
| 2 | Still missing **and** `exception_flagged` present with a rationale → downgrade to soft flag → score proceeds → route to human as `exception_pending` |

A draft bounces at most once on the same structural issue.

---

## 7. EXCEPTION VALIDATION

Run before gates. Each declared exception passes four checks or it is invalid.

```
1. Rationale present?          No  → INVALID, gate fires normally
2. Author is a human?          No  → INVALID, treat as exception_flagged
3. Names G9, G10 or G12?       Yes → INVALID, log to invalid_waivers, gate fires
4. Names a specific element?   No  → INVALID (blanket waivers are not permitted)
```

All four pass → apply to the named element **only**. Every other instance of that gate in the draft still fires.

Record: `waivers_applied` (valid) · `invalid_waivers` (rejected, with reason) · both stamped on the score card.

**The Editor never authors, infers or widens an exception.** It reads and applies.

---

## 8. SCORING PROCEDURE

1. Validate exceptions (§7).
2. Verify sources — fetch and containment-check every cited URL.
3. Run all 12 gates. Any unwaived breach → FAIL, stop, write evidence. No score computed.
4. Run deterministic checks (§9) and record the measurements.
5. Score C1–C6, then the channel module. One band per dimension. Every deduction carries a location reference.
6. Sum. Apply the floor rule — any channel dimension at L1 or L0 caps the verdict at REVISE.
7. Map to verdict: ≥85 PASS · 70–84 REVISE · <70 FAIL.
8. Write the revision brief, ordered by point recovery, capped at six items.

### Tie-break rules
- **Between two bands, choose the lower.** A rubric that rounds up stops discriminating within a month.
- **Score what is there, not what was intended.** A brief promising original data doesn't earn C6 points if the draft lacks it.
- **One defect, one dimension.** An unsourced statistic is C1. Do not also deduct C6 for it. Double-counting is how a good draft scores 71.

---

## 9. DETERMINISTIC PRE-CHECKS

These require no model judgement and should run in code before the Editor call. Roughly 15–18 of the 100 points, computed identically every time.

| Check | Feeds | Measurement |
|---|---|---|
| Title tag length | B3 | characters, target ≤60 |
| Meta description length | B3 | characters, target 140–160 |
| Keyword in H1 / first 100 words | B3 | boolean |
| Heading level sequence | B1 | no skipped levels |
| Internal link count + resolution | B4 | count, HTTP status per link |
| Word count | L2 | target 150–300 |
| Hashtag count | L4 | target 3–5 |
| External link in post body | L4 / G11 | boolean |
| Link count per email | E3 | ≤3 plus unsubscribe |
| Text-to-image ratio | E3 | target ≥60:40 |
| URL shortener present | E3 | boolean |
| Plain-text alternative | E3 | boolean |
| Alt text coverage | E3 | % of images |
| Physical address present | E4 / G9 | boolean |
| Unsubscribe present + resolves | E4 / G9 | boolean + HTTP status |
| `List-Unsubscribe` header | E4 / G9 | boolean |
| Banned-term hits | C2 / G5 | count + locations |
| Citation-to-claim ratio | C1 / B1 | claims per source, words per sourced fact |

Passing these as computed inputs makes the scores stable and cuts the model's work to the parts that actually need judgement.

---

## 10. CALIBRATION ANCHORS

Reference points for what each band of the total means. **Replace these with real drafts after shadow mode** — these are constructed illustrations, not observed cases.

| Total | Verdict | What it looks like |
|---|---|---|
| **92** | PASS | Sourced throughout, on-voice, template-complete, carries a first-party angle. Human publishes with a light proofread. |
| **86** | PASS | Solid across the board, C6 at L2 (competent synthesis, nothing new). Ships, but it's not a piece anyone forwards. |
| **83** | REVISE | Two or three targeted fixes — a missing citation, a stage-mismatched CTA, a thin byline. Twenty minutes of work. |
| **78** | REVISE | The worked example in the spec. Multiple dimensions at L2; the originality gap is the real problem. |
| **68** | FAIL | Structural issues plus voice drift. Faster to rewrite from the brief than to patch. |
| **any** | FAIL | Unwaived gate breach. Score irrelevant. |

---

## 11. KNOWN WEAKNESSES IN v1.0

Stated plainly so shadow mode has a hypothesis list rather than a blank page.

1. **Every weight and threshold is a design estimate.** Nothing here has been validated against a real draft.
2. **C4 (clarity) is the most subjective dimension** and the most likely to score inconsistently between runs on the same input. Candidate for replacement with a computed measure.
3. **C6's 7 points may be too low.** It is the dimension that most separates the work from commodity AI content, and it carries the least weight in the core.
4. **G7 will probably over-fire.** "Unsubstantiated performance claim" catches ordinary positioning language. If the false-positive rate runs high on the first 30 drafts, restrict it to quantified claims.
5. **G10 cannot run without a consent field** on the segment record. If that field doesn't exist, decide explicitly whether G10 fails open or blocks — do not leave it ambiguous.
6. **G1 is waivable by design decision.** This is the deliberate risk in v1.0: G1 is the gate that stops fabricated statistics reaching a client, and it is the failure mode an LLM produces most reliably. Scoping and the audit trail mitigate it. Watch the waiver rate — if G1 waivers become routine, move it to absolute and handle client-internal data with a `source:internal:<record>` annotation that proves provenance instead of skipping the check.
7. **Band boundaries are unvalidated.** The gap between L3 and L2 in particular may not be where the human's ship/fix decision actually falls.

---

*Rubric v1.0. Unvalidated. Do not treat any number in this file as evidence-based until shadow mode has run.*
