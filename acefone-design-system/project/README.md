# Acefone Design System

Internal design system for **Acefone** — the cloud communications platform (CPaaS + CCaaS) that powers **2.5 billion customer interactions annually** across contact centers, CX teams, and IT/Ops. Serves 5,000+ businesses globally; based in Gurugram, India, with presence in the UK and US.

This system captures Acefone's brand voice ("Trusted Clarity"), visual foundations, iconography and UI recreations so designers and AI agents can generate on-brand work — production, prototype, or throwaway mock — without starting from scratch.

> **Sources used**
> - `uploads/Acefone Assets.pdf` — official style guide (typography, color palette, accent, text color)
> - `uploads/acefone-brand-voice.md` — Brand Voice System v1.0, April 2026
> - `https://www.acefone.com` — live marketing site (captured via web capture on 2026-04-23)
> - `https://www.acefone.com/about-us/` and `/blog/servetel-is-rebranding-to-acefone/` — company background

---

## 0. Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — company context, content fundamentals, visual foundations, iconography |
| `SKILL.md` | Agent-skill manifest (cross-compatible with Claude Code) |
| `colors_and_type.css` | All design tokens as CSS variables (colors, type, spacing, radii, shadows) |
| `fonts/` | Poppins webfont files + Geist Mono fallback |
| `assets/` | Logos (`logo.svg`, `logo-white.svg`) and product illustrations |
| `preview/` | Small HTML specimen cards surfaced in the Design System tab |
| `ui_kits/website/` | Marketing-site recreation (Nav · Hero · ProductsTabs · Industries · MidCta · Footer) |
| `ui_kits/agent-workspace/` | Contact-center agent experience (Sidebar · Queue · CallPanel · Transcript · CustomerCard) |

Open `ui_kits/website/index.html` and `ui_kits/agent-workspace/index.html` for the full surfaces.

---

## 1. Company context at a glance

**What Acefone is.** A cloud communications platform for businesses that run on customer conversations — contact centers, sales teams, support desks. The umbrella product is **AceX**, a suite of four core products plus specialized tools.

**Products (use these exact names):**

| Product | One-liner | Voice calibration |
|---|---|---|
| **Interactions Hub** | Omnichannel agent workspace — voice, WhatsApp, chat, video, email in one view | *Unified Visibility* · team-centered, warm, control-focused |
| **Contact Center Studio** | Inbound + outbound contact center with smart routing, dialers, queues | *Trusted Clarity* · master-brand voice |
| **API Connect (APIs Hub)** | Programmable voice/SMS APIs — number masking, 2FA, embedded calling | *Developer Confidence* · technical, precise, capability-led |
| **Campaigns** | Multi-channel broadcast for marketing — voice, SMS, WhatsApp at scale | *Trusted Clarity* · ROI-led, strategic |
| **AI Voice Bot** | 24/7 tier-1 call automation; $0.50–$5 per call vs. $5–$25 human | *Efficient Precision* · sharper, commercial, data-led |
| **Xtract (Post-Call Analytics)** | 100% call analysis — sentiment, keyword spotting, trends | *Intelligence Lens* · strategic, insight-forward |
| **VoIP Calling Solution** | Global business phone system · 150+ countries | *Trusted Clarity* |

**Audiences.** Two primary personas (covered in depth in `uploads/acefone-brand-voice.md` §5):
- **CX / Contact Center Leader** — VP CX, Head of Support, CX Manager. Cares about agent productivity, CSAT, handle time, FCR. Lead with operational outcomes.
- **IT / Ops Leader** — CTO, VP Ops, Solutions Architect. Cares about integration, uptime, deployment speed, security (ISO/IEC 27001, AWS Advanced Tier). Lead with "works with what you have, live in weeks."

**Key credentials to cite in copy.** 2.5B engagements/year · 5,000+ businesses · 150+ countries · ISO/IEC 27001 · AWS Advanced Tier Partner · 20+ prebuilt CRM integrations (Salesforce, Zoho, HubSpot, Freshsales, Zendesk, Freshdesk, MS Dynamics 365, MS Teams, Google, Bitrix24, LeadSquared, Kapture). Notable customers: Michelin, MakeMyTrip, Cipla, BCG, Cars24, Uber, Godrej, Honda, Star Health, Red Chief, Jaguar, Casio, SAP, HomeLane.

**Rebrand note.** Acefone (.com, global) evolved from Servetel (.in, India). Copy should use "Acefone" — never "Servetel" — unless explicitly referencing the India product portal.

