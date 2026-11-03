/** PATCH /api/items/:id  { text?, done?, dueAt? } */
import type { ItemRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  const input = await readBody<{ text?: unknown; done?: unknown; dueAt?: unknown }>(event)
  const db = await useDb()
  const { rows } = await db.sql`SELECT * FROM items WHERE id = ${id} AND user_id = ${user.id}`
  const row = rows?.[0] as ItemRow | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Item not found' })

  if (input?.text !== undefined) row.text = readItemText(input.text)
  if (input?.done !== undefined) row.done = input.done ? 1 : 0
  if (input?.dueAt !== undefined && row.kind === 'reminder') row.due_at = readDueAt(input.dueAt)
  row.updated_at = Date.now()

  await db.sql`
    UPDATE items SET text = ${row.text}, done = ${row.done}, due_at = ${row.due_at}, updated_at = ${row.updated_at}
    WHERE id = ${id} AND user_id = ${user.id}`
  return toItem(row)
})
