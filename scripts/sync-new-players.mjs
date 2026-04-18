/**
 * Sync new España Split 6 player images to the Supabase players table.
 * Run with:  node scripts/sync-new-players.mjs
 * Requires:  NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// New players identified from filesystem (git status untracked images)
const NEW_PLAYERS = [
  { team: '1K FC',              name: 'Pol Requena'            },
  { team: 'El Barrio',          name: 'Naoufal Talkam'         },
  { team: 'La Capital CF',      name: 'Marc Montejo'           },
  { team: 'La Capital CF',      name: 'Roger García Hernández' },
  { team: 'PIO FC',             name: 'Kike Ferreres'          },
  { team: 'PIO FC',             name: 'Manel Beneite'          },
  { team: 'Rayo de Barcelona',  name: 'Nil Pradas'             },
  { team: 'Saiyans FC',         name: 'Alex Campuzano Bonilla' },
  { team: 'Skull FC',           name: 'Marcelo Vieira'         },
  { team: 'Ultimate Móstoles',  name: 'Pol Jansà'              },
  { team: 'xBuyer Team',        name: 'Antonio Domenech'       },
]

async function main() {
  // Fetch España Kings teams to get their IDs
  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select('id, name')
    .eq('competition_key', 'kings')
    .eq('country', 'spain')

  if (teamsErr) { console.error('Failed to fetch teams:', teamsErr.message); process.exit(1) }

  const teamMap = Object.fromEntries(teams.map(t => [t.name, t.id]))

  // Fetch existing players to avoid duplicates
  const { data: existing } = await supabase
    .from('players')
    .select('name, team_id')
    .eq('competition_key', 'kings')
    .eq('country_id', 1)

  const existingSet = new Set((existing ?? []).map(p => `${p.team_id}::${p.name}`))

  const toInsert = NEW_PLAYERS.flatMap(({ team, name }) => {
    const teamId = teamMap[team]
    if (!teamId) { console.warn(`  ⚠ Team not found in DB: "${team}"`); return [] }
    const key = `${teamId}::${name}`
    if (existingSet.has(key)) { console.log(`  ✓ Already exists: ${team} / ${name}`); return [] }
    return [{ team_id: teamId, competition_key: 'kings', country_id: 1, name, image_file: `${name}.webp`, lesion: false, tarjeta: false, wildcard: false, convocado: true }]
  })

  if (!toInsert.length) { console.log('\nNothing to insert — all players already in DB.'); return }

  console.log(`\nInserting ${toInsert.length} new player(s)...`)
  const { error: insertErr } = await supabase.from('players').insert(toInsert)
  if (insertErr) { console.error('Insert failed:', insertErr.message); process.exit(1) }

  toInsert.forEach(p => {
    const teamName = teams.find(t => t.id === p.team_id)?.name ?? p.team_id
    console.log(`  ✅ ${teamName} / ${p.name}`)
  })
  console.log('\nSync complete.')
}

main().catch(e => { console.error(e); process.exit(1) })
