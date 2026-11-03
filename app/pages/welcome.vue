<script setup lang="ts">
/**
 * The welcome, right after a new account's first sign-in:
 *   1. You: names (optional)
 *   2. How it works: what color, shape, size and position mean, and why
 *   3. Feelings: pick colors and shapes (or keep the defaults)
 *   4. Look: light/night and art style
 *   5. Ready
 * Every step can be skipped; the defaults are a finished setup on their own.
 * Can be replayed from Settings.
 */
import { AFFECT_FEATURES } from '#shared/utils/cosmos'
import { MOODS, MOOD_KEYS, isDefaultMoodMap } from '#shared/utils/moods'
import { ART_STYLES } from '#shared/utils/cosmos-styles'
import { demoWeek } from '~/data/sampleDumps'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Welcome' })

const route = useRoute()
const next = safeNextPath(route.query.next) ?? '/'
const replay = route.query.replay === '1'
const firstMorningSaved = next.startsWith('/journal/')

const { user } = useUserSession()
const prefs = usePreferences()
const synced = usePrefsSynced()

const STEPS = [
  { id: 'you', label: 'You' },
  { id: 'how', label: 'How it works' },
  { id: 'feelings', label: 'Feelings' },
  { id: 'look', label: 'Look' },
  { id: 'ready', label: 'Ready' }
] as const
const step = ref(0)
const current = computed(() => STEPS[step.value]!.id)

const names = ref<{ save: () => Promise<boolean> } | null>(null)
const heading = ref<HTMLElement | null>(null)
const busy = ref(false)
const error = ref('')

// The example used to explain the pictures: the morning with the most going on.
const week = demoWeek()
const example = [...week].sort((a, b) => {
  const score = (d: typeof a) => Object.values(d.affect.moods).filter((v) => v > 0.05).length + (d.affect.racing > 0.15 ? 1 : 0) + (d.affect.sparks > 0.15 ? 1 : 0)
  return score(b) - score(a)
})[0]!

async function go(to: number) {
  error.value = ''
  if (current.value === 'you' && to > step.value && names.value) {
    busy.value = true
    const ok = await names.value.save()
    busy.value = false
    if (!ok) {
      error.value = "Couldn't save your names. You can carry on and set them later in Settings."
    }
  }
  step.value = Math.max(0, Math.min(STEPS.length - 1, to))
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  heading.value?.focus({ preventScroll: true })
}

async function finish() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/account/profile', { method: 'PATCH', body: { onboarded: true, prefs: prefs.all.value } })
    synced.value = JSON.stringify(prefs.all.value)
  } catch {
    // Not fatal: preferences are in this browser, and the welcome can be replayed.
  }
  busy.value = false
  await navigateTo(next)
}

const journalTitle = computed(() => user.value?.journalName || 'Your journal')
const hello = computed(() => (user.value?.name ? `, ${user.value.name}` : ''))
const artLabel = computed(() => ART_STYLES.find((s) => s.id === prefs.art.value)?.label ?? 'Planets')
const appearanceLabel = computed(() => ({ system: 'follows your device', light: 'light', dark: 'night' })[prefs.appearance.value])
const customized = computed(() => !isDefaultMoodMap(prefs.moods.value))
</script>

