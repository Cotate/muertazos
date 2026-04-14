'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getTeamLogoPath, type Country } from '@/lib/utils'
import {
  SPAIN_PLAYERS_DATA,
  BRAZIL_PLAYERS_DATA,
  MEXICO_PLAYERS_DATA,
} from '@/lib/hooks/useTierListData'

type StatusField = 'lesion' | 'tarjeta' | 'wildcard' | 'convocado'

const COUNTRY_ID: Record<string, number> = {
  spain:  1,
  brazil: 2,
  mexico: 3,
}

interface Player {
  id: number
  name: string
  team_id: number
  lesion: boolean
  tarjeta: boolean
  wildcard: boolean
  convocado: boolean
}

interface Team {
  id: number
  name: string
  logo_file: string
  country: string
}

/*
  Table schema (players):
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
*/

// Hardcoded player data keyed by "competitionKey-country"
const HARDCODED: Record<string, Record<string, string[]>> = {
  'kings-spain':  SPAIN_PLAYERS_DATA,
  'kings-brazil': BRAZIL_PLAYERS_DATA,
  'kings-mexico': MEXICO_PLAYERS_DATA,
}

const STATUS_CONFIG: { field: StatusField; label: string; onCls: string }[] = [
  { field: 'lesion',    label: 'Lesión',    onCls: 'bg-red-600/80 border-red-500 text-white' },
  { field: 'tarjeta',   label: 'Tarjeta',   onCls: 'bg-amber-500/80 border-amber-400 text-black' },
  { field: 'wildcard',  label: 'Wildcard',  onCls: 'bg-violet-600/80 border-violet-500 text-white' },
  { field: 'convocado', label: 'Convocado', onCls: 'bg-emerald-600/80 border-emerald-500 text-white' },
]

const OFF_CLS =
  'bg-slate-800 border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'

