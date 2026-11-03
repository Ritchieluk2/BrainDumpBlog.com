<script setup lang="ts">
/** What to call the reader, and what to call their journal. Both optional. */
import { JOURNAL_NAME_MAX, NAME_MAX } from '#shared/utils/prefs'

const props = withDefaults(defineProps<{ showSave?: boolean }>(), { showSave: false })

const { user, fetch: refreshSession } = useUserSession()
const name = ref(user.value?.name ?? '')
const journalName = ref(user.value?.journalName ?? '')
const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const uid = useId()

const dirty = computed(() => name.value.trim() !== (user.value?.name ?? '') || journalName.value.trim() !== (user.value?.journalName ?? ''))

async function save(): Promise<boolean> {
  if (!dirty.value) return true
  status.value = 'saving'
  try {
    await $fetch('/api/account/profile', { method: 'PATCH', body: { name: name.value, journalName: journalName.value } })
    await refreshSession()
    status.value = 'saved'
    return true
  } catch {
    status.value = 'error'
    return false
  }
}
watch([name, journalName], () => { if (status.value !== 'saving') status.value = 'idle' })

defineExpose({ save })
</script>

<template>
  <form class="names" @submit.prevent="save">
    <label class="names__field" :for="`${uid}-name`">
      <span class="names__label">What should we call you? <span class="names__opt">Optional</span></span>
      <input :id="`${uid}-name`" v-model="name" class="bd-input" autocomplete="given-name" :maxlength="NAME_MAX" placeholder="Your first name">
      <span class="names__hint">Used in your morning greeting. Never shown to anyone else.</span>
    </label>
    <label class="names__field" :for="`${uid}-journal`">
      <span class="names__label">Name your journal <span class="names__opt">Optional</span></span>
      <input :id="`${uid}-journal`" v-model="journalName" class="bd-input" :maxlength="JOURNAL_NAME_MAX" placeholder="e.g. Morning pages, The fog report">
      <span class="names__hint">Shown at the top of your journal.</span>
    </label>
    <div v-if="props.showSave" class="names__actions">
      <button type="submit" class="bd-btn bd-btn--outline bd-btn--small" :disabled="!dirty || status === 'saving'">
        {{ status === 'saving' ? 'Saving…' : 'Save names' }}
      </button>
      <span v-if="status === 'saved' && !dirty" class="names__status" role="status">Saved</span>
      <span v-if="status === 'error'" class="names__status names__status--error" role="alert">Couldn't save. Try again.</span>
    </div>
  </form>
</template>

<style scoped>
.names { display: flex; flex-direction: column; gap: var(--bd-space-5); max-width: 520px; }
.names__field { display: flex; flex-direction: column; gap: 6px; }
.names__label { font-weight: 500; }
.names__opt { font-weight: 400; font-size: var(--bd-text-xs); color: var(--bd-ink-3); margin-left: 6px; }
.names__hint { font-size: var(--bd-text-xs); color: var(--bd-ink-3); }
.names__actions { display: flex; align-items: center; gap: var(--bd-space-3); }
.names__status { font-size: var(--bd-text-sm); color: var(--bd-ink-2); }
.names__status--error { color: var(--bd-terracotta-dark); }
</style>
