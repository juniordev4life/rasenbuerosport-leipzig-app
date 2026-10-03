# Design system

The app has two looks. Users pick one in **Settings → Design**; the choice is
stored per device.

| | A "Rot & Weiß" (default) | B "Fußballplatz" |
|---|---|---|
| Page | Light grey `#f6f6f6` | A mown pitch: green stripes plus chalk lines |
| Cards | White, 8 px radius, soft shadow | White "stickers", 20 px radius, hard drop shadow |
| Shapes | Square avatars, tiles, badges and bars | Round avatars, pills, rounded tiles |
| Headings | Condensed caps; red section titles | Sentence case; navy titles with an icon |
| Hero | Red band under the header (Frank's week, profile, …) | Plain white text on the pitch |
| Numbers | Anton display face | Bold condensed |

Neither variant follows the OS light/dark setting: both always look the same.
There is no dark mode.

The designs come from the Claude Design canvas (variants A and B, mobile
only). The desktop layouts follow from the same building blocks.

## How the switch works

- `src/lib/stores/designVariant.stores.js` exposes `designVariant` (`"a"` or
  `"b"`) and `applyDesignVariant()`. Applying a variant sets
  `<html data-variant="…">`, copies `--theme-color` into the
  `theme-color` meta tag and saves the choice in `localStorage`
  (`rbl:design-variant`).
- An inline script in `src/app.html` sets `data-variant` before the first
  paint, so a B user never sees A flash.
- `src/routes/+layout.svelte` subscribes the store to `applyDesignVariant`.
- `DesignVariantSelector.svelte` (Settings) writes the store.

## Tokens: every colour is a role

`src/app.css` is the only file that contains colour values. `@theme` holds the
roles with their A values; `:root[data-variant="b"]` overrides the ones that
differ. Tailwind generates a utility for each role (`bg-surface`,
`text-muted`, `border-line`, `bg-brand`, `text-win`, …). The default Tailwind
palette is switched off (`--color-*: initial`), so `bg-blue-500` or
`text-gray-400` silently render nothing.

| Role | Use |
|---|---|
| `page` | Page background (sits on `<html>`, see rules below) |
| `surface` | Cards, sheets, nav bars |
| `sunken` | Inputs, inner tiles, inactive controls, row hover |
| `ink` / `muted` | Primary / secondary text |
| `line` | Hairlines, dividers, input borders |
| `on-page` | Text placed straight on the page background (white in B) |
| `brand` / `brand-strong` / `on-brand` | Primary actions, active state / hover / text on red |
| `navy` / `on-navy` | Strong secondary surface (A talk-show block, B active segment, tooltips) |
| `gold` / `on-gold` / `gold-soft` | Highlights: leader, "Neu", B call-to-action; pale gold for speech bubbles |
| `aqua` | Info accent, second data colour; graphics only (3.2:1, too light for small text) |
| `win` / `win-soft` / `on-win` | Win result, positive delta, done state |
| `loss` / `loss-soft` / `on-loss` | Loss result, negative delta, errors |
| `draw` / `on-draw` | Draw result, neutral delta |
| `score` / `on-score` | Score chips ("2:3") |
| `home` / `on-home`, `away` / `on-away` | The two sides of a match (red / navy) on pitch, timeline, stats |
| `pitch` / `chalk` | A drawn pitch (live match, poster, B background): white with grey lines in A, darker grass with white chalk in B |
| `progress` / `track` | Progress bars |
| `chart-1` … `chart-4` | Chart series: main, second, faint, emphasis (red) |
| `tier-bronze` / `-silver` / `-gold` / `-diamond` (+ `on-tier-…`) | Trophy rarities, podium; `on-tier-…` is the text/icon colour on that tier |
| `avatar-0` … `avatar-5` (+ `on-avatar-N`) | Initials avatars; all navy in A, six colours in B |
| `white` / `black` | Only for media: text or scrims over photos and videos |

Non-colour tokens (in `:root`, overridden for B) shape the two looks:
`--radius-card|tile|avatar|badge|result|bar|control|sheet`,
`--shadow-card|raised|control|nav|fab`, `--bar-height`,
`--avatar-ring-width`, `--stack-gap` (space between page sections) and the
type roles `--font-title`, `--font-section`, `--font-num`, `--font-label`
plus their weight, case and tracking.

Fonts are self-hosted OFL stand-ins: Anton (≈ RBL Display), Barlow Condensed
(≈ Bull Condensed) and Barlow (≈ Bull Text). Utilities: `font-sans`,
`font-cond`, `font-display`. The RB Leipzig house fonts, logo and
pictograms are licensed for RB Leipzig assets only; this app is a private
project, so they must never ship here. The app's own crest is
`static/logo.png`.

### Mockup colour → role

Use this to translate a hex value from the design canvas.

| Canvas hex | Role |
|---|---|
| `#d2003c` | `brand` (A also `loss`, `progress`) |
| `#b4143c` | `brand-strong`; `loss` in B |
| `#811d39` | `tier-bronze` (A) |
| `#001f47` | `ink`, `navy`, `win` (A), `score` (A) |
| `#6a7484` / `#5a6675` | `muted` (A / B); A is `#606a7a` in the app, darkened for 4.5:1 on grey |
| `#dadada` | `line`, `draw`, `track` (A) |
| `#e3e7ec` / `#eef1f4` | `line` / `sunken` (B) |
| `#f6f6f6` | `page`, `sunken` (A) |
| `#ffcc00` | `gold` |
| `#fff7d6` | `gold-soft` |
| `#3698ca` | `aqua`, `tier-diamond` (A) |
| `#3a9441` / `#41a048` | `page` (B) / `progress` (B) |
| `#1d6b2a` | `win` (B) |
| `#0f3d1f` | `score` (B) |
| `#e8f5e9` | `win-soft`, `track` (B) |
| `#c9e6cb` | `chart-3` (B) |
| `#fde8ee` | `loss-soft` (B) |
| `#cd8a4f` / `#b5bec9` / `#e0a800` / `#7cc8ee` | B tiers |
| `#ff8a3d`, `#8e44ad` | B avatar colours (`avatar-c1`, `avatar-c2`) |

## Building blocks (classes in `app.css`)

| Class | What it is |
|---|---|
| `.card` | White surface with the variant's radius and shadow. No padding: add it. |
| `.tile` | Sunken inner tile (stat boxes); `.tile-win` is pale green in B |
| `.rows` | Hairlines between direct children (lists inside a card) |
| `.stack` | Page column with the variant's section gap |
| `.hero` + `.bleed` | Hero band: red, full width and flush under the header in A; transparent, inside the gutter in B |
| `.page-hero` + `.page-hero-title` | Hero of a list page (paddings, big title); combine with `.hero .bleed` |
| `.on-page` | Text straight on the page background (white with a shadow in B); `.section-title.on-page` stays red in A and turns white in B |
| `.page-title`, `.section-title`, `.section-icon` | Heading roles; set `font-size` yourself on `.page-title` |
| `.num`, `.label`, `.cond` | Big numbers, small labels, condensed face |
| `.avatar`, `.avatar-c0`…`c5`, `.avatar-ring`, `.avatar-self` | Avatars; use `PlayerAvatar` |
| `.chip` + `-gold`, `-brand`, `-navy`, `-muted`, `-win`, `-loss`, `-aqua`, `-outline` | Small labels ("Neu", "Ich", "Zu Null") |
| `.delta` + `-win`, `-loss`, `-draw` | ELO change with its sign: coloured text in A, soft pill in B |
| `.result` + `-w`, `-d`, `-l` | S / U / N markers |
| `.score` | Score chip ("2:3") |
| `.progress > span` | Progress bar; set the span's width |
| `.btn` + `-sm`, `-lg`, `-primary`, `-secondary`, `-accent`, `-confirm`, `-ghost`, `-icon` | Buttons; `-confirm` finishes a step in a flow (red in A, green in B) |
| `.link` | Inline action link ("Alle ansehen") |
| `.field` | Text input / select / textarea |
| `.seg`, `.seg-option`, `.seg-brand`, `.seg-option-2` (+ `.seg-title`, `.seg-sub`) | Segmented control; use `SegmentedControl` (options with `sub` render two lines) |
| `.bubble` | A reporter's words: plain in A, pale gold speech bubble in B |
| `.notice` + `.notice-title` | Loading, empty and error states: `<div class="card notice">` |
| `.scrim`, `.sheet` | Modal backdrop and panel; use `Sheet` |
| `.spinner`, `.spinner-sm` | Loading ring; set `role="status"` |

## Shared components

| Component | Use it for |
|---|---|
| `ui/Section.svelte` | Every titled block of a page: `title`, optional `href` + `actionLabel`, `icon` snippet, `aside` snippet at the end of the title row (e.g. an `InfoTip`). In A the title sits above the content's own card; in B the section *is* the card and flattens any `.card` inside it, so children can always render a plain `.card`. |
| `ui/PlayerAvatar.svelte` | Every player picture: photo with an initials fallback, square in A, round in B |
| `ui/SegmentedControl.svelte` | Pick-one views (Spieler/Duos, Aktuell/Form). `tone="brand"` for a red active pill in B |
| `ui/Sheet.svelte` | Every modal: bottom sheet on phones, centred card from `sm` up; portal, Escape, focus |
| `utils/backNavigation.utils.js` | Back button logic shared by the mobile Header and the desktop Topbar |
| `ui/Button.svelte`, `ui/Input.svelte` | Full-width form button / labelled input |
| `ui/ConfirmDialog.svelte`, `ui/InfoTip.svelte` | Confirm/alert dialog; "?" explainer |
| `ui/OvrBadge.svelte`, `ui/StarRating.svelte`, `ui/TeamLogo.svelte` | Team strength, stars, crest |
| `icons/*` | Line icons (`currentColor`); `FootballIcon` is the two-tone ball |
| `layout/PitchBackground.svelte` | B's pitch (fixed layer behind everything) |

## Rules

1. **No literal colours outside `app.css`.** No hex, `rgb()`, `hsl()` or
   named colours in components, constants or inline styles, and no
   default-palette utilities. Mix only tokens:
   `color-mix(in srgb, var(--color-brand) 15%, transparent)`.
   Exception: `white`/`black` for text or scrims over photos and videos.
2. **No dark mode.** No `dark:` variants, no `prefers-color-scheme`.
3. **Variant differences, in this order of preference:**
   1. tokens (most differences need nothing else);
   2. scoped CSS keyed on the attribute:
      `:global([data-variant="b"]) .thing { … }`;
   3. a markup branch on `$designVariant` (import from
      `$lib/stores/designVariant.stores.js`) only when the structure
      differs, e.g. B's podium or the fanned series cards.
4. **Component `<style>` beats Tailwind utilities.** Svelte styles are
   unlayered, Tailwind's are layered. Never set the same property through a
   utility and a scoped rule (e.g. `display` with `lg:hidden`); put the
   breakpoint in the component CSS instead.
5. **The page colour lives on `<html>` only.** Do not paint `bg-page` on a
   page wrapper, and do not give `body` a background: it would cover B's
   pitch. Text placed straight on the page gets `.on-page`.
6. **Hero bands** (A) use `.hero .bleed` as the first block of a page.
   `.bleed` pulls the band out to the screen edges via `--page-gutter`; in B
   it becomes plain text on the pitch.
7. **Never colour alone, and keep the contrast.** Results carry S/U/N,
   deltas carry +/−, states carry text or an icon. Contrast: 4.5:1 for
   text, 3:1 for large text (≥ 24 px, or ≥ 19 px bold) and meaningful
   graphics. Keep the visible focus outline. Known limits:
   - B: white straight on the pitch is only 3.3–3.8:1, so text there must
     be large; smaller text goes on a white pill or card. Never put
     `brand` or `muted` text on the pitch.
   - `aqua` and the B `progress` green are for graphics, not small text.
   - Text on a tier colour uses `on-tier-…` (A's bronze is dark, B's light).
8. **Focus ring:** navy everywhere (it reads on white, grey and the
   pitch). On a dark surface set `--focus-ring: var(--color-white)`;
   `.hero` (A's red band), `.bg-navy` and `.bg-brand` already do.
9. **Icons:** the line icons in `$lib/components/icons`, no emoji as UI
   icons, no RB Leipzig pictograms.
10. **Desktop (`lg`, ≥ 1024 px):** Sidebar + Topbar replace Header +
   BottomNav. Pages use the width: a 12-column grid for dashboards, two
   columns (main + side panel) for detail pages, full tables instead of
   card lists where they read better. Same functions as mobile, nothing
   desktop-only except extra context (the dashboard's highlight reels).
11. **New strings** go into both `de.json` and `en.json`.

## Checklist for a new or changed screen

- Only token utilities / `var(--color-…)`; `rg '#[0-9a-fA-F]{3,8}\b|rgba?\(' src` stays empty outside `app.css`.
- Built from `Section`, `.card`, `PlayerAvatar`, `SegmentedControl`, `Sheet` where they fit.
- Checked in A and B, at 375 px and at 1440 px.
