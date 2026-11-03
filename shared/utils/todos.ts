/**
 * Pull likely to-dos out of a brain dump: bullet/numbered list lines, and
 * phrases like "need to call the bank". Used to offer one-tap "add to my list".
 */
const LIST_LINE = /^\s*(?:[-*•]|\d+[.)]|\[ ?\])\s+(.+)$/
const PHRASE = /\b(?:need to|have to|got to|gotta|must|remember to|don't forget to|dont forget to|should)\s+([^.!?\n]{3,160})/gi

function tidy(s: string): string {
  let t = s.trim().replace(/\s+/g, ' ').replace(/[,;:]+$/, '')
  // stop at a clause that changes the subject
  t = t.split(/\b(?:but|because|although|though|and then|and there's|and there is)\b/i)[0]!.trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function extractTodos(body: string, max = 8): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (s: string) => {
    const t = tidy(s)
    const key = t.toLowerCase()
    if (t.length < 3 || t.length > 90 || seen.has(key)) return
    seen.add(key)
    out.push(t)
  }
  for (const line of body.split('\n')) {
    const m = line.match(LIST_LINE)
    if (m) add(m[1]!)
  }
  for (const m of body.matchAll(PHRASE)) {
    // split "pay the bill, email the landlord and buy a gift" into separate items
    for (const part of m[1]!.split(/,\s*|\s+and\s+(?=[a-z]+\s)/i)) add(part)
  }
  return out.slice(0, max)
}
