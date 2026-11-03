import type { Profile } from '#shared/types/profile'

/** The preferences last saved to (or loaded from) the account, as JSON. */
export const usePrefsSynced = () => useState('bd-prefs-synced', () => '')

/**
 * After signing in: apply the account's saved look right away, and note that
 * this tab is in step, so prefs-sync doesn't load it again.
 */
export function applySignedInProfile(userId: string, profile: Profile) {
  if (profile.prefs) {
    usePrefsSynced().value = JSON.stringify(profile.prefs)
    usePreferences().replace(profile.prefs)
  }
  try { sessionStorage.setItem(`bd-prefs-pulled:${userId}`, '1') } catch { /* ignore */ }
}
