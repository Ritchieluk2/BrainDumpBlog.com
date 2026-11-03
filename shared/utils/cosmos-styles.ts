/**
 * Alternate art styles for the same affect data.
 *
 *   planets     the original solar system / galaxy (cosmos.ts)
 *   geometry    Bauhaus-style flat shapes on a grid
 *   watercolor  soft, bleeding washes of color
 *   albers      nested cut-paper squares, after Josef Albers' "Homage to the Square"
 *
 * Every style draws the same things (strongest feeling, other feelings, racing
 * thoughts, to-dos, fog, loops, small joys); only the visual language changes.
 */
import {
  MOODS,
  PLANET_COLORS,
  averageAffect,
  dominantMood,
  escapeXml,
  f,
  hashString,
  mulberry32,
  rankedMoods,
  renderGalaxy,
  renderSolarSystem,
  surfaceFor,
  type Affect,
  type GalaxyDay,
  type Mood,
  type RenderOptions
} from './cosmos'

export type ArtStyle = 'planets' | 'geometry' | 'watercolor' | 'albers'

export const ART_STYLES: { id: ArtStyle; label: string; description: string }[] = [
  { id: 'planets', label: 'Planets', description: 'A solar system each morning, a galaxy each week.' },
  { id: 'geometry', label: 'Geometry', description: 'Flat Bauhaus shapes on a quiet grid.' },
  { id: 'watercolor', label: 'Watercolor', description: 'Soft washes that bleed into each other.' },
  { id: 'albers', label: 'Albers', description: 'Nested cut-paper squares, after Josef Albers.' }
]

export function isArtStyle(v: unknown): v is ArtStyle {
  return typeof v === 'string' && ART_STYLES.some((s) => s.id === v)
}

export function renderDay(style: ArtStyle, a: Affect, opts: RenderOptions): string {
  switch (style) {
    case 'geometry': return geometryDay(a, opts)
    case 'watercolor': return watercolorDay(a, opts)
    case 'albers': return albersDay(a, opts)
    default: return renderSolarSystem(a, opts)
  }
}

export function renderWeek(style: ArtStyle, days: GalaxyDay[], opts: RenderOptions): string {
  switch (style) {
    case 'geometry': return geometryWeek(days, opts)
    case 'watercolor': return watercolorWeek(days, opts)
    case 'albers': return albersWeek(days, opts)
    default: return renderGalaxy(days, opts)
  }
}

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

const S = 200

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i]! - v) * t).toString(16).padStart(2, '0')).join('')
}

const lit = (m: Mood) => PLANET_COLORS[MOODS[m].color].lit
const shade = (m: Mood) => PLANET_COLORS[MOODS[m].color].shade

function frame(p: string, opts: RenderOptions, defs: string, body: string): string {
  const title = opts.title ? `<title>${escapeXml(opts.title)}</title>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img"${opts.title ? '' : ' aria-hidden="true"'}>${title}` +
    `<defs><clipPath id="${p}-clip"><rect width="${S}" height="${S}" rx="28"/></clipPath>${defs}</defs>` +
    `<g clip-path="url(#${p}-clip)">${body}</g></svg>`
}

function setup(seedText: string, tag: string) {
  const seed = hashString(seedText)
  return { rng: mulberry32(seed), p: `${tag}${seed.toString(36)}`, seed }
}

/** Ranked moods with at least `n` entries, filling gaps with gentle defaults. */
function topMoods(a: Affect, n: number): [Mood, number][] {
  const r = rankedMoods(a)
  const fallback: Mood[] = ['calm', 'hopeful', 'tender', 'focused', 'joyful', 'tired', 'anxious']
  for (const m of fallback) {
    if (r.length >= n) break
    if (!r.some(([x]) => x === m)) r.push([m, 0.08])
  }
  return r.slice(0, n)
}

// ---------------------------------------------------------------------------
// Geometry (Bauhaus)
// ---------------------------------------------------------------------------