---

## 2. Content fundamentals

The full voice system is in `uploads/acefone-brand-voice.md` — read it before writing any long-form copy. This section is the cheat sheet.

### 2.1 The voice name: Trusted Clarity
Warm enough for a CX manager. Authoritative enough for a CFO. Archetype = **Empathetic Partner × Intelligent Simplifier**. Reference points = HubSpot's warmth + Salesforce's authority.

### 2.2 The four pillars (every piece of content expresses at least one)
1. **Grounded Clarity** — make the complex simple, don't dumb it down
2. **Earned Authority** — every claim backed by a specific number
3. **Operational Empathy** — name the reader's problem before offering the solution
4. **Decisive Optimism** — acknowledge, then point to a better reality

### 2.3 The 10 writing rules (abbreviated)
1. Lead with the problem, not the product.
2. "You / your team" beats "we / our" (≈3:1).
3. Translate features into outcomes — always.
4. Short sentences carry the weight. Vary rhythm deliberately.
5. Stats earn the right to make claims. No stat = no strong claim.
6. Definitive language — no "we try," "we hope," "we aim."
7. Name the specific role, not "businesses."
8. End every section with what comes next (CTA, bridge, question).
9. Active voice, always.
10. One idea per sentence. One theme per paragraph.

### 2.4 Casing & punctuation
- **Headlines:** Sentence case, no trailing period. "Your customers are waiting. They shouldn't have to."
- **Subheads / benefit headers:** Sentence case. Outcomes, not labels — "Resolve queries in seconds, not minutes" beats "Fast response times."
- **Buttons / CTAs:** Title Case. "Book a Demo," "Calculate Your Savings," "Talk to an Expert." Never "Learn More," "Submit," "Click Here."
- **Product names:** Always title-cased, never italicized — Interactions Hub, Contact Center Studio, API Connect, AI Voice Bot, Xtract.
- **Em dashes** — used liberally to land rhythm. No spaces around them in short phrases.
- **Numbers & stats** — always concrete. "70% cost reduction" not "significant savings." Use percent signs, not "percent."
- **Spelling** — British or American per audience, but "contact center" (US) on .com and "contact centre" (UK) in UK-targeted content. Be consistent within a piece.

### 2.5 Voice: use / avoid

**Use:** Resolve · Automate · Handle · Deflect · Route · Connect · Scale · Streamline · Unify · Intelligent · Real-time · Reliable · Proven · Deploy in weeks · Your team · First-contact · Cost per call · Agent productivity · Omnichannel · No rip-and-replace · Works with

**Avoid:** ~~Leverage · Synergy · World-class · Best-in-class · Cutting-edge · Game-changing · Next-generation · Robust · Seamlessly · Revolutionize · Empower · Holistic · Ecosystem · Significantly · Utilize · Facilitate · Innovative solution · Going forward~~

### 2.6 Emoji
**Do not use emoji in product, marketing, or sales copy.** They undercut "senior operator" authority. Exceptions: internal LinkedIn posts or celebratory moments, used sparingly (≤1 per post). Never in headers, buttons, product UI, or decks.

### 2.7 Before & After (abbreviated)
- **Startup slop:** "Revolutionise Your Customer Experience with Next-Generation AI Communication Solutions"
- **Trusted Clarity:** "Your Customers Are Waiting. They Shouldn't Have To." → then a subheadline with a specific stat.

---

## 3. Visual foundations

### 3.1 Color

**Primary: Blue.** Dominant across every surface. Workhorse is `--ace-blue-600` (`#1844C9`). Paired with the near-black `--ace-blue-950` (`#051441`) for body text — every heading and paragraph sits on this dark navy, not pure black.

Five exact swatches from the official style guide (PDF): `#1338A4 · #153EB7 · #1844C9 · #1A4ADB · #2454E5`. These form the backbone of the blue ramp in `colors_and_type.css`.

**Accent: Green.** Used sparingly — success states, positive outcome stats, occasional confirm CTAs, and a small underline accent on the Acefone wordmark. Five exact swatches: `#006235 · #007540 · #00894A · #009C55 · #00B060`.

**Neutrals.** Cool-biased grays — pulled slightly toward brand blue to avoid muddy warmth. Backgrounds default to white; alt sections use `--ace-gray-50` (`#F7F8FB`).

