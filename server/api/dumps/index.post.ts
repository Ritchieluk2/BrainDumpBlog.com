/**
 * POST /api/dumps  { body, entryDate, kind?, title?, refs? }
 * Save a morning dump (default) or a journal entry. Journal entries can
 * reference morning dumps by id in `refs`.
 */
import type { DumpRow } from '../../utils/db'
import { analyzeText, summarize } from '#shared/utils/affect'
import { extractTopics } from '#shared/utils/insights'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const input = await readBody<{ body?: unknown; entryDate?: unknown; kind?: unknown; title?: unknown; refs?: unknown }>(event)
  const text = readDumpText(input?.body)
  const kind = readKind(input?.kind)
  const title = kind === 'journal' ? readTitle(input?.title) : null
  // The client sends its own local date so "this morning" matches the writer's day.
  const entryDate = isIsoDate(input?.entryDate) ? input.entryDate : new Date().toISOString().slice(0, 10)

  const affect = analyzeText(text)
  const summary = summarize(affect)
  const now = Date.now()
  const row: DumpRow = {
    id: crypto.randomUUID(),
    user_id: user.id,
    kind,
    title,
    entry_date: entryDate,
    body: text,
    words: affect.words,
    summary,
    affect: JSON.stringify(affect),
    topics: JSON.stringify(extractTopics(text)),
    created_at: now,
    updated_at: now
  }

  const db = await useDb()
  await db.sql`
    INSERT INTO dumps (id, user_id, kind, title, entry_date, body, words, summary, affect, topics, created_at, updated_at)
    VALUES (${row.id}, ${row.user_id}, ${kind}, ${title}, ${row.entry_date}, ${row.body}, ${row.words}, ${row.summary}, ${row.affect}, ${row.topics}, ${row.created_at}, ${row.updated_at})`

  if (kind === 'journal') {
    await saveLinks(db, row.id, user.id, readRefIds(input?.refs))
  }

  setResponseStatus(event, 201)
  return toDetail(row, kind === 'journal' ? await loadRefs(db, row.id, user.id) : [])
})
