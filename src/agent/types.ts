import type { MetricKey } from '../data/epds'

/**
 * What the agent asks the page to show. The agent never sends markup:
 * it picks one of the layouts the page knows how to render and fills it with data.
 */
export type AgentView =
  | {
      kind: 'compare'
      title: string
      summary: string
      ids: [string, string]
      /** The field to emphasise in both cards. */
      highlight: MetricKey
    }
  | {
      kind: 'rows'
      title: string
      summary: string
      ids: string[]
      /** Replaces the GWP total column of the normal row layout. */
      metric: MetricKey
    }

export type AgentEvent =
  | { type: 'step_started'; id: string; label: string }
  | { type: 'step_completed'; id: string; detail: string }
  | { type: 'text_delta'; text: string }
  | { type: 'view'; view: AgentView }
  | { type: 'done' }
