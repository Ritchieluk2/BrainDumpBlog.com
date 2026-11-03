/**
 * GET /api/dev/demo-login        sign in as the demo account (seeds it on first use)
 * GET /api/dev/demo-login?reset=1  rebuild all demo content so the dates end today
 *
 * DEVELOPMENT ONLY. In a production build this route always answers 404,
 * so it can never be used to sign in on the live site.
 */
import { analyzeText, summarize } from '#shared/utils/affect'
import { extractTopics } from '#shared/utils/insights'
import { DEMO_EMAIL, DEMO_ENTRIES, DEMO_ITEMS, DEMO_JOURNALS } from '../../lib/demo-entries'

function localIsoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const db = await useDb()
  const now = Date.now()
  const reset = getQuery(event).reset === '1'

  const found = await db.sql`SELECT id FROM users WHERE email = ${DEMO_EMAIL}`
  let userId = (found.rows?.[0] as { id: string } | undefined)?.id
  if (!userId) {
    userId = crypto.randomUUID()
    await db.sql`INSERT INTO users (id, email, created_at) VALUES (${userId}, ${DEMO_EMAIL}, ${now})`
  }

  // Seed when asked, when empty, or when the demo predates journal entries.
  const counted = await db.sql`SELECT COUNT(*) AS n FROM dumps WHERE user_id = ${userId} AND kind = 'journal'`
  const journals = Number((counted.rows?.[0] as { n: number } | undefined)?.n ?? 0)

  if (reset || journals === 0) {
    await db.sql`DELETE FROM entry_links WHERE user_id = ${userId}`
    await db.sql`DELETE FROM items WHERE user_id = ${userId}`
    await db.sql`DELETE FROM dumps WHERE user_id = ${userId}`

    const idByDay = new Map<number, string>()
    const insert = async (kind: 'dump' | 'journal', daysAgo: number, body: string, title: string | null, offsetMs: number) => {
      const id = crypto.randomUUID()
      const affect = analyzeText(body)
      const createdAt = now - daysAgo * 86_400_000 + offsetMs
      await db.sql`
        INSERT INTO dumps (id, user_id, kind, title, entry_date, body, words, summary, affect, topics, created_at, updated_at)
        VALUES (${id}, ${userId}, ${kind}, ${title}, ${localIsoDaysAgo(daysAgo)}, ${body}, ${affect.words},
                ${summarize(affect)}, ${JSON.stringify(affect)}, ${JSON.stringify(extractTopics(body))}, ${createdAt}, ${createdAt})`
      return id
    }

    for (const e of DEMO_ENTRIES) idByDay.set(e.daysAgo, await insert('dump', e.daysAgo, e.body, null, 0))

    for (const j of DEMO_JOURNALS) {
      const id = await insert('journal', j.daysAgo, j.body, j.title, 8 * 3_600_000) // written later in the day
      for (const day of j.about) {
        const dumpId = idByDay.get(day)
        if (dumpId) await db.sql`INSERT INTO entry_links (entry_id, dump_id, user_id) VALUES (${id}, ${dumpId}, ${userId})`
      }
    }

    for (const it of DEMO_ITEMS) {
      const dueAt = it.dueInHours === undefined ? null : now + it.dueInHours * 3_600_000
      const sourceId = it.fromDaysAgo === undefined ? null : idByDay.get(it.fromDaysAgo) ?? null
      await db.sql`
        INSERT INTO items (id, user_id, kind, text, done, due_at, source_id, created_at, updated_at)
        VALUES (${crypto.randomUUID()}, ${userId}, ${it.kind}, ${it.text}, ${it.done ? 1 : 0}, ${dueAt}, ${sourceId}, ${now}, ${now})`
    }
  }

  await replaceUserSession(event, { user: { id: userId, email: DEMO_EMAIL }, loggedInAt: now })
  return sendRedirect(event, '/')
})
