import { formatMetric, location, METRICS, type Epd, type MetricKey } from '../data/epds'

export interface CompareCardsProps {
  products: [Epd, Epd]
  /** Field emphasised in both cards; the lower value is marked. */
  highlight: MetricKey
}

const FIELDS: MetricKey[] = ['gwpTotal', 'gwpA1A3']

/** Two EPDs side by side with the same fields in the same order, so values line up. */
export function CompareCards({ products, highlight }: CompareCardsProps) {
  const lowest = Math.min(...products.map((p) => p[highlight]))
  const fields = [...FIELDS.filter((f) => f !== highlight), highlight]

  return (
    <div className="compare">
      {products.map((epd, index) => (
        <article key={epd.id} className="compare-card" aria-labelledby={`compare-${epd.id}`}>
          <p className="compare-card__rank">{index === 0 ? 'First' : 'Second'}</p>
          <h3 id={`compare-${epd.id}`}>{epd.name}</h3>
          <dl className="compare-card__fields">
            <div>
              <dt>Location</dt>
              <dd>{location(epd)}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>
                <span className="type-tag">{epd.type}</span>
              </dd>
            </div>
            {fields.map((key) => {
              const isHighlight = key === highlight
              return (
                <div key={key} className={isHighlight ? 'is-highlight' : undefined}>
                  <dt>
                    {METRICS[key].label} <span className="unit">{METRICS[key].unit}</span>
                  </dt>
                  <dd className="num">
                    {formatMetric(key, epd[key])}
                    {isHighlight && epd[key] === lowest && <span className="badge">Lowest</span>}
                  </dd>
                </div>
              )
            })}
          </dl>
        </article>
      ))}
    </div>
  )
}
