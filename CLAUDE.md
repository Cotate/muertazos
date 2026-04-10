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

### Routes
- `/` — Login page (`app/page.tsx`)
- `/dashboard` — User view (`app/dashboard/page.tsx`)
- `/admin` — Admin view (`app/admin/page.tsx`)
- `/tierlist` — Tier List Maker (`app/tierlist/page.tsx`)
- `/simulator` — Simulator standalone (`app/simulator/page.tsx`)
- `/ranking` — Ranking standalone (`app/ranking/page.tsx`)
- `/pizarra` — Pizarra standalone (`app/pizarra/page.tsx`)
- `/predis` — Predis placeholder (`app/predis/page.tsx`)

All pages are `'use client'`. Auth is role-based via `localStorage` key `muertazos_user` (JSON of the `app_users` row). On load, pages check `localStorage` and redirect to `/` if no valid session or insufficient role. Some views (ranking, pizarra, simulator) are publicly accessible without auth.

### Auth model
Custom auth — **not Supabase Auth**. Credentials are checked against the `app_users` table (plain-text password comparison in the DB query). Roles: `admin` or regular user.

### Supabase schema
- `competitions` — id, key (`'kings'`|`'queens'`), name, color
- `teams` — id, competition_key, name, logo_file, **country** (default `'spain'`)
- `matchdays` — id, competition_key, name, date_label, display_order, is_visible, is_locked, **country** (default `'spain'`)
- `matches` — id, matchday_id, home_team_id, away_team_id, winner_team_id, match_order (default 99)
- `match_results` — match_id (PK), home_goals, away_goals, home_penalties, away_penalties, updated_at
- `app_users` — id (uuid), username (unique), password, role (default `'user'`)
- `predictions` — id, user_id, match_id, predicted_team_id
- `user_points` — id (uuid), user_id, matchday_id, points, updated_at

The Supabase client is a singleton at `lib/supabase.ts`. RLS is **disabled** on all tables.

### Multi-country support
Teams and matchdays both have a `country` column (`'spain'` | `'brazil'` | `'mexico'`). All queries that fetch teams or matchdays must include `.eq('country', ...)` to avoid cross-country data leakage. Splits per country:
- España → Split 6
- Brasil → Split 2
- México → Split 4

### Asset structure
All images live under `public/MUERTAZOS ESTRUCTURA/`. All image files are `.webp`.

- **App logo**: `/MUERTAZOS ESTRUCTURA/Muertazos.webp`
- **Team logos**: `/MUERTAZOS ESTRUCTURA/{KINGS|QUEENS}/{CountryFolder}/Equipos/{logo_file}`
  - CountryFolder: `España`, `Brazil`, `México`
  - `logo_file` in DB stores only the filename (e.g. `"1K FC.webp"`), never the full path
- **Player images**: `/MUERTAZOS ESTRUCTURA/KINGS/{CountryFolder}/{SplitFolder}/{TeamName}/{PlayerName}.webp`
  - e.g. `/MUERTAZOS ESTRUCTURA/KINGS/España/Split 6/1K FC/Achraf Laiti.webp`
- **User avatars**: `/usuarios/{username}.jpg`

### Path utilities (`lib/utils.ts`)
- `getTeamLogoPath(league, logoFile, country?)` — builds full team logo URL; auto-converts `.png`/`.jpg` to `.webp`; applies `LOGO_FILE_FIXES` map to normalize known DB/filesystem mismatches (e.g. `Ultimate Mostoles.webp` → `Ultimate Móstoles.webp`)
- `getPlayerImagePath(country, league, team, playerName)` — builds full player image URL
- `getLogoSize(filename, small?)` — returns pixel size for `<Image>` based on filename
- `getCompFolder(competitionKey)` — returns `'Kings'` or `'Queens'`
- `COUNTRIES` — array of `{ key, flag, name }` for the country selector UI
- `sortMatchesByOrder(matches)` — sorts matches by `match_order` then `id`

### Components
- `AppHeader` — shared sticky header with two variants: `'minimal'` (centered logo only, used on login) and `'nav'` (full navigation with left/right nav items, hamburger drawer on mobile, logout button).
- `AppFooter` — global footer rendered in `app/layout.tsx`.
- `SimulatorView` — Kings/Queens simulator with split selector (España/Brasil/México for Kings). Brasil only shows Kings (no Queens). Loads teams and matchdays from DB filtered by `competition_key` and `country`. Shows placeholder when no matchdays exist for the selected split.
- `RankingView` — global leaderboard.
- `PizarraView` — drag-and-drop tactical board supporting all three countries (España Split 6, Brasil Split 2, México Split 4). Dropdown flow: Competición → Equipo → Jugador. **Mixed teams are supported**: switching the Competición dropdown only updates the dropdowns for the next player to add — players already on the board are NOT removed. Each token on the board stores its own `split` field and resolves its image path independently via `buildImagePath(team, fileName, split)`. The "Limpiar" button clears all tokens regardless of origin.
- `TierList` (`components/TierList.tsx`) — tier list maker supporting España, Brasil, and México for Kings; España only for Queens. Extracted from the page into a reusable component; uses `useTierListData` hook for teams/players.

### Player data
`PLAYERS_DATA` constants (`SPAIN_PLAYERS_DATA`, `BRAZIL_PLAYERS_DATA`, `MEXICO_PLAYERS_DATA`) exist in both `app/tierlist/page.tsx` and `components/PizarraView.tsx` — they are duplicated intentionally as each component has different concerns. Player names are stored without file extension.

### Brand colors
- `#FFD300` — Kings / yellow accent
- `#01d6c3` — Queens / teal accent
- `#FF5733` — Simulator / orange accent
- `#0a0a0a` — App background (dark)

## Recent refactors

### Predis route (`/predis`)
- New route at `app/predis/page.tsx` — public-facing predictions/stats section, currently a placeholder ("Sección en construcción").
- Added to `USER_MENU` in `AppHeader.tsx` between PICKS and PIZARRA.

### TierList component extraction
- Tier list logic moved from `app/tierlist/page.tsx` into `components/TierList.tsx`.
- `app/tierlist/page.tsx` is now a thin wrapper that handles auth (reads `muertazos_user` from localStorage) and renders `<AppHeader>` + `<TierList user={user} />`.
- `TierList` accepts a `user?: { username?: string } | null` prop — no auth logic or router inside the component.
- Key UI improvements in `TierList.tsx` vs old page: label column widened to `w-32`, editing uses `<textarea>` for wrapping, new rows use next available letter (A–Z), `tierCounter` is a `useRef` (not module-level), share ticket label column widened to `80px`.

### `useTierListData` hook (`lib/hooks/useTierListData.ts`)
- Fetches teams from Supabase (`teams` table, filtered by `competition_key` + `country`).
- Attempts to fetch players from a `players` table; falls back to hardcoded `SPAIN_PLAYERS_DATA` / `BRAZIL_PLAYERS_DATA` / `MEXICO_PLAYERS_DATA` constants until that table is populated.
- Exports: `useTierListData(comp, country)` → `{ teamChips, playerTeamNames, buildPlayerChips, loading }`.
- Also exports the hardcoded player data constants and `buildPlayerChipsFallback` for external use.

### `players` table (needs to be created in Supabase)
```sql
CREATE TABLE players (
  id            serial PRIMARY KEY,
  team_id       int REFERENCES teams(id),
  team_name     text NOT NULL,
  name          text NOT NULL,
  country       text NOT NULL DEFAULT 'spain',
  competition_key text NOT NULL DEFAULT 'kings'
);
CREATE INDEX ON players (competition_key, country);
```
