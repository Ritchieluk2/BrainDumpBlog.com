/**
 * PATCH /api/account/profile
 *   { name?, journalName?, prefs?, onboarded?: true }
 * Any field left out is unchanged. An empty name clears it.
 */
import { JOURNAL_NAME_MAX, NAME_MAX, cleanName, normalizePrefs } from '#shared/utils/prefs'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { user } = session
  const body = (await readBody<Record<string, unknown>>(event)) ?? {}
  const db = await useDb()

  if ('name' in body) {
    await db.sql`UPDATE users SET display_name = ${cleanName(body.name, NAME_MAX)} WHERE id = ${user.id}`
  }
  if ('journalName' in body) {
    await db.sql`UPDATE users SET journal_name = ${cleanName(body.journalName, JOURNAL_NAME_MAX)} WHERE id = ${user.id}`
  }
  if ('prefs' in body) {
    // normalizePrefs keeps only known fields with valid values, so this stays small
    await db.sql`UPDATE users SET prefs = ${JSON.stringify(normalizePrefs(body.prefs))} WHERE id = ${user.id}`
  }
  if (body.onboarded === true) {
    await db.sql`UPDATE users SET onboarded_at = COALESCE(onboarded_at, ${Date.now()}) WHERE id = ${user.id}`
  }

  const profile = await loadProfile(user.id)
  // Keep the names in the session so pages can greet the reader without another request.
  if ('name' in body || 'journalName' in body) {
    await setUserSession(event, { user: { ...user, name: profile.name, journalName: profile.journalName } })
  }
  return profile
})
