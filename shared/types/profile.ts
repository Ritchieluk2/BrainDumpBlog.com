import type { Prefs } from '../utils/prefs'

/** The personal touches on an account (GET/PATCH /api/account/profile). */
export interface Profile {
  name: string | null
  journalName: string | null
  /** null until the reader has saved preferences to the account. */
  prefs: Prefs | null
  onboarded: boolean
}
