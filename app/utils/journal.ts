/** Small client helpers for dates and the not-yet-saved dump. */

/** Today's date in the reader's own timezone, as YYYY-MM-DD. */
export function localIsoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function formatIsoDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }): string {
  return parseIsoDate(iso).toLocaleDateString('en-US', opts)
}

/** Monday of the week containing this date, as YYYY-MM-DD. */
export function weekStart(iso: string): string {
  const d = parseIsoDate(iso)
  const offset = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - offset)
  return localIsoDate(d)
}

/** Only allow redirects to paths on this site (blocks //evil.com and /\evil.com). */
export function safeNextPath(value: unknown): string | null {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : null
}

// --- A dump written before signing in waits here until the account exists ---

const PENDING_KEY = 'bd-pending'
export const DRAFT_KEY = 'bd-draft'

export interface PendingDump {
  body: string
  entryDate: string
}

export function savePending(p: PendingDump) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)) } catch { /* storage unavailable */ }
}

export function readPending(): PendingDump | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as PendingDump) : null
  } catch {
    return null
  }
}

export function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY)
    localStorage.removeItem(DRAFT_KEY)
  } catch { /* ignore */ }
}
