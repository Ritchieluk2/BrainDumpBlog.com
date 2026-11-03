<script setup lang="ts">
/**
 * The signed-in homepage sidebar: to-dos, reminders and quick notes.
 * Changes show immediately and are saved in the background.
 */
import type { Item, ItemKind } from '#shared/types/dump'

const { data: items, refresh } = await useFetch<Item[]>('/api/items', { default: () => [] })
const error = ref('')

const todos = computed(() => (items.value ?? []).filter((i) => i.kind === 'todo'))
const openTodos = computed(() => todos.value.filter((i) => !i.done))
const doneTodos = computed(() => todos.value.filter((i) => i.done))
const reminders = computed(() =>
  (items.value ?? []).filter((i) => i.kind === 'reminder' && !i.done).sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))
)
const notes = computed(() => (items.value ?? []).filter((i) => i.kind === 'note'))

// "now" ticks once a minute so due reminders light up without a reload
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 60_000) })
onBeforeUnmount(() => clearInterval(timer))
const isDue = (r: Item) => r.dueAt !== null && r.dueAt <= now.value
const dueCount = computed(() => reminders.value.filter(isDue).length)

function fmtDue(ms: number | null) {
  if (ms === null) return 'No time set'
  const d = new Date(ms)
  const sameDay = d.toDateString() === new Date(now.value).toDateString()
  return sameDay
    ? `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const showDone = ref(false)
const newTodo = ref('')
const newNote = ref('')
const newReminder = ref('')
const newReminderAt = ref('')

async function add(kind: ItemKind, text: string, dueAt?: string) {
  if (!text.trim()) return
  error.value = ''
  try {
    const item = await $fetch<Item>('/api/items', {
      method: 'POST',
      body: { kind, text, dueAt: dueAt ? new Date(dueAt).getTime() : null }
    })
    items.value = [item, ...(items.value ?? [])]
  } catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage ?? 'Could not save that.'
  }
}

async function update(item: Item, patch: Partial<Pick<Item, 'done' | 'text'>>) {
  const before = { ...item }
  Object.assign(item, patch)
  try {
    await $fetch(`/api/items/${item.id}`, { method: 'PATCH', body: patch })
  } catch {
    Object.assign(item, before)
    error.value = 'Could not save that change.'
  }
}

async function remove(item: Item) {
  items.value = (items.value ?? []).filter((i) => i.id !== item.id)
  try {
    await $fetch(`/api/items/${item.id}`, { method: 'DELETE' })
  } catch {
    error.value = 'Could not delete that.'
    await refresh()
  }
}

async function submitTodo() { const t = newTodo.value; newTodo.value = ''; await add('todo', t) }
async function submitNote() { const t = newNote.value; newNote.value = ''; await add('note', t) }
async function submitReminder() {
  const t = newReminder.value
  const at = newReminderAt.value
  newReminder.value = ''
  newReminderAt.value = ''
  await add('reminder', t, at)
}
</script>

<template>
  <div class="today">
    <p v-if="error" class="today__error" role="alert">{{ error }}</p>

    <!-- Reminders -->
    <section class="panel bd-card" aria-labelledby="reminders-title">
      <h2 id="reminders-title" class="panel__title">
        Reminders
        <span v-if="dueCount" class="panel__badge">{{ dueCount }} due</span>
      </h2>
      <ul v-if="reminders.length" class="list">
        <li v-for="r in reminders" :key="r.id" class="row" :class="{ 'is-due': isDue(r) }">
          <input :id="`r-${r.id}`" type="checkbox" class="row__check" :checked="r.done" @change="update(r, { done: true })">
          <label :for="`r-${r.id}`" class="row__text">
            {{ r.text }}
            <span class="row__meta">{{ isDue(r) ? 'Due · ' : '' }}{{ fmtDue(r.dueAt) }}</span>
          </label>
          <button type="button" class="row__remove" :aria-label="`Delete reminder: ${r.text}`" @click="remove(r)">×</button>
        </li>
      </ul>
      <form class="adder adder--reminder" @submit.prevent="submitReminder">
        <label class="bd-sr-only" for="new-reminder">New reminder</label>
        <input id="new-reminder" v-model="newReminder" class="bd-input" placeholder="Remind me to…" maxlength="500">
        <label class="bd-sr-only" for="new-reminder-at">When</label>
        <input id="new-reminder-at" v-model="newReminderAt" class="bd-input" type="datetime-local">
        <button type="submit" class="bd-btn bd-btn--outline bd-btn--small" :disabled="!newReminder.trim()">Add</button>
      </form>
    </section>

    <!-- To-dos -->
    <section class="panel bd-card" aria-labelledby="todos-title">
      <h2 id="todos-title" class="panel__title">To-do</h2>
      <p v-if="!todos.length" class="bd-muted panel__empty">Nothing on the list. Lists in your morning dump can be added here in one tap.</p>
      <ul v-if="openTodos.length" class="list">
        <li v-for="t in openTodos" :key="t.id" class="row">
          <input :id="`t-${t.id}`" type="checkbox" class="row__check" :checked="t.done" @change="update(t, { done: true })">
          <label :for="`t-${t.id}`" class="row__text">
            {{ t.text }}
            <NuxtLink v-if="t.sourceId" :to="`/journal/${t.sourceId}`" class="row__meta row__source">from a morning dump</NuxtLink>
          </label>
          <button type="button" class="row__remove" :aria-label="`Delete to-do: ${t.text}`" @click="remove(t)">×</button>
        </li>
      </ul>
      <form class="adder" @submit.prevent="submitTodo">
        <label class="bd-sr-only" for="new-todo">New to-do</label>
        <input id="new-todo" v-model="newTodo" class="bd-input" placeholder="Add a to-do" maxlength="500">
        <button type="submit" class="bd-btn bd-btn--outline bd-btn--small" :disabled="!newTodo.trim()">Add</button>
      </form>
      <div v-if="doneTodos.length" class="done">
        <button type="button" class="done__toggle" :aria-expanded="showDone" @click="showDone = !showDone">
          {{ showDone ? 'Hide' : 'Show' }} {{ doneTodos.length }} done
        </button>
        <ul v-if="showDone" class="list">
          <li v-for="t in doneTodos" :key="t.id" class="row is-done">
            <input :id="`d-${t.id}`" type="checkbox" class="row__check" checked @change="update(t, { done: false })">
            <label :for="`d-${t.id}`" class="row__text">{{ t.text }}</label>
            <button type="button" class="row__remove" :aria-label="`Delete to-do: ${t.text}`" @click="remove(t)">×</button>
          </li>
        </ul>
      </div>
    </section>

    <!-- Notes -->
    <section class="panel bd-card" aria-labelledby="notes-title">
      <h2 id="notes-title" class="panel__title">Notes</h2>
      <ul v-if="notes.length" class="notes">
        <li v-for="n in notes" :key="n.id" class="note">
          <p class="note__text bd-serif">{{ n.text }}</p>
          <button type="button" class="row__remove" :aria-label="`Delete note: ${n.text}`" @click="remove(n)">×</button>
        </li>
      </ul>
      <form class="adder adder--note" @submit.prevent="submitNote">
        <label class="bd-sr-only" for="new-note">New note</label>
        <textarea id="new-note" v-model="newNote" class="bd-input" rows="2" placeholder="Jot something down" maxlength="500" />
        <button type="submit" class="bd-btn bd-btn--outline bd-btn--small" :disabled="!newNote.trim()">Save note</button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.today { display: flex; flex-direction: column; gap: var(--bd-space-4); }
.today__error { color: var(--bd-terracotta-dark); font-size: var(--bd-text-sm); }
.panel { display: flex; flex-direction: column; gap: var(--bd-space-3); padding: var(--bd-space-5); }
.panel__title { display: flex; align-items: center; gap: var(--bd-space-2); font-size: var(--bd-text-lg); font-weight: 500; letter-spacing: 0; }
.panel__badge { font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 999px; background: var(--bd-marigold); color: #221D1A; }
.panel__empty { font-size: var(--bd-text-sm); }

.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.row { display: grid; grid-template-columns: 24px minmax(0, 1fr) 32px; align-items: start; gap: var(--bd-space-2); padding-block: 8px; border-bottom: 1px solid var(--bd-line); }
.row__check { width: 18px; height: 18px; margin: 3px 0 0; accent-color: var(--bd-ink); cursor: pointer; }
.row__text { display: flex; flex-direction: column; font-size: var(--bd-text-sm); line-height: 1.4; cursor: pointer; overflow-wrap: anywhere; }
.row__meta { font-size: 12px; color: var(--bd-ink-3); }
.row__source { text-decoration: underline; text-underline-offset: 2px; }
.row.is-due .row__meta { color: var(--bd-terracotta-dark); font-weight: 500; }
.row.is-done .row__text { color: var(--bd-ink-3); text-decoration: line-through; }
.row__remove {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--bd-ink-3);
  font-size: 20px;
  line-height: 1;
  border-radius: 8px;
  cursor: pointer;
}
.row__remove:hover { background: var(--bd-line); color: var(--bd-ink); }

.adder { display: flex; gap: var(--bd-space-2); align-items: center; }
.adder .bd-input { min-height: 44px; padding: 8px 12px; font-size: var(--bd-text-sm); }
.adder--reminder { flex-wrap: wrap; }
.adder--reminder .bd-input:first-of-type { flex: 1 1 100%; }
.adder--reminder input[type='datetime-local'] { flex: 1 1 160px; }
.adder--note { flex-direction: column; align-items: stretch; }
.adder--note .bd-btn { align-self: flex-start; }

.done__toggle { font: inherit; font-size: 13px; color: var(--bd-ink-2); background: none; border: none; padding: 8px 0; cursor: pointer; text-decoration: underline; }

.notes { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--bd-space-2); }
.note { display: grid; grid-template-columns: minmax(0, 1fr) 32px; gap: var(--bd-space-2); padding: 10px 12px; border-radius: var(--bd-radius-sm); background: var(--bd-ground); }
.note__text { font-size: var(--bd-text-md); line-height: 1.45; white-space: pre-line; overflow-wrap: anywhere; }
</style>
