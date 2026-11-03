/** Helpers for email magic-link sign-in. */

export const TOKEN_TTL_MS = 20 * 60 * 1000 // links work for 20 minutes
export const MAX_LINKS_PER_HOUR = 5

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const email = input.trim().toLowerCase()
  if (email.length > 254) return null
  // Deliberately simple: one @, something on each side, a dot in the domain.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export function newToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** We only ever store a hash of the token, so a leaked database can't be used to sign in. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Validates a client-supplied local date (YYYY-MM-DD). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}
