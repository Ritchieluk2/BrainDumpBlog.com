/**
 * Appearance and art-style preferences, kept in a cookie so the server can
 * render the right theme on first load (no flash), signed in or not.
 */
import { isArtStyle, type ArtStyle } from '#shared/utils/cosmos-styles'

export type Appearance = 'system' | 'light' | 'dark'

interface Prefs {
  appearance: Appearance
  art: ArtStyle
}

const DEFAULTS: Prefs = { appearance: 'system', art: 'planets' }
const isAppearance = (v: unknown): v is Appearance => v === 'system' || v === 'light' || v === 'dark'

export function usePreferences() {
  const cookie = useCookie<Partial<Prefs> | null>('bd-prefs', {
    default: () => ({ ...DEFAULTS }),
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })
  // Set on the client from the OS setting (see plugins/system-theme.client.ts)
  const systemDark = useState('bd-system-dark', () => false)

  const appearance = computed<Appearance>({
    get: () => (isAppearance(cookie.value?.appearance) ? cookie.value!.appearance! : DEFAULTS.appearance),
    set: (v) => { cookie.value = { ...DEFAULTS, ...cookie.value, appearance: v } }
  })

  const art = computed<ArtStyle>({
    get: () => (isArtStyle(cookie.value?.art) ? cookie.value!.art! : DEFAULTS.art),
    set: (v) => { cookie.value = { ...DEFAULTS, ...cookie.value, art: v } }
  })

  const night = computed(() => appearance.value === 'dark' || (appearance.value === 'system' && systemDark.value))

  return { appearance, art, night, systemDark }
}
