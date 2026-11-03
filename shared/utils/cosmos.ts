/**
 * Brain Dump cosmos: turns an affect analysis into a picture.
 *
 *   One day  -> a solar system   (renderSolarSystem)
 *   One week -> a galaxy         (renderGalaxy)
 *
 * Pure functions that return SVG strings, so the same code runs in the
 * browser, on the server, and in tests. Everything is seeded from the
 * entry id, so a given entry always draws the same picture.
 *
 * Visual vocabulary (what each body means):
 *   Star (center)   strongest feeling; size = how strong; rays = energy
 *   Planets         other feelings, nearest = strongest; size = intensity
 *   Ringed planet   anxiety
 *   Moons           a feeling that rides along with another
 *   Comets          racing / jumping thoughts
 *   Asteroid belt   scattered to-dos and loose ends
 *   Nebula          fog: tiredness, uncertainty, things not yet clear
 *   Wormhole        looping thoughts, rumination
 *   Sparkles        small joys, gratitude
 */

// ---------------------------------------------------------------------------
// Palette and moods
// ---------------------------------------------------------------------------

export const PLANET_COLORS = {
  terracotta: { lit: '#E2614A', shade: '#B8432F' },
  marigold: { lit: '#F2A93B', shade: '#CC8418' },
  saffron: { lit: '#F6CF4A', shade: '#D6A91E' },
  teal: { lit: '#1FA39B', shade: '#127B75' },
  cobalt: { lit: '#2F5BEA', shade: '#1E3FB5' },
  plum: { lit: '#8A4FBF', shade: '#673495' },
  magenta: { lit: '#D94F8C', shade: '#AE3369' }
} as const

export type PlanetColor = keyof typeof PLANET_COLORS

export const MOODS = {
  joyful: { label: 'joyful', color: 'saffron', shape: 'star' },
  calm: { label: 'calm', color: 'cobalt', shape: 'sphere' },
  anxious: { label: 'anxious', color: 'terracotta', shape: 'ringed' },
  focused: { label: 'focused', color: 'marigold', shape: 'triangle' },
  tired: { label: 'tired', color: 'plum', shape: 'crescent' },
  hopeful: { label: 'hopeful', color: 'teal', shape: 'square' },
  tender: { label: 'tender', color: 'magenta', shape: 'sphere' }
} as const satisfies Record<string, { label: string; color: PlanetColor; shape: string }>

export type Mood = keyof typeof MOODS
export const MOOD_KEYS = Object.keys(MOODS) as Mood[]

/** The full analysis of one brain dump. All values 0..1 unless noted. */
export interface Affect {
  moods: Record<Mood, number>
  /** -1 (heavy) .. 1 (light) */
  valence: number
  /** energy level */
  arousal: number
  /** racing, jumping thoughts -> comets */
  racing: number
  /** lists, to-dos, loose ends -> asteroid belt */
  scattered: number
  /** tiredness, uncertainty -> nebula */
  fog: number
  /** rumination, repeated worries -> wormhole */
  loops: number
  /** small joys, gratitude -> sparkles */
  sparks: number
  words: number
}

export const AFFECT_FEATURES = [
  { key: 'racing', body: 'Comets', meaning: 'racing, jumping thoughts' },
  { key: 'scattered', body: 'Asteroid belt', meaning: 'to-dos and loose ends' },
  { key: 'fog', body: 'Nebula', meaning: 'tiredness or uncertainty' },
  { key: 'loops', body: 'Wormhole', meaning: 'looping thoughts' },
  { key: 'sparks', body: 'Sparkles', meaning: 'small joys and gratitude' }
] as const

export function rankedMoods(a: Affect): [Mood, number][] {
  return (Object.entries(a.moods) as [Mood, number][])
    .filter(([, v]) => v > 0.05)
    .sort((x, y) => y[1] - x[1])
}

