# Kallan Finance — design system v2

Replaces the Lovable-generated system. Tokens live in `src/styles.css`; shared pieces in `src/components/kallan/` and `src/components/ui/`. Class names and component props are unchanged from v1, so screens keep working.

## Principles
1. **Green is a signal.** Emerald marks money in, progress, selection and the primary action. It is never a background wash.
2. **Depth from tonal layers.** ink `#070A08` → graphite `#111713` → moss `#19231D` → raised (`surface-3`). No colored glows, no stacked soft shadows.
3. **Three surface tiers.** `surface-hero` (one per screen, the number it is about), `surface-card` (default container), `surface-row` (rows inside a card, hairline separated).
4. **Type does the hierarchy.** Manrope only. Amounts use `text-display` and always render through `<Money />` (tabular figures).
5. **Motion answers a touch.** `press` on tap, `lift` brightens a tappable card's edge. Only the page entrance (`animate-rise`, 8px) moves on its own. Reduced motion is respected globally.

## Tokens
| Role | Token | Value |
|---|---|---|
| Page | `background` | #070A08 |
| Container | `surface` | #111713 |
| Inset / hover | `surface-2` | #19231D |
| Raised / track | `surface-3` | oklch(0.3 0.022 160) |
| Primary | `primary` / `primary-glow` | #00C878 / #32E58C |
| Gain / loss | `positive` / `negative` | soft green / coral |
| Secondary text | `muted-foreground` | AA on surface and surface-2 |

Radii (base `--radius` 14px): 8 / 10 / 14 / 18 / 24 / 30. Buttons use `rounded-xl`, fields `rounded-lg`, chips and avatars are pills, cards 18px, hero 30px.

## Type scale
`text-display` amounts · `text-headline` page titles · `text-title` section and card titles · `text-label` small labels and eyebrows (sentence case) · body 15px · smallest text 12px.

## Navigation
Mobile: bottom bar docked to the screen edge, 56px targets, active = green bar on top + filled-weight icon. Desktop: 248px sidebar, active = green tick.

## Rules
- Use semantic tokens; never hardcode colors (brand logos and the standalone error page are the exceptions).
- Gradients only on the hero card, the primary/hero button and progress fills.
- No all-caps tracked labels except the KALLAN FINANCE wordmark.
