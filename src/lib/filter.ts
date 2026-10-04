import type { Epd } from '../data/epds'

export function normaliseType(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Exact match on the whole type, ignoring case and surrounding spaces.
 * "steel" matches, "ste" does not. An empty query returns everything.
 */
export function filterByType(epds: Epd[], query: string): Epd[] {
  const type = normaliseType(query)
  if (!type) return epds
  return epds.filter((epd) => epd.type === type)
}
