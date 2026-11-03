/**
 * Demo entries: used for the homepage illustration and the styleguide,
 * so visitors can see what a week looks like before they've written one.
 */
import type { GalaxyDay, Mood } from '#shared/utils/cosmos'
import { analyzeText } from '#shared/utils/affect'

/** The demo entries analyzed with the same code as real ones. */
export function demoWeek(): GalaxyDay[] {
  return sampleDumps.map((d) => ({ id: `demo-${d.id}`, affect: analyzeText(d.body) }))
}

export interface Dump {
  id: string
  date: string // ISO date (YYYY-MM-DD)
  words: number
  primary: Mood
  secondary?: Mood
  summary: string
  body: string
}

export const sampleDumps: Dump[] = [
  {
    id: '2026-11-02',
    date: '2026-11-02',
    words: 412,
    primary: 'anxious',
    secondary: 'joyful',
    summary: 'Mostly restless, with a streak of excitement.',
    body: `Couldn't sleep again, kept thinking about the move and whether the plants will survive the drive. Need to call about the lease. Also weirdly excited, the new place has that window over the sink.\n\nList: boxes, tape, cancel internet, ask Sam about the truck. Why do I always leave the hard calls until Friday.\n\nCoffee is good today at least.`
  },
  {
    id: '2026-11-01',
    date: '2026-11-01',
    words: 268,
    primary: 'calm',
    secondary: 'tired',
    summary: 'Quiet and settled, a little low on energy.',
    body: `Sunday. Slept in, which felt like a small victory. Nothing urgent on my mind for once. Want to read more this week and maybe walk before work.`
  },
  {
    id: '2026-10-31',
    date: '2026-10-31',
    words: 530,
    primary: 'joyful',
    secondary: 'hopeful',
    summary: 'Bright and expansive, looking forward.',
    body: `Finished the draft last night and it is actually good. Want to send it to two people before I lose my nerve. Halloween tonight, need to buy candy.`
  },
  {
    id: '2026-10-30',
    date: '2026-10-30',
    words: 190,
    primary: 'tired',
    summary: 'Low battery. Short and foggy.',
    body: `Tired. Meetings all day. Just want to get through it.`
  },
  {
    id: '2026-10-29',
    date: '2026-10-29',
    words: 355,
    primary: 'focused',
    secondary: 'calm',
    summary: 'Clear-headed and on task.',
    body: `Three things today: finish the deck, reply to Ana, go to the gym. That's it. Everything else can wait.`
  },
  {
    id: '2026-10-28',
    date: '2026-10-28',
    words: 470,
    primary: 'hopeful',
    secondary: 'anxious',
    summary: 'Optimistic, with a few worries underneath.',
    body: `Interview went better than I thought. Trying not to get my hopes up but they are up. Still nervous about the follow-up.`
  },
  {
    id: '2026-10-27',
    date: '2026-10-27',
    words: 240,
    primary: 'tender',
    secondary: 'calm',
    summary: 'Soft and reflective.',
    body: `Called Mom. She sounded good. Thinking about how fast this year went.`
  }
]

export function findDump(id: string): Dump | undefined {
  return sampleDumps.find((d) => d.id === id)
}

/** Planet radius (in a 100-unit box) scales with word count. */
export function planetRadius(words: number): number {
  const min = 18
  const max = 40
  const t = Math.min(Math.max((words - 100) / 500, 0), 1)
  return Math.round(min + (max - min) * t)
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', opts)
}
