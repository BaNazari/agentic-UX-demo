import { formatMetric, type Epd } from '../data/epds'
import { filterByType } from '../lib/filter'
import type { AgentView } from './types'

export const SAMPLE_PROMPTS = {
  P1: 'Compare GWP of first and second products sorted by lowest A1A2A3 and type steel',
  P2: 'Find the products in Mexico which have closest entries in GWP luluc',
} as const

export type PromptId = keyof typeof SAMPLE_PROMPTS

export interface PlanStep {
  id: string
  label: string
  detail: string
}

export interface Plan {
  steps: PlanStep[]
  view: AgentView | null
  reply: string
}

function normalise(text: string): string {
  return text
    .replace(/^\s*p[12]\s*:\s*/i, '') // allow pasting the "P1:" label too
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** The simulated agent only understands the two sample prompts. */
export function matchPrompt(text: string): PromptId | null {
  const input = normalise(text)
  for (const id of Object.keys(SAMPLE_PROMPTS) as PromptId[]) {
    if (normalise(SAMPLE_PROMPTS[id]) === input) return id
  }
  return null
}

const kg = (value: number, key: 'gwpA1A3' | 'gwpLuluc') => `${formatMetric(key, value)} kg CO₂e/t`

/** P1: the two steel EPDs with the lowest production-stage GWP. */
export function planCompareLowestA1A3(epds: Epd[], type = 'steel'): Plan {
  const matching = filterByType(epds, type)
  const sorted = [...matching].sort((a, b) => a.gwpA1A3 - b.gwpA1A3)
  const steps: PlanStep[] = [
    { id: 'filter', label: `Filter type = ${type}`, detail: `${matching.length} of ${epds.length} EPDs` },
    {
      id: 'sort',
      label: 'Sort by GWP A1–A3, lowest first',
      detail: sorted.map((e) => formatMetric('gwpA1A3', e.gwpA1A3)).join(' < '),
    },
  ]
  if (sorted.length < 2) {
    return { steps, view: null, reply: `I found ${sorted.length} ${type} EPD, so there is nothing to compare.` }
  }
  const [first, second] = sorted
  steps.push({ id: 'pick', label: 'Take the first two', detail: `${first.name}, ${second.name}` })
  const gap = second.gwpA1A3 - first.gwpA1A3
  return {
    steps,
    view: {
      kind: 'compare',
      title: `Lowest GWP A1–A3, ${type}`,
      summary: `First and second of ${matching.length} ${type} EPDs, sorted by GWP A1–A3.`,
      ids: [first.id, second.id],
      highlight: 'gwpA1A3',
    },
    reply:
      `${first.name} has the lowest production-stage GWP of the ${matching.length} ${type} EPDs: ${kg(first.gwpA1A3, 'gwpA1A3')} for A1–A3. ` +
      `${second.name} is second at ${kg(second.gwpA1A3, 'gwpA1A3')}, ${formatMetric('gwpA1A3', gap)} higher. ` +
      `I put them side by side with A1–A3 highlighted.`,
  }
}

/** P2: within one country, the pair of EPDs whose GWP-luluc values are closest. */
export function planClosestLuluc(epds: Epd[], country = 'Mexico'): Plan {
  const inCountry = epds.filter((e) => e.country.toLowerCase() === country.toLowerCase())
  const pairs = (inCountry.length * (inCountry.length - 1)) / 2
  const steps: PlanStep[] = [
    { id: 'filter', label: `Filter location = ${country}`, detail: `${inCountry.length} EPDs` },
    { id: 'pairs', label: 'Compare GWP-luluc of every pair', detail: `${pairs} pairs` },
  ]
  let best: { a: Epd; b: Epd; diff: number } | null = null
  for (let i = 0; i < inCountry.length; i++) {
    for (let j = i + 1; j < inCountry.length; j++) {
      const diff = Math.abs(inCountry[i].gwpLuluc - inCountry[j].gwpLuluc)
      if (!best || diff < best.diff) best = { a: inCountry[i], b: inCountry[j], diff }
    }
  }
  if (!best) {
    return { steps, view: null, reply: `I need at least two EPDs in ${country} to compare, and found ${inCountry.length}.` }
  }
  const [low, high] = best.a.gwpLuluc <= best.b.gwpLuluc ? [best.a, best.b] : [best.b, best.a]
  const diff = formatMetric('gwpLuluc', best.diff)
  steps.push({ id: 'closest', label: 'Pick the closest pair', detail: `Difference ${diff}` })
  return {
    steps,
    view: {
      kind: 'rows',
      title: `Closest GWP-luluc in ${country}`,
      summary: `Closest pair of ${inCountry.length} EPDs in ${country}, ${diff} kg CO₂e/t apart.`,
      ids: [low.id, high.id],
      metric: 'gwpLuluc',
    },
    reply:
      `Of the ${inCountry.length} EPDs in ${country}, ${low.name} (${kg(low.gwpLuluc, 'gwpLuluc')}) and ` +
      `${high.name} (${kg(high.gwpLuluc, 'gwpLuluc')}) have the closest GWP-luluc, ${diff} apart. ` +
      `The rows now show GWP-luluc instead of GWP total.`,
  }
}

export function planFor(prompt: PromptId, epds: Epd[]): Plan {
  return prompt === 'P1' ? planCompareLowestA1A3(epds) : planClosestLuluc(epds)
}
