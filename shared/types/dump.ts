import type { Affect } from '../utils/cosmos'

/** 'dump' = a morning brain dump (drawn as a solar system, feeds insights). 'journal' = any other entry. */
export type EntryKind = 'dump' | 'journal'

/** An entry as returned by the list endpoint. `body` is only included on the detail endpoint. */
export interface DumpSummary {
  id: string
  kind: EntryKind
  title: string | null
  excerpt: string
  entryDate: string // YYYY-MM-DD, the writer's local date
  words: number
  summary: string
  affect: Affect
  createdAt: number
}

/** A short reference to another entry (for links between journal entries and mornings). */
export interface EntryRef {
  id: string
  kind: EntryKind
  title: string | null
  entryDate: string
  summary: string
  affect: Affect
}

export interface DumpDetail extends DumpSummary {
  body: string
  /** For journal entries: the mornings this entry reflects on. */
  refs: EntryRef[]
  /** For morning dumps: journal entries that reflect on this morning. */
  reflections: EntryRef[]
}

export type ItemKind = 'todo' | 'note' | 'reminder'

export interface Item {
  id: string
  kind: ItemKind
  text: string
  done: boolean
  dueAt: number | null
  sourceId: string | null
  createdAt: number
}