function shapeFor(mood: Mood, x: number, y: number, size: number, fill: string, rot = 0): string {
  const h = size / 2
  const t = `transform="rotate(${f(rot)} ${f(x)} ${f(y)})"`
  switch (MOODS[mood].shape) {
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 16; i++) {
        const r = i % 2 === 0 ? h : h * 0.45
        const ang = (i / 16) * Math.PI * 2 - Math.PI / 2
        pts.push(`${f(x + Math.cos(ang) * r)},${f(y + Math.sin(ang) * r)}`)
      }
      return `<polygon points="${pts.join(' ')}" fill="${fill}" ${t}/>`
    }
    case 'ringed':
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(h * 0.55)}" fill="${fill}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(h * 0.88)}" fill="none" stroke="${fill}" stroke-width="${f(Math.max(2, h * 0.16))}"/>`
    case 'triangle':
      return `<polygon points="${f(x)},${f(y - h)} ${f(x + h * 0.95)},${f(y + h * 0.75)} ${f(x - h * 0.95)},${f(y + h * 0.75)}" fill="${fill}" ${t}/>`
    case 'crescent':
      return `<path d="M${f(x - h)} ${f(y)} A${f(h)} ${f(h)} 0 0 1 ${f(x + h)} ${f(y)} Z" fill="${fill}" ${t}/>`
    case 'square':
      return `<rect x="${f(x - h * 0.8)}" y="${f(y - h * 0.8)}" width="${f(h * 1.6)}" height="${f(h * 1.6)}" fill="${fill}" ${t}/>`
    default:
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(h)}" fill="${fill}"/>`
  }
}

function geoGrid(line: string): string {
  let g = ''
  for (let i = 40; i < S; i += 40) {
    g += `<line x1="${i}" y1="0" x2="${i}" y2="${S}" stroke="${line}" stroke-width="1"/><line x1="0" y1="${i}" x2="${S}" y2="${i}" stroke="${line}" stroke-width="1"/>`
  }
  return g
}

function geometryDay(a: Affect, opts: RenderOptions): string {
  const { rng, p } = setup(opts.seed, 'geo')
  const sf = surfaceFor(opts.night)
  const ranked = rankedMoods(a)
  const [dom, domVal] = ranked[0] ?? (['calm', 0.3] as [Mood, number])
  const out: string[] = []
  const defs = `<pattern id="${p}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${PLANET_COLORS.plum.lit}" stroke-width="2"/></pattern>`

  if (opts.background !== false) out.push(`<rect width="${S}" height="${S}" fill="${sf.bg}"/>`)
  out.push(geoGrid(sf.line))

  // fog: a hatched block
  if (a.fog > 0.15) {
    const w = 60 + a.fog * 50
    out.push(`<rect x="${f(rng() * (S - w))}" y="${f(20 + rng() * 100)}" width="${f(w)}" height="${f(w * 0.6)}" fill="url(#${p}-hatch)" opacity="${f(0.35 + a.fog * 0.4)}"/>`)
  }

  // to-dos: a dot matrix
  if (a.scattered > 0.15) {
    const count = 6 + Math.round(a.scattered * 14)
    const ox = rng() > 0.5 ? 18 : 122
    for (let i = 0; i < count; i++) {
      out.push(`<circle cx="${f(ox + (i % 5) * 12)}" cy="${f(150 + Math.floor(i / 5) * 10)}" r="1.8" fill="${sf.ink}" opacity="0.7"/>`)
    }
  }

  // loops: nested squares
  if (a.loops > 0.3) {
    const x = rng() > 0.5 ? 28 : 172
    const y = rng() > 0.5 ? 30 : 170
    for (let i = 0; i < 4; i++) {
      const s = 30 - i * 7
      out.push(`<rect x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${s}" fill="none" stroke="${sf.ink}" stroke-width="1.4" opacity="0.7"/>`)
    }
  }

  // the strongest feeling: a big split disc
  const cx = 88 + rng() * 24
  const cy = 90 + rng() * 18
  const r = 26 + domVal * 20
  out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${lit(dom)}"/>`)
  out.push(`<path d="M${f(cx)} ${f(cy - r)} A${f(r)} ${f(r)} 0 0 1 ${f(cx)} ${f(cy + r)} Z" fill="${shade(dom)}"/>`)
  out.push(`<line x1="${f(cx - r - 14)}" y1="${f(cy)}" x2="${f(cx + r + 14)}" y2="${f(cy)}" stroke="${sf.ink}" stroke-width="2"/>`)

  // other feelings: shapes in the grid cells around it
  const cells = [[40, 40], [160, 40], [40, 160], [160, 160], [100, 28], [28, 100], [172, 100], [100, 172]]
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j]!, cells[i]!]
  }
  ranked.slice(1, 6).forEach(([m, v], i) => {
    const [x, y] = cells[i]!
    const size = 14 + v * 26
    const rot = Math.floor(rng() * 4) * 90
    out.push(shapeFor(m, x! + 3, y! + 3, size, shade(m), rot)) // offset shadow
    out.push(shapeFor(m, x!, y!, size, lit(m), rot))
  })

  // racing thoughts: diagonal bars
  const bars = Math.round(a.racing * 4)
  for (let i = 0; i < bars; i++) {
    const x = 20 + rng() * 160
    const y = 20 + rng() * 160
    const len = 34 + rng() * 26
    const ang = -Math.PI / 4 + (rng() > 0.5 ? Math.PI / 2 : 0)
    out.push(`<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + Math.cos(ang) * len)}" y2="${f(y + Math.sin(ang) * len)}" stroke="${PLANET_COLORS.terracotta.lit}" stroke-width="5"/>`)
  }

  // small joys: plus signs
  const pluses = Math.round(a.sparks * 7)
  for (let i = 0; i < pluses; i++) {
    const x = 14 + rng() * 172
    const y = 14 + rng() * 172
    out.push(`<path d="M${f(x - 4)} ${f(y)} H${f(x + 4)} M${f(x)} ${f(y - 4)} V${f(y + 4)}" stroke="${PLANET_COLORS.saffron.shade}" stroke-width="2.4"/>`)
  }

  return frame(p, opts, defs, out.join(''))
}

