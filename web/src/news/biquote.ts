/** biquote.io client: no key, open CORS, responses cached for 5 minutes. */
const BASE_URL = "https://biquote.io/api";
const CACHE_MS = 5 * 60 * 1000;

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  publisher: string | null;
  publishedDate: string;
  imageUrl: string | null;
  language: string | null;
  country: string | null;
}

export interface Mover {
  symbol: string;
  name: string;
  lastPrice: number;
  changePercent: number;
}

/** Live API sends `data`/`name`, docs say `items`/`description`: both accepted. */
interface MoversResponse {
  period: string;
  data?: RawMover[];
  items?: RawMover[];
}

interface RawMover {
  symbol: string;
  name?: string;
  description?: string;
  lastPrice: number;
  changePercent: number;
}

function toMovers(response: MoversResponse): Mover[] {
  return (response.data ?? response.items ?? []).map((raw) => ({
    symbol: raw.symbol,
    name: raw.name ?? raw.description ?? "",
    lastPrice: raw.lastPrice,
    changePercent: raw.changePercent,
  }));
}

export interface Fetched<T> {
  data: T;
  fetchedAt: number;
  /** True when the request failed and this is an older cached copy. */
  stale: boolean;
}

const cache = new Map<string, { data: unknown; fetchedAt: number }>();

async function getJson<T>(path: string): Promise<Fetched<T>> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.fetchedAt < CACHE_MS) {
    return { data: hit.data as T, fetchedAt: hit.fetchedAt, stale: false };
  }

  try {
    const response = await fetch(BASE_URL + path);
    if (response.status === 429) throw new Error("biquote.io is limiting requests. Try again in a minute.");
    if (!response.ok) throw new Error(`biquote.io answered with status ${response.status}.`);
    const data = (await response.json()) as T;
    const fetchedAt = Date.now();
    cache.set(path, { data, fetchedAt });
    return { data, fetchedAt, stale: false };
  } catch (error) {
    if (hit) return { data: hit.data as T, fetchedAt: hit.fetchedAt, stale: true };
    if (error instanceof TypeError) throw new Error("Could not reach biquote.io. Check your connection.");
    throw error;
  }
}

export function fetchMarketNews(symbol?: string, maxResults = 12): Promise<Fetched<NewsArticle[]>> {
  const params = new URLSearchParams({ language: "en", maxResults: String(maxResults) });
  if (symbol) params.set("symbol", symbol.toUpperCase());
  return getJson<NewsArticle[]>(`/news/market?${params}`);
}

export async function fetchGainers(): Promise<Fetched<Mover[]>> {
  const result = await getJson<MoversResponse>("/market/gainers");
  return { ...result, data: toMovers(result.data) };
}

export async function fetchLosers(): Promise<Fetched<Mover[]>> {
  const result = await getJson<MoversResponse>("/market/losers");
  return { ...result, data: toMovers(result.data) };
}
