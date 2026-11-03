// Tracks the operating system's light/dark setting for the "System" appearance option.
export default defineNuxtPlugin(() => {
  const systemDark = useState('bd-system-dark', () => false)
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!mq) return
  systemDark.value = mq.matches
  mq.addEventListener?.('change', (e) => { systemDark.value = e.matches })
})