function geometryWeek(days: GalaxyDay[], opts: RenderOptions): string {
  const { rng, p } = setup(opts.seed, 'geow')
  const sf = surfaceFor(opts.night)
  const week = averageAffect(days.map((d) => d.affect))
  const core = dominantMood(week)
  const out: string[] = []
  if (opts.background !== false) out.push(`<rect width="${S}" height="${S}" fill="${sf.bg}"/>`)
  out.push(geoGrid(sf.line))

  const n = Math.max(days.length, 1)
  const pts = days.map((d, i) => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2
    return { d, x: 100 + Math.cos(ang) * 68, y: 100 + Math.sin(ang) * 68 }
  })
  // constellation lines, in order
  if (pts.length > 1) {
    out.push(`<polyline points="${pts.map((q) => `${f(q.x)},${f(q.y)}`).join(' ')}" fill="none" stroke="${sf.ink}" stroke-width="1.2" opacity="0.45"/>`)
  }
  // the week's core
  out.push(`<circle cx="100" cy="100" r="30" fill="${lit(core)}"/><path d="M100 70 A30 30 0 0 1 100 130 Z" fill="${shade(core)}"/>`)
  for (const q of pts) {
    const m = dominantMood(q.d.affect)
    const size = 16 + Math.min(1, q.d.affect.words / 500) * 14
    const rot = Math.floor(rng() * 4) * 90
    out.push(shapeFor(m, q.x + 2.5, q.y + 2.5, size, shade(m), rot))
    out.push(shapeFor(m, q.x, q.y, size, lit(m), rot))
  }
  if (week.racing > 0.35) {
    out.push(`<line x1="24" y1="176" x2="64" y2="136" stroke="${PLANET_COLORS.terracotta.lit}" stroke-width="5"/>`)
  }
  return frame(p, opts, '', out.join(''))
}

// ---------------------------------------------------------------------------
// Watercolor
// ---------------------------------------------------------------------------

function wcDefs(p: string, seed: number): string {
  const s = seed % 1000
  return `<filter id="${p}-wc" x="-30%" y="-30%" width="160%" height="160%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${s}" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
      `<feGaussianBlur in="d" stdDeviation="1.4"/></filter>` +
    `<filter id="${p}-wash" x="-50%" y="-50%" width="200%" height="200%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="${s + 7}" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
      `<feGaussianBlur in="d" stdDeviation="7"/></filter>` +
    `<filter id="${p}-paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${s + 3}"/>` +
      `<feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.35 0"/></filter>`
}

function blob(p: string, x: number, y: number, r: number, color: string, opacity: number, rng: () => number): string {
  // two slightly offset layers make a pooled edge
  const dx = (rng() - 0.5) * r * 0.25
  const dy = (rng() - 0.5) * r * 0.25
  return `<g filter="url(#${p}-wc)">` +
    `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * (0.85 + rng() * 0.25))}" fill="${color}" opacity="${f(opacity)}"/>` +
    `<ellipse cx="${f(x + dx)}" cy="${f(y + dy)}" rx="${f(r * 0.72)}" ry="${f(r * 0.66)}" fill="${color}" opacity="${f(opacity * 0.8)}"/></g>`
}

