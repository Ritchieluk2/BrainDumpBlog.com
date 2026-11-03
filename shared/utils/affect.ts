/**
 * Placeholder affect analysis.
 *
 * A small word-list heuristic so the whole pipeline (write -> analyze ->
 * store -> draw) works end to end today. It will be replaced by a proper
 * model call later; anything that returns an `Affect` can slot in here.
 */
import type { Affect, Mood } from './cosmos'

const LEXICON: Record<Mood, string[]> = {
  joyful: ['happy', 'excited', 'great', 'amazing', 'fun', 'laugh', 'yay', 'awesome', 'love', 'loved', 'wonderful', 'best', 'delight', 'proud', 'celebrate'],
  calm: ['calm', 'quiet', 'peaceful', 'slow', 'rest', 'relaxed', 'settled', 'easy', 'still', 'gentle', 'breathe', 'content', 'fine'],
  anxious: ['anxious', 'worried', 'worry', 'nervous', 'stress', 'stressed', 'scared', 'afraid', 'panic', 'overwhelmed', 'dread', 'deadline', 'pressure', 'tense', "can't sleep", "couldn't sleep", 'restless'],
  focused: ['focus', 'focused', 'plan', 'goal', 'finish', 'finished', 'priority', 'today i will', 'clear', 'productive', 'done', 'ship', 'work on', 'list'],
  tired: ['tired', 'exhausted', 'sleepy', 'drained', 'foggy', 'groggy', 'slept badly', 'no energy', 'burned out', 'burnt out', 'meh', 'sluggish', 'heavy'],
  hopeful: ['hope', 'hopeful', 'looking forward', 'maybe this', 'excited for', 'could be', 'new', 'start', 'better', 'progress', 'optimistic', 'chance', 'soon'],
  tender: ['miss', 'missed', 'mom', 'dad', 'family', 'friend', 'hug', 'grateful', 'thankful', 'care', 'kind', 'remember', 'nostalgic', 'sweet', 'soft']
}

const SCATTERED = ['need to', 'have to', 'should', 'todo', 'to-do', 'call', 'email', 'buy', 'pay', 'book', 'remember to', "don't forget", 'errand', 'appointment', 'list']
const FOG = ['maybe', 'not sure', 'unsure', 'idk', "don't know", 'confused', 'foggy', 'unclear', 'lost', 'whatever', 'i guess', 'kind of', 'sort of']
const LOOPS = ['again', 'keep', 'always', 'never', 'why do i', 'why does', 'over and over', 'still', 'same', 'every time', 'what if']
const SPARKS = ['grateful', 'thankful', 'glad', 'nice', 'good', 'small win', 'lovely', 'beautiful', 'coffee', 'sunshine', 'enjoyed', 'smile']
/** Every word the analysis already scores, so "topics" can skip them. */
export const FEELING_WORDS: ReadonlySet<string> = new Set(
  [...Object.values(LEXICON).flat(), ...SCATTERED, ...FOG, ...LOOPS, ...SPARKS].filter((w) => !w.includes(' '))
)

const POSITIVE = [...LEXICON.joyful, ...LEXICON.calm, ...LEXICON.hopeful, ...SPARKS]
const NEGATIVE = [...LEXICON.anxious, ...LEXICON.tired, 'sad', 'angry', 'upset', 'hate', 'awful', 'bad', 'lonely', 'hurt']

function count(text: string, terms: string[]): number {
  let n = 0
  for (const t of terms) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
    n += text.match(re)?.length ?? 0
  }
  return n
}

/** Map a raw rate onto 0..1 with diminishing returns. */
const squash = (x: number, k = 1) => 1 - Math.exp(-k * x)

export function analyzeText(raw: string): Affect {
  const text = raw.toLowerCase()
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0
  const per100 = 100 / Math.max(words, 80)

  const moods = Object.fromEntries(
    (Object.keys(LEXICON) as Mood[]).map((m) => [m, squash(count(text, LEXICON[m]) * per100, 0.9)])
  ) as Record<Mood, number>

  // If nothing matched, call it a quiet, calm morning.
  if (Object.values(moods).every((v) => v < 0.05)) moods.calm = 0.35

  const sentences = raw.split(/[.!?\n]+/).filter((s) => s.trim()).length || 1
  const avgSentence = words / sentences
  const listLines = (raw.match(/^\s*([-*•]|\d+[.)])\s+/gm) ?? []).length
  const exclaims = (raw.match(/!/g) ?? []).length
  const questions = (raw.match(/\?/g) ?? []).length
  const dashes = (raw.match(/(—|--| - |\.\.\.|…)/g) ?? []).length

  const pos = count(text, POSITIVE)
  const neg = count(text, NEGATIVE)

  return {
    moods,
    valence: (pos - neg) / Math.max(pos + neg, 1),
    arousal: squash((exclaims + dashes + count(text, LEXICON.anxious) + count(text, LEXICON.joyful)) * per100, 0.5),
    racing: squash(Math.max(0, dashes + exclaims * 0.5 + (avgSentence < 7 ? 1 : 0) + count(text, ['also', 'and then', 'wait', 'oh', 'anyway', 'what if']) * 1.5 - 1) * per100, 0.22),
    scattered: squash((count(text, SCATTERED) + listLines * 1.5) * per100, 0.35),
    fog: squash((count(text, FOG) + count(text, LEXICON.tired) + questions * 0.5) * per100, 0.3),
    loops: squash(count(text, LOOPS) * per100, 0.3),
    sparks: squash(count(text, SPARKS) * per100, 0.35),
    words
  }
}

/** One-line human summary, e.g. "Mostly anxious, with a streak of joyful." */
export function summarize(a: Affect): string {
  const ranked = (Object.entries(a.moods) as [Mood, number][]).filter(([, v]) => v > 0.05).sort((x, y) => y[1] - x[1])
  const [first, second] = ranked
  if (!first) return 'A quiet morning.'
  return second && second[1] > 0.15
    ? `Mostly ${first[0]}, with a streak of ${second[0]}.`
    : `Mostly ${first[0]}.`
}
