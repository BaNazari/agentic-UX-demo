import { describe, expect, it } from 'vitest'
import { EPDS } from '../data/epds'
import { filterByType } from '../lib/filter'
import { matchPrompt, planClosestLuluc, planCompareLowestA1A3, SAMPLE_PROMPTS } from './planner'

describe('filterByType', () => {
  it('matches the complete type only, ignoring case and spaces', () => {
    expect(filterByType(EPDS, ' Steel ')).toHaveLength(4)
    expect(filterByType(EPDS, 'ste')).toHaveLength(0)
  })

  it('returns everything for an empty query', () => {
    expect(filterByType(EPDS, '  ')).toBe(EPDS)
  })
})

describe('matchPrompt', () => {
  it('recognises the samples, with or without their label and punctuation', () => {
    expect(matchPrompt(SAMPLE_PROMPTS.P1)).toBe('P1')
    expect(matchPrompt(`P2: ${SAMPLE_PROMPTS.P2.toUpperCase()}?`)).toBe('P2')
    expect(matchPrompt('compare all cement')).toBeNull()
  })
})

describe('P1: lowest A1–A3 among steel', () => {
  it('sorts steel EPDs by A1–A3 and takes the first two', () => {
    const plan = planCompareLowestA1A3(EPDS)
    expect(plan.view).toMatchObject({ kind: 'compare', ids: ['b500b', 'st-60'], highlight: 'gwpA1A3' })
    expect(plan.steps.map((s) => s.id)).toEqual(['filter', 'sort', 'pick'])
  })

  it('explains when there is nothing to compare', () => {
    const plan = planCompareLowestA1A3(EPDS, 'glass')
    expect(plan.view).toBeNull()
    expect(plan.reply).toMatch(/nothing to compare/)
  })
})

describe('P2: closest GWP-luluc in Mexico', () => {
  it('finds the pair with the smallest difference and swaps the row metric', () => {
    const plan = planClosestLuluc(EPDS)
    // Mexico: 0.84, 0.62, 0.59, 1.95 → closest is 0.59 and 0.62.
    expect(plan.view).toMatchObject({ kind: 'rows', ids: ['cem-i', 'st-60'], metric: 'gwpLuluc' })
    expect(plan.steps[1].detail).toBe('6 pairs')
    expect(plan.view?.summary).toContain('0.03')
  })
})