function watercolorDay(a: Affect, opts: RenderOptions): string {
  const { rng, p, seed } = setup(opts.seed, 'wc')
  const sf = surfaceFor(opts.night)
  const night = !!opts.night
  const blend = night ? 'screen' : 'multiply'
  const op = night ? 0.5 : 0.38
  const ranked = rankedMoods(a)
  const [dom, domVal] = ranked[0] ?? (['calm', 0.3] as [Mood, number])
  const paperBg = night ? sf.bg : '#FFFDF9'
  const out: string[] = []
  if (opts.background !== false) out.push(`<rect width="${S}" height="${S}" fill="${paperBg}"/>`)

  const paint: string[] = []
  // fog: a broad, very soft wash
  if (a.fog > 0.1) {
    const fogColor = a.moods.tired > a.moods.calm ? PLANET_COLORS.plum.lit : PLANET_COLORS.cobalt.lit
    paint.push(`<ellipse cx="${f(60 + rng() * 80)}" cy="${f(60 + rng() * 80)}" rx="${f(70 + a.fog * 30)}" ry="${f(46 + a.fog * 20)}" fill="${fogColor}" opacity="${f(0.12 + a.fog * 0.22)}" filter="url(#${p}-wash)"/>`)
  }
  // the strongest feeling: a pooled center
  const r0 = 24 + domVal * 18
  for (let i = 0; i < 3; i++) {
    paint.push(blob(p, 100 + (rng() - 0.5) * 8, 100 + (rng() - 0.5) * 8, r0 * (1 - i * 0.18), lit(dom), op, rng))
  }
  paint.push(blob(p, 104, 104, r0 * 0.45, shade(dom), op * 0.7, rng))
  // other feelings: smaller pools around it
  const start = rng() * Math.PI * 2
  ranked.slice(1, 6).forEach(([m, v], i) => {
    const ang = start + i * 2.39996
    const dist = r0 + 22 + i * 9
    paint.push(blob(p, 100 + Math.cos(ang) * dist, 100 + Math.sin(ang) * dist, 8 + v * 13, lit(m), op, rng))
  })
  // racing thoughts: quick brush strokes
  const strokes = Math.round(a.racing * 4)
  for (let i = 0; i < strokes; i++) {
    const x = 20 + rng() * 160
    const y = 20 + rng() * 160
    const ang = rng() * Math.PI * 2
    const len = 30 + rng() * 26
    const x2 = x + Math.cos(ang) * len
    const y2 = y + Math.sin(ang) * len
    const cxp = (x + x2) / 2 + (rng() - 0.5) * 20
    const cyp = (y + y2) / 2 + (rng() - 0.5) * 20
    paint.push(`<path d="M${f(x)} ${f(y)} Q${f(cxp)} ${f(cyp)} ${f(x2)} ${f(y2)}" fill="none" stroke="${PLANET_COLORS.terracotta.lit}" stroke-width="5" stroke-linecap="round" opacity="${f(op + 0.1)}" filter="url(#${p}-wc)"/>`)
  }
  out.push(`<g style="mix-blend-mode:${blend}">${paint.join('')}</g>`)

  // loops: a faint ink spiral
  if (a.loops > 0.3) {
    const x0 = rng() > 0.5 ? 40 : 160
    const y0 = rng() > 0.5 ? 40 : 160
    let d = ''
    for (let t = 0; t < 26; t++) {
      const ang = t * 0.55
      const rr = 1.5 + t * 0.85
      d += `${t ? 'L' : 'M'}${f(x0 + Math.cos(ang) * rr)} ${f(y0 + Math.sin(ang) * rr)} `
    }
    out.push(`<path d="${d}" fill="none" stroke="${sf.ink}" stroke-width="1.3" opacity="0.4" filter="url(#${p}-wc)"/>`)
  }
  // to-dos: ink spatter
  if (a.scattered > 0.15) {
    const sx = 30 + rng() * 140
    const sy = 140 + rng() * 40
    const count = 12 + Math.round(a.scattered * 30)
    for (let i = 0; i < count; i++) {
      const ang = rng() * Math.PI * 2
      const dist = Math.pow(rng(), 1.6) * 34
      out.push(`<circle cx="${f(sx + Math.cos(ang) * dist)}" cy="${f(sy + Math.sin(ang) * dist * 0.6)}" r="${f(0.5 + rng() * 1.6)}" fill="${sf.ink}" opacity="${f(0.2 + rng() * 0.3)}"/>`)
    }
  }
  // small joys: gold flecks
  const flecks = Math.round(a.sparks * 10)
  for (let i = 0; i < flecks; i++) {
    out.push(`<circle cx="${f(12 + rng() * 176)}" cy="${f(12 + rng() * 176)}" r="${f(1.4 + rng() * 1.6)}" fill="${PLANET_COLORS.saffron.lit}" opacity="0.85"/>`)
  }
  // paper grain
  out.push(`<rect width="${S}" height="${S}" filter="url(#${p}-paper)" opacity="${night ? 0.12 : 0.16}"/>`)
  return frame(p, opts, wcDefs(p, seed), out.join(''))
}

