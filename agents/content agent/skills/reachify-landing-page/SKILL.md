---
name: reachify-landing-page
description: Use when drafting a client's flagship product or homepage landing page — the page that carries the full buying argument, not a single feature. Format Key: landing_page.
---

# Landing Page — Full Structure

**Source:** Retape / product Resolve (retape.ai), YC W23. Structure and technique only — no copy is reused verbatim from Retape. Retape scored strongest of 10 audited YC SaaS sites for full-page narrative anatomy (Flesch Reading Ease 54.9 / grade 8.3).

## When to use

Use for a client's flagship product or homepage landing page — the page carrying the full buying argument, not a single feature.

## Structure

1. **Hero** — optional eyebrow tag → H1 problem-framed headline (2 lines max) → one-sentence subheadline → primary CTA + secondary link → live product visual alongside.
2. **Trust bar** — client logos, "used by / trusted by" line.
3. **Capability sections (numbered, repeat 3–5x)** — numbered eyebrow (01, 02, 03…) + category label → benefit-led H2 → 2–3 sub-feature cards (name + one-line description each).
4. **Risk-reversal / implementation section** — addresses switching cost, migration, guarantee, or onboarding timeline. Buyers stall here — don't skip it.
5. **FAQ** — pull in the `faq_block` template for this slot.
6. **Closing CTA band** — one unambiguous next step, not a menu of options.

## Copy rules (from benchmark)

- Keep sentences short — target Flesch Reading Ease 45–55 (grade 8–10). Plain English even for a technical buyer.
- Give recurring features a consistent naming device (persona names, module names, whatever fits the client) — it makes the product read as a system, not a feature list.
- One CTA verb per fold. Don't mix "Book a demo" / "Start trial" / "Sign up" in the same section.

## Fields to fill per client

- [ ] Problem statement (client's ICP pain, 1 sentence)
- [ ] Headline (benefit-led, 2 lines)
- [ ] Subheadline (1 sentence)
- [ ] Primary CTA label + secondary link label
- [ ] 3–5 capability categories, each with 2–3 sub-features
- [ ] Risk-reversal angle (migration ease / guarantee / free trial length)
- [ ] 5–10 FAQ questions, ordered by real buyer objection priority (via `reachify-faq-block`)

## Technical checklist before publishing

- Exactly one H1 on the page
- Every image has descriptive alt text
- Canonical tag + JSON-LD structured data present
- Target under 1.5 MB page weight and under 2.5s full load (Cone benchmark hit 102 KB / 1.37s — that's the ceiling to aim under, not the floor)

## Source note

Structure and technique only — no copy is reused verbatim from Retape. Do not carry this note into client-facing output; it exists for internal template governance only.
