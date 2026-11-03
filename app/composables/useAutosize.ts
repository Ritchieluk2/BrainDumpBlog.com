/**
 * Grows a textarea with its content instead of making it scroll inside itself.
 * Keeps the writing and the save button in one natural page scroll, which
 * matters on phones where the keyboard takes half the screen.
 */
export function useAutosize(el: Ref<HTMLTextAreaElement | null>, value: Ref<string>, minPx = 160) {
  function fit() {
    const t = el.value
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.max(minPx, t.scrollHeight)}px`
  }
  onMounted(() => {
    fit()
    window.addEventListener('resize', fit)
  })
  onBeforeUnmount(() => window.removeEventListener('resize', fit))
  watch(value, () => nextTick(fit))
  return { fit }
}