function watercolorWeek(days: GalaxyDay[], opts: RenderOptions): string {
  const { rng, p, seed } = setup(opts.seed, 'wcw')
  const sf = surfaceFor(opts.night)
  const night = !!opts.night
  const op = night ? 0.45 : 0.34
  const week = averageAffect(days.map((d) => d.affect))
  const core = dominantMood(week)
  const out: string[] = []
  if (opts.background !== false) out.push(`<rect width="${S}" height="${S}" fill="${night ? sf.bg : '#FFFDF9'}"/>`)
  const paint: string[] = []
  paint.push(`<ellipse cx="100" cy="100" rx="70" ry="60" fill="${lit(core)}" opacity="${f(op * 0.6)}" filter="url(#${p}-wash)"/>`)
  const n = Math.max(days.length, 1)
  const rot = rng() * Math.PI * 2
  days.forEach((d, i) => {
    const ang = rot + (i / n) * Math.PI * 2
    const dist = 46 + (rng() - 0.5) * 16
    const m = dominantMood(d.affect)
    const r = 16 + Math.min(1, d.affect.words / 500) * 12
    paint.push(blob(p, 100 + Math.cos(ang) * dist, 100 + Math.sin(ang) * dist, r, lit(m), op, rng))
  })
  out.push(`<g style="mix-blend-mode:${night ? 'screen' : 'multiply'}">${paint.join('')}</g>`)
  const flecks = 2 + Math.round(week.sparks * 6)
  for (let i = 0; i < flecks; i++) {
    out.push(`<circle cx="${f(14 + rng() * 172)}" cy="${f(14 + rng() * 172)}" r="${f(1.4 + rng() * 1.4)}" fill="${PLANET_COLORS.saffron.lit}" opacity="0.85"/>`)
  }
  out.push(`<rect width="${S}" height="${S}" filter="url(#${p}-paper)" opacity="${night ? 0.12 : 0.16}"/>`)
  return frame(p, opts, wcDefs(p, seed), out.join(''))
}

// ---------------------------------------------------------------------------
// Albers: nested cut-paper squares
// ---------------------------------------------------------------------------

const ALBERS_PAPER = { day: '#F4F0EA', night: '#1D1A24' }

function albersDefs(p: string, night: boolean): string {
  return `<filter id="${p}-cut" x="-10%" y="-10%" width="120%" height="125%">` +
    `<feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-color="#000" flood-opacity="${night ? 0.5 : 0.2}"/></filter>`
}

/**
 * Albers places each inner square low in the one around it: equal margins
 * left and right, a wide margin above and a narrow one below.
 */
function nest(sizes: number[]) {
  const rects: { x: number; y: number; s: number }[] = []
  let px = 0
  let py = 0
  let ps = S
  for (const s of sizes) {
    const gap = ps - s
    const x = px + gap / 2
    const y = py + gap * 0.66
    rects.push({ x, y, s })
    px = x
    py = y
    ps = s
  }
  return rects
}

