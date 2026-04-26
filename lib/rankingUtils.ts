// Kings League Rule 1.1.2 — official standings tie-breaker
// Primary sort: total pts (w×3 — all wins equal, regular or shootout)
// Tie-break sequence:
//   a) H2H points          b) H2H goal diff
//   c) H2H goals scored    d) H2H regular wins
//   e) Overall goal diff   f) Overall goals scored

export interface TeamMatchStats {
  w: number    // total wins  (regW + soW)
  l: number    // total losses (regL + soL)
  regW: number // regular-time wins
  soW: number  // shootout wins (same pts value as regW)
  soL: number  // shootout losses
  regL: number // regular-time losses
  gf: number
  gc: number
  dg: number   // gf - gc
  pts: number  // w × 3 (all wins worth 3 pts, no partial credit)
}

export type TeamWithStats = { id: number; [key: string]: any } & TeamMatchStats

type ScoreEntry = { hg: string; ag: string; penaltyWinnerId: number | null }
type ScoreMap = Record<number, ScoreEntry>

const ZERO: TeamMatchStats = {
  w: 0, l: 0, regW: 0, soW: 0, soL: 0, regL: 0,
  gf: 0, gc: 0, dg: 0, pts: 0,
}

function computeStats(
  teamIds: number[],
  matchdays: any[],
  scores: ScoreMap,
  onlyBetween?: Set<number>,
): Record<number, TeamMatchStats> {
  const stats: Record<number, TeamMatchStats> = {}
  for (const id of teamIds) stats[id] = { ...ZERO }

  for (const md of matchdays) {
    for (const m of md.matches ?? []) {
      const hId: number = m.home_team_id
      const aId: number = m.away_team_id
      if (onlyBetween && (!onlyBetween.has(hId) || !onlyBetween.has(aId))) continue

      const s = scores[m.id]
      if (!s || s.hg === '' || s.ag === '') continue
      const hG = parseInt(s.hg)
      const aG = parseInt(s.ag)
      if (isNaN(hG) || isNaN(aG)) continue

      const home = stats[hId]
      const away = stats[aId]
      if (!home || !away) continue

      home.gf += hG; home.gc += aG
      away.gf += aG; away.gc += hG

      if (hG > aG) {
        home.regW++; away.regL++
      } else if (aG > hG) {
        away.regW++; home.regL++
      } else {
        if (s.penaltyWinnerId === hId)      { home.soW++; away.soL++ }
        else if (s.penaltyWinnerId === aId) { away.soW++; home.soL++ }
      }
    }
  }

  for (const id in stats) {
    const s = stats[id]
    s.w   = s.regW + s.soW
    s.l   = s.regL + s.soL
    s.dg  = s.gf - s.gc
    s.pts = s.w * 3
  }

  return stats
}

function h2hHasData(group: TeamWithStats[], matchdays: any[], scores: ScoreMap): boolean {
  const ids = new Set(group.map(t => t.id))
  return matchdays.some(md =>
    (md.matches ?? []).some((m: any) => {
      if (!ids.has(m.home_team_id) || !ids.has(m.away_team_id)) return false
      const s = scores[m.id]
      return s && s.hg !== '' && s.ag !== ''
    })
  )
}

function sortTied(
  group: TeamWithStats[],
  matchdays: any[],
  scores: ScoreMap,
  overall: Record<number, TeamMatchStats>,
): TeamWithStats[] {
  if (group.length <= 1) return group

  const tiedIds = new Set(group.map(t => t.id))
  const h2h = computeStats(group.map(t => t.id), matchdays, scores, tiedIds)
  const useH2H = h2hHasData(group, matchdays, scores)

  return [...group].sort((a, b) => {
    const ah = h2h[a.id] ?? { ...ZERO }
    const bh = h2h[b.id] ?? { ...ZERO }
    const ao = overall[a.id] ?? { ...ZERO }
    const bo = overall[b.id] ?? { ...ZERO }

    if (useH2H) {
      if (bh.pts  !== ah.pts)  return bh.pts  - ah.pts   // a) H2H points
      if (bh.dg   !== ah.dg)   return bh.dg   - ah.dg    // b) H2H goal diff
      if (bh.gf   !== ah.gf)   return bh.gf   - ah.gf    // c) H2H goals scored
      if (bh.regW !== ah.regW) return bh.regW - ah.regW  // d) H2H regular wins
    }
    if (bo.dg !== ao.dg) return bo.dg - ao.dg             // e) overall goal diff
    if (bo.gf !== ao.gf) return bo.gf - ao.gf             // f) overall goals scored
    return 0
  })
}

/**
 * Compute Kings League standings with full Rule 1.1.2 tie-breaker.
 * Returns teams sorted by: pts → H2H pts → H2H GD → H2H GF → H2H regW → GD → GF.
 * Works reactively — call whenever `scores` changes (e.g. live simulator input).
 */
export function calculateKingsRanking(
  teams: any[],
  matchdays: any[],
  scores: ScoreMap,
): TeamWithStats[] {
  if (teams.length === 0) return []

  const overall = computeStats(teams.map(t => t.id), matchdays, scores)

  const withStats: TeamWithStats[] = teams.map(t => ({
    ...t,
    ...(overall[t.id] ?? { ...ZERO }),
  }))

  // Initial sort groups ties together so we can extract each tied bucket.
  withStats.sort((a, b) => b.pts - a.pts)

  const result: TeamWithStats[] = []
  let i = 0
  while (i < withStats.length) {
    let j = i + 1
    while (j < withStats.length && withStats[j].pts === withStats[i].pts) j++
    result.push(...sortTied(withStats.slice(i, j), matchdays, scores, overall))
    i = j
  }

  return result
}
