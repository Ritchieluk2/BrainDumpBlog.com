/**
 * Insights: patterns across many brain dumps.
 *
 * Pure function over stored entries so it runs on the server (and in tests).
 * Unlocks once there are two weeks of history, because before that the
 * "patterns" would mostly be noise.
 */
import { AFFECT_FEATURES, dominantMood, type Affect } from './cosmos'
import { MOOD_KEYS, MOODS, type Mood } from './moods'
import { FEELING_WORDS } from './affect'

export const UNLOCK_DAYS = 14
export const UNLOCK_ENTRIES = 10

export interface InsightEntry {
  id: string
  entryDate: string // YYYY-MM-DD
  words: number
  affect: Affect
  /** Topic words saved with the entry (see extractTopics). Falls back to scanning `body`. */
  topics?: string[] | null
  body?: string | null
}

export interface Insights {
  unlocked: boolean
  progress: { daysSpanned: number; entries: number; neededDays: number; neededEntries: number }
  totals?: {
    entries: number
    words: number
    avgWords: number
    longestStreak: number
    currentStreak: number
    firstDate: string
    lastDate: string
  }
  moods?: { mood: Mood; avg: number; ledDays: number }[]
  features?: { key: string; body: string; meaning: string; days: number }[]
  timeline?: { id: string; date: string; valence: number; arousal: number; mood: Mood }[]
  weekdays?: { day: string; avgValence: number | null; entries: number }[]
  weeks?: { start: string; entries: number; avgValence: number; avgArousal: number; mood: Mood; days: { id: string; affect: Affect }[] }[]
  topics?: { word: string; days: number; valenceDiff: number }[]
  observations?: string[]
}

// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_NAMES = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

const dayCache = new Map<string, number>()
const dayNumber = (iso: string) => {
  let n = dayCache.get(iso)
  if (n === undefined) {
    const [y, m, d] = iso.split('-').map(Number)
    n = Math.round(Date.UTC(y!, m! - 1, d!) / DAY_MS)
    if (dayCache.size > 5000) dayCache.clear()
    dayCache.set(iso, n)
  }
  return n
}
const isoFromDayNumber = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10)
const weekdayIndex = (iso: string) => (new Date(dayNumber(iso) * DAY_MS).getUTCDay() + 6) % 7 // Mon = 0
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
const round2 = (x: number) => Math.round(x * 100) / 100

const STOPWORDS = new Set(`about above after again against also always among another anyway around because been before being below
between both cant could couldnt didnt does doesnt doing dont down during each even every feel feeling felt from further going gonna
have having here hers herself himself into itself just kind know last like little look maybe might more most much must myself need
never next nothing once only other ought ours ourselves over really same should since some something still such sure than that thats
their theirs them themselves then there these they thing things think this those though through today together tomorrow very want
wanted wasnt were what when where which while whom whose will with within without would yesterday your yours yourself yourselves
week weekend morning mornings maybe also okay good great time make made back going well right left day days night
thinking wait start started honestly actually probably anything everything someone somehow already enough again kept keep
take takes took give gave said says tell told come came went getting gets head mind lots less feels felt feeling
badly called hours minutes monday tuesday wednesday thursday friday saturday sunday
goes guess helps leave place pointless slept weird honestly literally basically small smiling stop whether`.split(/\s+/))

/** Short words that are usually real topics. */
const SHORT_TOPICS = new Set(['mom', 'dad', 'job', 'car', 'gym', 'run', 'dog', 'cat', 'kid', 'kids', 'son', 'wife', 'boss', 'team', 'home', 'move', 'rent', 'tea'])

/** Concrete things we also count as small joys; still worth tracking as topics. */
const TOPIC_ALLOW = new Set(['coffee', 'sunshine', 'family', 'friend', 'friends', 'deadline', 'interview', 'appointment'])

/** Words worth tracking as "topics": skip short words, stopwords and the feeling words we already score. */
const WORD = /[a-z]+(?:'[a-z]+)?/g
function topicWords(body: string): Set<string> {
  const out = new Set<string>()
  const skipped = new Set<string>()
  const text = body.toLowerCase()
  WORD.lastIndex = 0
  for (let m = WORD.exec(text); m; m = WORD.exec(text)) {
    let w = m[0]
    const q = w.indexOf("'")
    if (q !== -1) w = w.endsWith("'s") ? w.slice(0, -2) : w.slice(0, q) + w.slice(q + 1)
    if (out.has(w) || skipped.has(w)) continue
    if (TOPIC_ALLOW.has(w) || SHORT_TOPICS.has(w) || (w.length >= 4 && !STOPWORDS.has(w) && !FEELING_WORDS.has(w))) out.add(w)
    else skipped.add(w)
  }
  return out
}

/** Topic words for one entry, computed once when it's saved and stored with it. */
export function extractTopics(body: string): string[] {
  return [...topicWords(body)].slice(0, 400)
}

function streaks(dates: string[]) {
  const days = [...new Set(dates.map(dayNumber))].sort((a, b) => a - b)
  let longest = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i]! - days[i - 1]! === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }
  // current streak counts back from the most recent entry
  let current = days.length ? 1 : 0
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i]! - days[i - 1]! === 1) current++
    else break
  }
  return { longest, current }
}