function card(p: string, x: number, y: number, w: number, h: number, fill: string, rot: number, extra = ''): string {
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" filter="url(#${p}-cut)" transform="rotate(${f(rot)} ${f(x + w / 2)} ${f(y + h / 2)})"${extra}/>`
}

function albersDay(a: Affect, opts: RenderOptions): string {
  const { rng, p } = setup(opts.seed, 'alb')
  const night = !!opts.night
  const paper = night ? ALBERS_PAPER.night : ALBERS_PAPER.day
  const [[m1, v1], [m2], [m3]] = topMoods(a, 3) as [[Mood, number], [Mood, number], [Mood, number]]
  const out: string[] = []

  // ground: the third feeling, softened
  if (opts.background !== false) out.push(`<rect width="${S}" height="${S}" fill="${mix(lit(m3), paper, 0.55)}"/>`)

  const sizes = [150, 104 - (1 - v1) * 10, 58]
  if (a.loops > 0.3) sizes.push(30) // looping thoughts add one more square
  const rects = nest(sizes)
  const fills = [mix(lit(m2), paper, 0.28), lit(m1), mix(shade(m1), lit(m2), 0.5), mix(lit(m1), paper, 0.35)]

  // fog: a translucent vellum card laid across the lower half
  const vellum = a.fog > 0.15
    ? `<rect x="${f(-10 + rng() * 30)}" y="${f(96 + rng() * 30)}" width="${f(170 + a.fog * 40)}" height="${f(50 + a.fog * 30)}" fill="${night ? '#000000' : '#FFFFFF'}" opacity="${f(0.22 + a.fog * 0.25)}" transform="rotate(${f(-4 + rng() * 8)} 100 130)"/>`
    : ''

  rects.forEach((r, i) => {
    out.push(card(p, r.x, r.y, r.s, r.s, fills[i]!, (rng() - 0.5) * 2.4))
  })

  // interplay: a translucent card of the second feeling crossing the inner squares
  if (rankedMoods(a).length > 1) {
    const r = rects[1]!
    out.push(`<rect x="${f(r.x + r.s * 0.55)}" y="${f(r.y - 8)}" width="${f(r.s * 0.7)}" height="${f(r.s * 0.5)}" fill="${lit(m2)}" opacity="0.55" style="mix-blend-mode:${night ? 'screen' : 'multiply'}" transform="rotate(${f((rng() - 0.5) * 6)} ${f(r.x + r.s)} ${f(r.y + r.s * 0.2)})"/>`)
  }
  out.push(vellum)

  // racing thoughts: thin cut strips
  const strips = Math.round(a.racing * 3)
  for (let i = 0; i < strips; i++) {
    out.push(card(p, 10 + rng() * 110, 10 + rng() * 40, 60 + rng() * 40, 4, PLANET_COLORS.terracotta.lit, -35 + rng() * 70))
  }
  // to-dos: confetti of small cut squares along the bottom
  if (a.scattered > 0.15) {
    const n = 4 + Math.round(a.scattered * 10)
    const colors = Object.values(PLANET_COLORS).map((c) => c.lit)
    for (let i = 0; i < n; i++) {
      const s = 5 + rng() * 4
      out.push(card(p, 10 + rng() * 175, 176 + rng() * 16, s, s, colors[Math.floor(rng() * colors.length)]!, rng() * 90))
    }
  }
  // small joys: tiny bright squares near the top
  const joys = Math.round(a.sparks * 5)
  for (let i = 0; i < joys; i++) {
    out.push(card(p, 12 + rng() * 170, 8 + rng() * 24, 6, 6, PLANET_COLORS.saffron.lit, rng() * 45))
  }
  return frame(p, opts, albersDefs(p, night), out.join(''))
}

function albersWeek(days: GalaxyDay[], opts: RenderOptions): string {
  const { rng, p } = setup(opts.seed, 'albw')
  const night = !!opts.night
  const paper = night ? ALBERS_PAPER.night : ALBERS_PAPER.day
  const shown = days.slice(0, 7)
  const out: string[] = []
  if (opts.background !== false) out.push(`<rect width="${S}" height="${S}" fill="${paper}"/>`)
  // oldest day is the outermost square, newest the innermost
  const n = Math.max(shown.length, 1)
  const step = (S - 72) / n
  const sizes = shown.map((_, i) => S - 40 - i * step)
  const rects = nest(sizes)
  rects.forEach((r, i) => {
    const m = dominantMood(shown[i]!.affect)
    const t = 0.35 * (1 - i / n) // outer days a little softer
    out.push(card(p, r.x, r.y, r.s, r.s, mix(lit(m), paper, t), (rng() - 0.5) * 1.6))
  })
  return frame(p, opts, albersDefs(p, night), out.join(''))
}

