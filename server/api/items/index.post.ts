/** POST /api/items  { kind: 'todo'|'note'|'reminder', text, dueAt?, sourceId? } */
import type { ItemRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const input = await readBody<{ kind?: unknown; text?: unknown; dueAt?: unknown; sourceId?: unknown }>(event)
  const db = await useDb()

  const { rows: countRows } = await db.sql`SELECT COUNT(*) AS n FROM items WHERE user_id = ${user.id}`
  if (Number((countRows?.[0] as { n: number } | undefined)?.n ?? 0) >= MAX_ITEMS) {
    throw createError({ statusCode: 400, statusMessage: 'That list is full. Clear out some finished items first.' })
  }

  const kind = readItemKind(input?.kind)
  const sourceId = typeof input?.sourceId === 'string' && input.sourceId.length <= 64 ? input.sourceId : null
  // only accept a source entry the user owns
  if (sourceId) {
    const own = await db.sql`SELECT id FROM dumps WHERE id = ${sourceId} AND user_id = ${user.id}`
    if (!own.rows?.length) throw createError({ statusCode: 400, statusMessage: 'Unknown source entry' })
  }

  const now = Date.now()
  const row: ItemRow = {
    id: crypto.randomUUID(),
    user_id: user.id,
    kind,
    text: readItemText(input?.text),
    done: 0,
    due_at: kind === 'reminder' ? readDueAt(input?.dueAt) : null,
    source_id: sourceId,
    created_at: now,
    updated_at: now
  }
  await db.sql`
    INSERT INTO items (id, user_id, kind, text, done, due_at, source_id, created_at, updated_at)
    VALUES (${row.id}, ${row.user_id}, ${row.kind}, ${row.text}, 0, ${row.due_at}, ${row.source_id}, ${now}, ${now})`

  setResponseStatus(event, 201)
  return toItem(row)
})
