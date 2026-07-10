---
name: acefone-design
description: Use this skill to generate well-branded interfaces and assets for Acefone, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Key files:
- `README.md` — company context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — design tokens (CSS variables for colors, type, spacing, radii, shadows)
- `assets/` — logos, product illustrations
- `ui_kits/website/` — marketing site recreation (Nav, Hero, ProductsTabs, Industries, Footer)
- `ui_kits/agent-workspace/` — contact-center agent workspace recreation

Brand voice: "Trusted Clarity." Lead with the problem, not the product. Every strong claim earned by a specific stat. Active voice. Short sentences as anchors. Use "you / your team" over "we / our." Avoid: leverage, seamless, world-class, revolutionize, game-changing.

Primary colors: `--ace-blue-700 #1338A4` (workhorse), `--ace-blue-950 #051441` (text/background), `--ace-green-600 #00894A` (success/positive stats). Never use hot pink, purple gradients, or neon — blue is the brand.

Type: Poppins (display + body). Tight tracking on display (-0.02em). Stats use Poppins Bold 76px for impact anchors.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create static HTML files for the user to view. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
