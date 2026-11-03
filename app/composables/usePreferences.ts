/**
 * Appearance, art style, and each feeling's color and shape.
 *
 * Kept in a cookie so the server renders the right theme on first load (no
 * flash), signed in or not. When signed in, changes are also saved to the
 * account (see plugins/prefs-sync.client.ts).
 */
import type { ArtStyle } from '#shared/utils/cosmos-styles'
import type { Mood, MoodLook, MoodMap } from '#shared/utils/moods'
import { DEFAULT_PREFS, normalizePrefs, type Appearance, type Prefs } from '#shared/utils/prefs'


export function usePreferences() {
  const cookie = useCookie<Partial<Prefs> | null>('bd-prefs', {
    default: () => ({ ...DEFAULT_PREFS }),
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })
  // Set on the client from the OS setting (see plugins/system-theme.client.ts)
  const systemDark = useState('bd-system-dark', () => false)

  const all = computed<Prefs>(() => normalizePrefs(cookie.value))
  const write = (patch: Partial<Prefs>) => { cookie.value = { ...all.value, ...patch } }

  const appearance = computed<Appearance>({
    get: () => all.value.appearance,
    set: (v) => write({ appearance: v })
  })

  const art = computed<ArtStyle>({
    get: () => all.value.art,
    set: (v) => write({ art: v })
  })

  const moods = computed<MoodMap>({
    get: () => all.value.moods,
    set: (v) => write({ moods: v })
  })

  function setMood(mood: Mood, look: Partial<MoodLook>) {
    write({ moods: { ...all.value.moods, [mood]: { ...all.value.moods[mood], ...look } } })
  }

  /** Replace everything at once (used when loading preferences from the account). */
  function replace(prefs: Prefs) {
    cookie.value = normalizePrefs(prefs)
  }

  const night = computed(() => appearance.value === 'dark' || (appearance.value === 'system' && systemDark.value))

  return { all, appearance, art, moods, setMood, replace, night, systemDark }
}