export function dominantMood(a: Affect): Mood {
  return rankedMoods(a)[0]?.[0] ?? 'calm'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const f = (n: number) => (Math.round(n * 10) / 10).toString()
export const INK = '#221D1A'

/** Night palette for dark thumbnails. */
export const NIGHT = { bg: '#15121D', ink: '#EEE8E1', line: '#2E2A38' } as const
export const DAY = { bg: '#FFFFFF', ink: INK, line: '#ECE8E2' } as const
export const surfaceFor = (night?: boolean) => (night ? NIGHT : DAY)

export function gradientDefs(prefix: string): string {
  return (Object.entries(PLANET_COLORS) as [PlanetColor, { lit: string; shade: string }][])
    .map(([name, c]) =>
      `<linearGradient id="${prefix}-${name}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0.58" stop-color="${c.lit}"/><stop offset="0.58" stop-color="${c.shade}"/></linearGradient>`)
    .join('')
}

export function sparkle(x: number, y: number, s: number, color: string, opacity = 1): string {
  // four-point star
  const d = `M${f(x)} ${f(y - s)} Q${f(x)} ${f(y)} ${f(x + s)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y + s)} Q${f(x)} ${f(y)} ${f(x - s)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y - s)}Z`
  return `<path d="${d}" fill="${color}" opacity="${f(opacity)}"/>`
}

export function asteroid(rng: () => number, x: number, y: number, r: number, fill: string): string {
  const pts: string[] = []
  const n = 6 + Math.floor(rng() * 3)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (0.7 + rng() * 0.45)
    pts.push(`${f(x + Math.cos(a) * rr)},${f(y + Math.sin(a) * rr)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`
}

export function wormhole(x: number, y: number, size: number, opacity: number, tilt: number, ink: string = INK): string {
  let out = `<g transform="rotate(${f(tilt)} ${f(x)} ${f(y)})" opacity="${f(opacity)}">`
  const rings = 6
  for (let i = 0; i < rings; i++) {
    const t = i / rings
    const rx = size * (1 - t * 0.85)
    const ry = rx * 0.42
    const dx = size * 0.18 * t
    out += `<ellipse cx="${f(x + dx)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${ink}" stroke-width="${f(1.4 - t * 0.6)}"/>`
  }
  out += `<ellipse cx="${f(x + size * 0.17)}" cy="${f(y)}" rx="${f(size * 0.16)}" ry="${f(size * 0.08)}" fill="${ink}"/></g>`
  return out
}

export function comet(prefix: string, idx: number, x: number, y: number, angle: number, len: number, color: PlanetColor): string {
  const c = PLANET_COLORS[color]
  const tx = x - Math.cos(angle) * len
  const ty = y - Math.sin(angle) * len
  const gid = `${prefix}-comet-${idx}`
  const nx = -Math.sin(angle)
  const ny = Math.cos(angle)
  const w = 2.6
  const tail = `M${f(x + nx * w)} ${f(y + ny * w)} L${f(tx)} ${f(ty)} L${f(x - nx * w)} ${f(y - ny * w)} Z`
  return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(x)}" y1="${f(y)}" x2="${f(tx)}" y2="${f(ty)}">` +
    `<stop offset="0" stop-color="${c.lit}" stop-opacity="0.85"/><stop offset="1" stop-color="${c.lit}" stop-opacity="0"/></linearGradient>` +
    `<path d="${tail}" fill="url(#${gid})"/>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="url(#${prefix}-${color})"/>`
}

// ---------------------------------------------------------------------------
// Day: solar system
// ---------------------------------------------------------------------------

export interface RenderOptions {
  /** Unique, stable seed (use the entry id). */
  seed: string
  /** Draw the white card background. Default true. */
  background?: boolean
  /** Accessible title. */
  title?: string
  /** Dark background for night mode. */
  night?: boolean
}

export function renderSolarSystem(a: Affect, opts: RenderOptions): string {
  const seed = hashString(opts.seed)
  const rng = mulberry32(seed)
  const p = `bd${seed.toString(36)}`
  const S = 200
  const cx = 100
  const cy = 100
  const ranked = rankedMoods(a)
  const [domMood, domVal] = ranked[0] ?? (['calm', 0.3] as [Mood, number])
  const domColor = MOODS[domMood].color
  const tilt = -18 + rng() * 10
  const sf = surfaceFor(opts.night)

  const layers: string[] = []
  const defs: string[] = [gradientDefs(p)]
  defs.push(`<filter id="${p}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>`)
  defs.push(`<filter id="${p}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`)
  defs.push(`<clipPath id="${p}-clip"><rect width="${S}" height="${S}" rx="28"/></clipPath>`)

  if (opts.background !== false) {
    layers.push(`<rect width="${S}" height="${S}" rx="28" fill="${sf.bg}"/>`)
  }

  // Nebula (behind everything)
  if (a.fog > 0.1) {
    const fogColors: PlanetColor[] = [a.moods.tired > a.moods.calm ? 'plum' : 'cobalt', domColor]
    const n = a.fog > 0.5 ? 3 : 2
    for (let i = 0; i < n; i++) {
      const ang = rng() * Math.PI * 2
      const dist = 40 + rng() * 40
      const x = cx + Math.cos(ang) * dist
      const y = cy + Math.sin(ang) * dist
      const col = PLANET_COLORS[fogColors[i % fogColors.length]!].lit
      layers.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(28 + rng() * 22)}" ry="${f(16 + rng() * 14)}" transform="rotate(${f(rng() * 180)} ${f(x)} ${f(y)})" fill="${col}" opacity="${f(0.12 + a.fog * 0.3)}" filter="url(#${p}-blur)"/>`)
    }
  }

  // Background dust
  const dust = 14 + Math.floor(a.arousal * 10)
  for (let i = 0; i < dust; i++) {
    layers.push(`<circle cx="${f(8 + rng() * 184)}" cy="${f(8 + rng() * 184)}" r="${f(0.5 + rng() * 0.7)}" fill="${sf.ink}" opacity="${f(0.12 + rng() * 0.15)}"/>`)
  }

  // Sparkles (small joys)
  const sparkCount = Math.round(a.sparks * 9)
  for (let i = 0; i < sparkCount; i++) {
    const col = i % 3 === 0 ? PLANET_COLORS.marigold.lit : PLANET_COLORS.saffron.lit
    layers.push(sparkle(10 + rng() * 180, 10 + rng() * 180, 2.5 + rng() * 3.5, col, 0.9))
  }

  // Orbits + planets
  const starR = 12 + domVal * 10
  const planets = ranked.slice(1, 6)
  const hasBelt = a.scattered > 0.15
  const orbitBase = starR + 8 + a.arousal * 6 + 14
  const room = 88 - orbitBase - (hasBelt ? 10 : 0)
  const orbitStep = planets.length > 1 ? Math.min(18, room / (planets.length - 1)) : 0
  const orbitLayer: string[] = []
  const bodyLayer: string[] = []
  let beltDrawn = false
  const startAngle = rng() * Math.PI * 2

  planets.forEach(([mood, val], i) => {
    let r = orbitBase + i * orbitStep
    // leave room for the asteroid belt after the 2nd planet
    if (hasBelt && i >= 2) r += 10
    orbitLayer.push(`<ellipse cx="${cx}" cy="${cy}" rx="${f(r)}" ry="${f(r * 0.92)}" fill="none" stroke="${sf.line}" stroke-width="1" transform="rotate(${f(tilt)} ${cx} ${cy})"/>`)
    // golden-angle spacing keeps planets from bunching up
    const ang = startAngle + i * 2.39996 + (rng() - 0.5) * 0.5
    const x = cx + Math.cos(ang) * r
    const y = cy + Math.sin(ang) * r * 0.92
    const pr = 3.5 + val * 8
    const color = MOODS[mood].color
    if (mood === 'anxious') {
      bodyLayer.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(pr * 1.8)}" ry="${f(pr * 0.45)}" fill="none" stroke="${PLANET_COLORS[color].shade}" stroke-width="1.6" transform="rotate(-20 ${f(x)} ${f(y)})"/>`)
    }
    bodyLayer.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(pr)}" fill="url(#${p}-${color})"/>`)
    // moon: the next-ranked mood rides along with strong planets
    const moonMood = ranked[i + 6]?.[0] ?? (val > 0.45 && rng() > 0.4 ? planets[(i + 1) % planets.length]?.[0] : undefined)
    if (moonMood && moonMood !== mood) {
      const ma = rng() * Math.PI * 2
      const md = pr + 4
      bodyLayer.push(`<circle cx="${f(x + Math.cos(ma) * md)}" cy="${f(y + Math.sin(ma) * md)}" r="${f(Math.max(1.8, pr * 0.32))}" fill="url(#${p}-${MOODS[moonMood].color})"/>`)
    }

    // asteroid belt between 2nd and 3rd orbit (or after the last if fewer)
    if (!beltDrawn && a.scattered > 0.15 && (i === 1 || i === planets.length - 1)) {
      beltDrawn = true
      const br = r + (i === 1 ? 14 : 14)
      const count = 14 + Math.round(a.scattered * 34)
      for (let k = 0; k < count; k++) {
        const ba = (k / count) * Math.PI * 2 + rng() * 0.2
        const jitter = (rng() - 0.5) * 7
        const ax = cx + Math.cos(ba) * (br + jitter)
        const ay = cy + Math.sin(ba) * (br + jitter) * 0.92
        const shade = rng() > 0.5 ? '#9C948B' : '#B9B1A7'
        bodyLayer.push(asteroid(rng, ax, ay, 0.8 + rng() * 1.6, shade))
      }
    }
  })

  // If there were no planets but the day was scattered, still draw a belt
  if (!beltDrawn && a.scattered > 0.15) {
    const br = starR + 30
    const count = 14 + Math.round(a.scattered * 34)
    for (let k = 0; k < count; k++) {
      const ba = (k / count) * Math.PI * 2 + rng() * 0.2
      const jitter = (rng() - 0.5) * 7
      bodyLayer.push(asteroid(rng, cx + Math.cos(ba) * (br + jitter), cy + Math.sin(ba) * (br + jitter) * 0.92, 0.8 + rng() * 1.6, rng() > 0.5 ? '#9C948B' : '#B9B1A7'))
    }
  }

  // Wormhole (rumination)
  const wormLayer: string[] = []
  if (a.loops > 0.3) {
    const corner = Math.floor(rng() * 4)
    const wx = corner % 2 === 0 ? 34 : 166
    const wy = corner < 2 ? 34 : 166
    wormLayer.push(wormhole(wx, wy, 14 + a.loops * 12, 0.35 + a.loops * 0.4, rng() * 60 - 30, sf.ink))
  }

  // Star (dominant mood)
  const rays = 8 + Math.round(a.arousal * 10)
  const starLayer: string[] = []
  starLayer.push(`<circle cx="${cx}" cy="${cy}" r="${f(starR * 1.9)}" fill="${PLANET_COLORS[domColor].lit}" opacity="0.14" filter="url(#${p}-soft)"/>`)
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2 + rng() * 0.15
    const r1 = starR + 3
    const r2 = starR + 5 + a.arousal * 6 + (i % 2) * 2
    starLayer.push(`<line x1="${f(cx + Math.cos(ang) * r1)}" y1="${f(cy + Math.sin(ang) * r1)}" x2="${f(cx + Math.cos(ang) * r2)}" y2="${f(cy + Math.sin(ang) * r2)}" stroke="${PLANET_COLORS[domColor].lit}" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>`)
  }
  starLayer.push(`<circle cx="${cx}" cy="${cy}" r="${f(starR)}" fill="url(#${p}-${domColor})"/>`)

  // Comets (racing thoughts)
  const cometLayer: string[] = []
  const comets = Math.round(a.racing * 4)
  for (let i = 0; i < comets; i++) {
    const ang = rng() * Math.PI * 2
    const dist = 62 + rng() * 26
    const x = cx + Math.cos(ang) * dist
    const y = cy + Math.sin(ang) * dist
    // travel roughly tangentially, tail pointing back
    const dir = ang + Math.PI / 2 + (rng() - 0.5) * 0.8
    const col: PlanetColor = rng() > 0.5 ? 'terracotta' : domColor
    cometLayer.push(comet(p, i, x, y, dir, 22 + rng() * 16, col))
  }

  const title = opts.title ? `<title>${escapeXml(opts.title)}</title>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img"${opts.title ? '' : ' aria-hidden="true"'}>${title}` +
    `<defs>${defs.join('')}</defs><g clip-path="url(#${p}-clip)">` +
    layers.join('') + orbitLayer.join('') + wormLayer.join('') + starLayer.join('') + bodyLayer.join('') + cometLayer.join('') +
    `</g></svg>`
}

