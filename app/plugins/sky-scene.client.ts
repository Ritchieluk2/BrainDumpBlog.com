// Keeps the logo scene in step with the reader's local time, checking once a minute.
import { skySceneFor } from '#shared/utils/sky-scene'

export default defineNuxtPlugin((nuxtApp) => {
  const scene = useSkyScene()
  const cookie = useCookie<string | null>('bd-scene', { maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
  const update = () => {
    const now = skySceneFor()
    if (scene.value !== now) scene.value = now
    if (cookie.value !== now) cookie.value = now
  }
  // After hydration, so the first render matches the server's.
  nuxtApp.hook('app:mounted', () => {
    update()
    setInterval(update, 60_000)
    document.addEventListener('visibilitychange', () => { if (!document.hidden) update() })
  })
})
