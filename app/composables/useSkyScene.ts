/**
 * The current logo scene. The server can't know the reader's clock, so it uses
 * the scene this browser last saw (a cookie), which avoids a flash on reload.
 * The browser then works out the real scene and keeps it current (see
 * plugins/sky-scene.client.ts). First visit with no cookie: morning.
 */
import { isSkyScene, type SkyScene } from '#shared/utils/sky-scene'

export function useSkyScene() {
  const cookie = useCookie<SkyScene | null>('bd-scene', { maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
  return useState<SkyScene>('bd-scene', () => (isSkyScene(cookie.value) ? cookie.value : 'morning'))
}
