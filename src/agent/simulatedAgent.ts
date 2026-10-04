import type { Epd } from '../data/epds'
import { matchPrompt, planFor } from './planner'
import type { AgentEvent } from './types'

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

const FALLBACK =
  'This demo runs the two sample prompts only. Copy P1 or P2 from Prompt samples, paste it here and send it.'

/**
 * Streams a response the way a real agent would: tool steps first,
 * then the view it wants shown, then the reply text word by word.
 * The answers are computed from the data, not stored.
 */
export async function* runSimulatedAgent(
  prompt: string,
  epds: Epd[],
  signal: AbortSignal,
  speed = 1,
): AsyncGenerator<AgentEvent> {
  const wait = (ms: number) => sleep(ms / speed, signal)
  const id = matchPrompt(prompt)
  await wait(350)

  const plan = id ? planFor(id, epds) : null
  if (plan) {
    for (const step of plan.steps) {
      yield { type: 'step_started', id: step.id, label: step.label }
      await wait(600)
      yield { type: 'step_completed', id: step.id, detail: step.detail }
    }
    if (plan.view) yield { type: 'view', view: plan.view }
  }

  const words = (plan?.reply ?? FALLBACK).split(/(?<= )/)
  for (const word of words) {
    await wait(28)
    yield { type: 'text_delta', text: word }
  }
  yield { type: 'done' }
}
