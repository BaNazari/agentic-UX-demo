import { useEffect, useRef } from 'react'
import type { AgentView } from '../agent/types'
import { METRICS, type Epd } from '../data/epds'
import { CompareCards } from './CompareCards'
import { EpdTable } from './EpdTable'

interface AgentResultProps {
  view: AgentView
  epds: Epd[]
  onClose: () => void
}

/** Renders whichever layout the agent asked for, using the page's own components. */
export function AgentResult({ view, epds, onClose }: AgentResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const products = view.ids
    .map((id) => epds.find((e) => e.id === id))
    .filter((e): e is Epd => e !== undefined)

  // Bring the result into view when the agent produces it.
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    headingRef.current?.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }, [view])

  return (
    <section className="result" aria-labelledby="result-title">
      <header className="result__head">
        <div>
          <p className="eyebrow">Assistant result</p>
          <h2 id="result-title" ref={headingRef} tabIndex={-1}>
            {view.title}
          </h2>
          <p className="result__summary">{view.summary}</p>
        </div>
        <button type="button" className="btn" onClick={onClose}>
          Back to list
        </button>
      </header>

      {view.kind === 'compare' && products.length === 2 && (
        <CompareCards products={[products[0], products[1]]} highlight={view.highlight} />
      )}

      {view.kind === 'rows' && (
        <>
          <p className="result__note">
            Rows show <strong>{METRICS[view.metric].label}</strong> in place of GWP total.
          </p>
          <EpdTable epds={products} metric={view.metric} caption={view.title} />
        </>
      )}
    </section>
  )
}
