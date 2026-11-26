# Kallan Finance — design system v3

Built from the approved prototype (`Kallan_Finance.html`). It replaces the Lovable-generated system and the earlier emerald draft.

## Identity
- **Monochrome.** Ink and white carry the interface. Violet (`brand`) appears only in small details: focus ring, text selection, the spark in the logo, the glow behind Kallan Intelligence.
- **Three themes.** Automatic (follows the device), light, dark. `<html data-theme="light|dark">` forces one; no attribute = automatic. The choice lives in this device's `localStorage` (`kf-theme`), set in Configurações > Aparência, and an inline script in `__root.tsx` applies it before first paint.
- **Frosted glass.** Cards are translucent with a blur over a soft aurora (`.k-aurora`). The home has one dark hero header.
- **Type.** Bricolage Grotesque for titles and amounts, DM Sans for text. Amounts use tabular figures.

## Tokens (`src/styles.css`)
| Role | Token | Light | Dark |
|---|---|---|---|
| Page | `background` | #F4F4F5 | #050506 |
| Container | `surface` | #FFFFFF | #121214 |
| Inset / hover | `surface-2` | #EFEFF1 | #1B1B1E |
| Track / raised | `surface-3` | #E1E1E5 | #29292E |
| Text | `foreground` / `muted-foreground` / `subtle-foreground` | #0A0A0B / #55555D / #74747C | #F5F5F7 / #A8A8B0 / #86868E |
| Primary action | `primary` (ink) | #0A0A0B | #F5F5F7 |
| Detail | `brand` | #7A3FE0 | #A581F7 |
| Gain | `positive` | #6B2FD0 | #B79CFF |
| Spend | `negative` (same as ink) | #0A0A0B | #F5F5F7 |
| Error | `destructive` | #C4281C | #F97066 |
| Categories | `chart-1…8` | lightness ramp, so slices separate without hue | |

Money going out is ink, not red; use `text-destructive` only for errors.

## Classes
- `src/kallan.css` (`k-*`): shell (rail, tab bar, aurora, intro), home (hero header, summary, donut, lists, goals strip) and the Kallan Intelligence chat. Lives in the `components` layer so Tailwind utilities still override it.
- Utilities: `surface-card`, `surface-hero`, `glass`, `press`, `lift`, `tabular`, `skeleton`, `text-display|headline|title|label`.

## Navigation
- Mobile: tab bar with Início, Contas, Extrato, Metas and the Kallan button in the centre. It slides away while scrolling down. Perfil is the avatar in the home header.
- Desktop (≥1024px): side rail with the same areas plus Diagnósticos, Negócios, Comunidade, Open Finance and Configurações, and a Kallan card.

## Kallan Intelligence
Full-screen chat (`components/kallan/kallan-chat.tsx`), opened from the tab bar, the rail, the home actions and the insight card. Answers come from `modules/intelligence/chat-replies.ts`, which only formats results of `modules/finance/calculations.ts`: no value is invented. The conversational AI plugs in later on top of the same results.

## Rules
- Semantic tokens only; never hardcode colors (the hero header and intro are the exceptions: they are dark in both themes by design).
- No payment actions: the app reads and organizes. Invoices are listed, not paid.
- Respect "Ocultar valores" everywhere a balance is shown.
