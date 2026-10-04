/**
 * Ten fictional EPDs. Product names, plants and all numbers are invented.
 * Every value is per declared unit of 1 tonne, so values are comparable.
 */

export type MetricKey = 'gwpTotal' | 'gwpA1A3' | 'gwpLuluc'

export interface Epd {
  id: string
  name: string
  city: string
  country: string
  /** Lower case, used for exact-match filtering. */
  type: string
  /** GWP-total over all declared modules (A1–A3, C, D). */
  gwpTotal: number
  /** GWP-total for the production stage only (modules A1, A2 and A3). */
  gwpA1A3: number
  /** GWP from land use and land-use change. */
  gwpLuluc: number
}

export const METRICS: Record<MetricKey, { label: string; unit: string; digits: number }> = {
  gwpTotal: { label: 'GWP total', unit: 'kg CO₂e/t', digits: 0 },
  gwpA1A3: { label: 'GWP A1–A3', unit: 'kg CO₂e/t', digits: 0 },
  gwpLuluc: { label: 'GWP-luluc', unit: 'kg CO₂e/t', digits: 2 },
}

export function formatMetric(key: MetricKey, value: number): string {
  const { digits } = METRICS[key]
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function location(epd: Epd): string {
  return `${epd.city}, ${epd.country}`
}

export const EPDS: Epd[] = [
  { id: 'hr-240', name: 'Hot-rolled section HR-240', city: 'Monterrey', country: 'Mexico', type: 'steel', gwpTotal: 1610, gwpA1A3: 1520, gwpLuluc: 0.84 },
  { id: 'b500b', name: 'Reinforcing bar B500B', city: 'Duisburg', country: 'Germany', type: 'steel', gwpTotal: 735, gwpA1A3: 680, gwpLuluc: 0.41 },
  { id: 'gs-12', name: 'Galvanised sheet GS-12', city: 'Linz', country: 'Austria', type: 'steel', gwpTotal: 2230, gwpA1A3: 2140, gwpLuluc: 1.12 },
  { id: 'st-60', name: 'Structural tube ST-60', city: 'Saltillo', country: 'Mexico', type: 'steel', gwpTotal: 1265, gwpA1A3: 1180, gwpLuluc: 0.62 },
  { id: 'cem-i', name: 'Portland cement CEM I 52,5 R', city: 'Puebla', country: 'Mexico', type: 'cement', gwpTotal: 902, gwpA1A3: 860, gwpLuluc: 0.59 },
  { id: 'cem-ii', name: 'Limestone cement CEM II/A-LL 42,5 R', city: 'Kassel', country: 'Germany', type: 'cement', gwpTotal: 676, gwpA1A3: 640, gwpLuluc: 0.37 },
  { id: 'c30', name: 'Ready-mix concrete C30/37', city: 'Lyon', country: 'France', type: 'concrete', gwpTotal: 131, gwpA1A3: 118, gwpLuluc: 0.09 },
  { id: 'clt', name: 'Cross-laminated timber panel', city: 'Graz', country: 'Austria', type: 'timber', gwpTotal: 85, gwpA1A3: -690, gwpLuluc: 3.4 },
  { id: 'mw-35', name: 'Mineral wool slab MW-35', city: 'Querétaro', country: 'Mexico', type: 'insulation', gwpTotal: 1290, gwpA1A3: 1210, gwpLuluc: 1.95 },
  { id: 'fg-6', name: 'Float glass 6 mm', city: 'Ghent', country: 'Belgium', type: 'glass', gwpTotal: 1245, gwpA1A3: 1190, gwpLuluc: 0.78 },
]

export const EPD_TYPES = [...new Set(EPDS.map((e) => e.type))].sort()
