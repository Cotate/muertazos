# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Next.js 16 App Router** with TypeScript and Tailwind CSS v4. Deployed on Vercel.

---

## Routes

| Path | Purpose | Auth |
|------|---------|------|
| `/` | Landing page + login modal | Public |
| `/predis` | Predictions/bracket view | Public + User |
| `/dashboard` | All-picks table + individual picks + settings | User |
| `/admin` | Admin panel (picks, jugadores, ranking, simulator, carta) | Admin |
| `/simulator` | Bracket simulator | Public |
| `/ranking` | Global leaderboard | Public |
| `/pizarra` | Drag-and-drop tactical board | Public |
| `/tierlist` | Tier list maker | User |
| `/card-generator` | Player card generator | Admin |

All pages are `'use client'`. No Next.js middleware exists.

---

## Auth Model

Custom auth — **not Supabase Auth**. Credentials checked against `app_users` (plain-text password comparison).

- Session stored in `localStorage` as `muertazos_user` (JSON of the `app_users` row)
- Roles: `admin` or regular user
- Pages guard themselves via `useEffect` on mount, redirecting to `/` if session is missing or role is insufficient

### Post-login redirects
- **Admin** → `/admin?section=espana&sub=picks`
- **User** → `/predis?league=kings&country=spain`
- **Existing session on `/`** → same destinations (checked in `useEffect`)

---

## Supabase Schema

All tables have RLS **disabled**.

| Table | Key columns |
|-------|------------|
| `competitions` | id, key (`'kings'`\|`'queens'`), name, color |
| `teams` | id, competition_key, name, logo_file, **country** (default `'spain'`) |
| `matchdays` | id, competition_key, name, date_label, display_order, is_visible, is_locked, **is_public_visible**, **country** |
| `matches` | id, matchday_id, home_team_id, away_team_id, winner_team_id, match_order (default 99) |
| `match_results` | match_id (PK), home_goals, away_goals, home_penalties, away_penalties, updated_at |
| `app_users` | id (uuid), username (unique), password, role (default `'user'`), favorite_team_id |
| `predictions` | id, user_id, match_id, predicted_team_id |
| `user_points` | id (uuid), user_id, matchday_id, points, updated_at |
| `players` | id (serial), team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado |

Supabase client singleton: `lib/supabase.ts`

### `players` table — create once if missing
```sql
CREATE TABLE players (
  id              serial PRIMARY KEY,
  team_id         int REFERENCES teams(id),
  competition_key text NOT NULL DEFAULT 'kings',
  country_id      int NOT NULL,   -- 1=spain  2=brazil  3=mexico
  name            text NOT NULL,
  image_file      text NOT NULL,  -- e.g. 'Achraf Laiti.webp'
  lesion          boolean NOT NULL DEFAULT false,
  tarjeta         boolean NOT NULL DEFAULT false,
  wildcard        boolean NOT NULL DEFAULT false,
  convocado       boolean NOT NULL DEFAULT true
);
CREATE INDEX ON players (competition_key, country_id);
```

---

## Multi-country Support

Teams and matchdays carry a `country` column. All queries must include `.eq('country', ...)`.

| Country | DB key | Folder | Split |
|---------|--------|--------|-------|
| España | `'spain'` | `España` | Split 6 |
| Brasil | `'brazil'` | `Brazil` | Split 2 |
| México | `'mexico'` | `México` | Split 4 |

Queens always uses `country = 'spain'`.

---

## Asset Structure

All images live under `public/MUERTAZOS ESTRUCTURA/`. All files are `.webp`.

```
public/MUERTAZOS ESTRUCTURA/
  Muertazos.webp                          # App logo
  KINGS/{CountryFolder}/
    Equipos/{logo_file}                   # Team logos
    {SplitFolder}/{TeamName}/{Player}.webp # Player images
  QUEENS/España/
    Equipos/{logo_file}
  usuarios/{username}.webp               # User avatars
```

`logo_file` in DB stores filename only (e.g. `"1K FC.webp"`), never the full path.

---

## Path Utilities (`lib/utils.ts`)

| Function | Purpose |
|----------|---------|
| `getTeamLogoPath(league, logoFile, country?)` | Full URL for team logo; auto-converts ext to `.webp`; applies `LOGO_FILE_FIXES` |
| `getTeamLogoPathEncoded(league, logoFile, country?)` | `encodeURI` variant for `<img>` tags in share tickets |
| `getPlayerImagePath(country, league, team, playerName)` | Full URL for player image |
| `getLogoSize(filename, large?)` | Pixel size for `<Image>` |
| `getCompFolder(compKey)` | `'Kings'` or `'Queens'` |
| `getStoredUser()` | Safe `localStorage` read for `muertazos_user` |
| `sortMatchesByOrder(matches)` | Sort by `match_order` then `id` |
| `COUNTRIES` | `[{ key, flag, name, color }]` for country data |

---

## Navigation Architecture

### Sidebar (drawer in `AppHeader`)

