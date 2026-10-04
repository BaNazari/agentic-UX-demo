import { useCallback, useEffect, useReducer, useRef } from 'react'
import { runSimulatedAgent } from '../agent/simulatedAgent'
import type { Epd } from '../data/epds'
import { chatReducer, initialChatState } from './chat'

/** Sends prompts to the agent and feeds its event stream into the chat reducer. */
export function useAgentChat(epds: Epd[], speed = 1) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)
  const controller = useRef<AbortController | null>(null)

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim()
      if (!prompt) return
      controller.current?.abort()
      const current = new AbortController()
      controller.current = current
      dispatch({ type: 'sent', text: prompt, userId: crypto.randomUUID(), assistantId: crypto.randomUUID() })
      try {
        for await (const event of runSimulatedAgent(prompt, epds, current.signal, speed)) {
          dispatch({ type: 'agent_event', event })
        }
      } catch {
        // Aborted by Stop or by a newer prompt; the reducer has already marked it.
      }
    },
    [epds, speed],
  )

  const stop = useCallback(() => {
    controller.current?.abort()
    dispatch({ type: 'stopped' })
  }, [])

  useEffect(() => () => controller.current?.abort(), [])

  return { state, dispatch, send, stop }
}
