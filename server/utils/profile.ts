/** Reading and saving the personal touches on an account. */
import { normalizePrefs, type Prefs } from '#shared/utils/prefs'
import type { Profile } from '#shared/types/profile'
import type { UserRow } from './db'

export function toProfile(row: Pick<UserRow, 'display_name' | 'journal_name' | 'prefs' | 'onboarded_at'>): Profile {
  let prefs: Prefs | null = null
  if (row.prefs) {
    try { prefs = normalizePrefs(JSON.parse(row.prefs)) } catch { prefs = null }
  }
  return {
    name: row.display_name ?? null,
    journalName: row.journal_name ?? null,
    prefs,
    onboarded: row.onboarded_at !== null && row.onboarded_at !== undefined
  }
}

export async function loadProfile(userId: string): Promise<Profile> {
  const db = await useDb()
  const { rows } = await db.sql`SELECT display_name, journal_name, prefs, onboarded_at FROM users WHERE id = ${userId}`
  const row = rows?.[0] as UserRow | undefined
  if (!row) throw createError({ statusCode: 401, statusMessage: 'Please sign in again.' })
  return toProfile(row)
}
