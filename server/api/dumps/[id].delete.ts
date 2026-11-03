/** DELETE /api/dumps/:id — permanently delete one of your entries (and its links). */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  const db = await useDb()
  const { rows } = await db.sql`SELECT id FROM dumps WHERE id = ${id} AND user_id = ${user.id}`
  if (!rows?.length) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  await db.sql`DELETE FROM entry_links WHERE (entry_id = ${id} OR dump_id = ${id}) AND user_id = ${user.id}`
  await db.sql`DELETE FROM dumps WHERE id = ${id} AND user_id = ${user.id}`
  return { ok: true }
})
