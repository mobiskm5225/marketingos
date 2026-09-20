---
name: email-onboarding-nurture-sequence
description: Draft a post-signup onboarding/nurture email sequence that moves a new trial or freemium user to their first activation milestone. Use when asked to write onboarding emails, an activation sequence, trial nurture emails, a "welcome sequence", or any drip campaign for a new SaaS signup.
---

# Onboarding & Nurture Sequence — Activation-Focused

Source of truth: [Onboarding & Nurture Sequence — Activation-Focused](https://app.notion.com/p/3cb892c0700f813689ebe031c0e725c3) in Reachify's Email Templates database (Format Key: `onboarding_nurture_sequence`). If this file and the Notion page disagree, Notion wins — re-export this file.

## When to use

Use this shell for any post-signup email sequence whose job is to move a new trial/freemium user to their first real activation milestone — not a generic "drip campaign." Fits B2B SaaS trial and freemium flows by default; adapt the milestone definition and cadence for other industries (e.g. marketplace first-transaction, app first-session). Not for cold prospecting (use `email-cold-outreach-sequence`) or recurring editorial content (use `email-newsletter`).

## Before drafting, gather

- Product name + core activation milestone definition (the one action "activation" means)
- Day 0 welcome action + a screenshot/visual to reference
- Checklist steps (max 3) tied to signup-captured goals
- Educational email topic (the most-overlooked high-value feature)
- Segmentation logic + criteria for disengaged vs. active branch
- Case study / workflow example for the active-user branch
- Trial length, upgrade path, and pricing/plan links
- Enterprise escalation contact or sales-assist path
- Sender name/persona and reply-to address
- Client's brand voice/positioning (pull from the client's Brand KB if one exists)

If any of these are missing, ask for them before drafting rather than inventing client-specific facts.

## Structure

1. **Email 1 — Day 0: Welcome + Quick Start.** Sent immediately on signup. Subject: direct, first-name personalization, outcome-focused (not "Welcome to [Product]"). Body: minimal explanation — resist the urge to describe the product — one concrete activation action only, shown as numbered steps with a screenshot/visual. Single primary CTA button pointing to that one action.
2. **Email 2 — Day 1–2: Personalized Onboarding Checklist.** Subject ties to the user's stated goal from signup and mentions a completion timeframe. Body: a checklist of 3 steps maximum, each tied to a job-to-be-done captured at signup, each step naming its specific outcome. CTA: link straight into the checklist/setup flow.
3. **Email 3 — Day 3–5: Educational / Quick Win.** Subject highlights an overlooked feature or a fast win. Body: one single actionable lesson — explain the automation/workflow benefit, deliver real value before any upsell language. CTA: feature-specific setup link.

   *Optional compression:* when the value item is a single asset/feature/template (not a multi-step lesson), Alex Hormozi's 3-step "Email SOP" works as a lightweight alternate copy pattern — "I made this for you" → what it is / how it helps (one line) → how to get it (single link). Keeps the email to 3 short lines; use the fuller lesson format above when the value needs walking through.
4. **Email 4 — Day 6–7: Segmented Check-in.** Branches by behaviour, not by time alone:
   - *Disengaged branch* — subject names the specific incomplete step; body explains what gap that creates and how little time completion takes; low-friction CTA to finish that one step.
   - *Active branch* — subject uses an industry/team-size case-study framing; body shows a real workflow example relevant to their segment for feature discovery; CTA into that workflow's setup.
5. **Email 5 — Day 8–10: Trial Reminder / Upgrade Nudge.** Subject quantifies the user's own progress (e.g. assets created, actions taken). Body acknowledges the concrete work already done, explains plainly what pauses at trial end, frames continuing as "resuming" rather than "buying." CTA: plan-selection link, with a human/sales escalation path for enterprise-sized accounts.

## Copy rules

- Trigger by behaviour/milestone completion where possible, not purely by elapsed time — skip ahead for users who are already advanced.
- Manage cognitive load: each email shares only what a new user needs right now; never a full feature list.
- Mobile-first formatting — the majority of opens are mobile; write for a real render, not just a desktop preview.
- Use visual instruction: numbered steps, screenshots at each step, colour-coded cards if listing multiple features.
- One activation-focused CTA per email — a single button pointing at the one action that matters for that stage.
- Segment by role, stated intent, or behavioural milestone — never send the same Day 6–7 email to an active power-user and a no-show.
- Measure activation-milestone completion, not opens/clicks alone.

## Output format

Return, per email in the sequence: subject line (2–3 options), full body copy, and the CTA. Flag if the Hormozi compression was used for Email 3 and why.

## Source note

Benchmarked against Userpilot's synthesis of real onboarding sequences from Grammarly, Asana, SurveyMonkey, Loom, Trello, Typeform, Todoist, Qualtrics, Clay, and ActiveCampaign (userpilot.com/blog/saas-onboarding-emails) — a recognised SaaS-onboarding authority, not a single first-party benchmark. The optional Day 3–5 compression is additionally benchmarked against Alex Hormozi's "Email SOP" (via swipefile.com, sourced from x.com). In both cases only structure/sequencing was extracted — never reuse subject lines or body copy from these sources verbatim in a client draft.
