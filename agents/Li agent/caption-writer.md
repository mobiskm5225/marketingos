# Skill: Caption Writer

**Produces:** Short captions for static posts and carousels
**Format:** Platform-specific (LinkedIn vs. others)

## When to use

Run alongside Creative Brief Generator, whenever the post has a visual asset attached. The caption is separate from — and shorter than — the main post body; it's the text that sits on or directly under the visual itself, not the LinkedIn post copy.

## Inputs

- The finished post's hook and CTA (the caption should compress these, not repeat the full post)
- KB-01 Brand Voice
- Platform: this agent is LinkedIn-only today, so default to the LinkedIn caption rules below; the field exists so the same skill can be reused for other channels later without a rewrite

## Template — LinkedIn

- 1 line, under 100 characters. It should work standalone if someone sees only the image on a slow scroll.
- No hashtags in the caption itself — hashtags stay in the post body per the shared content rules.
- No emoji unless the post's hook also used one (stay consistent within a single post).

## Template — Other platforms (reserved, not active)

- Not yet in scope for this agent. Leave this section as a placeholder until a non-LinkedIn channel is added — don't invent Instagram/X caption rules without the same live-research approval process used for LinkedIn.

## Output

- `caption`: the single line of caption text
- `platform`: "LinkedIn"
