/**
 * GET /api/dumps?kind=dump|journal|all — the signed-in user's entries, newest first.
 * Defaults to morning dumps. Returns a short excerpt instead of the full text.
 */
import type { DumpRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const q = getQuery(event).kind
  const kind = q === 'journal' || q === 'all' ? q : 'dump'
  const db = await useDb()
  const { rows } = kind === 'all'
    ? await db.sql`
        SELECT id, user_id, kind, title, entry_date, substr(body, 1, 200) AS excerpt, words, summary, affect, created_at, updated_at
        FROM dumps WHERE user_id = ${user.id}
        ORDER BY entry_date DESC, created_at DESC LIMIT 1000`
    : await db.sql`
        SELECT id, user_id, kind, title, entry_date, substr(body, 1, 200) AS excerpt, words, summary, affect, created_at, updated_at
        FROM dumps WHERE user_id = ${user.id} AND kind = ${kind}
        ORDER BY entry_date DESC, created_at DESC LIMIT 1000`
  return ((rows ?? []) as unknown as DumpRow[]).map(toSummary)
})
