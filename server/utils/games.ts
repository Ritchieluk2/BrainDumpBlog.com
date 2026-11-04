/**
 * Game logging for /games (Syzygy). Each finished game, Adventure encounter
 * or Adventure reward pick is one row in game_events. Signed-out players are
 * counted by an anonymous id the game keeps in their browser; when they sign
 * in, their earlier anonymous games are attached to the account.
 *
 * Kept free of Nitro auto-imports so it can be tested on its own.
 */

export const GAME_MODES = [
  'daily', 'practice',
  'race-blitz', 'race-plus', 'race-trial',
  'flux', 'flux-random',
  'encounter', 'pick'
] as const
export type GameMode = (typeof GAME_MODES)[number]

/** Most events accepted in one request. The game sends at most 25. */
export const MAX_EVENTS_PER_REQUEST = 25
/** Largest single event, as JSON. Real ones are well under 1 KB. */
export const MAX_EVENT_BYTES = 4000
/** How far back the stats view reads, and how many rows at most (keeps the Worker's CPU time small). */
export const STATS_DAYS = 120
export const STATS_MAX_ROWS = 2000

export interface GameEventRow {
  id: string
  user_id: string | null
  anon_id: string | null
  mode: GameMode
  day: string
  ver: string | null
  created_at: number
  data: string
}

const ID_RE = /^[a-z0-9]{6,32}$/
const ANON_RE = /^[A-Za-z0-9_-]{8,40}$/
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export function readAnonId(input: unknown): string | null {
  return typeof input === 'string' && ANON_RE.test(input) ? input : null
}

function isDay(value: unknown): value is string {
  if (typeof value !== 'string' || !DAY_RE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

/**
 * Turns the request body's `events` into rows, dropping anything malformed
 * instead of failing the whole batch (a game should never get stuck retrying).
 */
export function readGameEvents(
  input: unknown,
  who: { userId: string | null; anonId: string | null },
  now: number
): GameEventRow[] {
  if (!Array.isArray(input)) return []
  const rows: GameEventRow[] = []
  const seen = new Set<string>()
  for (const raw of input.slice(0, MAX_EVENTS_PER_REQUEST)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const e = raw as Record<string, unknown>
    const id = typeof e.id === 'string' && ID_RE.test(e.id) ? e.id : null
    const mode = typeof e.mode === 'string' && (GAME_MODES as readonly string[]).includes(e.mode) ? (e.mode as GameMode) : null
    if (!id || !mode || seen.has(id)) continue
    const day = isDay(e.day) ? e.day : new Date(now).toISOString().slice(0, 10)
    const ver = typeof e.ver === 'string' ? e.ver.slice(0, 24) : null
    // Never keep fields that could identify someone, even if a client sent them.
    const { who: _who, email: _email, name: _name, ...rest } = e
    const data = JSON.stringify(rest)
    if (data.length > MAX_EVENT_BYTES) continue
    seen.add(id)
    rows.push({ id, user_id: who.userId, anon_id: who.anonId, mode, day, ver, created_at: now, data })
  }
  return rows
}

/** NUXT_ADMIN_EMAILS is a comma-separated list of the accounts that see everyone's game stats. */
export function isGameAdmin(email: string | null | undefined, adminEmails: string | null | undefined): boolean {
  if (!email || !adminEmails) return false
  const list = adminEmails.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}

/** Rows back into the shape the game's Stats sheet reads. `who` is opaque: a player key, never an email. */
export function toStatsGames(rows: { user_id: string | null; anon_id: string | null; data: string }[]) {
  const keys = new Map<string, string>()
  const out: Record<string, unknown>[] = []
  for (const r of rows) {
    let data: Record<string, unknown>
    try { data = JSON.parse(r.data) } catch { continue }
    const raw = r.user_id ? `u:${r.user_id}` : `a:${r.anon_id ?? '?'}`
    if (!keys.has(raw)) keys.set(raw, `p${keys.size + 1}`)
    out.push({ ...data, who: keys.get(raw) })
  }
  return { games: out, players: keys.size }
}
