# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

This is the **Striker** of the RasenBürosport Leipzig stack — the frontend application for the office-foosball tracker. It is a Svelte 5 / SvelteKit single-page app for recording matches, browsing stats, AI-powered match reports/predictions, and a 15-badge progression system.

**Repository roles in the ecosystem:**

- **Striker** (Application) — Goal scoring & frontend delivery (this repo: `rasenbuerosport-leipzig-app`)
- **Playmaker** (API) — Build-up play & data distribution (`rasenbuerosport-leipzig-api`)

There is no separate Coach repo — infrastructure is provisioned manually (Firebase Hosting for this app, Cloud Run + Cloud SQL for the API).

This project follows the same architectural patterns as the RB Leipzig engineering-unit Striker projects, but is **independent**: it does **not** consume the `@rasenballsport-leipzig/*` shared packages (referee, jersey, tactics) and does **not** use Microsoft Entra ID auth. Styling uses a project-local Tailwind 4 theme, and authentication is Firebase (Google Sign-In).

## Language & Communication

- **All code artifacts must be in English**: JSDoc, comments, documentation, variable names, commit messages
- User communication can be in German, but code output is always English
- App-facing copy ships in both German and English via Tolgee — keys go in `src/lib/i18n/{de,en}.json`

## Development Philosophies

