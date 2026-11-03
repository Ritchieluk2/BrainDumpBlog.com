<script setup lang="ts">
import type { DumpDetail, Item } from '#shared/types/dump'
import { extractTodos } from '#shared/utils/todos'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = String(route.params.id)
const { data: dump, error } = await useFetch<DumpDetail>(`/api/dumps/${id}`)

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Entry not found', fatal: true })
}

const isJournal = computed(() => dump.value?.kind === 'journal')
useHead({
  title: () => (dump.value ? (dump.value.kind === 'journal' ? dump.value.title || 'Journal entry' : formatIsoDate(dump.value.entryDate)) : 'Entry')
})

const fresh = computed(() => route.query.fresh === '1')
const paragraphs = computed(() => (dump.value?.body ?? '').split(/\n\s*\n+/))

// --- to-dos found in a morning dump ---
const suggestions = computed(() => (dump.value && !isJournal.value ? extractTodos(dump.value.body) : []))
const added = ref<string[]>([])
const { data: items } = await useFetch<Item[]>('/api/items', { default: () => [] })
onMounted(() => {
  // mark suggestions already on the list (added from this entry before)
  added.value = (items.value ?? []).filter((i) => i.sourceId === id).map((i) => i.text.toLowerCase())
})
const isAdded = (t: string) => added.value.includes(t.toLowerCase())
async function addTodo(text: string) {
  if (isAdded(text)) return
  added.value = [...added.value, text.toLowerCase()]
  try {
    await $fetch('/api/items', { method: 'POST', body: { kind: 'todo', text, sourceId: id } })
  } catch {
    added.value = added.value.filter((t) => t !== text.toLowerCase())
  }
}
async function addAll() {
  for (const t of suggestions.value) await addTodo(t)
}

