import type { AgentEvent, AgentView } from '../agent/types'

export type StepStatus = 'running' | 'done' | 'stopped'

export interface ChatStep {
  id: string
  label: string
  detail?: string
  status: StepStatus
}

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string
      role: 'assistant'
      steps: ChatStep[]
      text: string
      view?: AgentView
      status: 'streaming' | 'done' | 'stopped'
    }

export interface ChatState {
  messages: ChatMessage[]
  running: boolean
  /** The assistant message whose result is shown in place of the list, if any. */
  activeViewId: string | null
}

export type ChatAction =
  | { type: 'sent'; text: string; userId: string; assistantId: string }
  | { type: 'agent_event'; event: AgentEvent }
  | { type: 'stopped' }
  | { type: 'view_shown'; messageId: string }
  | { type: 'view_closed' }

export const initialChatState: ChatState = { messages: [], running: false, activeViewId: null }

type Assistant = Extract<ChatMessage, { role: 'assistant' }>

function updateLastAssistant(state: ChatState, update: (message: Assistant) => Assistant): ChatState {
  const index = state.messages.findLastIndex((m) => m.role === 'assistant')
  if (index === -1) return state
  const messages = [...state.messages]
  messages[index] = update(messages[index] as Assistant)
  return { ...state, messages }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'sent':
      return {
        ...state,
        running: true,
        messages: [
          // A new prompt interrupts a reply that is still streaming.
          ...state.messages.map((m) => (m.role === 'assistant' && m.status === 'streaming' ? { ...m, status: 'stopped' as const } : m)),
          { id: action.userId, role: 'user', text: action.text },
          { id: action.assistantId, role: 'assistant', steps: [], text: '', status: 'streaming' },
        ],
      }

    case 'agent_event': {
      const { event } = action
      switch (event.type) {
        case 'step_started':
          return updateLastAssistant(state, (m) => ({
            ...m,
            steps: [...m.steps, { id: event.id, label: event.label, status: 'running' }],
          }))
        case 'step_completed':
          return updateLastAssistant(state, (m) => ({
            ...m,
            steps: m.steps.map((s) => (s.id === event.id ? { ...s, status: 'done', detail: event.detail } : s)),
          }))
        case 'text_delta':
          return updateLastAssistant(state, (m) => ({ ...m, text: m.text + event.text }))
        case 'view': {
          const next = updateLastAssistant(state, (m) => ({ ...m, view: event.view }))
          const last = next.messages.findLast((m) => m.role === 'assistant')
          return { ...next, activeViewId: last?.id ?? null }
        }
        case 'done':
          return { ...updateLastAssistant(state, (m) => ({ ...m, status: 'done' })), running: false }
      }
      return state
    }

    case 'stopped':
      if (!state.running) return state
      return {
        ...updateLastAssistant(state, (m) => ({
          ...m,
          status: 'stopped',
          steps: m.steps.map((s) => (s.status === 'running' ? { ...s, status: 'stopped' } : s)),
        })),
        running: false,
      }

    case 'view_shown': {
      const message = state.messages.find((m) => m.id === action.messageId)
      return message?.role === 'assistant' && message.view ? { ...state, activeViewId: message.id } : state
    }

    case 'view_closed':
      return { ...state, activeViewId: null }
  }
}

export function activeView(state: ChatState): AgentView | null {
  const message = state.messages.find((m) => m.id === state.activeViewId)
  return message?.role === 'assistant' ? (message.view ?? null) : null
}
