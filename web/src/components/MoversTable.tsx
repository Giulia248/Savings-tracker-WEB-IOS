import type { Mover } from "../news/biquote";
import { formatPercent, formatPrice } from "../lib/format";

export function MoversTable({ movers, limit = 8 }: { movers: Mover[]; limit?: number }) {
  return (
    <table className="movers">
      <thead>
        <tr>
          <th scope="col">Symbol</th>
          <th scope="col" className="movers__number">
            Price
          </th>
          <th scope="col" className="movers__number">
            Change
          </th>
        </tr>
      </thead>
      <tbody>
        {movers.slice(0, limit).map((mover) => (
          <tr key={mover.symbol}>
            <th scope="row">
              <span className="movers__symbol">{mover.symbol}</span>
              <span className="movers__name muted">{mover.name}</span>
            </th>
            <td className="movers__number">{formatPrice(mover.lastPrice)}</td>
            <td className={`movers__number ${mover.changePercent >= 0 ? "income" : "danger-text"}`}>
              {formatPercent(mover.changePercent)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
