/** DELETE /api/account — permanently delete your account, every entry, and every to-do/note/reminder. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const db = await useDb()
  await db.sql`DELETE FROM entry_links WHERE user_id = ${user.id}`
  await db.sql`DELETE FROM items WHERE user_id = ${user.id}`
  await db.sql`DELETE FROM dumps WHERE user_id = ${user.id}`
  await db.sql`DELETE FROM login_tokens WHERE email = ${user.email}`
  await db.sql`DELETE FROM users WHERE id = ${user.id}`
  await clearUserSession(event)
  return { ok: true }
})