<template>
  <div class="welcome bd-container">
    <nav class="steps" aria-label="Welcome steps">
      <ol>
        <li v-for="(s, i) in STEPS" :key="s.id" :class="{ 'is-done': i < step, 'is-on': i === step }">
          <button type="button" :aria-current="i === step ? 'step' : undefined" :disabled="busy" @click="go(i)">
            <span class="steps__dot" aria-hidden="true" />
            <span class="steps__label">{{ s.label }}</span>
          </button>
        </li>
      </ol>
      <button v-if="current !== 'ready'" type="button" class="steps__skip" :disabled="busy" @click="finish">
        {{ replay ? 'Close' : 'Skip, use the defaults' }}
      </button>
    </nav>

    <!-- 1. You -->
    <section v-if="current === 'you'" class="step" aria-labelledby="w-title">
      <header class="step__head">
        <BdLogo size="sm" mark-only />
        <h1 id="w-title" ref="heading" tabindex="-1" class="step__title">
          Welcome{{ hello }}. <span class="bd-serif-italic">Let's make this journal yours.</span>
        </h1>
        <p class="bd-muted step__lede">Four short steps, about a minute. Nothing here is required, and everything can be changed later in Settings.</p>
      </header>
      <ProfileNames ref="names" />
    </section>

    <!-- 2. How it works -->
    <section v-else-if="current === 'how'" class="step" aria-labelledby="w-title">
      <header class="step__head">
        <h1 id="w-title" ref="heading" tabindex="-1" class="step__title">Every morning becomes <span class="bd-serif-italic">a picture.</span></h1>
        <p class="bd-muted step__lede">After you write, we look for seven feelings in your words, plus a few patterns in how you think. Then we draw what we found. Here's how to read one.</p>
      </header>

      <div class="how">
        <div class="how__pic">
          <CosmosDay :affect="example.affect" :seed="example.id" title="An example morning" />
          <p class="how__cap">An example morning, in your current style</p>
        </div>
        <ol class="how__rules">
          <li>
            <span class="how__num">1</span>
            <div><strong>Color and shape tell you which feeling.</strong> Each feeling always gets the same color and the same shape, in every picture.</div>
          </li>
          <li>
            <span class="how__num">2</span>
            <div><strong>The center is your strongest feeling.</strong> The bigger it is, the stronger it was.</div>
          </li>
          <li>
            <span class="how__num">3</span>
            <div><strong>Around it, your other feelings.</strong> Closer and bigger means stronger.</div>
          </li>
          <li>
            <span class="how__num">4</span>
            <div>
              <strong>Small extras show how your mind was moving.</strong>
              <ul class="how__extras">
                <li v-for="f in AFFECT_FEATURES" :key="f.key"><CosmosGlyph :feature="f.key" :size="24" /><span><strong>{{ f.body }}</strong>: {{ f.meaning }}</span></li>
              </ul>
            </div>
          </li>
          <li>
            <span class="how__num">5</span>
            <div><strong>A week becomes one bigger picture</strong>, built from each morning's strongest feeling, so you can see the shape of your week at a glance.</div>
          </li>
        </ol>
      </div>

      <div class="why">
        <div class="why__card bd-card">
          <h2 class="why__title">Why color <em>and</em> shape?</h2>
          <p>Color is what you notice first. Shape is the backup: it keeps feelings readable in a tiny thumbnail, in a printout, or if some colors are hard for you to tell apart.</p>
        </div>
        <div class="why__card bd-card">
          <h2 class="why__title">Why make them <em>yours</em>?</h2>
          <p>Colors don't mean the same thing to everyone. Blue is calm to one person and sad to another. You'll read these pictures every morning, so they should match how you feel about colors. The better they fit, the faster you'll spot your own patterns over the weeks.</p>
        </div>
      </div>
    </section>

    <!-- 3. Feelings -->
    <section v-else-if="current === 'feelings'" class="step" aria-labelledby="w-title">
      <header class="step__head">
        <h1 id="w-title" ref="heading" tabindex="-1" class="step__title">Your feelings, <span class="bd-serif-italic">your colors.</span></h1>
        <p class="bd-muted step__lede">Everyone starts on the Dawn set. Keep it, try another set, or tap a feeling to give it its own color and shape. Not sure yet? Keep the defaults and come back after a few mornings.</p>
      </header>
      <div class="feelings">
        <MoodMapEditor compact />
        <aside class="feelings__preview" aria-label="Preview">
          <MoodPreview />
        </aside>
      </div>
    </section>

    <!-- 4. Look -->
    <section v-else-if="current === 'look'" class="step" aria-labelledby="w-title">
      <header class="step__head">
        <h1 id="w-title" ref="heading" tabindex="-1" class="step__title">Pick <span class="bd-serif-italic">your look.</span></h1>
        <p class="bd-muted step__lede">Light or night, and the art style for your pictures. Your colors and shapes carry over to every style.</p>
      </header>
      <ThemePicker />
    </section>

    <!-- 5. Ready -->
    <section v-else class="step step--ready" aria-labelledby="w-title">
      <header class="step__head">
        <BdSunrise />
        <h1 id="w-title" ref="heading" tabindex="-1" class="step__title">{{ journalTitle }} <span class="bd-serif-italic">is ready.</span></h1>
      </header>
      <div class="ready bd-card">
        <ul class="ready__moods" aria-label="Your feelings">
          <li v-for="m in MOOD_KEYS" :key="m"><BdMoodIcon :mood="m" :size="40" show-label /></li>
        </ul>
        <p class="bd-muted">
          {{ customized ? 'Your own colors and shapes' : 'The Dawn colors and shapes' }}, drawn as {{ artLabel }}, with an appearance that {{ appearanceLabel === 'follows your device' ? 'follows your device' : `stays ${appearanceLabel}` }}.
          You can change any of this in Settings.
        </p>
      </div>
      <p class="bd-muted ready__tip">Tomorrow morning, open Brain Dump and write whatever is there for about ten minutes. No editing, no audience.</p>
    </section>

    <p v-if="error" class="welcome__error" role="alert">{{ error }}</p>

    <footer class="nav">
      <button v-if="step > 0" type="button" class="bd-btn bd-btn--outline" :disabled="busy" @click="go(step - 1)">Back</button>
      <span v-else />
      <button v-if="current !== 'ready'" type="button" class="bd-btn bd-btn--primary" :disabled="busy" @click="go(step + 1)">
        {{ busy ? 'Saving…' : current === 'feelings' && !customized ? 'Keep the defaults' : 'Next' }}
      </button>
      <button v-else type="button" class="bd-btn bd-btn--primary" :disabled="busy" @click="finish">
        {{ busy ? 'Saving…' : replay ? 'Done' : firstMorningSaved ? 'See your first morning' : 'Write your first morning' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.welcome { display: flex; flex-direction: column; gap: var(--bd-space-6); padding-block: var(--bd-space-5) var(--bd-space-7); max-width: 1040px; }

.steps { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--bd-space-3); }
.steps ol { list-style: none; margin: 0; padding: 0; display: flex; gap: 4px; flex-wrap: wrap; }
.steps li button {
  display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 10px;
  font: inherit; font-size: var(--bd-text-sm); color: var(--bd-ink-3); background: none; border: none; border-radius: var(--bd-radius-pill); cursor: pointer;
}
.steps li button:hover { background: var(--bd-line); }
.steps__dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bd-ink-3); flex: none; }
.steps li.is-done .steps__dot { background: var(--bd-ink-3); }
.steps li.is-on button { color: var(--bd-ink); font-weight: 500; }
.steps li.is-on .steps__dot { border-color: var(--bd-sunrise); background: var(--bd-sunrise); }
.steps__skip { font: inherit; font-size: var(--bd-text-sm); color: var(--bd-ink-2); background: none; border: none; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; min-height: 44px; padding: 0 4px; }
@media (max-width: 600px) {
  .steps__label { display: none; }
  .steps li.is-on .steps__label { display: inline; }
}

