/**
 * GET /api/insights — patterns across your morning dumps.
 * Returns { unlocked: false, progress } until there are two weeks of history.
 *
 * Topic words are saved with each entry when it's written, so this route never
 * re-reads full entry text (except once, to fill in entries saved before that
 * existed). Entry text is never sent back.
 */
import type { DumpRow } from '../utils/db'
import { computeInsights, extractTopics } from '#shared/utils/insights'
import type { Affect } from '#shared/utils/cosmos'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = await useDb()
  // The most recent ~6 months of mornings: plenty for patterns, and it keeps
  // the work per request small (Cloudflare's free plan allows 10 ms of CPU).
  const { rows } = await db.sql`
    SELECT id, entry_date, words, affect, topics,
           CASE WHEN topics IS NULL THEN body ELSE NULL END AS body
    FROM dumps
    WHERE user_id = ${user.id} AND kind = 'dump'
    ORDER BY entry_date DESC, created_at DESC
    LIMIT 180`

  const entries = []
  for (const r of (rows ?? []) as unknown as DumpRow[]) {
    let topics: string[]
    if (r.topics) {
      topics = JSON.parse(r.topics) as string[]
    } else {
      // one-time backfill for entries saved before topics were stored
      topics = extractTopics(r.body ?? '')
      await db.sql`UPDATE dumps SET topics = ${JSON.stringify(topics)} WHERE id = ${r.id} AND user_id = ${user.id}`
    }
    entries.push({
      id: r.id,
      entryDate: r.entry_date,
      words: Number(r.words),
      affect: JSON.parse(r.affect) as Affect,
      topics
    })
  }

  return computeInsights(entries)
})
