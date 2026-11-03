/**
 * GET /api/dumps/:id — one entry with its full text. Only the owner can read it.
 * Journal entries include the mornings they reflect on; mornings include the
 * journal entries that reflect on them.
 */
import type { DumpRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  const db = await useDb()
  const { rows } = await db.sql`SELECT * FROM dumps WHERE id = ${id} AND user_id = ${user.id}`
  const row = rows?.[0] as DumpRow | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })

  return row.kind === 'journal'
    ? toDetail(row, await loadRefs(db, id, user.id), [])
    : toDetail(row, [], await loadReflections(db, id, user.id))
})