// --- delete ---
const confirmingDelete = ref(false)
const deleting = ref(false)
async function remove() {
  deleting.value = true
  try {
    await $fetch(`/api/dumps/${id}`, { method: 'DELETE' })
    await navigateTo(isJournal.value ? '/journal/entries' : '/journal', { replace: true })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <article v-if="dump" class="entry bd-container">
    <NuxtLink :to="isJournal ? '/journal/entries' : '/journal'" class="entry__back">← {{ isJournal ? 'Journal' : 'All mornings' }}</NuxtLink>

    <div class="entry__grid">
      <aside class="entry__sky">
        <CosmosDay :affect="dump.affect" :seed="dump.id" :title="`${isJournal ? 'Picture' : 'Solar system'} for ${formatIsoDate(dump.entryDate)}`" />
        <CosmosLegend v-if="!isJournal" :affect="dump.affect" />

        <section v-if="isJournal && dump.refs.length" class="entry__links" aria-labelledby="refs-title">
          <h2 id="refs-title" class="bd-label">Reflecting on</h2>
          <EntryRefCard v-for="r in dump.refs" :key="r.id" :entry="r" />
        </section>
      </aside>

      <div class="entry__body">
        <p v-if="fresh" class="entry__fresh">Saved. Here's this morning's sky.</p>
        <p class="entry__date">
          <BdSunrise />
          {{ formatIsoDate(dump.entryDate) }} · {{ dump.words }} words · {{ isJournal ? 'Journal entry' : 'Morning dump' }}
        </p>
        <h1 class="entry__summary">{{ isJournal ? (dump.title || 'Untitled entry') : dump.summary }}</h1>
        <p v-if="isJournal" class="bd-muted">{{ dump.summary }}</p>
        <div class="entry__text bd-serif">
          <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
        </div>

        <!-- To-dos spotted in a morning dump -->
        <section v-if="suggestions.length" class="entry__todos bd-card" aria-labelledby="todos-title">
          <div class="entry__todos-head">
            <h2 id="todos-title" class="entry__section-title">To-dos in this <span class="bd-serif-italic">morning</span></h2>
            <button type="button" class="entry__link" @click="addAll">Add all</button>
          </div>
          <ul class="todo-suggestions">
            <li v-for="t in suggestions" :key="t">
              <span>{{ t }}</span>
              <button type="button" class="bd-btn bd-btn--outline bd-btn--small" :disabled="isAdded(t)" @click="addTodo(t)">
                {{ isAdded(t) ? 'On your list' : 'Add' }}
              </button>
            </li>
          </ul>
        </section>

        <!-- Journal entries about this morning -->
        <section v-if="!isJournal" class="entry__reflections" aria-labelledby="reflections-title">
          <div class="entry__todos-head">
            <h2 id="reflections-title" class="entry__section-title">Reflections</h2>
            <NuxtLink :to="{ path: '/journal/new', query: { about: dump.id } }" class="bd-btn bd-btn--outline bd-btn--small">Write about this morning</NuxtLink>
          </div>
          <p v-if="!dump.reflections.length" class="bd-muted">Nothing yet. Come back to this morning later and write about how the day actually went.</p>
          <div v-else class="entry__ref-list">
            <EntryRefCard v-for="r in dump.reflections" :key="r.id" :entry="r" />
          </div>
        </section>

        <div class="entry__actions">
          <NuxtLink v-if="isJournal" :to="{ path: '/journal/new', query: { edit: dump.id } }" class="bd-btn bd-btn--outline bd-btn--small">Edit</NuxtLink>
          <button v-if="!confirmingDelete" type="button" class="entry__link" @click="confirmingDelete = true">Delete this entry</button>
          <template v-else>
            <span class="bd-muted">Delete it for good?</span>
            <button type="button" class="bd-btn bd-btn--small bd-btn--danger" :disabled="deleting" @click="remove">
              {{ deleting ? 'Deleting…' : 'Yes, delete' }}
            </button>
            <button type="button" class="bd-btn bd-btn--small bd-btn--outline" @click="confirmingDelete = false">Keep it</button>
          </template>
        </div>
      </div>
    </div>
  </article>
  <div v-else class="bd-container entry">
    <p role="alert">Couldn't load this entry. <NuxtLink to="/journal">Back to your journal</NuxtLink></p>
  </div>
</template>

<style scoped>
.entry { display: flex; flex-direction: column; gap: var(--bd-space-6); padding-block: var(--bd-space-5); }
.entry__back { font-size: var(--bd-text-sm); color: var(--bd-ink-2); text-decoration: none; padding-block: 10px; align-self: flex-start; }

.entry__grid { display: flex; flex-wrap: wrap; gap: var(--bd-space-8); align-items: flex-start; }
.entry__sky { flex: 1 1 300px; max-width: 420px; display: flex; flex-direction: column; gap: var(--bd-space-6); }
.entry__sky > .cosmos { border-radius: var(--bd-radius-lg); box-shadow: var(--bd-shadow-card); overflow: hidden; }
.entry__links { display: flex; flex-direction: column; gap: var(--bd-space-2); }

.entry__body { flex: 999 1 420px; min-width: 0; display: flex; flex-direction: column; gap: var(--bd-space-5); max-width: 680px; }
.entry__fresh {
  padding: 12px 16px;
  border-radius: var(--bd-radius-md);
  background: var(--bd-surface);
  box-shadow: var(--bd-shadow-soft);
  font-size: var(--bd-text-sm);
}
.entry__date { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: var(--bd-text-sm); color: var(--bd-ink-2); }
.entry__summary { font-size: var(--bd-text-3xl); font-weight: 300; letter-spacing: -0.03em; }
.entry__text { display: flex; flex-direction: column; gap: 1em; font-size: var(--bd-text-xl); line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; }

.entry__section-title { font-size: var(--bd-text-xl); font-weight: 400; }
.entry__todos { display: flex; flex-direction: column; gap: var(--bd-space-3); }
.entry__todos-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--bd-space-3); }
.todo-suggestions { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-2); }
.todo-suggestions li { display: flex; justify-content: space-between; align-items: center; gap: var(--bd-space-3); padding-block: 4px; border-bottom: 1px solid var(--bd-line); }
.entry__reflections { display: flex; flex-direction: column; gap: var(--bd-space-3); padding-top: var(--bd-space-5); border-top: 1px solid var(--bd-line); }
.entry__ref-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: var(--bd-space-3); }

.entry__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--bd-space-3); padding-top: var(--bd-space-5); border-top: 1px solid var(--bd-line); }
.entry__link {
  font: inherit;
  font-size: var(--bd-text-sm);
  color: var(--bd-ink-2);
  background: none;
  border: none;
  padding: 10px 0;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
</style>
