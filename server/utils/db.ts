/**
 * Database access. Uses Nitro's built-in SQL layer: a local SQLite file
 * (.data/) during development, Cloudflare D1 in production.
 *
 * The schema is created on first use, so there is no separate migrate step.
 * When the schema needs to change later, add a new numbered entry to
 * MIGRATIONS (never edit an old one).
 */
type Database = ReturnType<typeof useDatabase>

const MIGRATIONS: string[][] = [
  // 1: initial schema
  [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS login_tokens (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS login_tokens_email_idx ON login_tokens (email, created_at)`,
    `CREATE TABLE IF NOT EXISTS dumps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      body TEXT NOT NULL,
      words INTEGER NOT NULL,
      summary TEXT NOT NULL,
      affect TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS dumps_user_date_idx ON dumps (user_id, entry_date)`
  ],
  // 2: journal entries alongside morning dumps, links between them, and to-dos/notes/reminders
  [
    `ALTER TABLE dumps ADD COLUMN kind TEXT NOT NULL DEFAULT 'dump'`,
    `ALTER TABLE dumps ADD COLUMN title TEXT`,
    `CREATE INDEX IF NOT EXISTS dumps_user_kind_idx ON dumps (user_id, kind, entry_date)`,
    `CREATE TABLE IF NOT EXISTS entry_links (
      entry_id TEXT NOT NULL,
      dump_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (entry_id, dump_id)
    )`,
    `CREATE INDEX IF NOT EXISTS entry_links_dump_idx ON entry_links (dump_id)`,
    `CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      due_at INTEGER,
      source_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS items_user_idx ON items (user_id, kind)`
  ],
  // 3: topic words saved with each entry, so Insights doesn't re-read every entry's text
  [
    `ALTER TABLE dumps ADD COLUMN topics TEXT`
  ],
  // 4: personal touches from the welcome flow: names, look-and-feel (incl. each
  // feeling's color and shape), and whether the welcome has been finished.
  // Accounts that existed before count as already welcomed.
  [
    `ALTER TABLE users ADD COLUMN display_name TEXT`,
    `ALTER TABLE users ADD COLUMN journal_name TEXT`,
    `ALTER TABLE users ADD COLUMN prefs TEXT`,
    `ALTER TABLE users ADD COLUMN onboarded_at INTEGER`,
    `UPDATE users SET onboarded_at = created_at`
  ]
]

let ready: Promise<void> | undefined

async function migrate(db: Database) {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`)
  const { rows } = await db.sql`SELECT MAX(version) AS v FROM schema_version`
  const current = Number((rows?.[0] as { v: number | null } | undefined)?.v ?? 0)
  for (let i = current; i < MIGRATIONS.length; i++) {
    for (const statement of MIGRATIONS[i]!) {
      // D1's exec() treats each line as its own statement, so flatten to one line.
      await db.exec(statement.replace(/\s+/g, ' ').trim())
    }
    await db.sql`INSERT INTO schema_version (version) VALUES (${i + 1})`
  }
}

export async function useDb(): Promise<Database> {
  const db = useDatabase()
  if (!ready) {
    ready = migrate(db).catch((err) => {
      ready = undefined // try again on the next request
      throw err
    })
  }
  await ready
  return db
}

export type EntryKind = 'dump' | 'journal'

export interface UserRow {
  id: string
  email: string
  created_at: number
  display_name: string | null
  journal_name: string | null
  prefs: string | null
  onboarded_at: number | null
}

export interface ItemRow {
  id: string
  user_id: string
  kind: string
  text: string
  done: number
  due_at: number | null
  source_id: string | null
  created_at: number
  updated_at: number
}

export interface DumpRow {
  id: string
  user_id: string
  kind?: EntryKind
  title?: string | null
  excerpt?: string
  topics?: string | null
  entry_date: string
  body: string
  words: number
  summary: string
  affect: string
  created_at: number
  updated_at: number
}