export default function AdminPlayerRoster({
  competitionKey,
  country,
}: {
  competitionKey: string
  country: Country
}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const accentColor    = competitionKey === 'queens' ? '#01d6c3' : '#FFD300'
  const jugadoresLabel = competitionKey === 'queens' ? 'Jugadoras' : 'Jugadores'
  const hardcodedKey   = `${competitionKey}-${country}`

  // ── Load teams ─────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[AdminPlayerRoster] loading teams:', { competitionKey, country })
    supabase
      .from('teams')
      .select('id, name, logo_file, country')
      .eq('competition_key', competitionKey)
      .eq('country', country)
      .order('name')
      .then(({ data, error }) => {
        console.log('[AdminPlayerRoster] teams result:', { data, error })
        const rows = data ?? []
        setTeams(rows)
        setSelectedTeamId(rows.length ? rows[0].id : null)
      })
  }, [competitionKey, country])

  // ── Load players for selected team ─────────────────────────────────────────
  useEffect(() => {
    if (selectedTeamId == null) { setPlayers([]); return }
    setLoading(true)
    setDbError(null)

    console.log('[AdminPlayerRoster] fetching players:', {
      team_id: selectedTeamId,
      competition_key: competitionKey,
      country_id: COUNTRY_ID[country] ?? 1,
    })

    supabase
      .from('players')
      .select('id, name, team_id, lesion, tarjeta, wildcard, convocado')
      .eq('team_id', selectedTeamId)
      .order('name')
      .then(({ data, error }) => {
        setLoading(false)
        // Supabase error objects have non-enumerable props — stringify to see them
        console.log('[AdminPlayerRoster] players result:', {
          count: data?.length,
          error: error ? JSON.stringify(error) : null,
          errorMsg: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint,
        })

        if (error) {
          // Build a human-readable message from whatever the error object contains
          const msg =
            error.message ||
            error.details ||
            error.hint ||
            (error.code ? `Código: ${error.code}` : null) ||
            JSON.stringify(error) ||
            'Error desconocido al consultar la tabla players'
          console.error('[AdminPlayerRoster] DB error (full):', JSON.stringify(error))
          setDbError(msg)
          setPlayers([])
          return
        }

        setPlayers(
          (data ?? []).map(p => ({
            id:        p.id,
            name:      p.name,
            team_id:   p.team_id,
            lesion:    !!p.lesion,
            tarjeta:   !!p.tarjeta,
            wildcard:  !!p.wildcard,
            convocado: p.convocado !== false,
          }))
        )
      })
  }, [selectedTeamId, reloadKey]) // reloadKey forces a re-fetch after import

  // ── Import hardcoded players into DB ───────────────────────────────────────
  const importPlayers = async () => {
    if (selectedTeamId == null) return
    const selectedTeam = teams.find(t => t.id === selectedTeamId)
    if (!selectedTeam) return

    const hardcoded = HARDCODED[hardcodedKey]?.[selectedTeam.name] ?? []
    if (!hardcoded.length) {
      console.warn('[AdminPlayerRoster] no hardcoded data for', hardcodedKey, selectedTeam.name)
      return
    }

    const rows = hardcoded.map(name => ({
      team_id:         selectedTeamId,
      competition_key: competitionKey,
      country_id:      COUNTRY_ID[country] ?? 1,
      name,
      image_file:      `${name}.webp`,
      lesion:          false,
      tarjeta:         false,
      wildcard:        false,
      convocado:       true,
    }))

    setImporting(true)
    console.log('[AdminPlayerRoster] importing', rows.length, 'players for', selectedTeam.name)
    const { error } = await supabase.from('players').insert(rows)
    setImporting(false)

    if (error) {
      const msg =
        error.message ||
        error.details ||
        error.hint ||
        (error.code ? `Código: ${error.code}` : null) ||
        JSON.stringify(error) ||
        'Error al importar jugadores'
      console.error('[AdminPlayerRoster] import error (full):', JSON.stringify(error))
      setDbError(msg)
      return
    }

    console.log('[AdminPlayerRoster] import successful, reloading...')
    setReloadKey(k => k + 1)
  }

  // ── Optimistic toggle ───────────────────────────────────────────────────────
  const toggleStatus = async (playerId: number, field: StatusField, currentVal: boolean) => {
    const newVal = !currentVal
    setToggleError(null)
    // Optimistic update
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: newVal } : p))
    const { error } = await supabase
      .from('players')
      .update({ [field]: newVal })
      .eq('id', playerId)
    if (error) {
      // Supabase errors have non-enumerable props — always stringify for visibility
      console.error('[AdminPlayerRoster] toggle error (full):', JSON.stringify(error))
      const msg =
        error.message ||
        error.details ||
        error.hint ||
        (error.code ? `Código: ${error.code}` : null) ||
        JSON.stringify(error) ||
        'Error desconocido al guardar'
      setToggleError(msg)
      // Roll back optimistic update
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: currentVal } : p))
    }
  }

  const selectedTeam   = teams.find(t => t.id === selectedTeamId)
  const convocadoCount = players.filter(p => p.convocado).length
  const hasHardcoded   = !!HARDCODED[hardcodedKey]?.[selectedTeam?.name ?? '']?.length

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* ── Team selector ── */}
      {teams.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            Seleccionar Equipo
          </p>
          <div className="flex flex-wrap gap-2">
            {teams.map(team => {
              const active = selectedTeamId === team.id
              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all
                    ${active ? 'border-current' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                  style={active ? { borderColor: accentColor, color: accentColor, backgroundColor: accentColor + '18' } : {}}
                >
                  <div className="relative w-7 h-7 flex-shrink-0">
                    <Image
                      src={getTeamLogoPath(competitionKey, team.logo_file, team.country)}
                      alt={team.name}
                      fill
                      sizes="28px"
                      className="object-contain"
                      onError={e => { e.currentTarget.style.opacity = '0' }}
                    />
                  </div>
                  <span>{team.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Toggle error banner ── */}
      {toggleError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-red-400 text-xs font-black uppercase tracking-wide shrink-0">Error al guardar:</span>
          <span className="text-red-300 text-xs font-mono break-all">{toggleError}</span>
          <button onClick={() => setToggleError(null)} className="ml-auto text-red-500 hover:text-red-300 text-xs shrink-0">✕</button>
        </div>
      )}

      {/* ── Player table ── */}
      {dbError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-3">
          <p className="text-red-400 font-black uppercase tracking-wide text-sm">
            Error al cargar jugadores
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            {dbError}
          </p>
          <div className="text-slate-600 text-xs leading-relaxed space-y-1">
            <p>Posibles causas:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              <li>La tabla <code className="text-slate-400 bg-slate-800 px-1 rounded">players</code> no existe → ejecuta el CREATE TABLE</li>
              <li>Faltan columnas de estado → ejecuta los ALTER TABLE para añadir <code className="text-slate-400 bg-slate-800 px-1 rounded">lesion</code>, <code className="text-slate-400 bg-slate-800 px-1 rounded">tarjeta</code>, <code className="text-slate-400 bg-slate-800 px-1 rounded">wildcard</code>, <code className="text-slate-400 bg-slate-800 px-1 rounded">convocado</code></li>
              <li>RLS habilitado — la tabla debe tener RLS desactivado (como el resto)</li>
            </ul>
          </div>
          <p className="text-slate-700 text-[10px] font-mono break-all border-t border-slate-800 pt-2">
            Detalle: {dbError}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

          {/* Table header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800 flex-wrap gap-y-2">
            {selectedTeam && (
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src={getTeamLogoPath(competitionKey, selectedTeam.logo_file, selectedTeam.country)}
                  alt={selectedTeam.name}
                  fill
                  sizes="32px"
                  className="object-contain"
                  onError={e => { e.currentTarget.style.opacity = '0' }}
                />
              </div>
            )}
            <span className="font-black italic uppercase text-sm tracking-tight" style={{ color: accentColor }}>
              {selectedTeam?.name ?? '—'} · {jugadoresLabel}
            </span>
            {players.length > 0 && (
              <span className="text-[11px] text-slate-600 font-bold">
                {convocadoCount}/{players.length} convocados
              </span>
            )}

            {/* Import button — only shown when table is empty and hardcoded data exists */}
            {!loading && players.length === 0 && hasHardcoded && (
              <button
                onClick={importPlayers}
                disabled={importing}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-all disabled:opacity-50"
                style={{ backgroundColor: accentColor + '22', color: accentColor, border: `1px solid ${accentColor}55` }}
              >
                {importing ? (
                  <>
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                    Importando...
                  </>
                ) : (
                  <>↓ Importar jugadores</>
                )}
              </button>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <p className="text-slate-700 text-sm font-bold italic uppercase tracking-widest">
                Sin jugadores registrados
              </p>
              {hasHardcoded && (
                <p className="text-slate-600 text-xs">
                  Pulsa "Importar jugadores" para cargar el roster desde los datos del sistema.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px]">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 w-full">
                      Nombre
                    </th>
                    {STATUS_CONFIG.map(s => (
                      <th
                        key={s.field}
                        className="px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center whitespace-nowrap"
                      >
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {players.map(player => (
                    <tr
                      key={player.id}
                      className={`transition-colors hover:bg-white/[0.02] ${!player.convocado ? 'opacity-40' : ''}`}
                    >
                      <td className="px-5 py-2.5 text-sm text-slate-200 font-medium">{player.name}</td>
                      {STATUS_CONFIG.map(({ field, label, onCls }) => {
                        const active = player[field]
                        return (
                          <td key={field} className="px-2 py-2 text-center">
                            <button
                              onClick={() => toggleStatus(player.id, field, active)}
                              className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap
                                ${active ? onCls : OFF_CLS}`}
                            >
                              {active ? '✓' : field === 'convocado' ? '✗' : '–'} {label}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
