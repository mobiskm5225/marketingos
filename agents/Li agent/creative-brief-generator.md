# Skill: Creative Brief Generator

**Produces:** One-paragraph brief for the designer/video team
**Output fields:** platform, format, objective, tone, CTA

## When to use

Run only when the content calendar brief (or the LinkedIn post skill just run) calls for a static graphic, carousel, or video accompaniment. Skip entirely for text-only posts.

## Inputs

- The finished post copy from whichever LinkedIn post skill just ran (hook, body, CTA)
- KB-01 Brand Voice — tone descriptor for the brief
- The visual format specified in the calendar brief (static / carousel / short video), or "static" as the default if unspecified

## Template

Write exactly one paragraph, no headers, covering all five fields inline so a designer or video editor can act on it without follow-up questions:

- **Platform**: LinkedIn (state explicitly, even though it's the only platform this agent serves today — the brief format is reused by other channels later)
- **Format**: static graphic / carousel / short video, and how many frames/slides or seconds if a carousel or video
- **Objective**: what this visual needs to do — reinforce the hook, illustrate the proof point, show the result — one sentence
- **Tone**: 2–3 adjectives pulled from KB-01 Brand Voice, not invented fresh each time
- **CTA**: the same CTA as the post copy — the visual must not introduce a second, different ask

## Output

- `creative_brief`: the single paragraph, ready to hand to the designer/video team
- `format`: "static" | "carousel" | "video"
