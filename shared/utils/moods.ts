/**
 * Feelings, and how each one looks: its color and its shape.
 *
 * Everyone starts with the same defaults (DEFAULT_MOOD_MAP), and can change
 * any feeling's color or shape. The chosen look is a MoodMap, passed to every
 * renderer, so a person's own associations show up in every picture, icon,
 * legend and chart.
 *
 * Pure data and string helpers only, so the server can validate a MoodMap and
 * the browser can draw with it.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

/** The brand planet colors. Each has a lit side and a shade side. */
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

export interface Tone { lit: string; shade: string }

/** Every color offered in the picker: the brand colors plus a wider, softer range. */
export const SWATCHES: { id: string; label: string; lit: string; shade: string }[] = [
  { id: 'terracotta', label: 'Terracotta', ...PLANET_COLORS.terracotta },
  { id: 'coral', label: 'Coral', lit: '#F28B6E', shade: '#CC6A4F' },
  { id: 'marigold', label: 'Marigold', ...PLANET_COLORS.marigold },
  { id: 'saffron', label: 'Saffron', ...PLANET_COLORS.saffron },
  { id: 'sand', label: 'Sand', lit: '#D9B98A', shade: '#B39466' },
  { id: 'sage', label: 'Sage', lit: '#8DB07A', shade: '#6A8C58' },
  { id: 'forest', label: 'Forest', lit: '#2E8A57', shade: '#1F6640' },
  { id: 'teal', label: 'Teal', ...PLANET_COLORS.teal },
  { id: 'sky', label: 'Sky', lit: '#5AB4E5', shade: '#3A8FC0' },
  { id: 'cobalt', label: 'Cobalt', ...PLANET_COLORS.cobalt },
  { id: 'lavender', label: 'Lavender', lit: '#A99BE0', shade: '#8273C0' },
  { id: 'plum', label: 'Plum', ...PLANET_COLORS.plum },
  { id: 'magenta', label: 'Magenta', ...PLANET_COLORS.magenta },
  { id: 'rose', label: 'Rose', lit: '#F08FA6', shade: '#C96B82' },
  { id: 'slate', label: 'Slate', lit: '#7A8494', shade: '#596273' }
]

const HEX = /^#[0-9a-f]{6}$/i
export const isHexColor = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()

/** Lit and shade sides for any color. Brand swatches use their designed shade. */
export function tone(hex: string): Tone {
  const up = hex.toUpperCase()
  const known = SWATCHES.find((s) => s.lit === up)
  if (known) return { lit: known.lit, shade: known.shade }
  return { lit: up, shade: toHex(rgb(up).map((v) => v * 0.78)) }
}

