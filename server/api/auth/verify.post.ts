/**
 * POST /api/auth/verify  { token }
 * Exchanges a sign-in link token for a session. Done as a POST (from a
 * button on /auth/verify) so email link-scanners can't use up the token.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: unknown }>(event)
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!token || token.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'This sign-in link is not valid.' })
  }

  const db = await useDb()
  const now = Date.now()
  const tokenHash = await hashToken(token)

  const { rows } = await db.sql`
    SELECT email, expires_at, used_at FROM login_tokens WHERE token_hash = ${tokenHash}`
  const row = rows?.[0] as { email: string; expires_at: number; used_at: number | null } | undefined

  if (!row || row.used_at || Number(row.expires_at) < now) {
    throw createError({ statusCode: 400, statusMessage: 'This sign-in link has expired or was already used. Request a new one.' })
  }

  // Claim the token. If two requests race, only the one whose timestamp sticks wins.
  await db.sql`UPDATE login_tokens SET used_at = ${now} WHERE token_hash = ${tokenHash} AND used_at IS NULL`
  const claimed = await db.sql`SELECT used_at FROM login_tokens WHERE token_hash = ${tokenHash}`
  if (Number((claimed.rows?.[0] as { used_at: number } | undefined)?.used_at) !== now) {
    throw createError({ statusCode: 400, statusMessage: 'This sign-in link was already used. Request a new one.' })
  }

  // Find or create the account.
  const existing = await db.sql`SELECT id, email FROM users WHERE email = ${row.email}`
  let user = existing.rows?.[0] as { id: string; email: string } | undefined
  if (!user) {
    user = { id: crypto.randomUUID(), email: row.email }
    await db.sql`INSERT INTO users (id, email, created_at) VALUES (${user.id}, ${user.email}, ${now})`
  }

  await replaceUserSession(event, {
    user: { id: user.id, email: user.email },
    loggedInAt: now
  })

  return { ok: true }
})
