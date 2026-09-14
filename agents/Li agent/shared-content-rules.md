# Shared Content Rules — Social Media Agent (LinkedIn)

Approved by Ritwik, 2026-09-14. Every LinkedIn post skill in `skills/` inherits these rules without exception. If a skill file and this file ever conflict, this file wins.

Two rules below are marked **OVERRIDE** — they replace the general 2026 industry research finding with Ritwik's own first-party data. Every other rule is taken directly from live 2026 research, sourced inline. Nothing here is assumed or invented.

---

## Length — OVERRIDE (Ritwik's data)

- **150–180 words per post.**
- This overrides the general 2026 B2B benchmark of 200–300 words / 1,300–2,500 characters ([ConnectSafely, 2026](https://connectsafely.ai/articles/ideal-linkedin-post-length-engagement-guide-2026)).
- Reason: a year of posting for Acefone, plus observation of leading LinkedIn marketers, showed shorter posts carrying **one clear message** outperform longer, explanatory posts for this audience.
- One narrative per post. If a draft is carrying two points, cut to the sharper one — don't compress both into the word count.

## Hook

- First line = a complete claim, not an announcement or a table of contents. ("Remote work didn't kill culture. Bad managers did" — not "Let's talk about remote work.")
- Must read in full before LinkedIn's "see more" cutoff: **≤140 characters** on mobile, **≤210 characters** on desktop. ([AuthoredUp, 2026](https://authoredup.com/blog/linkedin-character-limit))
- No emoji in the hook line.

## No external links in the post body

- An in-post external link cuts reach by roughly 60%; placing it in the first comment is also penalized as of 2026 — that workaround is patched. ([Forbes, 2026](https://www.forbes.com/sites/jodiecook/2026/07/30/the-linkedin-link-penalty-cutting-your-reach-by-60/))
- Never place a link in the post body or first comment. Route interested readers to the Featured section, the profile, DMs, or "comment and I'll send it."

## Hashtags

- 3–5 hashtags, placed at the end of the body after a blank line.
- Favor niche/industry-specific tags over generic ones — niche tags outperform generic by roughly 28% engagement. ([Meet-Lea, 2026](https://meet-lea.com/en/blog/linkedin-hashtags-statistics-effective-strategy))
- Capitalize each word inside multi-word hashtags for readability (`#B2BMarketing`, not `#b2bmarketing`).

## CTA

- Exactly one CTA per post. Match it to a specific goal: comment, save, share, DM, or follow — one sentence, one ask.
- Rotate the CTA type across the week's posts; don't repeat the same ask two runs in a row.
- Never use generic engagement bait ("Agree?", "Like if you..."). LinkedIn actively suppresses it as of 2026. ([ConnectSafely, 2026](https://connectsafely.ai/articles/linkedin-call-to-action-cta-best-practices-guide-2026))

## Formatting

- 1–3 sentence paragraphs, one blank line between each. Use a single blank line only — double blank lines collapse unpredictably in LinkedIn's renderer.
- Max 1–2 emojis in the whole post, used as visual anchors, not decoration.
- No Unicode bold/bullet-character formatting. LinkedIn's composer strips native bold/italics/bullets anyway, and heavy Unicode styling reads as AI-generated. ([Postory, 2026](https://postory.io/blog/how-to-format-linkedin-posts))

## What the algorithm actually rewards (context for drafting — not a checklist to game)

- Comments carry roughly 15x the ranking weight of likes; dwell time and comment depth are the two dominant 2026 ranking signals. ([Sprout Social, 2026](https://sproutsocial.com/insights/linkedin-algorithm/))
- The algorithm scores the creator's demonstrated topical expertise, not just the individual post — stay inside the pillars defined in KB-03 Positioning rather than posting off-topic for reach.
- Vague storytelling, clickbait, and overtly promotional language get reduced distribution.

## Frequency — OVERRIDE (Ritwik's decision)

- **3x/week**, not daily. Default schedule: Mon/Wed/Fri, 7:00 AM IST — see `../config.json`.
- Client accounts may run at a different cadence when their industry/niche genuinely requires it. Set the override in `../config.json` → `client_exceptions`. Never hardcode a different cadence into a skill file.

## Founder voice weighting (context, not a hard rule)

- Personal-profile posts get roughly 4.7% median engagement vs. 1–2% for company pages, and cost ~73% less per qualified engagement. ([DigitalApplied, 2026](https://www.digitalapplied.com/blog/linkedin-personal-profiles-vs-company-pages-8x-engagement))
- Where the content calendar leaves the choice open, prefer publishing from the founder/personal profile over a company page.
