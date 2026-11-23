import { useEffect, useState, type FormEvent } from "react";
import { MoversTable } from "../components/MoversTable";
import { fetchGainers, fetchLosers, fetchMarketNews, type Fetched, type Mover, type NewsArticle } from "../news/biquote";
import { formatDateTime } from "../lib/format";

type RemoteState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; result: Fetched<T> };

function useRemote<T>(load: () => Promise<Fetched<T>>, key: string): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    load()
      .then((result) => active && setState({ status: "ready", result }))
      .catch((error: Error) => active && setState({ status: "error", message: error.message }));
    return () => {
      active = false;
    };
    // Re-run on `key` only: `load` changes every render.
  }, [key]);

  return state;
}

function StaleNote({ result }: { result: Fetched<unknown> }) {
  if (!result.stale) return null;
  return (
    <p className="muted">
      biquote.io did not answer. Showing data from {formatDateTime(new Date(result.fetchedAt).toISOString())}.
    </p>
  );
}

export function NewsPage() {
  const [symbolInput, setSymbolInput] = useState("");
  const [symbol, setSymbol] = useState("");

  const news = useRemote<NewsArticle[]>(() => fetchMarketNews(symbol || undefined), `news:${symbol}`);
  const gainers = useRemote<Mover[]>(fetchGainers, "gainers");
  const losers = useRemote<Mover[]>(fetchLosers, "losers");

  function handleFilter(event: FormEvent) {
    event.preventDefault();
    setSymbol(symbolInput.trim().toUpperCase());
  }

  return (
    <div className="news">
      <h1>Market news</h1>

      <div className="news__layout">
        <section className="news__headlines" aria-labelledby="headlines-heading">
          <div className="news__headlines-top">
            <h2 id="headlines-heading">{symbol ? `Headlines for ${symbol}` : "Headlines"}</h2>
            <form className="news__filter" onSubmit={handleFilter} role="search">
              <label htmlFor="symbol" className="visually-hidden">
                Filter by symbol
              </label>
              <input
                id="symbol"
                className="input"
                placeholder="Symbol, for example AAPL"
                value={symbolInput}
                onChange={(event) => setSymbolInput(event.target.value)}
              />
              <button className="button button--quiet" type="submit">
                Filter
              </button>
            </form>
          </div>

          {news.status === "loading" && <p className="muted">Loading headlines…</p>}
          {news.status === "error" && <p className="danger-text">{news.message}</p>}
          {news.status === "ready" && (
            <>
              <StaleNote result={news.result} />
              {news.result.data.length === 0 ? (
                <p className="muted">No headlines found{symbol ? ` for ${symbol}` : ""}. Try another symbol.</p>
              ) : (
                <ul className="headlines">
                  {news.result.data.map((article) => (
                    <li key={article.url} className="headline">
                      <a href={article.url} target="_blank" rel="noreferrer" className="headline__title">
                        {article.title}
                      </a>
                      {/* Google News descriptions often just repeat the title. */}
                      {article.description && !article.description.startsWith(article.title) && (
                        <p className="headline__description">{article.description}</p>
                      )}
                      <p className="headline__meta muted">
                        {[article.publisher, formatDateTime(article.publishedDate)].filter(Boolean).join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <div className="news__movers">
          <MoversSection title="Top gainers" id="gainers" state={gainers} />
          <MoversSection title="Top losers" id="losers" state={losers} />
        </div>
      </div>

      <p className="news__credit muted">
        Data from{" "}
        <a href="https://biquote.io" target="_blank" rel="noreferrer">
          biquote.io
        </a>
        .
      </p>
    </div>
  );
}

function MoversSection({ title, id, state }: { title: string; id: string; state: RemoteState<Mover[]> }) {
  return (
    <section className="panel" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      {state.status === "loading" && <p className="muted">Loading…</p>}
      {state.status === "error" && <p className="danger-text">{state.message}</p>}
      {state.status === "ready" && (
        <>
          <StaleNote result={state.result} />
          {state.result.data.length === 0 ? (
            <p className="muted">No data right now. Markets may be closed.</p>
          ) : (
            <MoversTable movers={state.result.data} />
          )}
        </>
      )}
    </section>
  );
}
