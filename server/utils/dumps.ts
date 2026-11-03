import type { DumpRow, EntryKind, ItemRow } from './db'
import type { DumpDetail, DumpSummary, EntryRef, Item, ItemKind } from '#shared/types/dump'
import type { Affect } from '#shared/utils/cosmos'

type Db = Awaited<ReturnType<typeof useDb>>

export const MAX_BODY_CHARS = 20_000
export const MAX_TITLE_CHARS = 140
export const MAX_REFS = 14

export function toSummary(row: DumpRow): DumpSummary {
  return {
    id: row.id,
    kind: row.kind === 'journal' ? 'journal' : 'dump',
    title: row.title ?? null,
    excerpt: row.excerpt ?? (row.body ? row.body.slice(0, 200) : ''),
    entryDate: row.entry_date,
    words: Number(row.words),
    summary: row.summary,
    affect: JSON.parse(row.affect) as Affect,
    createdAt: Number(row.created_at)
  }
}

export function toDetail(row: DumpRow, refs: EntryRef[] = [], reflections: EntryRef[] = []): DumpDetail {
  return { ...toSummary(row), body: row.body, refs, reflections }
}

function toRef(row: DumpRow): EntryRef {
  return {
    id: row.id,
    kind: row.kind === 'journal' ? 'journal' : 'dump',
    title: row.title ?? null,
    entryDate: row.entry_date,
    summary: row.summary,
    affect: JSON.parse(row.affect) as Affect
  }
}

export function readDumpText(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Write something first.' })
  }
  if (input.length > MAX_BODY_CHARS) {
    throw createError({ statusCode: 413, statusMessage: `That's a long one. Entries are limited to ${MAX_BODY_CHARS.toLocaleString()} characters.` })
  }
  return input
}

export function readKind(input: unknown): EntryKind {
  return input === 'journal' ? 'journal' : 'dump'
}

export function readTitle(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const t = input.trim().slice(0, MAX_TITLE_CHARS)
  return t || null
}

export function readRefIds(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return [...new Set(input.filter((x): x is string => typeof x === 'string' && x.length <= 64))].slice(0, MAX_REFS)
}

/** Mornings a journal entry reflects on. */
export async function loadRefs(db: Db, entryId: string, userId: string): Promise<EntryRef[]> {
  const { rows } = await db.sql`
    SELECT d.id, d.kind, d.title, d.entry_date, d.summary, d.affect
    FROM entry_links l JOIN dumps d ON d.id = l.dump_id
    WHERE l.entry_id = ${entryId} AND l.user_id = ${userId} AND d.user_id = ${userId}
    ORDER BY d.entry_date ASC`
  return ((rows ?? []) as unknown as DumpRow[]).map(toRef)
}

/** Journal entries that reflect on a given morning. */
export async function loadReflections(db: Db, dumpId: string, userId: string): Promise<EntryRef[]> {
  const { rows } = await db.sql`
    SELECT d.id, d.kind, d.title, d.entry_date, d.summary, d.affect
    FROM entry_links l JOIN dumps d ON d.id = l.entry_id
    WHERE l.dump_id = ${dumpId} AND l.user_id = ${userId} AND d.user_id = ${userId}
    ORDER BY d.entry_date DESC, d.created_at DESC`
  return ((rows ?? []) as unknown as DumpRow[]).map(toRef)
}

/** Replace a journal entry's links, keeping only the user's own morning dumps. */
export async function saveLinks(db: Db, entryId: string, userId: string, refIds: string[]) {
  await db.sql`DELETE FROM entry_links WHERE entry_id = ${entryId} AND user_id = ${userId}`
  for (const dumpId of refIds) {
    const { rows } = await db.sql`SELECT id FROM dumps WHERE id = ${dumpId} AND user_id = ${userId} AND kind = 'dump'`
    if (rows?.length) {
      await db.sql`INSERT INTO entry_links (entry_id, dump_id, user_id) VALUES (${entryId}, ${dumpId}, ${userId})`
    }
  }
}

// --- to-dos, notes, reminders ---

export const MAX_ITEM_CHARS = 500
export const MAX_ITEMS = 500

export function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    kind: (['todo', 'note', 'reminder'].includes(row.kind) ? row.kind : 'todo') as ItemKind,
    text: row.text,
    done: Boolean(Number(row.done)),
    dueAt: row.due_at === null || row.due_at === undefined ? null : Number(row.due_at),
    sourceId: row.source_id ?? null,
    createdAt: Number(row.created_at)
  }
}

export function readItemKind(input: unknown): ItemKind {
  if (input === 'note' || input === 'reminder') return input
  return 'todo'
}

export function readItemText(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Write something first.' })
  }
  return input.trim().slice(0, MAX_ITEM_CHARS)
}

export function readDueAt(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null
  const n = typeof input === 'number' ? input : Date.parse(String(input))
  return Number.isFinite(n) ? Math.round(n) : null
}