**Gradients.** Used deliberately, not decoratively:
- `--ace-grad-primary` — the default CTA button (diagonal 135°, 500→800 blue).
- `--ace-grad-deep` — dark hero backgrounds (vertical, 950→700).
- `--ace-grad-subtle` — section dividers and soft card backs (white→blue-50).
Avoid the cliché purple-to-blue startup gradient — Acefone's gradients are **blue-to-blue** with small depth variation.

### 3.2 Typography

**Primary face: Poppins.** Geometric sans, 300–800 weights. Loaded from Google Fonts in `colors_and_type.css`. Fallback: Inter → system stack.

- **Display / H1** — 700 weight, tight tracking (−0.02em), clamped 40–76px. Large and confident.
- **H2 / H3** — 600 semibold, snug tracking. Never bold for H3 and below.
- **Body** — 400 regular, 16px, 1.65 line-height, color `--ace-fg` (which is `--ace-blue-950`, the dark-blue body-text color from the style guide).
- **Stats** — 700 weight, clamped 44–76px, tight tracking. Numbers do the work; they must look like the headline they often are.
- **Eyebrow labels** — 12px, 600, `letter-spacing: 0.08em`, uppercased, blue-600.

Never use Arial, Helvetica, Times, or generic system UI as a stand-in. If Poppins can't load, the fallback stack is tuned to match Poppins' metrics.

### 3.3 Spacing & layout
- **8-pt base grid.** The full spacing scale (`--ace-space-1` … `--ace-space-32`) is 4/8/12/16/20/24/32/40/48/64/80/96/128 px.
- **Container widths.** Narrow 880px (long-form reading), standard 1200px (most marketing sections), wide 1440px (hero, footers). Never exceed 1440px at 1x zoom.
- **Section rhythm.** Large content sections vertically padded 80–128px top and bottom. Smaller card grids at 48–64px.
- **Grid system.** 12-column at desktop, 16px gutters (can expand to 24px on hero sections).

### 3.4 Corners & borders
- **Small elements (buttons, inputs, badges):** `--ace-radius-md` (10px).
- **Cards, tiles:** `--ace-radius-lg` (14px) to `--ace-radius-xl` (20px). Product-category tiles on the marketing site use the larger end.
- **Pills / tags:** fully rounded (`--ace-radius-pill`).
- **Borders.** Default 1px `--ace-border` (gray-200). Emphasized 1px `--ace-border-strong`. Focus rings use `--ace-border-focus` + a 4px blue halo (`--ace-shadow-focus`).

### 3.5 Shadows & elevation
Five-step elevation, all with **blue-tinted shadow color** (`rgba(5, 20, 65, …)`) rather than neutral black — this is the single biggest quality cue for an Acefone-on-brand card.

`xs / sm / md / lg / xl` progressively lift. Two specialty shadows:
- `--ace-shadow-glow-blue` — CTA hover / hero card lift.
- `--ace-shadow-focus` — 4px blue halo on focused inputs and keyboard-focused buttons.

Inner shadows are rarely used; Acefone's look is flat planes of color with lifted cards, not pressed/inset surfaces.

### 3.6 Imagery & illustration
The live site uses two imagery families:
1. **Product screenshot tiles** — square-ish (700×555 to 700×589), cropped product UI sitting on a soft blue-50 or white background. Used inside rounded cards with subtle shadow.
2. **Industry / persona photography** — warm-toned stock photography (people in professional settings), placed in rounded cards with a blue color-overlay on hover.

No hand-drawn illustration. No emoji. No cartoon mascots. No AI-generated hero art.

When real imagery isn't available, fall back to **Unsplash placeholders** or a flat blue-gradient block with the Acefone logo mark centered — never attempt to draw the product UI with SVG.

### 3.7 Backgrounds & texture
- Default page background: pure white.
- Alternating sections: `--ace-bg-subtle` (`#F7F8FB`).
- Hero sections sometimes use `--ace-grad-deep` (very dark navy, vertical gradient) with a faint dot-grid overlay drawn in `canvas#aceBannGridCanvas` style — low-opacity white dots spaced ~28px apart.
- CTA bands ("Let's elevate your communication today") use `--ace-grad-primary` with white text and sometimes the same dot-grid at 8% opacity.
- No textures, no paper, no noise.

### 3.8 Animation & motion
Restrained, functional, never decorative.
- **Easing:** `--ace-ease-standard` (custom cubic-bezier `0.2, 0.8, 0.2, 1`) — snappy at start, soft landing.
- **Durations:** fast 140ms (hover color swaps), medium 240ms (card lifts, menu opens), slow 420ms (page transitions, hero reveals).
- **Hover (buttons):** lift 2–4px, shadow deepens one step, color brightens one step on the ramp. Never rotate or scale > 1.02.
- **Hover (cards):** shadow lifts from `md` → `lg`; optional 1–2px upward translate.
- **Press (buttons):** translate back to baseline (no lift), shadow drops to `sm`. No color change.
- **Focus:** instant, not animated — 4px blue halo appears immediately.
- No bounces, no springy overshoots, no spinning logos.

