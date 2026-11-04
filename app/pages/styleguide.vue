<script setup lang="ts">
import { MOODS, PLANET_COLORS, type Mood, type PlanetColor } from '#shared/utils/moods'
import { demoWeek } from '~/data/sampleDumps'
import { SKY_SCENES } from '#shared/utils/sky-scene'

useHead({ title: 'Styleguide' })

const week = demoWeek()

const colors = Object.entries(PLANET_COLORS) as [PlanetColor, { lit: string; shade: string }][]
const moods = Object.keys(MOODS) as Mood[]

const neutrals = [
  { name: 'Chalk (ground)', token: '--bd-ground', hex: '#FAF9F7' },
  { name: 'Surface', token: '--bd-surface', hex: '#FFFFFF' },
  { name: 'Hairline', token: '--bd-line', hex: '#ECE8E2' },
  { name: 'Muted text', token: '--bd-ink-3', hex: '#6B645D' },
  { name: 'Secondary text', token: '--bd-ink-2', hex: '#55504B' },
  { name: 'Ink', token: '--bd-ink', hex: '#221D1A' }
]
</script>

<template>
  <div class="sg bd-container">
    <header class="sg__head">
      <p class="bd-label">Brand system · Dawn Orbit</p>
      <BdLogo size="lg" />
      <p class="bd-muted">Every value here comes from <code>app/assets/css/tokens.css</code> and <code>shared/utils/moods.ts</code>. Change them there and the site follows.</p>
    </header>

    <section class="sg__section">
      <h2 class="bd-label">Logo</h2>
      <div class="sg__row">
        <div class="sg__tile"><BdLogo /></div>
        <div class="sg__tile"><BdLogo size="sm" /></div>
        <div class="sg__tile"><BdLogo mark-only /></div>
      </div>
      <p class="bd-muted sg__note">The mark follows the reader's local time. Right now it shows the current scene; here are all four.</p>
      <div class="sg__row">
        <div v-for="s in SKY_SCENES" :key="s.id" class="sg__tile sg__scene">
          <BdLogo mark-only size="lg" :scene="s.id" />
          <code>{{ s.id }} · {{ s.label }} · from {{ s.from }}</code>
        </div>
      </div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Planet palette</h2>
      <div class="sg__swatches">
        <div v-for="[name, c] in colors" :key="name" class="sg__swatch">
          <BdPlanet :color="name" :radius="36" />
          <strong>{{ name }}</strong>
          <code>{{ c.lit }} / {{ c.shade }}</code>
        </div>
      </div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Neutrals</h2>
      <div class="sg__neutrals">
        <div v-for="n in neutrals" :key="n.token" class="sg__neutral">
          <span class="sg__chip" :style="{ background: n.hex }" />
          <span><strong>{{ n.name }}</strong><br><code>{{ n.token }} · {{ n.hex }}</code></span>
        </div>
      </div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Mood icons</h2>
      <div class="sg__row">
        <BdMoodIcon v-for="m in moods" :key="m" :mood="m" :size="52" show-label />
      </div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Cosmos: a day is a solar system</h2>
      <div class="sg__cosmos">
        <figure v-for="d in week" :key="d.id" class="sg__day">
          <CosmosDay :affect="d.affect" :seed="d.id" />
        </figure>
      </div>
      <div class="sg__legend">
        <CosmosLegend :affect="week[0]!.affect" show-all />
      </div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Cosmos: a week is a galaxy</h2>
      <div class="sg__galaxy"><CosmosWeek :days="week" seed="styleguide-week" /></div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Planet variations</h2>
      <div class="sg__swatches">
        <div class="sg__swatch"><BdPlanet color="cobalt" :radius="24" /><code>small (few words)</code></div>
        <div class="sg__swatch"><BdPlanet color="saffron" :radius="40" /><code>large (many words)</code></div>
        <div class="sg__swatch"><BdPlanet color="terracotta" :radius="30" ring /><code>ringed (anxious)</code></div>
        <div class="sg__swatch"><BdPlanet color="plum" :radius="32" moon="magenta" /><code>with moon (2nd mood)</code></div>
      </div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Type</h2>
      <div class="sg__type">
        <p class="bd-display">Good morning.</p>
        <p class="bd-display bd-serif-italic">Empty your head.</p>
        <p style="font-size: var(--bd-text-2xl); font-weight: 300">Outfit Light — headings and interface</p>
        <p class="bd-serif" style="font-size: var(--bd-text-xl)">Fraunces Soft — your writing. Couldn't sleep again, kept thinking about the move…</p>
        <p>Outfit Regular 16px — body and UI copy.</p>
        <p class="bd-label">Label · 12px caps</p>
      </div>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Buttons &amp; inputs</h2>
      <div class="sg__row">
        <button type="button" class="bd-btn bd-btn--primary">Primary</button>
        <button type="button" class="bd-btn bd-btn--outline">Outline</button>
        <button type="button" class="bd-btn bd-btn--outline bd-btn--small">Small</button>
        <button type="button" class="bd-btn bd-btn--primary" disabled>Disabled</button>
      </div>
      <label class="sg__input">
        <span class="bd-muted">Text input</span>
        <input class="bd-input" placeholder="you@example.com">
      </label>
    </section>

    <section class="sg__section">
      <h2 class="bd-label">Card &amp; editor</h2>
      <DumpEditor />
    </section>
  </div>
</template>

<style scoped>
.sg { display: flex; flex-direction: column; gap: var(--bd-space-8); padding-block: var(--bd-space-6); }
.sg__head { display: flex; flex-direction: column; gap: var(--bd-space-5); max-width: 760px; }
.sg__section { display: flex; flex-direction: column; gap: var(--bd-space-5); }
.sg__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--bd-space-5); }
.sg__tile { padding: var(--bd-space-5) var(--bd-space-6); background: var(--bd-surface); border-radius: var(--bd-radius-lg); box-shadow: var(--bd-shadow-soft); }
.sg__swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--bd-space-5); }
.sg__swatch { display: flex; flex-direction: column; gap: 6px; font-size: var(--bd-text-sm); }
.sg__swatch strong { font-weight: 500; text-transform: capitalize; }
.sg__neutrals { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--bd-space-4); }
.sg__neutral { display: flex; align-items: center; gap: var(--bd-space-3); font-size: var(--bd-text-sm); }
.sg__neutral strong { font-weight: 500; }
.sg__chip { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--bd-line-strong); flex: none; }
.sg__type { display: flex; flex-direction: column; gap: var(--bd-space-4); }
.sg__input { display: flex; flex-direction: column; gap: 6px; max-width: 360px; font-size: var(--bd-text-sm); }
code { font-size: 12px; color: var(--bd-ink-3); }
.sg__note { font-size: var(--bd-text-sm); margin-top: var(--bd-space-3); }
.sg__scene { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sg__cosmos { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--bd-space-4); }
.sg__day { margin: 0; }
.sg__day .cosmos, .sg__galaxy .cosmos { border-radius: 22px; box-shadow: var(--bd-shadow-soft); }
.sg__legend { max-width: 560px; }
.sg__galaxy { max-width: 420px; }
</style>
