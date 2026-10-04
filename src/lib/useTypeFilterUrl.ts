import { useCallback, useEffect, useState } from 'react'

const PARAM = 'type'

function readFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get(PARAM) ?? ''
  } catch {
    return ''
  }
}

/** The link that reproduces a filter, independent of whether history updates are allowed. */
export function shareLinkFor(type: string): string {
  const query = type ? `?${PARAM}=${encodeURIComponent(type)}` : ''
  const { protocol, origin, pathname } = window.location
  const base = protocol.startsWith('http') ? `${origin}${pathname}` : ''
  return `${base}${query}` || '/'
}

/**
 * The applied type filter, kept in the URL (?type=steel) so a filtered list
 * can be shared and survives a reload. Back and forward restore earlier filters.
 *
 * Only committed searches touch the URL; typing in the input does not.
 */
export function useTypeFilterUrl() {
  const [applied, setApplied] = useState(readFromUrl)

  useEffect(() => {
    const onPopState = () => setApplied(readFromUrl())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const apply = useCallback((value: string) => {
    const type = value.trim()
    setApplied(type)
    try {
      const url = new URL(window.location.href)
      if (type) url.searchParams.set(PARAM, type)
      else url.searchParams.delete(PARAM)
      if (url.href !== window.location.href) window.history.pushState(null, '', url)
    } catch {
      // Some sandboxed frames refuse history changes. The filter still works in the page.
    }
  }, [])

  return { applied, apply }
}
