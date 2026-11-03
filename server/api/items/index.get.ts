/** GET /api/items — your to-dos, notes and reminders. */
import type { ItemRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = await useDb()
  const { rows } = await db.sql`
    SELECT * FROM items WHERE user_id = ${user.id}
    ORDER BY done ASC, COALESCE(due_at, 9e15) ASC, created_at DESC
    LIMIT ${MAX_ITEMS}`
  return ((rows ?? []) as unknown as ItemRow[]).map(toItem)
})
