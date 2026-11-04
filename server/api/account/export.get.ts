/** GET /api/account/export — download everything we store about you, as JSON. */
import type { DumpRow, ItemRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = await useDb()
  const entries = await db.sql`SELECT * FROM dumps WHERE user_id = ${user.id} ORDER BY entry_date ASC, created_at ASC`
  const links = await db.sql`SELECT entry_id, dump_id FROM entry_links WHERE user_id = ${user.id}`
  const items = await db.sql`SELECT * FROM items WHERE user_id = ${user.id} ORDER BY created_at ASC`
  const games = await db.sql`SELECT mode, day, created_at, data FROM game_events WHERE user_id = ${user.id} ORDER BY created_at ASC`
  const profile = await loadProfile(user.id)
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="brain-dump-export.json"')
  return {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, name: profile.name, journalName: profile.journalName, preferences: profile.prefs },
    entries: ((entries.rows ?? []) as unknown as DumpRow[]).map((r) => toDetail(r)),
    links: links.rows ?? [],
    items: ((items.rows ?? []) as unknown as ItemRow[]).map(toItem),
    games: ((games.rows ?? []) as { mode: string; day: string; created_at: number; data: string }[]).map((g) => {
      let details: unknown = null
      try { details = JSON.parse(g.data) } catch { details = null }
      return { mode: g.mode, day: g.day, savedAt: new Date(Number(g.created_at)).toISOString(), details }
    })
  }
})
