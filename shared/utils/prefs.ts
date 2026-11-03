/**
 * A reader's look-and-feel preferences. Kept in a cookie (so the first page
 * load is already in the right theme) and, when signed in, saved to the
 * account so they follow the reader to other devices.
 */
import { isArtStyle, type ArtStyle } from './cosmos-styles'
import { DEFAULT_MOOD_MAP, normalizeMoodMap, type MoodMap } from './moods'

export type Appearance = 'system' | 'light' | 'dark'
export const isAppearance = (v: unknown): v is Appearance => v === 'system' || v === 'light' || v === 'dark'

export interface Prefs {
  appearance: Appearance
  art: ArtStyle
  moods: MoodMap
}

export const DEFAULT_PREFS: Prefs = { appearance: 'system', art: 'planets', moods: DEFAULT_MOOD_MAP }

export function normalizePrefs(input: unknown): Prefs {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  return {
    appearance: isAppearance(src.appearance) ? src.appearance : DEFAULT_PREFS.appearance,
    art: isArtStyle(src.art) ? src.art : DEFAULT_PREFS.art,
    moods: normalizeMoodMap(src.moods)
  }
}

export const NAME_MAX = 40
export const JOURNAL_NAME_MAX = 60

/** Trims, collapses spaces and strips control characters. Empty means "not set". */
export function cleanName(input: unknown, max: number): string | null {
  if (typeof input !== 'string') return null
  // eslint-disable-next-line no-control-regex
  const s = input.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
  return s || null
}
