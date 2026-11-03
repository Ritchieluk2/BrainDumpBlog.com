<script setup lang="ts">
/**
 * Write a journal entry, or edit one (?edit=<id>).
 * ?about=<morning id> starts the entry already linked to that morning.
 */
import type { DumpDetail, DumpSummary } from '#shared/types/dump'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const editId = typeof route.query.edit === 'string' ? route.query.edit : ''
const aboutId = typeof route.query.about === 'string' ? route.query.about : ''
useHead({ title: editId ? 'Edit entry' : 'New journal entry' })

const { data: mornings } = await useFetch<DumpSummary[]>('/api/dumps', { query: { kind: 'dump' }, default: () => [] })

const title = ref('')
const body = ref('')
const entryDate = ref(localIsoDate())
const selected = ref<string[]>(aboutId ? [aboutId] : [])
const saving = ref(false)
const error = ref('')
const showAll = ref(false)
const area = ref<HTMLTextAreaElement | null>(null)
useAutosize(area, body, 240)

if (editId) {
  // useRequestFetch forwards the session cookie when this runs on the server
  const existing = await useRequestFetch()<DumpDetail>(`/api/dumps/${editId}`).catch(() => null)
  if (!existing || existing.kind !== 'journal') {
    throw createError({ statusCode: 404, statusMessage: 'Entry not found', fatal: true })
  }
  title.value = existing.title ?? ''
  body.value = existing.body
  entryDate.value = existing.entryDate
  selected.value = existing.refs.map((r) => r.id)
}

const about = computed(() => (mornings.value ?? []).find((m) => m.id === aboutId))
const choices = computed(() => {
  const list = mornings.value ?? []
  const shown = showAll.value ? list : list.slice(0, 14)
  // always show selected mornings even if they're older
  const extra = list.filter((m) => selected.value.includes(m.id) && !shown.includes(m))
  return [...shown, ...extra]
})
const words = computed(() => (body.value.trim() ? body.value.trim().split(/\s+/).length : 0))

function toggle(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id].slice(0, 14)
}

