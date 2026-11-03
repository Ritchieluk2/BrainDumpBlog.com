/**
 * PATCH /api/dumps/:id  { title?, body?, refs? }
 * Edit a journal entry. Morning dumps are kept as written (that's the ritual),
 * so they can be deleted but not edited.
 */
import type { DumpRow } from '../../utils/db'
import { analyzeText, summarize } from '#shared/utils/affect'
import { extractTopics } from '#shared/utils/insights'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  const input = await readBody<{ title?: unknown; body?: unknown; refs?: unknown }>(event)
  const db = await useDb()

  const { rows } = await db.sql`SELECT * FROM dumps WHERE id = ${id} AND user_id = ${user.id}`
  const row = rows?.[0] as DumpRow | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  if (row.kind !== 'journal') {
    throw createError({ statusCode: 400, statusMessage: 'Morning dumps are kept as written. You can write a journal entry about it instead.' })
  }

  const now = Date.now()
  if (input?.title !== undefined) {
    row.title = readTitle(input.title)
    await db.sql`UPDATE dumps SET title = ${row.title}, updated_at = ${now} WHERE id = ${id} AND user_id = ${user.id}`
  }
  if (input?.body !== undefined) {
    const text = readDumpText(input.body)
    const affect = analyzeText(text)
    row.body = text
    row.words = affect.words
    row.summary = summarize(affect)
    row.affect = JSON.stringify(affect)
    row.topics = JSON.stringify(extractTopics(text))
    await db.sql`
      UPDATE dumps SET body = ${row.body}, words = ${row.words}, summary = ${row.summary}, affect = ${row.affect}, topics = ${row.topics}, updated_at = ${now}
      WHERE id = ${id} AND user_id = ${user.id}`
  }
  if (input?.refs !== undefined) {
    await saveLinks(db, id, user.id, readRefIds(input.refs))
  }

  return toDetail(row, await loadRefs(db, id, user.id), [])
})
