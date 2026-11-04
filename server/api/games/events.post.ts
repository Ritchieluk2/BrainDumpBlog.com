/**
 * POST /api/games/events  { anonId, events: [...] }
 * Saves finished games from /games/syzygy. Works signed in or out: signed-out
 * games are kept under the anonymous id the game stores in the browser.
 * Duplicate ids are ignored, so the game can safely retry a batch.
 */
import { readAnonId, readGameEvents } from '../../utils/games'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session.user?.id ?? null
  const input = await readBody<{ anonId?: unknown; events?: unknown }>(event)
  const anonId = readAnonId(input?.anonId)
  if (!userId && !anonId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing player id.' })
  }

  const rows = readGameEvents(input?.events, { userId, anonId }, Date.now())
  const db = await useDb()
  for (const r of rows) {
    await db.sql`
      INSERT OR IGNORE INTO game_events (id, user_id, anon_id, mode, day, ver, created_at, data)
      VALUES (${r.id}, ${r.user_id}, ${r.anon_id}, ${r.mode}, ${r.day}, ${r.ver}, ${r.created_at}, ${r.data})`
  }
  // Games played on this device before signing in now belong to the account.
  if (userId && anonId) {
    await db.sql`UPDATE game_events SET user_id = ${userId} WHERE anon_id = ${anonId} AND user_id IS NULL`
  }
  return { saved: rows.length }
})