- **KISS (Keep It Simple, Stupid)** — Prefer the simplest solution that works.
- **DRY (Don't Repeat Yourself)** — Extract repeated logic into `src/lib/utils/`, `src/lib/services/`, or `src/lib/components/`. There are no cross-project shared packages for this stack.
- **YAGNI (You Ain't Gonna Need It)** — Only implement what is currently needed.
- **Layered Architecture** — Routes (pages) → Components (presentation) → Services (API + Firebase) → Stores (state). Dependencies flow top-down.

## Technology Stack

- **Framework**: Svelte 5 with SvelteKit (file-based routing)
- **Language**: Plain JavaScript only — NO TypeScript
- **Build / Dev**: Vite 7
- **Styling**: TailwindCSS 4 (via `@tailwindcss/vite`) + project-local CSS variables in `src/app.css`
- **Charts**: Chart.js 4 (used directly — no shared chart-component package)
- **API client**: `apiRequest` helper in `src/lib/services/api.services.js` (uses native `fetch`, never call `fetch` directly)
- **Authentication**: Firebase Authentication (Google Sign-In via `firebase/auth`)
- **i18n**: Tolgee (`@tolgee/svelte`)
- **Adapter**: `@sveltejs/adapter-static` (SPA, fallback `index.html`) — deployed to Firebase Hosting
- **Linting/Formatting**: Biome 2.x (no shared config — local `biome.json`)

## Development Server

DO NOT start dev servers automatically. The dev server is either already running or will be started manually.

```bash
npm run dev      # Vite dev server (default port 5173)
npm run preview  # Preview the production build
```

Frontend talks to the API at `PUBLIC_API_URL` (default `http://localhost:3001` for local dev). See `DEVELOPMENT.md` for the full local stack setup.

## Svelte 5 Patterns (MANDATORY)

Use Svelte 5 runes exclusively. Never use legacy Svelte 4 syntax.

```svelte
<script>
  // Props
  let { title, items = [], onSelect } = $props();
  let { value = $bindable() } = $props();  // Two-way binding

  // State
  let count = $state(0);

  // Derived
  const total = $derived(items.reduce((sum, i) => sum + i.value, 0));
  const filtered = $derived.by(() => items.filter((i) => i.active));

  // Effects
  $effect(() => {
    console.log("count changed:", count);
  });
</script>

{#each items as item (item.id)}
  <div>{item.name}</div>
{/each}
```

**Do NOT use:**

- `$:` reactive declarations → use `$derived()`
- `onMount()` for subscriptions → use `$effect()`
- `export let` for props → use `$props()`
- `{#key}` blocks to force re-rendering for locale changes
- Each loops without a key

### Reactive Language/Locale Pattern

```svelte
<script>
  import { tolgee } from "$lib/config/i18n.config.js";

  let currentLanguage = $state(tolgee.getLanguage());

  $effect(() => {
    const update = () => { currentLanguage = tolgee.getLanguage(); };
    tolgee.on("language", update);
  });

  const currentLocale = $derived(currentLanguage === "de" ? "de-DE" : "en-US");
</script>
```

## API Communication

Always use `apiRequest` from `$lib/services/api.services.js` — it handles `Authorization: Bearer <id-token>` automatically by reading the current Firebase user.

```javascript
import { apiRequest } from "$lib/services/api.services.js";

const { data } = await apiRequest("/v1/games?limit=20");
const result = await apiRequest("/v1/games", {
  method: "POST",
  body: JSON.stringify(payload),
});
```

The backend returns the standard envelope `{ code, title, message, data, error }`. Read `.data` for the payload.

Do **not** call `fetch(...)` directly from components or stores.

## Authentication

Auth is Firebase Authentication via Google Sign-In:

- `signInWithPopup` for login (`$lib/services/auth.services.js`)
- The current user is exposed via `firebase/auth`'s `auth.currentUser` and via the `auth.stores.js` store
- Protected routes live under `/app/*` — the layout (`/app/+layout.svelte`) redirects unauthenticated users to `/auth/login`
- Each API call attaches a fresh ID token (Firebase SDK handles refresh)

Public routes: `/`, `/auth/*`. Authenticated routes: everything under `/app/*`.

## Styling

TailwindCSS 4 is configured via `src/app.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #f5f7fa;
  --color-accent-red: #c41e3a;
  --color-text-primary: #1a1d26;
  /* ... */
}

.dark {
  --color-bg-primary: #0f1219;
  /* ... */
}
```

**Rules:**

- **Use the project's CSS variables**, not arbitrary Tailwind colors. Use the Tailwind utilities they generate (e.g. `bg-bg-primary`, `text-text-primary`, `text-accent-red`).
- The theme supports **light and dark mode** via the `.dark` class on `<html>` (toggled by `theme.stores.js`). Dark variants must be considered for any new color usage.
- Page layout: CSS Grid; content layout: Flexbox.
- This project does **not** use the RB Leipzig brand colors or the Jersey design system. Stick to the local theme tokens.

### Charts

Use Chart.js 4 directly. There is no shared chart-component package — wrap chart instances in small Svelte components under `src/lib/components/{domain}/`.

## Accessibility (WCAG 2.1 Level A & AA)

- All images need alt text (empty `alt=""` for decorative)
- Never rely on color alone for meaning — pair color cues with icons/text
- Contrast: 4.5:1 normal text, 3:1 large text (18pt+) — verify in both light and dark mode
- All interactive elements must be keyboard accessible
- Use semantic HTML (`<main>`, `<section>`, `<nav>`, `<article>`, `<button>` for buttons)
- Proper ARIA on custom interactive elements
- Focus indicators must remain visible — do not remove the default ring
- Form controls must have labels

## State Management

- Use Svelte 5 stores under `src/lib/stores/`
- `auth.stores.js` — current user + auth state (subscribes to Firebase `onAuthStateChanged`)
- `theme.stores.js` — light/dark mode toggle (persists to `localStorage`)
- `season.stores.js` — currently selected season for season-scoped queries
- Prefer local `$state` in components for UI-only state; lift to a store only when shared across routes

## File Naming Conventions

- **Components**: `PascalCase.svelte` (e.g. `GameCard.svelte`, `MatchReportPanel.svelte`)
- **All other JS files**: `camelCase.{category}.js`
  - Services: `name.services.js`
  - Stores: `name.stores.js`
  - Utils: `name.utils.js`
  - Config: `name.config.js`
  - Constants: `name.constants.js`
- **Routes**: SvelteKit conventions (`+page.svelte`, `+layout.svelte`, `+layout.js`); folders may include dynamic segments like `[id]`

## Project Structure

```
src/
  app.css                     # Tailwind import + project @theme tokens (light + dark)
  app.html                    # SvelteKit shell
  routes/                     # SvelteKit file-based routing
    +page.svelte              # Marketing / landing
    auth/
      login/                  # Google sign-in
      callback/               # Auth callback
      setup/                  # First-time profile setup
    app/                      # Authenticated area (layout enforces auth)
      dashboard/              # User dashboard
      games/                  # List, /new, /[id]
      stats/                  # Personal stats + H2H
      compare/                # Player vs player
      leaderboard/            # Public-but-rendered-here rankings
      seasons/                # Season list + archive
      teams/                  # Team catalog
      profile/                # Edit profile
      wrapped/                # Weekly wrapped recap
  lib/
    components/               # PascalCase.svelte, grouped by domain
      auth/  compare/  dashboard/  games/  layout/
      leaderboard/  profile/  season/  stats/  ui/
    services/                 # api.services.js, auth.services.js, teams.services.js
    stores/                   # auth, season, theme
    config/                   # firebase.config.js, i18n.config.js
    constants/                # role + label constants
    utils/                    # framework-agnostic helpers
    i18n/                     # de.json, en.json (Tolgee keys)
    data/  assets/            # static data + assets imported into components
tests/
  unit/                       # Vitest unit tests (currently utils only)
```

## Testing

The repo currently has unit tests under `tests/unit/utils/` but Vitest is not yet wired into `package.json` scripts. When adding the first proper test layer:

- **Framework**: Vitest (unit/component, jsdom for component tests)
- **E2E**: Playwright is the expected choice when added later
- **Pattern**: AAA (Arrange-Act-Assert)
- **Mocking**: mock `apiRequest`, mock Firebase auth — never hit the real API or Firebase in tests
- **Test files**: `{Name}.test.js` for components, `{name}.services.test.js` for services

## Internationalization

- Tolgee config in `src/lib/config/i18n.config.js`
- Translation files: `src/lib/i18n/de.json`, `src/lib/i18n/en.json`
- In components: `const { t } = getTranslate(); … {$t('key')}`
- Keep keys flat or shallowly nested by domain (`game.create.title`, `stats.label.winRate`)
- Add both `de` and `en` for every new key

## Code Style

- Plain JavaScript with ES6+ syntax, async/await, destructuring
- Optional chaining (`?.`) and nullish coalescing (`??`) wherever they help
- ES Modules — `"type": "module"` in package.json
- Tabs for indentation (Biome config)
- Use `$lib/...` aliases for imports inside `src/lib/`
- JSDoc on ALL exported functions with `@param`, `@returns`, and at least one `@example` for non-trivial logic
- Run `npm run check` before committing — Biome handles lint + format

## CI/CD

### Git Workflow

Never push directly to `main`. Always use feature branches and pull requests.

- **Branch naming**: `<type>/<short-description>` (e.g. `feat/add-wrapped-screen`, `fix/dark-mode-card-contrast`)
- **PR checks**: lint + format must pass
- **Merge strategy**: Squash merge, delete branch after merge

### Deployment — Firebase Hosting (NOT a GCS bucket)

Unlike the RB Leipzig engineering-unit Striker projects, this app deploys to **Firebase Hosting**, not Cloud Storage + Cloud CDN.

```bash
npm run build      # adapter-static → ./build
npm run deploy     # build + firebase deploy --only hosting
```

`firebase.json` configures the SPA rewrites (`** → /index.html`) and long-cache headers for hashed assets. The matching API runs on Cloud Run; keep `PUBLIC_API_URL` and the API's `CORS_ORIGIN` in sync between environments.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Production build (adapter-static → `./build`) |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Biome lint + format with auto-fix |
| `npm run lint:check` | Biome lint, no fixes |
| `npm run format:check` | Biome format check, no fixes |
| `npm run deploy` | Build + Firebase Hosting deploy |

## Commit Messages

Follow Conventional Commits:

```
<type>[optional scope]: <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Breaking changes: `feat(api)!: rename PUBLIC_API_URL to VITE_API_URL`

## Code Review Standards

After completing any implementation, review the code for:

- Functions longer than 30 lines (likely doing too much — split them)
- Logic duplicated more than twice (extract to a util/helper or component)
- Exported functions without JSDoc — every one needs name, description, `@param`, `@returns`, and at least one `@example` for non-trivial behavior
- Components with more than 3 props that could be grouped into a single object prop
- Missing error handling on `apiRequest` calls (catch + user-facing message)
- Direct `fetch(...)` usage instead of `apiRequest`
- Hardcoded color literals instead of theme tokens (breaks dark mode)
- Missing dark-mode treatment for new UI surfaces
- Each loops without a key
- New strings shipped without `de` + `en` Tolgee keys