/** Relative luminance (0 = black, 1 = white), for "hard to see" warnings. */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function swatchLabel(hex: string): string {
  return SWATCHES.find((s) => s.lit === hex.toUpperCase())?.label ?? 'Custom'
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export const SHAPES = [
  { id: 'sphere', label: 'Circle' },
  { id: 'ringed', label: 'Ringed' },
  { id: 'star', label: 'Star' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'square', label: 'Square' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'crescent', label: 'Crescent' },
  { id: 'drop', label: 'Drop' }
] as const

export type ShapeId = (typeof SHAPES)[number]['id']
export const isShape = (v: unknown): v is ShapeId => typeof v === 'string' && SHAPES.some((s) => s.id === v)

const n = (v: number) => (Math.round(v * 10) / 10).toString()

export interface ShapePaint {
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  /** Color of a ringed shape's ring (defaults to the stroke or fill). */
  ring?: string
  /** Degrees. */
  rotate?: number
  /** Square corners (the Geometry style). */
  sharp?: boolean
}

/**
 * One feeling's shape as SVG, centered on (x, y), about 2r across.
 * Every shape fills roughly the same area so none looks "bigger" by accident.
 */
export function shapeSvg(shape: ShapeId, x: number, y: number, r: number, paint: ShapePaint): string {
  const fill = paint.fill ?? 'none'
  const style = `fill="${fill}"` +
    (paint.stroke ? ` stroke="${paint.stroke}" stroke-width="${n(paint.strokeWidth ?? 1)}" stroke-linejoin="round"` : '') +
    (paint.opacity !== undefined && paint.opacity < 1 ? ` opacity="${n(paint.opacity)}"` : '')
  const rot = paint.rotate ? ` transform="rotate(${n(paint.rotate)} ${n(x)} ${n(y)})"` : ''
  const poly = (pts: [number, number][]) => `<polygon points="${pts.map(([px, py]) => `${n(px)},${n(py)}`).join(' ')}" ${style}${rot}/>`

  switch (shape) {
    case 'ringed': {
      const ring = paint.ring ?? paint.stroke ?? fill
      const w = Math.max(1, r * 0.14)
      return `<g${rot}><circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.62)}" ${style}/>` +
        `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 1.18)}" ry="${n(r * 0.36)}" fill="none" stroke="${ring}" stroke-width="${n(w)}"` +
        `${paint.opacity !== undefined && paint.opacity < 1 ? ` opacity="${n(paint.opacity)}"` : ''} transform="rotate(-20 ${n(x)} ${n(y)})"/></g>`
    }
    case 'star': {
      const pts: [number, number][] = []
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r * 1.12 : r * 0.5
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr])
      }
      return poly(pts)
    }
    case 'triangle':
      return poly([[x, y - r * 1.08], [x + r * 1.05, y + r * 0.78], [x - r * 1.05, y + r * 0.78]])
    case 'square': {
      const s = r * 1.62
      return `<rect x="${n(x - s / 2)}" y="${n(y - s / 2)}" width="${n(s)}" height="${n(s)}" rx="${paint.sharp ? 0 : n(s * 0.18)}" ${style}${rot}/>`
    }
    case 'diamond':
      return poly([[x, y - r * 1.15], [x + r * 0.85, y], [x, y + r * 1.15], [x - r * 0.85, y]])
    case 'hexagon': {
      const pts: [number, number][] = []
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2
        pts.push([x + Math.cos(a) * r * 1.02, y + Math.sin(a) * r * 1.02])
      }
      return poly(pts)
    }
    case 'crescent': {
      // outer circle minus a smaller circle nudged up and to the right
      const r1 = r * 0.84
      const d = r * 0.52
      const ang = -Math.PI / 4
      const ux = Math.cos(ang)
      const uy = Math.sin(ang)
      const a = (r * r - r1 * r1 + d * d) / (2 * d)
      const h = Math.sqrt(Math.max(0, r * r - a * a))
      const p1 = [x + ux * a - uy * h, y + uy * a + ux * h]
      const p2 = [x + ux * a + uy * h, y + uy * a - ux * h]
      const dd = `M${n(p1[0]!)} ${n(p1[1]!)} A${n(r)} ${n(r)} 0 1 1 ${n(p2[0]!)} ${n(p2[1]!)} A${n(r1)} ${n(r1)} 0 1 0 ${n(p1[0]!)} ${n(p1[1]!)}Z`
      return `<path d="${dd}" ${style}${rot}/>`
    }
    case 'drop': {
      const k = r * 0.8
      const cy = y + r * 0.22
      const dd = `M${n(x)} ${n(y - r * 1.12)} C${n(x + r * 0.2)} ${n(y - r * 0.6)} ${n(x + k)} ${n(cy - r * 0.4)} ${n(x + k)} ${n(cy)} ` +
        `A${n(k)} ${n(k)} 0 0 1 ${n(x - k)} ${n(cy)} C${n(x - k)} ${n(cy - r * 0.4)} ${n(x - r * 0.2)} ${n(y - r * 0.6)} ${n(x)} ${n(y - r * 1.12)}Z`
      return `<path d="${dd}" ${style}${rot}/>`
    }
    default:
      return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" ${style}/>`
  }
}

// ---------------------------------------------------------------------------
// Moods and the default look
// ---------------------------------------------------------------------------

