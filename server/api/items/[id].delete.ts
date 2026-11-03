/** DELETE /api/items/:id */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  const db = await useDb()
  await db.sql`DELETE FROM items WHERE id = ${id} AND user_id = ${user.id}`
  return { ok: true }
})
