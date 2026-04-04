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

All pages are `'use client'`. Auth is role-based via `localStorage` key `muertazos_user` (JSON of the `app_users` row). On load, pages check `localStorage` and redirect to `/` if no valid session or insufficient role.

### Auth model
Custom auth — **not Supabase Auth**. Credentials are checked against the `app_users` table (plain-text password comparison in the DB query). Roles: `admin` or regular user.

### Supabase schema
- `competitions` — id, key (`'kings'`|`'queens'`), name, color
- `teams` — id, competition_key, name, logo_file
- `matchdays` — id, competition_key, name, date_label, display_order, is_visible, is_locked
- `matches` — id, matchday_id, home_team_id, away_team_id, winner_team_id, match_order (default 99)
- `match_results` — match_id (PK), home_goals, away_goals, home_penalties, away_penalties, updated_at
- `app_users` — id (uuid), username (unique), password, role (default `'user'`)
- `predictions` — id, user_id, match_id, predicted_team_id
- `user_points` — id (uuid), user_id, matchday_id, points, updated_at

The Supabase client is a singleton at `lib/supabase.ts`. RLS is **disabled** on all tables.

### Components
- `AppHeader` — shared sticky header with two variants: `'minimal'` (centered logo only, used on login) and `'nav'` (full navigation with left/right nav items, hamburger drawer on mobile, logout button).
- `AppFooter` — global footer rendered in `app/layout.tsx`.

### Player images
Stored under `public/jugadores/{TeamName}/{PlayerName}.png`. The `PLAYERS_DATA` constant in `app/dashboard/page.tsx` maps team names to player filenames (Kings league only).

### Brand colors
- `#FFD300` — Kings / yellow accent
- `#01d6c3` — Queens / teal accent
- `#FF5733` — Simulator / orange accent
- `#0a0a0a` — App background (dark)
