/**
 * GET /api/games/stats
 * Signed-in players get their own games. Accounts listed in NUXT_ADMIN_EMAILS
 * get everyone's, with players shown only as p1, p2, … (never an email).
 */
import { STATS_DAYS, STATS_MAX_ROWS, isGameAdmin, toStatsGames } from '../../utils/games'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { adminEmails } = useRuntimeConfig(event)
  const everyone = isGameAdmin(user.email, adminEmails)
  const since = Date.now() - STATS_DAYS * 24 * 60 * 60 * 1000
  const db = await useDb()
  const { rows } = everyone
    ? await db.sql`
        SELECT user_id, anon_id, data FROM game_events
        WHERE created_at > ${since} ORDER BY created_at DESC LIMIT ${STATS_MAX_ROWS}`
    : await db.sql`
        SELECT user_id, anon_id, data FROM game_events
        WHERE user_id = ${user.id} AND created_at > ${since} ORDER BY created_at DESC LIMIT ${STATS_MAX_ROWS}`
  const { games, players } = toStatsGames((rows ?? []) as { user_id: string | null; anon_id: string | null; data: string }[])
  return { scope: everyone ? 'everyone' : 'you', days: STATS_DAYS, players, games }
})
