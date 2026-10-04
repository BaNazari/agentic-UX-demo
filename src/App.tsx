import { useEffect, useState } from 'react'
import { AgentResult } from './components/AgentResult'
import { ChatPanel } from './components/ChatPanel'
import { EpdTable } from './components/EpdTable'
import { PromptSamples } from './components/PromptSamples'
import { EPD_TYPES, EPDS } from './data/epds'
import { filterByType } from './lib/filter'
import { shareLinkFor, useTypeFilterUrl } from './lib/useTypeFilterUrl'
import { activeView } from './state/chat'
import { useAgentChat } from './state/useAgentChat'

export default function App({ agentSpeed = 1 }: { agentSpeed?: number }) {
  const { applied, apply } = useTypeFilterUrl()
  const [query, setQuery] = useState(applied)
  const [chatDraft, setChatDraft] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const chat = useAgentChat(EPDS, agentSpeed)

  // Back/forward changes the applied filter; keep the input in step.
  useEffect(() => setQuery(applied), [applied])

  const rows = filterByType(EPDS, applied)
  const view = activeView(chat.state)
  const shareLink = shareLinkFor(applied)

  function search() {
    apply(query)
    chat.dispatch({ type: 'view_closed' })
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    // Typing never filters. Emptying the field is the one exception: it restores the full list.
    if (!value.trim() && applied) apply('')
  }

  function sendChat() {
    void chat.send(chatDraft)
    setChatDraft('')
  }

  async function copyLink(target: HTMLElement | null) {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1600)
    } catch {
      if (target) window.getSelection()?.selectAllChildren(target)
    }
  }

  return (
    <div className="app">
      <header className="app__head">
        <div>
          <p className="eyebrow">Environmental Product Declarations</p>
          <h1>EPD Explorer</h1>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => window.location.reload()}
          title="Reload the page. The type filter is kept because it is in the URL."
        >
          <span aria-hidden="true">↻</span> Reload
        </button>
      </header>

      <section className="search" aria-labelledby="search-title">
        <h2 id="search-title" className="visually-hidden">
          Filter EPDs
        </h2>
        <p className="content">This demo does not deal with edge cases such as race conditions between agent request/response or user input, search debounce, or any other real edge case in agentic ui. This is just a start point for agentic UX design, before going for real architecture and solid contracts.</p>
        <ul className="search__notes">
          <li>You can filter by type, enter the complete value of type</li>
          <li>While filtered lists should be sharable, the url follows the search state</li>
        </ul>

        <form
          role="search"
          className="search__form"
          onSubmit={(event) => {
            event.preventDefault()
            search()
          }}
        >
          <label htmlFor="type-filter" className="visually-hidden">
            Type
          </label>
          <input
            id="type-filter"
            type="search"
            className="search__input"
            placeholder="Type, e.g. steel"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="btn btn--primary">
            Search
          </button>
        </form>

        <p className="share">
          <span className="share__label">Link to this list</span>
          <code className="share__url" id="share-url">
            {shareLink}
          </code>
          <button
            type="button"
            className="btn btn--small btn--quiet"
            onClick={() => copyLink(document.getElementById('share-url'))}
          >
            {linkCopied ? 'Copied' : 'Copy link'}
          </button>
        </p>
      </section>

      <main className="main">
        {view ? (
          <AgentResult view={view} epds={EPDS} onClose={() => chat.dispatch({ type: 'view_closed' })} />
        ) : (
          <section aria-labelledby="list-title" className="list">
            <header className="list__head">
              <h2 id="list-title">{applied ? `Type: ${applied}` : 'All EPDs'}</h2>
              <p className="list__count" aria-live="polite">
                {rows.length} of {EPDS.length}
              </p>
            </header>
            {rows.length > 0 ? (
              <EpdTable epds={rows} caption={applied ? `EPDs of type ${applied}` : 'All EPDs'} />
            ) : (
              <div className="list__empty">
                <p>
                  No EPDs have the type <strong>“{applied}”</strong>. The filter needs the complete type.
                </p>
                <p>Types in this list: {EPD_TYPES.join(', ')}.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <div className="assistant">
        <ChatPanel
          messages={chat.state.messages}
          running={chat.state.running}
          draft={chatDraft}
          activeViewId={chat.state.activeViewId}
          onDraftChange={setChatDraft}
          onSend={sendChat}
          onStop={chat.stop}
          onShowView={(messageId) => chat.dispatch({ type: 'view_shown', messageId })}
        />
        <PromptSamples
          onInsert={(text) => {
            setChatDraft(text)
            document.getElementById('chat-input')?.focus()
          }}
        />
      </div>

      <footer className="app__foot">Demo with a simulated assistant and fictional EPD data.</footer>
    </div>
  )
}