export const MOODS = {
  joyful: { label: 'joyful', color: '#F6CF4A', shape: 'star' },
  calm: { label: 'calm', color: '#2F5BEA', shape: 'sphere' },
  anxious: { label: 'anxious', color: '#E2614A', shape: 'ringed' },
  focused: { label: 'focused', color: '#F2A93B', shape: 'triangle' },
  tired: { label: 'tired', color: '#8A4FBF', shape: 'crescent' },
  hopeful: { label: 'hopeful', color: '#1FA39B', shape: 'square' },
  tender: { label: 'tender', color: '#D94F8C', shape: 'drop' }
} as const satisfies Record<string, { label: string; color: string; shape: ShapeId }>

export type Mood = keyof typeof MOODS
export const MOOD_KEYS = Object.keys(MOODS) as Mood[]
export const isMood = (v: unknown): v is Mood => typeof v === 'string' && v in MOODS

export interface MoodLook { color: string; shape: ShapeId }
export type MoodMap = Record<Mood, MoodLook>

export const DEFAULT_MOOD_MAP: MoodMap = Object.fromEntries(
  MOOD_KEYS.map((m) => [m, { color: MOODS[m].color, shape: MOODS[m].shape }])
) as MoodMap

/** Ready-made color sets. They change colors only; shapes stay as they are. */
export const COLOR_SETS: { id: string; label: string; description: string; colors: Record<Mood, string> }[] = [
  {
    id: 'dawn',
    label: 'Dawn',
    description: 'The Brain Dump default.',
    colors: Object.fromEntries(MOOD_KEYS.map((m) => [m, MOODS[m].color])) as Record<Mood, string>
  },
  {
    id: 'garden',
    label: 'Garden',
    description: 'Greens for calm and focus, soft florals for the rest.',
    colors: { joyful: '#F6CF4A', calm: '#8DB07A', anxious: '#E2614A', focused: '#2E8A57', tired: '#A99BE0', hopeful: '#5AB4E5', tender: '#F08FA6' }
  },
  {
    id: 'tide',
    label: 'Tide',
    description: 'Cool blues when settled, warm colors when stirred up.',
    colors: { joyful: '#F2A93B', calm: '#5AB4E5', anxious: '#E2614A', focused: '#2F5BEA', tired: '#7A8494', hopeful: '#1FA39B', tender: '#D94F8C' }
  },
  {
    id: 'clear',
    label: 'Clear contrast',
    description: 'Colors chosen to stay distinct for most kinds of color blindness.',
    colors: { joyful: '#F0E442', calm: '#0072B2', anxious: '#D55E00', focused: '#E69F00', tired: '#CC79A7', hopeful: '#009E73', tender: '#56B4E9' }
  }
]

/** Accepts anything (a cookie, a request body) and returns a complete, valid map. */
export function normalizeMoodMap(input: unknown): MoodMap {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const out = {} as MoodMap
  for (const m of MOOD_KEYS) {
    const v = (src[m] && typeof src[m] === 'object' ? src[m] : {}) as Record<string, unknown>
    out[m] = {
      color: isHexColor(v.color) ? v.color.toUpperCase() : DEFAULT_MOOD_MAP[m].color,
      shape: isShape(v.shape) ? v.shape : DEFAULT_MOOD_MAP[m].shape
    }
  }
  return out
}

export function isDefaultMoodMap(map: MoodMap): boolean {
  return MOOD_KEYS.every((m) => map[m].color === DEFAULT_MOOD_MAP[m].color && map[m].shape === DEFAULT_MOOD_MAP[m].shape)
}

/** Lit/shade for a feeling under a given map. */
export const moodTone = (map: MoodMap | undefined, m: Mood): Tone => tone((map ?? DEFAULT_MOOD_MAP)[m].color)

/** Diagonal split-light gradient for each feeling, ids `${prefix}-${mood}`. */
export function moodGradients(prefix: string, map: MoodMap | undefined): string {
  return MOOD_KEYS.map((m) => {
    const c = moodTone(map, m)
    return `<linearGradient id="${prefix}-${m}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0.58" stop-color="${c.lit}"/><stop offset="0.58" stop-color="${c.shade}"/></linearGradient>`
  }).join('')
}
