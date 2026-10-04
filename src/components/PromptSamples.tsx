import { useState } from 'react'
import { SAMPLE_PROMPTS, type PromptId } from '../agent/planner'

interface PromptSamplesProps {
  onInsert: (text: string) => void
}

export function PromptSamples({ onInsert }: PromptSamplesProps) {
  const [copied, setCopied] = useState<PromptId | null>(null)

  async function copy(id: PromptId, element: HTMLElement | null) {
    try {
      await navigator.clipboard.writeText(SAMPLE_PROMPTS[id])
      setCopied(id)
      setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600)
    } catch {
      // Clipboard refused: select the text so the viewer can copy it by hand.
      if (element) window.getSelection()?.selectAllChildren(element)
    }
  }

  return (
    <aside className="samples" aria-labelledby="samples-title">
      <h2 id="samples-title">Prompt samples</h2>
      {(Object.keys(SAMPLE_PROMPTS) as PromptId[]).map((id) => (
        <figure key={id} className="sample">
          <figcaption className="sample__id">{id}</figcaption>
          <p className="sample__text" id={`sample-${id}`}>
            {SAMPLE_PROMPTS[id]}
          </p>
          <div className="sample__actions">
            <button
              type="button"
              className="btn btn--small"
              onClick={() => copy(id, document.getElementById(`sample-${id}`))}
            >
              {copied === id ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="btn btn--small btn--quiet" onClick={() => onInsert(SAMPLE_PROMPTS[id])}>
              Put in chat
            </button>
          </div>
        </figure>
      ))}
    </aside>
  )
}