const pctOf = (n: number, of: number) => `${n} of ${of}`

// ---------------------------------------------------------------------------

export function computeInsights(input: InsightEntry[]): Insights {
  const entries = [...input].sort((a, b) => a.entryDate.localeCompare(b.entryDate))
  const n = entries.length
  const first = entries[0]?.entryDate
  const last = entries[n - 1]?.entryDate
  const daysSpanned = first && last ? dayNumber(last) - dayNumber(first) + 1 : 0
  const progress = { daysSpanned, entries: n, neededDays: UNLOCK_DAYS, neededEntries: UNLOCK_ENTRIES }

  if (daysSpanned < UNLOCK_DAYS || n < UNLOCK_ENTRIES) {
    return { unlocked: false, progress }
  }

  // --- totals ---
  const words = entries.reduce((s, e) => s + e.words, 0)
  const { longest, current } = streaks(entries.map((e) => e.entryDate))
  const totals = {
    entries: n,
    words,
    avgWords: Math.round(words / n),
    longestStreak: longest,
    currentStreak: current,
    firstDate: first!,
    lastDate: last!
  }

  // --- feelings ---
  const dominants = entries.map((e) => dominantMood(e.affect))
  const moods = MOOD_KEYS.map((mood) => ({
    mood,
    avg: round2(mean(entries.map((e) => e.affect.moods[mood] ?? 0))),
    ledDays: dominants.filter((d) => d === mood).length
  }))
    .filter((m) => m.avg > 0.02 || m.ledDays > 0)
    .sort((a, b) => b.ledDays - a.ledDays || b.avg - a.avg)

  // --- sky features (comets etc.) ---
  const FEATURE_ON = 0.3
  const features = AFFECT_FEATURES.map((f) => ({
    key: f.key as string,
    body: f.body as string,
    meaning: f.meaning as string,
    days: entries.filter((e) => (e.affect[f.key] as number) > FEATURE_ON).length
  })).sort((a, b) => b.days - a.days)

  // --- timeline ---
  const timeline = entries.map((e, i) => ({
    id: e.id,
    date: e.entryDate,
    valence: round2(e.affect.valence),
    arousal: round2(e.affect.arousal),
    mood: dominants[i]!
  }))

  // --- weekdays ---
  const weekdays = WEEKDAYS.map((day, i) => {
    const vs = entries.filter((e) => weekdayIndex(e.entryDate) === i).map((e) => e.affect.valence)
    return { day, avgValence: vs.length ? round2(mean(vs)) : null, entries: vs.length }
  })

  // --- weeks (Monday start), newest first ---
  const byWeek = new Map<number, InsightEntry[]>()
  for (const e of entries) {
    const dn = dayNumber(e.entryDate)
    const start = dn - weekdayIndex(e.entryDate)
    if (!byWeek.has(start)) byWeek.set(start, [])
    byWeek.get(start)!.push(e)
  }
  const weeks = [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([start, es]) => {
      const tally = new Map<Mood, number>()
      for (const e of es) {
        const m = dominantMood(e.affect)
        tally.set(m, (tally.get(m) ?? 0) + 1)
      }
      const mood = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]![0]
      return {
        start: isoFromDayNumber(start),
        entries: es.length,
        avgValence: round2(mean(es.map((e) => e.affect.valence))),
        avgArousal: round2(mean(es.map((e) => e.affect.arousal))),
        mood,
        days: es.map((e) => ({ id: e.id, affect: e.affect }))
      }
    })

  // --- recurring topics, and whether they come with lighter or heavier mornings ---
  const topicSets = entries.map((e) => (e.topics ? new Set(e.topics) : topicWords(e.body ?? '')))
  const counts = new Map<string, number>()
  for (const s of topicSets) for (const w of s) counts.set(w, (counts.get(w) ?? 0) + 1)
  const overall = mean(entries.map((e) => e.affect.valence))
  const minTopicDays = Math.max(2, Math.round(n * 0.12))
  const topics = [...counts.entries()]
    .filter(([, c]) => c >= minTopicDays)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word, days]) => {
      const withIt = entries.filter((_, i) => topicSets[i]!.has(word)).map((e) => e.affect.valence)
      return { word, days, valenceDiff: round2(mean(withIt) - overall) }
    })

  // --- plain-language observations ---
  const observations: string[] = []

  const lead = moods[0]
  if (lead) {
    const tied = moods.filter((m) => m.ledDays === lead.ledDays).map((m) => MOODS[m.mood].label)
    observations.push(
      tied.length === 1
        ? `${cap(tied[0]!)} led ${pctOf(lead.ledDays, n)} mornings, more than any other feeling.`
        : `No single feeling dominated: ${listJoin(tied)} each led ${lead.ledDays} mornings.`
    )
  }

  const rated = weekdays.filter((w) => w.entries >= 2 && w.avgValence !== null)
  if (rated.length >= 3) {
    const sorted = [...rated].sort((a, b) => b.avgValence! - a.avgValence!)
    const best = sorted[0]!
    const worst = sorted[sorted.length - 1]!
    if (best.avgValence! - worst.avgValence! > 0.3) {
      observations.push(`${WEEKDAY_NAMES[WEEKDAYS.indexOf(best.day)]} have been your lightest mornings so far, and ${WEEKDAY_NAMES[WEEKDAYS.indexOf(worst.day)]} your heaviest.`)
    }
  }

  // feelings that travel together
  const anxiousDays = entries.filter((e) => e.affect.moods.anxious > 0.3)
  if (anxiousDays.length >= 3) {
    const racing = anxiousDays.filter((e) => e.affect.racing > FEATURE_ON).length
    const loops = anxiousDays.filter((e) => e.affect.loops > FEATURE_ON).length
    if (racing / anxiousDays.length >= 0.5) {
      observations.push(`Anxious mornings usually came with racing thoughts: comets appeared on ${pctOf(racing, anxiousDays.length)} of them.`)
    } else if (loops / anxiousDays.length >= 0.5) {
      observations.push(`When you felt anxious, your thoughts tended to loop: a wormhole showed up on ${pctOf(loops, anxiousDays.length)} of those mornings.`)
    }
  }

  // writing more or less depending on mood
  const avgAll = words / n
  const wordsByMood = MOOD_KEYS.map((m) => {
    const ws = entries.filter((_, i) => dominants[i] === m).map((e) => e.words)
    return { m, count: ws.length, avg: mean(ws) }
  }).filter((x) => x.count >= 2)
  const wordiest = [...wordsByMood].sort((a, b) => b.avg - a.avg)[0]
  if (wordiest && wordiest.avg > avgAll * 1.2) {
    observations.push(`You write the most on ${MOODS[wordiest.m].label} mornings, about ${Math.round((wordiest.avg / avgAll - 1) * 100)}% more than usual.`)
  }

  // topics linked to lighter / heavier mornings
  const lighter = topics.filter((t) => t.valenceDiff >= 0.25).sort((a, b) => b.valenceDiff - a.valenceDiff)[0]
  const heavier = topics.filter((t) => t.valenceDiff <= -0.25).sort((a, b) => a.valenceDiff - b.valenceDiff)[0]
  if (lighter) observations.push(`Mornings where "${lighter.word}" came up tended to be lighter than average.`)
  if (heavier) observations.push(`"${cap(heavier.word)}" tends to show up on heavier mornings.`)

  // compare the two most recent weeks with enough entries to mean something
  const solidWeeks = weeks.filter((w) => w.entries >= 3)
  if (solidWeeks.length >= 2) {
    const [a, b] = solidWeeks
    const diff = a!.avgValence - b!.avgValence
    if (Math.abs(diff) >= 0.15) {
      observations.push(`The week of ${shortDate(a!.start)} was ${diff > 0 ? 'lighter' : 'heavier'} overall than the week before.`)
    } else {
      observations.push(`The weeks of ${shortDate(b!.start)} and ${shortDate(a!.start)} felt about the same overall.`)
    }
  }

  if (longest >= 3) observations.push(`Your longest streak so far is ${longest} mornings in a row.`)

  return {
    unlocked: true,
    progress,
    totals,
    moods,
    features,
    timeline,
    weekdays,
    weeks,
    topics,
    observations
  }
}

function listJoin(xs: string[]) {
  return xs.length <= 2 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

function shortDate(iso: string) {
  return new Date(dayNumber(iso) * DAY_MS).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