### 3.9 Transparency & blur
Used sparingly:
- Top navigation bar when scrolled: 90% white + 12px backdrop-blur.
- Modal backdrops: `rgba(5, 20, 65, 0.45)` + 4px backdrop-blur.
- Never frosted-glass cards. Never translucent buttons.

### 3.10 Fixed elements
- Top nav is fixed-position, 72px tall.
- CTA banners and cookie bars are fixed-bottom.
- The site uses a floating "Book a Demo" button on mobile only.

### 3.11 Protection gradients vs capsules
When text overlays imagery, use a **dark protection gradient** from the bottom (`linear-gradient(to top, rgba(5,20,65,0.75), transparent 65%)`). Do **not** drop the text into a white capsule — that pattern isn't used on Acefone.

---

## 4. Iconography

See [`ICONOGRAPHY.md`](./ICONOGRAPHY.md) (full details, usage rules, examples).

**TL;DR:** Acefone uses **outlined, 1.75–2px stroke SVG icons** for UI, and small **filled-glyph icons** (message, calc, stars, arrow) as accents in marketing. The live site uses a handful of custom SVGs — we've created substitutes in `assets/icons/` and flagged them. **For general-purpose UI, use [Lucide](https://lucide.dev) via CDN** — same stroke weight, modern geometry, matches Acefone's look.

---

## 5. File index

```
.
├── README.md                  ← you are here
├── SKILL.md                   ← agent-skill manifest (for Claude Code use)
├── ICONOGRAPHY.md             ← icon system + usage rules
├── colors_and_type.css        ← CSS variables + semantic type classes (.ace-h1, .ace-p, .ace-eyebrow, …)
│
├── assets/
│   ├── logo.svg               ← horizontal wordmark (primary) · stylized placeholder
│   ├── logo-mark.svg          ← square mark only
│   ├── logo-white.svg         ← on-dark version
│   ├── icons/                 ← UI + marketing icons (SVG)
│   ├── clients/               ← customer logos
│   └── integrations/          ← CRM integration logos
│
├── preview/                   ← small cards registered for the Design System tab
│   ├── colors-blue.html
│   ├── colors-green.html
│   ├── colors-neutrals.html
│   ├── colors-semantic.html
│   ├── type-display.html
│   ├── type-body.html
│   ├── type-stats.html
│   ├── spacing.html
│   ├── radii.html
│   ├── shadows.html
│   ├── buttons.html
│   ├── form-inputs.html
│   ├── badges.html
│   ├── cards.html
│   └── logo.html
│
├── ui_kits/
│   ├── website/               ← marketing site recreation (acefone.com)
│   │   ├── README.md
│   │   ├── index.html
│   │   └── *.jsx
│   └── contact-center/        ← agent workspace / Interactions Hub prototype
│       ├── README.md
│       ├── index.html
│       └── *.jsx
│
└── uploads/                   ← source materials (do not edit)
    ├── Acefone Assets.pdf
    ├── acefone-brand-voice.md
    └── web-capture-*.json
```

---

## 6. Caveats & known substitutions

A few things were not fully recoverable from the sources given — they're flagged here so you know what's placeholder and what's official:

- **Logo.** The real `logo.svg` on acefone.com is CORS-locked and I couldn't fetch the file bytes directly. `assets/logo.svg` is a stylized placeholder built to the brand's character (Poppins bold wordmark + blue gradient mark + green speech-wave accent). Swap in the real file when available.
- **Customer + integration logos.** Same CORS issue. Referenced by name in copy; fetch the real PNG/SVGs from acefone.com when you have network access and drop them in `assets/clients/` and `assets/integrations/`.
- **Dashboard video / product screenshots.** Not embedded — reference by URL (`/assets/img/home/dashboard2.mp4`, `/assets/img/home/interactions-hub.png`, etc.) and use placeholders in mocks.
- **Poppins.** Loaded from Google Fonts CDN. If offline use is needed, download the TTFs and self-host in `fonts/`.

**If you're continuing this work:** please re-attach the real Acefone logo and product screenshot assets via Import so they can be dropped in and the placeholders replaced.
