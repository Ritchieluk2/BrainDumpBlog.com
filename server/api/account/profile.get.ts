/** GET /api/account/profile — names, saved preferences, and whether the welcome is done. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return loadProfile(user.id)
})
