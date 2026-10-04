import { formatMetric, location, METRICS, type Epd, type MetricKey } from '../data/epds'

export interface EpdTableProps {
  epds: Epd[]
  caption: string
  /**
   * The numeric column. Rows show GWP total by default; an agent result
   * can swap in another metric without a separate table component.
   */
  metric?: MetricKey
}

export function EpdTable({ epds, caption, metric = 'gwpTotal' }: EpdTableProps) {
  const { label, unit } = METRICS[metric]
  const swapped = metric !== 'gwpTotal'

  return (
    <div className="table-wrap">
      <table className="epd-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Location</th>
            <th scope="col" className={`num ${swapped ? 'is-swapped' : ''}`}>
              {label} <span className="unit">{unit}</span>
            </th>
            <th scope="col">Type</th>
          </tr>
        </thead>
        <tbody>
          {epds.map((epd) => (
            <tr key={epd.id}>
              <th scope="row">{epd.name}</th>
              <td>{location(epd)}</td>
              <td className={`num ${swapped ? 'is-swapped' : ''}`}>{formatMetric(metric, epd[metric])}</td>
              <td>
                <span className="type-tag">{epd.type}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
