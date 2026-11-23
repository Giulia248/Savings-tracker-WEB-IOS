# Savings tracker

A personal finance app for tracking earnings and spending. It has a web client and an iOS client. Each client stores its data locally on the device.

Status: the web app works. The iOS app is planned.

## Idea

The app answers two questions: how much money comes in and goes out over time, and where most of the spending goes. It stays small on purpose. It has a name login, a few charts, a form to record transactions, and a news feed for market headlines.

Features:

- Login by name. The app opens the local profile with that name, or creates it. The login page also lists the profiles already on this device. There is no password, so the login identifies a profile and does not protect it.
- Main page that opens with a one-line summary of the current month, for example "You kept €420 in November". Below it are a chart of earnings against spending for the last six months, a chart of spending by category, and the recent transactions.
- Add transaction page to record income (for example salary) or an expense, with a category, amount, date and note.
- User page with profile picture, name, currency, light or dark appearance, JSON export and import, and an option to delete transactions or the whole profile.
- News page with three parts, all from the biquote.io API: market headlines (`GET /api/news/market`, with an optional symbol filter), top gainers (`GET /api/market/gainers`) and top losers (`GET /api/market/losers`).

Out of scope for now: cloud sync, bank connections and shared accounts.

## Architecture

```
etc/
├── web/    React + Vite, Recharts for graphs, IndexedDB storage
└── ios/    SwiftUI, Swift Charts, SwiftData storage
```

```
web (React)   ──> IndexedDB (in the browser)
              ──> https://biquote.io/api/news/market, /market/gainers, /market/losers

ios (SwiftUI) ──> SwiftData (on the device)
              ──> https://biquote.io/api/news/market, /market/gainers, /market/losers
```

The project has no backend. The web and iOS apps keep separate databases, and transactions never leave the device. The only network calls go to biquote.io for the News page. The API needs no key, so nothing secret ships in the clients. It allows browser requests from any origin. To move data from one client to the other, export a JSON file on one and import it on the other.

### News API

biquote.io is a free market data API that needs no signup. The News page uses three endpoints:

| Endpoint | Shown as |
| --- | --- |
| `GET https://biquote.io/api/news/market?symbol=AAPL&language=en&maxResults=12` | Headlines list |
| `GET https://biquote.io/api/market/gainers` | Top gainers table |
| `GET https://biquote.io/api/market/losers` | Top losers table |

The news endpoint returns an array of `{ title, description, url, publisher, publishedDate, imageUrl, category, language, country }`. The `symbol` parameter is optional. Google News descriptions often repeat the title, so the app hides a description that starts with the title.

The gainers and losers endpoints return `{ period, exchange, type, data, marketState, asOf }`, where each item in `data` is `{ symbol, name, exchange, type, lastPrice, changePercent, volume, high, low }`. This differs from the biquote docs, which describe `items` with a `description` field. The clients accept both formats. The tables show symbol, name, last price and percent change, with green for gainers and red for losers.

Each client caches the three responses for 5 minutes and does not poll, as the biquote docs ask.

Limits to know: the service has no uptime guarantee, and its server code is not open source (only its SDKs are). When a request fails, the News page shows the last cached data with a note, or an error message when nothing is cached.

### JSON export format

Both clients read and write the same file:

```json
{
  "app": "savings-tracker",
  "version": 1,
  "exportedAt": "2026-11-23T10:00:00.000Z",
  "profile": { "displayName": "Giulia", "currency": "EUR" },
  "transactions": [
    { "type": "expense", "amountCents": 1250, "category": "Groceries", "date": "2026-11-23", "note": "" }
  ]
}
```

Amounts are whole cents, so the totals have no rounding errors.

### Theme

The palette is Olive Garden Feast, with one added red for errors and losses:

| Color | Light mode role | Dark mode role |
| --- | --- | --- |
| `#fefae0` cream | Background | Text |
| `#283618` forest | Text, navigation bar | Background |
| `#606c38` olive | Buttons, income | Highlight fills |
| `#dda15e` sand | Highlight fills, avatar | Buttons, spending |
| `#bc6c25` rust | Spending in charts | |
| `#8f4f15` dark rust | Spending in text | |
| `#9b2c2c` brick | Delete buttons, losers | |

Fonts: Bricolage Grotesque for headings and Hanken Grotesk for body text. Both are bundled with the app, so they work offline.

### web

React with Vite and TypeScript. Recharts draws the graphs. Dexie wraps IndexedDB. React Router handles the pages.

```
web/
├── src/
│   ├── pages/         Login, Dashboard, AddTransaction, Profile, News
│   ├── components/    Charts, transaction list, movers table, avatar, layout with navigation
│   ├── db/            IndexedDB schema and queries, per profile
│   ├── session/       Current profile and route protection
│   ├── news/          biquote.io client and cache
│   ├── lib/           Money and date formatting, monthly totals, categories, JSON backup, image resizing
│   ├── theme/         Light and dark preference, theme colors for the charts
│   ├── styles/        Theme variables, global styles, page styles
│   └── main.tsx
├── index.html
└── package.json
```

Each page matches one screen in the app: Login, then Dashboard as the main page, with Add transaction, News and Profile reachable from the navigation bar. On wide screens the navigation is a sidebar. On phones it is a bottom tab bar. Routes other than Login redirect to Login when no profile is selected. Every transaction carries its profile id, so profiles stay separate.

### ios

SwiftUI with Swift Charts. SwiftData stores the data on the device. The app has the same screens as the web client.

```
ios/
└── SavingsTracker/
    ├── App/           App entry point, root navigation, ModelContainer
    ├── Features/
    │   ├── Login/
    │   ├── Dashboard/
    │   ├── AddTransaction/
    │   ├── Profile/
    │   └── News/
    ├── Models/        SwiftData models: Profile, Transaction, Category
    ├── Networking/    biquote.io client built on URLSession with async/await
    └── Export/        JSON export and import
```

Each feature folder holds its view and its view model. The app works the same on the simulator and on a physical iPhone, because it needs no local server.

## Build order

1. `web`: login, dashboard, add transaction, profile, JSON export, news page. Done.
2. `ios`: the same screens, with SwiftData and the same JSON format.

## Running locally

### web

Requires Node.js 20.19 or 22.12 and later, as Vite 8 needs.

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173 and enter a name to create a profile.

To stop the server, press `Ctrl+C` in the terminal where it runs.

If the terminal was closed and the server still runs, find the process that holds the port:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Then stop it with the PID from the output:

```bash
kill <PID>
```

Other commands:

- `npm run build` checks the types and builds the app into `web/dist`.
- `npm run preview` serves the built app.
- `npm run typecheck` checks the types only.

### ios

Instructions will be added with the iOS app.