.step { display: flex; flex-direction: column; gap: var(--bd-space-6); }
.step__head { display: flex; flex-direction: column; gap: var(--bd-space-3); max-width: 680px; }
.step__title { font-size: var(--bd-text-3xl); font-weight: 300; letter-spacing: -0.035em; line-height: 1.08; outline: none; }
.step__lede { font-size: var(--bd-text-lg); line-height: 1.5; }

.how { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--bd-space-6); align-items: start; }
.how__pic { max-width: 360px; width: 100%; }
.how__pic :deep(.cosmos) { border-radius: var(--bd-radius-lg); overflow: hidden; box-shadow: var(--bd-shadow-card); }
.how__cap { font-size: var(--bd-text-xs); color: var(--bd-ink-3); margin-top: 8px; text-align: center; }
.how__rules { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-4); }
.how__rules > li { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: var(--bd-space-3); line-height: 1.5; }
.how__num { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-size: var(--bd-text-sm); font-weight: 500; background: var(--bd-ink); color: var(--bd-surface); }
.how__extras { list-style: none; margin: var(--bd-space-2) 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; font-size: var(--bd-text-sm); }
.how__extras li { display: flex; align-items: center; gap: var(--bd-space-2); }
.how__extras strong { font-weight: 500; }
@media (min-width: 820px) {
  .how { grid-template-columns: minmax(260px, 360px) minmax(0, 1fr); gap: var(--bd-space-7); }
}

.why { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: var(--bd-space-4); }
.why__card { display: flex; flex-direction: column; gap: var(--bd-space-2); }
.why__title { font-size: var(--bd-text-lg); font-weight: 500; letter-spacing: 0; }
.why__title em { font-family: var(--bd-font-serif); font-style: italic; font-weight: 400; }
.why__card p { color: var(--bd-ink-2); line-height: 1.55; }

.feelings { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--bd-space-6); align-items: start; }
.feelings__preview { order: -1; max-width: 420px; }
@media (min-width: 900px) {
  .feelings { grid-template-columns: minmax(0, 1.25fr) minmax(280px, 1fr); }
  .feelings__preview { order: 0; max-width: none; position: sticky; top: var(--bd-space-5); }
}

.ready { display: flex; flex-direction: column; gap: var(--bd-space-4); max-width: 680px; }
.ready__moods { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--bd-space-4); }
.ready__moods :deep(.bd-mood__label) { text-transform: capitalize; }
.ready__tip { max-width: 620px; line-height: 1.55; }

.welcome__error { color: var(--bd-terracotta-dark); font-size: var(--bd-text-sm); }

.nav {
  display: flex; justify-content: space-between; align-items: center; gap: var(--bd-space-3);
  padding-top: var(--bd-space-5); border-top: 1px solid var(--bd-line);
  position: sticky; bottom: 0; background: var(--bd-ground); padding-bottom: var(--bd-space-3); z-index: 2;
}
/* the phone tab bar is hidden on this page (see layouts/default.vue), so the bar sits at the very bottom */
@media (max-width: 719px) { .nav { padding-bottom: calc(var(--bd-space-3) + env(safe-area-inset-bottom)); } }
</style>
