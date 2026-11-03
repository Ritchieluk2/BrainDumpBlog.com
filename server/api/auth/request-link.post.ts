/**
 * POST /api/auth/request-link  { email }
 * Emails a one-time sign-in link. Works for new and existing accounts alike,
 * and always answers the same way so it can't be used to probe for accounts.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown }>(event)
  const email = normalizeEmail(body?.email)
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  const db = await useDb()
  const now = Date.now()

  const { rows } = await db.sql`
    SELECT COUNT(*) AS n FROM login_tokens WHERE email = ${email} AND created_at > ${now - 60 * 60 * 1000}`
  if (Number((rows?.[0] as { n: number } | undefined)?.n ?? 0) >= MAX_LINKS_PER_HOUR) {
    throw createError({ statusCode: 429, statusMessage: 'Too many sign-in emails. Please wait a bit and try again.' })
  }

  const token = newToken()
  const tokenHash = await hashToken(token)
  await db.sql`
    INSERT INTO login_tokens (token_hash, email, expires_at, created_at)
    VALUES (${tokenHash}, ${email}, ${now + TOKEN_TTL_MS}, ${now})`

  // Tidy up expired tokens now and then.
  await db.sql`DELETE FROM login_tokens WHERE expires_at < ${now - 24 * 60 * 60 * 1000}`

  const siteUrl = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')
  const link = `${siteUrl}/auth/verify?token=${encodeURIComponent(token)}`
  await sendEmail(event, { to: email, ...signInEmail(link) })

  return { ok: true }
})
