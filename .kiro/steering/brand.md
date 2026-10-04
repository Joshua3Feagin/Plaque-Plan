---
inclusion: always
---

# Brand: Lincoln Financial (Plaque & Plan)

Plaque & Plan is built for codeLinc 11 (Lincoln Financial + AWS). The UI uses Lincoln
Financial's visual identity so it feels trustworthy and familiar. Implement these
tokens exactly once in `apps/mobile/theme/colors.ts` and pass them into the React
Native Paper theme. Do not hard-code hex values in components — always read from the
theme.

## Color tokens

| Token | Hex | Use |
| --- | --- | --- |
| `primary` | `#650030` | Lincoln burgundy. Primary buttons, active tab, headers, key accents. |
| `onPrimary` | `#FFFFFF` | Text/icons on primary. |
| `primaryContainer` | `#8A1F4F` | Lighter burgundy for containers, selected rows. |
| `secondary` | `#B88A00` | Warm gold accent (sparingly: savings, highlights). |
| `background` | `#FBF8F4` | Warm off-white app background. |
| `surface` | `#FFFFFF` | Cards, sheets. |
| `surfaceVariant` | `#F1EAE2` | Subtle panels, gauge tracks. |
| `onSurface` | `#1F1A1C` | Primary text. |
| `onSurfaceVariant` | `#5C5257` | Secondary text, captions. |
| `outline` | `#D9CEC6` | Borders, dividers. |
| `success` | `#2E7D32` | Positive (savings, within budget). |
| `warning` | `#B26A00` | Expiring benefits, over budget. |
| `error` | `#B3261E` | Errors, destructive. |

### Member accent colors (calendar dots / avatars)

Assigned in order to household members. Must meet WCAG AA against white text.

`#650030` (burgundy), `#1C6E8C` (teal), `#9C4722` (terracotta), `#4A6C2F` (olive),
`#5E4B8B` (violet), `#A61E4D` (magenta).

## Rules

- Primary action color is burgundy `#650030`; one primary action per screen.
- Warm off-white (`#FBF8F4`) surfaces, never pure gray.
- Gold `#B88A00` is an accent only — never a large fill or body text.
- Tap targets at least 44pt; body text meets WCAG AA contrast on its surface.
- Plain-language copy: "left to use this year", "you owe", "expires in N days".
- Money is always labeled an estimate; never present a figure as a guaranteed bill.
