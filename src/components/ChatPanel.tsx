import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { ChatMessage } from '../state/chat'

interface ChatPanelProps {
  messages: ChatMessage[]
  running: boolean
  draft: string
  activeViewId: string | null
  onDraftChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  onShowView: (messageId: string) => void
}

const STEP_ICON = { running: '◌', done: '✓', stopped: '×' } as const

export function ChatPanel({
  messages,
  running,
  draft,
  activeViewId,
  onDraftChange,
  onSend,
  onStop,
  onShowView,
}: ChatPanelProps) {
  const logRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages])

  function handleKeys(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      if (!running) onSend()
    }
  }

  return (
    <section className="chat" aria-labelledby="chat-title">
      <h2 id="chat-title">Assistant</h2>

      <ol ref={logRef} className="chat__log" aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 && (
          <li className="chat__empty">Ask about the EPDs above. Paste a sample prompt to start.</li>
        )}
        {messages.map((message) =>
          message.role === 'user' ? (
            <li key={message.id} className="msg msg--user">
              <span className="visually-hidden">You: </span>
              {message.text}
            </li>
          ) : (
            <li key={message.id} className="msg msg--assistant">
              <span className="visually-hidden">Assistant: </span>
              {message.steps.length > 0 && (
                <ul className="steps">
                  {message.steps.map((step) => (
                    <li key={step.id} className={`steps__item steps__item--${step.status}`}>
                      <span className="steps__icon" aria-hidden="true">
                        {STEP_ICON[step.status]}
                      </span>
                      <span>
                        {step.label}
                        {step.detail && <span className="steps__detail"> · {step.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {message.text && <p className="msg__text">{message.text}</p>}
              {message.status === 'streaming' && !message.text && message.steps.length === 0 && (
                <p className="msg__thinking">Thinking…</p>
              )}
              {message.status === 'stopped' && <p className="msg__stopped">Stopped</p>}
              {message.view && message.status !== 'streaming' && (
                <button
                  type="button"
                  className="btn btn--link"
                  onClick={() => onShowView(message.id)}
                  disabled={activeViewId === message.id}
                >
                  {activeViewId === message.id ? 'Shown above' : 'Show result'}
                </button>
              )}
            </li>
          ),
        )}
      </ol>

      <form
        className="chat__form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!running) onSend()
        }}
      >
        <label htmlFor="chat-input" className="visually-hidden">
          Message the assistant
        </label>
        <textarea
          id="chat-input"
          className="chat__input"
          rows={2}
          placeholder="Ask about these EPDs"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeys}
        />
        {running ? (
          <button type="button" className="btn" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button type="submit" className="btn btn--primary" disabled={!draft.trim()}>
            Send
          </button>
        )}
      </form>
    </section>
  )
}
