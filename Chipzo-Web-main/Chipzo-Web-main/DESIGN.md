# Chipzo Design System

## Design Context

Chipzo serves students, hackers, robotics builders, and startup prototypers who need electronic components quickly while they are actively building, debugging, or preparing for demos. The homepage should make speed feel credible, keep the energy of a maker marketplace, and show that stocked parts can reach a bench fast.

## Brand Personality

- Precise
- Trusted
- Maker-first
- Fast without feeling chaotic
- Technical without feeling cold

## Visual Direction

Chipzo uses a polished neo-brutalist electronics aesthetic: hard geometry, exposed structure, direct copy, sharp contrast, and practical maker energy. The interface should feel like an industrial parts counter upgraded into a flagship web experience.

The design should not feel like generic premium SaaS, soft glassmorphism, blue-purple neon tech, or interchangeable AI landing-page layouts.

## Theme Tokens

Use OKLCH-based color values for perceptual consistency.

```css
:root {
  --chipzo-paper: oklch(0.955 0.007 174);
  --chipzo-surface: oklch(0.991 0.004 174);
  --chipzo-ink: oklch(0.16 0.012 174);
  --chipzo-muted: oklch(0.46 0.014 174);
  --chipzo-rule: oklch(0.82 0.01 174);
  --chipzo-primary: oklch(0.72 0.14 178);
  --chipzo-lime: oklch(0.89 0.21 126);
}
```

## Color Roles

- Paper: `--chipzo-paper` for the main page background.
- Surface: `--chipzo-surface` for cards, overlays, navigation surfaces, and content blocks.
- Ink: `--chipzo-ink` for primary text, borders, shadows, and dark panels.
- Muted: `--chipzo-muted` for secondary text and explanatory copy.
- Rule: `--chipzo-rule` for dashed dividers and quieter separators.
- Primary: `--chipzo-primary` for CTAs, active labels, progress indicators, and high-value emphasis.
- Lime: `--chipzo-lime` for status badges, maker-energy tags, and sparing highlights.

## Typography

- Current font: Archivo.
- Headlines: heavy, uppercase, tight tracking, compressed line-height.
- Body copy: semibold or bold where needed, concise, direct, and readable.
- Labels: uppercase, high letter-spacing, compact, and functional.
- Numeric values: use tabular numerals where progress, prices, or counts need stable alignment.

## Layout Principles

- Use strong asymmetry and varied spacing rhythm.
- Keep sections scannable with clear hierarchy and hard section breaks.
- Use bold surfaces sparingly so they carry weight.
- Prefer full borders, offset shadows, and exposed dividers over soft elevation.
- Avoid wrapping everything in cards; use cards only where they clarify commerce or content groups.
- Body copy should stay concise and avoid long line lengths.

## Component Style

### Borders And Shadows

- Primary border: `3px solid var(--chipzo-ink)`.
- Standard shadow: `4px 4px 0 var(--chipzo-ink)`.
- Small shadow: `2px 2px 0 var(--chipzo-ink)`.
- Large shadow: `8px 8px 0 var(--chipzo-ink)` on desktop, reduced on mobile.

### Buttons

- Rectangular, high-contrast, minimum touch height of roughly 44-48px.
- Primary buttons use `--chipzo-primary` background with paper-colored text.
- Secondary buttons use `--chipzo-surface` background with ink-colored text.
- Hover motion should be small and mechanical, usually a 1-4px translate.

### Cards

- Use hard borders and brutal shadows.
- Product cards should prioritize image clarity, stock urgency, category, name, price, and shipping speed.
- Avoid decorative side stripes and generic soft rounded-card treatments.

## Motion System

Motion should feel engineered, not playful. Use smooth deceleration and transform/opacity animation only where possible.

### Hero Scrollytelling

- The hero uses a sticky full-screen canvas-style sequence.
- Frame source: `/public/sequence/arduino-nano-exploded/`.
- Frame count: 240 JPG frames.
- Naming pattern: `ezgif-frame-001.jpg` through `ezgif-frame-240.jpg`.
- Scroll progress maps directly to frame index.
- The section should remain pinned for roughly 4 viewport heights.
- Story overlays fade and slide between beats.
- Reduced-motion users should see a static final or representative frame with no continuous animation.

### Story Beats

- 0-20%: Intro, assembled or early reveal state. Message: build openly and inspect the board.
- 20-45%: Engineering reveal. Message: pins, traces, headers, and internal structure made legible.
- 45-72%: Marketplace speed. Message: parts move as fast as the prototype.
- 72-100%: CTA. Message: scroll ends, the build begins.

## Page Structure

1. Sticky navigation with Chipzo logo, primary links, Bangalore delivery status, cart, and mobile menu.
2. Scroll-linked Arduino Nano hero with frame sequence, progress indicator, story overlays, and CTAs.
3. Marquee emphasizing 90-minute delivery and Bangalore coverage.
4. Essential kit product grid.
5. Delivery workflow explaining order, packing, and doorstep delivery.
6. Robotics promotional section.
7. Bangalore coverage card.
8. Footer with documentation, shipping, coverage, API support, privacy, and brand summary.

## Stitch Prompt Guidance

When generating or editing Chipzo screens in Stitch, preserve this direction:

```markdown
Create a polished neo-brutalist electronics marketplace interface for Chipzo. Use hard 3px borders, offset black shadows, bold uppercase typography, direct maker-focused copy, and a tinted OKLCH palette built around paper, ink, electric solder teal, and high-visibility lime. The interface should feel fast, reliable, industrial, and maker-first. Avoid generic SaaS styling, soft glassmorphism, gradient text, blue-purple neon tech palettes, and decorative side stripes. Prioritize scannability, real commerce utility, and strong responsive composition.
```

## Avoid

- Pure `#000` or `#fff` as authored design colors.
- Gradient text.
- Decorative `border-left` or `border-right` accent stripes.
- Generic glassmorphism cards.
- Blue-purple neon AI-tech palettes.
- Overly rounded, soft SaaS UI.
- Repetitive same-size card grids unless they serve product browsing.
- Centering every section by default.
