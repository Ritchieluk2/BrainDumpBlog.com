<script setup lang="ts">
/**
 * The writing box. For now it only counts words and keeps a local
 * draft in the browser; submitting will call the backend later.
 */
const props = withDefaults(defineProps<{
  prompt?: string
  submitLabel?: string
  rows?: number
}>(), {
  prompt: "Write whatever's there. No account needed to start.",
  submitLabel: "See today's shape",
  rows: 6
})

const emit = defineEmits<{ submit: [text: string] }>()

const DRAFT_KEY = 'bd-draft'
const text = ref('')
const uid = useId()
const area = ref<HTMLTextAreaElement | null>(null)
useAutosize(area, text, 180)

const words = computed(() => {
  const t = text.value.trim()
  return t ? t.split(/\s+/).length : 0
})

onMounted(() => {
  try {
    text.value = localStorage.getItem(DRAFT_KEY) ?? ''
  } catch { /* storage unavailable: start empty */ }
})

watch(text, (v) => {
  try { localStorage.setItem(DRAFT_KEY, v) } catch { /* ignore */ }
})

function submit() {
  if (!words.value) return
  emit('submit', text.value)
}
</script>

<template>
  <form class="dump-editor bd-card" @submit.prevent="submit">
    <label :for="`dump-${uid}`" class="dump-editor__prompt">{{ props.prompt }}</label>
    <textarea
      :id="`dump-${uid}`"
      ref="area"
      v-model="text"
      :rows="props.rows"
      class="dump-editor__text bd-serif"
      placeholder="couldn't sleep again, kept thinking about…"
    />
    <div class="dump-editor__footer">
      <span class="dump-editor__count">{{ words }} {{ words === 1 ? 'word' : 'words' }} · saved on this device</span>
      <button type="submit" class="bd-btn bd-btn--primary" :disabled="!words">{{ props.submitLabel }}</button>
    </div>
  </form>
</template>

<style scoped>
.dump-editor { display: flex; flex-direction: column; gap: var(--bd-space-4); }
.dump-editor__prompt { font-size: var(--bd-text-sm); color: var(--bd-ink-2); }
.dump-editor__text {
  width: 100%;
  min-height: 180px;
  padding: 0;
  border: none;
  resize: none;
  overflow: hidden;
  background: transparent;
  color: var(--bd-ink);
  font-size: var(--bd-text-xl);
  line-height: 1.55;
}
.dump-editor__text:focus { outline: none; }
.dump-editor__text::placeholder { color: var(--bd-ink-3); opacity: 0.8; }
@media (max-width: 480px) {
  .dump-editor__text { font-size: var(--bd-text-lg); }
  .dump-editor__footer .bd-btn { width: 100%; }
}
.dump-editor__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--bd-space-3);
}
.dump-editor__count { font-size: 14px; color: var(--bd-ink-3); }
</style>
