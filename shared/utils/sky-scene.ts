/**
 * The logo's scene follows the reader's local time of day (see docs/brand.md).
 *
 *   morning  sunrise .. 11:00   sleepy sunrise
 *   noon     11:00 .. 17:00     sun-shower
 *   evening  17:00 .. 21:00     pink dusk
 *   night    21:00 .. sunrise   moonlit sleep
 */
export type SkyScene = 'morning' | 'noon' | 'evening' | 'night'

export const SKY_SCENES: { id: SkyScene; label: string; from: string }[] = [
  { id: 'morning', label: 'Sleepy sunrise', from: '6:00' },
  { id: 'noon', label: 'Sun-shower', from: '11:00' },
  { id: 'evening', label: 'Pink dusk', from: '17:00' },
  { id: 'night', label: 'Moonlit sleep', from: '21:00' }
]

export const isSkyScene = (v: unknown): v is SkyScene => SKY_SCENES.some((s) => s.id === v)

/** We don't know the reader's sunrise, so morning starts at a fixed 6:00 for now. */
export function skySceneFor(date = new Date(), sunriseHour = 6): SkyScene {
  const h = date.getHours() + date.getMinutes() / 60
  if (h >= sunriseHour && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'noon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}