// ---------------------------------------------------------------------------
// Week: galaxy
// ---------------------------------------------------------------------------

export interface GalaxyDay {
  id: string
  affect: Affect
}

export function averageAffect(days: Affect[]): Affect {
  const n = Math.max(days.length, 1)
  const moods = Object.fromEntries(MOOD_KEYS.map((m) => [m, days.reduce((s, d) => s + (d.moods[m] ?? 0), 0) / n])) as Record<Mood, number>
  const avg = (k: keyof Omit<Affect, 'moods'>) => days.reduce((s, d) => s + (d[k] as number), 0) / n
  return {
    moods,
    valence: avg('valence'),
    arousal: avg('arousal'),
    racing: avg('racing'),
    scattered: avg('scattered'),
    fog: avg('fog'),
    loops: avg('loops'),
    sparks: avg('sparks'),
    words: days.reduce((s, d) => s + d.words, 0)
  }
}

export function renderGalaxy(days: GalaxyDay[], opts: RenderOptions): string {
  const seed = hashString(opts.seed)
  const rng = mulberry32(seed)
  const p = `gx${seed.toString(36)}`
  const S = 200
  const cx = 100
  const cy = 100
  const week = averageAffect(days.map((d) => d.affect))
  const weekRanked = rankedMoods(week)
  const core = MOODS[weekRanked[0]?.[0] ?? 'calm'].color
  const second: PlanetColor = MOODS[weekRanked[1]?.[0] ?? weekRanked[0]?.[0] ?? 'calm'].color
  const rot = rng() * Math.PI * 2
  const arms = 2
  const sf = surfaceFor(opts.night)

  const defs: string[] = [gradientDefs(p)]
  defs.push(`<filter id="${p}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`)
  defs.push(`<filter id="${p}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>`)
  defs.push(`<clipPath id="${p}-clip"><rect width="${S}" height="${S}" rx="28"/></clipPath>`)

  const out: string[] = []
  if (opts.background !== false) out.push(`<rect width="${S}" height="${S}" rx="28" fill="${sf.bg}"/>`)

  // squash the disc so it reads as a tilted galaxy
  const squash = 0.72
  const tilt = -24 + rng() * 14
  const disc: string[] = []

  // spiral arms: radius grows steadily as each arm winds about 3/4 of a turn
  const armPoint = (arm: number, t: number) => {
    const ang = rot + arm * (Math.PI * 2 / arms) + t * 0.16
    const r = 9 + t * 2.75
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r * squash }
  }
  const T_MAX = 30 // r ≈ 91 at the tip

  // nebula clouds along the arms
  const clouds = 3 + Math.round(week.fog * 3)
  for (let i = 0; i < clouds; i++) {
    const pt = armPoint(i % arms, 10 + rng() * 16)
    const col = PLANET_COLORS[i % 2 === 0 ? core : second].lit
    disc.push(`<ellipse cx="${f(pt.x)}" cy="${f(pt.y)}" rx="${f(16 + rng() * 14)}" ry="${f(8 + rng() * 6)}" fill="${col}" opacity="${f(0.14 + week.fog * 0.2)}" filter="url(#${p}-blur)"/>`)
  }

  // arm dust: dense near the arm's spine, thinning outward
  for (let arm = 0; arm < arms; arm++) {
    for (let t = 0; t < T_MAX; t += 0.16) {
      const pt = armPoint(arm, t)
      const spread = 2 + t * 0.32
      const g = (rng() + rng() + rng() - 1.5) / 1.5 // roughly normal
      const g2 = (rng() + rng() - 1)
      const x = pt.x + g * spread * 2
      const y = pt.y + g2 * spread
      const colored = rng() < 0.12
      const fill = colored ? PLANET_COLORS[rng() > 0.5 ? core : second].lit : sf.ink
      const fade = 1 - t / T_MAX * 0.6
      disc.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.4 + rng() * 0.8)}" fill="${fill}" opacity="${f((colored ? 0.8 : 0.16 + rng() * 0.3) * fade)}"/>`)
    }
  }

  // central bulge
  for (let i = 0; i < 70; i++) {
    const a2 = rng() * Math.PI * 2
    const r = Math.abs((rng() + rng() + rng() - 1.5)) * 14
    disc.push(`<circle cx="${f(cx + Math.cos(a2) * r)}" cy="${f(cy + Math.sin(a2) * r * squash)}" r="${f(0.4 + rng() * 0.7)}" fill="${sf.ink}" opacity="${f(0.2 + rng() * 0.3)}"/>`)
  }

  // core glow
  disc.push(`<ellipse cx="${cx}" cy="${cy}" rx="30" ry="${f(30 * squash)}" fill="${PLANET_COLORS[core].lit}" opacity="0.28" filter="url(#${p}-soft)"/>`)
  disc.push(`<circle cx="${cx}" cy="${cy}" r="8" fill="url(#${p}-${core})"/>`)

  // one star system per day, placed along the arms in order
  const sorted = [...days]
  sorted.forEach((d, i) => {
    const arm = i % arms
    const t = 6 + Math.floor(i / arms) * 6.5 + (arm ? 3 : 0)
    const pt = armPoint(arm, t)
    const dm = dominantMood(d.affect)
    const col = MOODS[dm].color
    const r = 2.6 + clamp((d.affect.words - 100) / 600) * 3.4
    disc.push(`<circle cx="${f(pt.x)}" cy="${f(pt.y)}" r="${f(r * 2.4)}" fill="${PLANET_COLORS[col].lit}" opacity="0.18"/>`)
    disc.push(`<circle cx="${f(pt.x)}" cy="${f(pt.y)}" r="${f(r)}" fill="url(#${p}-${col})"/>`)
    // its planets as tiny satellites
    rankedMoods(d.affect).slice(1, 4).forEach(([m], k) => {
      const a = rng() * Math.PI * 2
      const dist = r + 3 + k * 2
      disc.push(`<circle cx="${f(pt.x + Math.cos(a) * dist)}" cy="${f(pt.y + Math.sin(a) * dist * 0.8)}" r="1.1" fill="${PLANET_COLORS[MOODS[m].color].shade}"/>`)
    })
  })

  out.push(`<g transform="rotate(${f(tilt)} ${cx} ${cy})">${disc.join('')}</g>`)

  // a few sparkles for the week's small joys
  const sparkCount = 2 + Math.round(week.sparks * 6)
  for (let i = 0; i < sparkCount; i++) {
    out.push(sparkle(12 + rng() * 176, 12 + rng() * 176, 2 + rng() * 3, PLANET_COLORS.saffron.lit, 0.85))
  }

  // a wormhole if the week kept looping
  if (week.loops > 0.3) {
    out.push(wormhole(rng() > 0.5 ? 36 : 164, rng() > 0.5 ? 38 : 162, 13, 0.4, rng() * 40 - 20, sf.ink))
  }

  // a comet if the week was racing
  if (week.racing > 0.35) {
    const ang = rng() * Math.PI * 2
    const x = cx + Math.cos(ang) * 78
    const y = cy + Math.sin(ang) * 70
    out.push(comet(p, 0, x, y, ang + Math.PI / 2, 28, 'terracotta'))
  }

  const title = opts.title ? `<title>${escapeXml(opts.title)}</title>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img"${opts.title ? '' : ' aria-hidden="true"'}>${title}` +
    `<defs>${defs.join('')}</defs><g clip-path="url(#${p}-clip)">${out.join('')}</g></svg>`
}

export function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!))
}
