# Email Campaign — Sequence Structure

## Research note (read before the template)

The brief asked for "top 10 marketing agencies' recommendations." Worth being upfront about what live research actually turned up: creative/marketing agencies (Ogilvy, WPP shops, VaynerMedia and similar) publish case studies and POV pieces, but not granular, checkable email specs — that level of detail comes from the ESPs and deliverability authorities practitioners actually rely on (Klaviyo, HubSpot, Litmus, Mailchimp, GetResponse) and from B2B-specific operational playbooks. A "top 10 B2B email agencies" ranking exists (DesignRush), but its ordering is sponsored placement, not a performance ranking — so it's cited below as agency discovery, not as a source of best-practice specifics. The technical rules in this template come from the platforms and playbooks that actually publish them, cited per claim.

## When to use

For any multi-email sequence produced by the Email Campaign Skill — onboarding, nurture, re-engagement, win-back, or launch flows. Not for one-off broadcast announcements (a single promotional send has different rules — lower personalization overhead, no sequence-coherence requirement — and would need its own template if volume justifies one).

## Structure

An email campaign is scored and reviewed **as a sequence**, not as isolated emails — this matches how the Editor Agent's E2 dimension already works (sequence logic scored whole, not per-email).

1. **Sequence goal** (required) — One stated business outcome for the whole sequence (activate a trial, recover a stalled deal, re-engage a dormant lead). Every email in the sequence serves this goal; an email that doesn't is cut.
2. **Per-email structure** (required, repeats for each email in the sequence):
   - **Subject line** — under 50 characters, 3+ variants supplied
   - **Preheader** — 40–90 characters, written deliberately (not left to auto-pull from the body's first line)
   - **Opening line** — leads with reader value, not the sender's pitch
   - **Body** — one core idea, conversational register, no press-release language
   - **Single primary CTA** — placed above the fold where the platform allows; a secondary, lower-commitment CTA ("learn more") is optional and must be visually subordinate to the primary
   - **Compliance block** — physical address, unsubscribe, sender identification (see the Editor's E4 dimension — this is checked per email, not just at sequence level)
3. **Trigger logic** (required) — What advances a recipient to the next email: elapsed time, an action taken, or an action *not* taken. State it explicitly per step.
4. **Exit conditions** (required) — What removes a recipient from the sequence before it completes (converted, unsubscribed, hit a suppression rule).

**Optional/droppable modules:**
- A/B variant on subject line or CTA — droppable for low-volume sequences where a test wouldn't reach significance.
- Personalization beyond first name (funnel stage, industry, geography, prior engagement) — strengthens relevance but isn't mandatory for every email in every sequence.

## Copy rules (from source)

- Lead with reader value in the first line. The sales pitch comes after the value, never before it.
- One core idea and one primary CTA per email — this is a compliance-adjacent rule as well as a style one; a second competing CTA is a rubric deduction (E2).
- Conversational, human register. No press-release or brochure language.
- Get to the point. B2B inboxes are read fast — respect that in sentence length and paragraph length.
- Subject lines under 50 characters — mobile inbox previews truncate above this, and 60%+ of email opens are on mobile.
- Preheader written on purpose, 40–90 characters, never left to auto-pull the body's opening line.
- Personalization tokens go beyond first name where data supports it — funnel stage, industry, prior engagement, geography — each with a sensible fallback for missing data.
- 0–2 emojis in a subject line, if used at all. Restraint over decoration.
- Avoid spam-trigger vocabulary: money/pricing terms ("free," "cash," "$$$"), urgency phrases ("act now," "urgent," "hurry"), risk-free claims ("guarantee," "risk-free"), ALL CAPS, and excessive punctuation ("!!!", "???"). Reframe rather than drop the idea — "complimentary" instead of "FREE."
- Single-column layout for the email body — this is what renders correctly across mobile clients without a redesign.
- Live text buttons for CTAs, never text baked into an image — screen readers and image-blocking clients both need this.
- Alt text on every image, without exception.
- Healthy image-to-text balance; no important information conveyed only through an image.
- List hygiene is a campaign precondition, not a copy rule: no purchased lists, ever. Hard bounces and long-term inactive subscribers are removed on a standing cadence, not left to accumulate.
- Track and report on clicks-to-meaningful-destination over opens — open-rate tracking has become unreliable since Apple Mail Privacy Protection and similar changes. A sequence's success metric should be pipeline or reply-driven, not open-rate-driven.

## Fields to fill per campaign

- [ ] Sequence goal (one sentence, one business outcome)
- [ ] Number of emails in the sequence
- [ ] Audience segment (role/seniority, industry, funnel stage, engagement history)
- [ ] Per email: subject line variants (3+), preheader, primary CTA, secondary CTA (if any)
- [ ] Trigger logic per step (time-based / behavior-based)
- [ ] Exit conditions
- [ ] Personalization tokens used + fallback values
- [ ] Compliance block confirmed present on every email (address, unsubscribe, sender ID)
- [ ] Success metric (click-through to a named destination, reply rate, or pipeline — not open rate alone)

## Editing checklist before sending

- [ ] Every subject line under 50 characters; preheader 40–90 and written on purpose
- [ ] Single-column layout confirmed on a mobile preview, not just desktop
- [ ] Every image has alt text; no CTA is an image with no live text underneath
- [ ] One primary CTA per email; any secondary CTA is visually subordinate
- [ ] No spam-trigger vocabulary in subject or first paragraph
- [ ] Compliance block present and correct on every email in the sequence, not just the first
- [ ] The sequence, read start to finish, builds — each email earns the reason to open the next
- [ ] List being sent to has been checked for hard bounces / long-inactive contacts within the standing cadence

## Source note

**Not first-party — compiled from current ESP and B2B-practitioner guidance**, not from a benchmarked agency's own campaign (no single named agency case was used as the structural source, unlike the website-format templates in this library). Specific rules sourced from: [Klaviyo — Email Design Tips](https://www.klaviyo.com/blog/email-design-tips) (CTA rules, mobile layout, alt text, personalization, A/B testing), [Noseberry — B2B Email Marketing Best Practices 2026](https://noseberry.com/blogs/digital-marketing/email-marketing-best-practices-in-2026-the-complete-b2b-playbook-that-actually-converts) (list hygiene, segmentation, sequence structure, metrics), [Truelist — Email Subject Line Best Practices](https://truelist.io/blog/email-subject-line-best-practices) (character limits, preheader length, emoji use, spam-trigger vocabulary). Agency-discovery reference only, not a source of technical specifics: [DesignRush — Top B2B Email Marketing Agencies](https://www.designrush.com/agency/email-marketing/b2b-agencies) (ranking is sponsored-placement, not performance-based — flagged as such, not treated as evidence).
