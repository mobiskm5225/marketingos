# Iconography

Acefone's icon language is **clean, outlined, and functional** — the antithesis of "tech startup emoji" or "colorful Material Design." Icons are supporting actors; they clarify a label, never replace one.

## Three icon families

### 1. UI icons — outlined, 2px stroke
For product UI, navigation, form controls, and any dense interface.

- **Recommended source: [Lucide](https://lucide.dev)** — loaded via CDN in all UI kits:
  ```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  ```
- Stroke width: **1.75px** (default) or **2px** for small sizes (≤ 16px).
- Color: `currentColor` — inherits from the parent. On primary surface = `--ace-fg`. On blue bg = white. Never paint an icon a different color for decoration.
- Sizes: **16, 20, 24px**. Never scale mid-flight — pick a size and stick with it per surface.
- No filled variants, no duotone, no gradients on icons.

Common UI icons used throughout Acefone interfaces: `phone`, `phone-call`, `phone-incoming`, `phone-outgoing`, `phone-missed`, `message-circle`, `mail`, `video`, `mic`, `mic-off`, `headphones`, `users`, `user`, `user-plus`, `bar-chart-2`, `pie-chart`, `activity`, `zap`, `settings`, `bell`, `search`, `filter`, `chevron-down/right`, `arrow-right`, `plus`, `x`, `check`, `trash-2`, `edit-2`, `download`, `upload`, `external-link`, `clock`, `calendar`, `shield`, `lock`, `globe`.

### 2. Marketing accent icons — filled glyphs
Small decorative icons used next to CTAs, headlines, and stat callouts on acefone.com. Typically blue-600 filled on a blue-50 rounded-square background.

Originals referenced from the live site (recreated as stylized SVGs in `assets/icons/`):
- `message-icon.svg` — speech bubble (used next to "Simplifying Communication…")
- `calc-icon.svg` — calculator (used next to "Track your expenses…")
- `stars-black.svg` — 5-star rating (used in review sections)
- `btn-arrow.svg` — right-pointing arrow (used on all CTA buttons; replaces the word "→")
- `play-icon.svg` — triangle inside a circle (used on video thumbnails)

### 3. Brand / product mark icons
Per-product glyph that appears next to product names in navs, docs, and slides. These are square 32–64px marks with brand-blue gradient fills. Currently placeholders — recreate on request.

## When to use which

| Context | Family |
|---|---|
| Inside a dashboard, table, form, or menu | **UI icons (Lucide, outlined)** |
| Next to a marketing headline, stat, or CTA | **Marketing accent icons** (blue-50 tile + blue-600 filled glyph) |
| Product name in a sidebar / nav | **Brand/product mark** |

## Never

- ❌ **Emoji** — never in product UI, marketing, decks, or sales materials. (One exception: an internal celebratory LinkedIn post may include a single emoji.)
- ❌ **Unicode characters as icons** — no "→", "✓", "★". Use the SVG equivalent.
- ❌ **Colorful icons** — no Material Design multicolor set, no Iconscout colorful packs.
- ❌ **Hand-drawn SVGs from scratch** — always reach for Lucide or the copied assets first. Drawing new icons produces off-brand inconsistency.
- ❌ **Duotone / gradient / neumorphic icons** — not in Acefone's visual vocabulary.

## Flags

- The marketing accent icons in `assets/icons/` are **recreations**, not the original bytes from acefone.com (CORS-blocked during capture). They're stylistically on-brand but not pixel-exact. Replace with the official SVGs when available.
- Product mark icons are not yet created — they'll be generated per-product (Interactions Hub, Contact Center Studio, API Connect, Campaigns) when needed.