The sidebar is the **sole navigation source** — pages never render in-page country/league selectors. All navigation passes `league` and `country` as URL search params so the active item in the sidebar can highlight correctly.

**Feature-first structure (both admin and user):**

**Admin:**
- PICKS → España / México / Brasil / Queens — `/admin?section={key}&sub=picks`
- JUGADORES → España / México / Brasil / Jugadoras — `/admin?section={key}&sub=jugadores`
- RANKING — `/admin?section=ranking`
- SIMULADOR → España / México / Brasil / Queens — `/admin?section=simulator&country={key}`
- CARTA — `/card-generator`

**User:**
- PREDIS → España / México / Brasil / Queens — `/predis?league=kings&country={key}`
- PICKS → España / México / Brasil / Queens — `/dashboard?tab=picks&league=kings&country={key}`
- RANKING — `/ranking`
- SIMULADOR → España / México / Brasil / Queens — `/simulator?country={key}`
- PIZARRA — `/pizarra`
- TIER LIST — `/tierlist`

### Reactivity pattern

All pages derive `league` and `country` from URL search params via two separate `useEffect`s:

```ts
// 1. Mount-only: read session from localStorage
useEffect(() => { /* setUser, setUserChecked */ }, [])

// 2. Re-sync on URL change: fires whenever sidebar navigates
useEffect(() => {
  if (urlLeague)  setLeague(urlLeague)
  if (urlCountry) setCountry(urlCountry)
}, [urlLeague, urlCountry])
```

The `loadData` callback depends on `league` and `country` via `useCallback`, so it re-fires automatically when state updates.

For components with internal `useState` initialized from props (e.g. `SimulatorView`), always pass a `key` prop derived from country/league so React remounts on navigation change:

```tsx
<SimulatorView
  key={`sim-${urlCountry ?? 'all'}-${urlLeague ?? 'kings'}`}
  initialCountry={urlCountry || undefined}
/>
```

---

## Components

| Component | Purpose |
|-----------|---------|
| `AppHeader` | Sticky header with hamburger drawer. Variants: `'minimal'` (login page), `'nav'` (all other pages). Contains `AdminNavContent` and `UserNavContent` — both feature-first accordions. |
| `AppFooter` | Global footer, rendered in `app/layout.tsx` |
| `SimulatorView` | Bracket simulator. Props: `isAdmin`, `initialCountry`, `initialLeague`, `hideControls`. Always mount with a `key` when country/league comes from URL. |
| `RankingView` | Global leaderboard. Accepts `currentUser?` to highlight the logged-in user. |
| `PizarraView` | Drag-and-drop tactical board; supports España/Brasil/México. Mixed teams allowed; each token stores its own `split`. |
| `TierList` | Tier list maker. Accepts `user?: { username? }`. Extracted from the page; no auth logic inside. |
| `AdminPlayerRoster` | Player roster table for admin. Supports importing hardcoded data, toggling status flags, and adding players manually. |

---

## Admin Page (`/admin`)

State is derived **purely from URL** — no internal useState for section/sub.

```
?section=espana&sub=picks       → CompetitionAdmin (kings, spain)
?section=brasil&sub=picks       → CompetitionAdmin (kings, brazil)
?section=mexico&sub=picks       → CompetitionAdmin (kings, mexico)
?section=queens&sub=picks       → CompetitionAdmin (queens, spain)
?section=espana&sub=jugadores   → AdminPlayerRoster (kings, spain)
?section=ranking                → RankingView
?section=simulator&country=spain → SimulatorView (keyed by country)
```

`CompetitionAdmin` components are keyed by `competitionKey-country` to force full remount when switching leagues.

---

## User Dashboard (`/dashboard`)

URL params drive the view:

```
?tab=picks&league=kings&country=spain  → CompetitionReadOnly (all users' picks table)
?tab=settings                          → SettingsView
```

Legacy `?tab=kings` / `?tab=queens` still work but route to `view='picks'` (individual picks — no country selector rendered).

---

## Player Data

`SPAIN_PLAYERS_DATA`, `BRAZIL_PLAYERS_DATA`, `MEXICO_PLAYERS_DATA` constants live in `lib/hooks/useTierListData.ts` (canonical source) and are duplicated in `components/PizarraView.tsx` (intentional — different concerns).

`useTierListData(comp, country)` hook:
1. Fetches teams from Supabase
2. Attempts to fetch players from `players` table
3. Falls back to hardcoded constants if table is empty

### Sync script

```bash
node scripts/sync-new-players.mjs
```

Reads `.env.local`, queries team IDs from Supabase, inserts any new España players not yet in the DB.

---

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Kings / yellow | `#FFD300` | Kings accent, admin picks |
| Queens / teal | `#01d6c3` | Queens accent |
| Simulator / orange | `#FF5733` | Simulator section |
| App background | `#0a0a0a` | Dark base |

---

## Icon Library

**Lucide React** exclusively. Consistent `size={15}` for nav sub-icons, `size={16}` for nav top-level icons, `size={13}` for badge/button icons. Same stroke width throughout (Lucide default).