async function save() {
  error.value = ''
  if (!body.value.trim()) {
    error.value = 'Write something first.'
    return
  }
  saving.value = true
  try {
    const payload = { title: title.value, body: body.value, refs: selected.value }
    const saved = editId
      ? await $fetch<DumpDetail>(`/api/dumps/${editId}`, { method: 'PATCH', body: payload })
      : await $fetch<DumpDetail>('/api/dumps', { method: 'POST', body: { ...payload, kind: 'journal', entryDate: entryDate.value } })
    await navigateTo(`/journal/${saved.id}`)
  } catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage ?? 'Could not save. Your writing is still here.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="write bd-container">
    <NuxtLink :to="editId ? `/journal/${editId}` : '/journal/entries'" class="write__back">← {{ editId ? 'Back to entry' : 'Journal' }}</NuxtLink>

    <h1 class="write__heading">
      <template v-if="editId">Edit <span class="bd-serif-italic">entry</span></template>
      <template v-else-if="about">Reflecting on <span class="bd-serif-italic">{{ formatIsoDate(about.entryDate, { weekday: 'long', month: 'long', day: 'numeric' }) }}</span></template>
      <template v-else>New journal <span class="bd-serif-italic">entry</span></template>
    </h1>

    <form class="write__grid" @submit.prevent="save">
      <div class="write__main bd-card">
        <label class="bd-sr-only" for="entry-title">Title</label>
        <input id="entry-title" v-model="title" class="write__title" type="text" maxlength="140" placeholder="Title (optional)">
        <label class="bd-sr-only" for="entry-body">Entry</label>
        <textarea
          id="entry-body"
          ref="area"
          v-model="body"
          class="write__body bd-serif"
          rows="14"
          :placeholder="about ? `Looking back at that morning: ${about.summary.toLowerCase()} What do you notice now?` : 'Write as much or as little as you like.'"
        />
        <div class="write__footer">
          <span class="write__count">{{ words }} {{ words === 1 ? 'word' : 'words' }}</span>
          <button type="submit" class="bd-btn bd-btn--primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save entry' }}</button>
        </div>
        <p v-if="error" class="write__error" role="alert">{{ error }}</p>
      </div>

      <aside class="write__side">
        <div v-if="!editId" class="write__field">
          <label for="entry-date" class="bd-label">Date</label>
          <input id="entry-date" v-model="entryDate" type="date" class="bd-input">
        </div>

        <fieldset class="write__mornings">
          <legend class="bd-label">Reflecting on these mornings</legend>
          <p v-if="!mornings?.length" class="bd-muted write__hint">No morning dumps yet. Once you write some, you can link them here.</p>
          <ul v-else class="picker">
            <li v-for="m in choices" :key="m.id">
              <button
                type="button"
                class="picker__item"
                :aria-pressed="selected.includes(m.id)"
                :aria-label="`${formatIsoDate(m.entryDate)}: ${m.summary}`"
                @click="toggle(m.id)"
              >
                <CosmosDay :affect="m.affect" :seed="m.id" class="picker__sky" />
                <span class="picker__date">{{ formatIsoDate(m.entryDate, { month: 'short', day: 'numeric' }) }}</span>
              </button>
            </li>
          </ul>
          <button v-if="(mornings?.length ?? 0) > 14 && !showAll" type="button" class="write__more" @click="showAll = true">Show older mornings</button>
        </fieldset>
      </aside>
    </form>
  </div>
</template>

<style scoped>
.write { display: flex; flex-direction: column; gap: var(--bd-space-5); padding-block: var(--bd-space-5); }
.write__back { font-size: var(--bd-text-sm); color: var(--bd-ink-2); text-decoration: none; padding-block: 10px; align-self: flex-start; }
.write__heading { font-size: var(--bd-text-3xl); font-weight: 300; letter-spacing: -0.03em; }
.write__grid { display: flex; flex-wrap: wrap; gap: var(--bd-space-6); align-items: flex-start; }
.write__main { flex: 999 1 480px; min-width: 0; display: flex; flex-direction: column; gap: var(--bd-space-4); }
.write__title {
  font: inherit;
  font-size: var(--bd-text-2xl);
  font-weight: 300;
  border: none;
  border-bottom: 1px solid var(--bd-line);
  padding: 6px 0 12px;
  background: transparent;
  color: var(--bd-ink);
}
.write__title:focus { outline: none; border-bottom-color: var(--bd-ink-3); }
.write__body { border: none; resize: none; overflow: hidden; background: transparent; color: var(--bd-ink); font-size: var(--bd-text-xl); line-height: 1.6; padding: 0; min-height: 240px; }
@media (max-width: 480px) {
  .write__body { font-size: var(--bd-text-lg); }
  .write__title { font-size: var(--bd-text-xl); }
  .write__footer .bd-btn { width: 100%; }
}
.write__body:focus { outline: none; }
.write__footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--bd-space-3); }
.write__count { font-size: 14px; color: var(--bd-ink-3); }
.write__error { color: var(--bd-terracotta-dark); font-size: var(--bd-text-sm); }
.write__side { flex: 1 1 280px; display: flex; flex-direction: column; gap: var(--bd-space-5); }
.write__field { display: flex; flex-direction: column; gap: 6px; }
.write__mornings { border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--bd-space-3); }
.write__hint { font-size: var(--bd-text-sm); }
.write__more { align-self: flex-start; font: inherit; font-size: var(--bd-text-sm); background: none; border: none; color: var(--bd-ink-2); text-decoration: underline; padding: 10px 0; cursor: pointer; }
.picker { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: var(--bd-space-2); }
.picker__item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: var(--bd-radius-md);
  border: 2px solid transparent;
  background: none;
  color: var(--bd-ink-2);
  font: inherit;
  cursor: pointer;
}
.picker__item[aria-pressed='true'] { border-color: var(--bd-ink); background: var(--bd-surface); color: var(--bd-ink); }
.picker__sky { border-radius: 12px; overflow: hidden; }
.picker__date { font-size: 12px; }
</style>
