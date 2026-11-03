/**
 * POST /api/analyze  { body }
 * Analyzes text without saving it, so people can try Brain Dump before
 * making an account. Nothing is stored.
 */
import { analyzeText, summarize } from '#shared/utils/affect'

export default defineEventHandler(async (event) => {
  const input = await readBody<{ body?: unknown }>(event)
  const text = readDumpText(input?.body)
  const affect = analyzeText(text)
  return { affect, summary: summarize(affect), words: affect.words }
})
