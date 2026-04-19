/**
 * Recalculates user_points for ALL locked matchdays.
 * Run: node scripts/recalculate-points.mjs
 *
 * Logic: points = count of predictions where predicted_team_id === winner_team_id
 * Requirements: prediction NOT NULL, winner NOT NULL, and they must match.
 * Users with no predictions get 0 points (not absent from the table).
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Read .env.local
const envRaw = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envRaw.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join('=')])
)

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function recalculate() {
  console.log('Fetching all locked matchdays...')
  const { data: lockedDays, error: dErr } = await supabase
    .from('matchdays')
    .select('id, name, competition_key, country')
    .eq('is_locked', true)
    .order('display_order')

  if (dErr) { console.error('Error fetching matchdays:', dErr.message); process.exit(1) }
  if (!lockedDays || lockedDays.length === 0) { console.log('No locked matchdays found.'); return }

  console.log(`Found ${lockedDays.length} locked matchday(s):`, lockedDays.map(d => d.name).join(', '))

  const { data: allUsers } = await supabase
    .from('app_users')
    .select('id, username')
    .neq('role', 'admin')

  if (!allUsers || allUsers.length === 0) { console.log('No users found.'); return }
  console.log(`Found ${allUsers.length} users.`)

  let totalUpserted = 0

  for (const day of lockedDays) {
    const { data: matches } = await supabase
      .from('matches')
      .select('id, winner_team_id')
      .eq('matchday_id', day.id)
      .not('winner_team_id', 'is', null)

    if (!matches || matches.length === 0) {
      console.log(`  ${day.name}: no matches with winners — writing 0 for all users`)
    }

    const matchIds = (matches ?? []).map(m => m.id)
    const winnerMap = Object.fromEntries((matches ?? []).map(m => [m.id, m.winner_team_id]))

    const { data: preds } = matchIds.length > 0
      ? await supabase.from('predictions').select('user_id, match_id, predicted_team_id').in('match_id', matchIds)
      : { data: [] }

    const rows = allUsers.map(u => {
      const correct = (preds ?? []).filter(
        p => p.user_id === u.id &&
             p.predicted_team_id != null &&
             winnerMap[p.match_id] != null &&
             p.predicted_team_id === winnerMap[p.match_id]
      ).length
      return { user_id: u.id, matchday_id: day.id, points: correct, updated_at: new Date().toISOString() }
    })

    const { error } = await supabase
      .from('user_points')
      .upsert(rows, { onConflict: 'user_id,matchday_id' })

    if (error) {
      console.error(`  ${day.name}: ERROR — ${error.message}`)
    } else {
      totalUpserted += rows.length
      const breakdown = rows.reduce((acc, r) => { acc[r.points] = (acc[r.points] || 0) + 1; return acc }, {})
      console.log(`  ${day.name}: updated ${rows.length} users. Points distribution:`, breakdown)
    }
  }

  console.log(`\nDone. Total rows upserted: ${totalUpserted}`)
}

recalculate().catch(e => { console.error(e); process.exit(1) })
