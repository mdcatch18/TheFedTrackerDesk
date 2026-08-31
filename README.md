# The Desk 2.0 — live deployment

A macro / sector / positioning terminal. 13 engines. The analytical core runs on
**free public data**; feeds with no free source are seeded with representative
values and clearly badged **sample**.

---

## What's live vs. sample

**Live — FRED** (drives the model object `m`, so liquidity, the curve, credit
spreads, the regime classifier, sector + factor rotation, the Taylor rule and the
posture chip all update together):
net liquidity (WALCL − TGA − RRP), reserves, SOFR/EFFR, DGS3MO/2/5/10/30, 2s10s,
HY/IG/BBB OAS, WTI (DCOILWTICO), Core PCE/CPI, unemployment, payrolls, claims,
GDPNow, plus ~30 macro-board series. Live rows show a **cyan dot**; sample rows a
coloured signal dot.

**Live — no key:** openFDA recent drug approvals (`/api/fda`) and ClinicalTrials.gov
active Phase 3 trials (`/api/trials`), shown in the Sectors → Biotech (BBP) deep-dive.

**Sample (no free source — badged in-app):** SEP dot plot (PDF release), SOFR-futures
strip, prediction-market odds (CME/Kalshi are paid), dealer GEX, fund/factor flows,
short interest, foreign-index quotes, FX board, OSINT. **ISM** is proprietary and was
delisted from FRED — it stays seeded; swap in a regional-Fed proxy (Empire `GACDISA`,
Philly Fed) or a paid ISM feed if you want it live.

---

## Setup

1. **Free FRED key:** https://fred.stlouisfed.org/docs/api/api_key.html
2. Copy env: `cp .env.example .env` and paste your key into `FRED_API_KEY`.
   (`OPENFDA_API_KEY` optional — only raises rate limits; ClinicalTrials needs none.)
3. Install + run:
   ```bash
   npm install
   npm run dev        # http://localhost:3000
   ```
   Without a key the app still runs — it shows the seeded values and an
   `offline · sample` badge instead of `LIVE · FRED`.

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel            # link/create the project
vercel --prod     # production deploy
```
Then in the Vercel dashboard: **Project → Settings → Environment Variables**, add
`FRED_API_KEY` (and optionally `OPENFDA_API_KEY`) for Production, and redeploy.

### The v1 "Deployment Protection" gotcha
If the deployed URL prompts for a Vercel login / password, that's **Deployment
Protection**, not a code issue. Fix: **Project → Settings → Deployment Protection →**
set **Vercel Authentication** to *Disabled* (or *Only Preview Deployments*) so the
production URL is public. Standard Protection / password protection off as well.

---

## How it's wired

```
app/
  page.jsx            renders <TheDesk/>
  layout.jsx          html shell + globals
  api/
    data/route.js     batches all FRED series (M_MAP + BOARD_MAP), cached 1h
    trials/route.js   ClinicalTrials.gov v2, cached 6h
    fda/route.js      openFDA drugsfda, cached 6h
components/
  TheDesk.jsx         the terminal; fetches /api/* and merges live over seeds
lib/
  fred.js             FRED fetch helpers (last / yoy / mom / chg)
  map.js              field → FRED series ID mapping (edit here to add series)
```

Caching (`revalidate`) keeps you far under FRED's limits — one upstream fetch per
series per hour regardless of traffic. The FRED key is read server-side only and
never reaches the browser.

### Adding a series to the live set
Edit `lib/map.js`. Add to `M_MAP` (to override a model field) or `BOARD_MAP`
(label must match the macro-board row text exactly). Pick a method: `last`, `yoy`,
`mom`, `chg`, with an optional `sc` scale. Done — no other changes needed.

### Wiring a paid feed later (flows, GEX, odds, quotes)
Add a route under `app/api/…` that reads its key from `process.env`, return JSON,
and overlay it in the matching panel the same way `bio` is wired in `TheDesk.jsx`.

---

*Informational tooling — not investment advice. Biotech codenames in the sample
panels are fictional; the live FDA/trials panels show real records.*

---

## Going live, hour by hour — full runbook

### API keys (get these first)

| Key | Cost | Powers | Where |
|---|---|---|---|
| **FRED_API_KEY** | free, instant | the whole analytical core — net liquidity, curve, 2s10s, HY/IG/BBB OAS, WTI, Core PCE/CPI, jobs, GDPNow, ~30 macro-board rows | fredaccount.stlouisfed.org/apikeys |
| OPENFDA_API_KEY | free, optional | raises openFDA rate limit (drug approvals) | open.fda.gov/apis/authentication |
| *(none)* | — | ClinicalTrials.gov v2 — already wired, no key | — |

Only **FRED** is required. The rest of the desks stay on seeded values until you add the intraday feeds below.

### Deploy steps

1. **FRED key** — create account → generate key.
2. **Unzip** this repo. `cp .env.example .env`, paste `FRED_API_KEY`.
3. `npm install` → `npm run dev` → open localhost:3000. Header should read **LIVE · FRED** and macro tiles get cyan (live) dots.
4. **Push to GitHub** — `git init && git add -A && git commit -m "the desk" && git branch -M main && git remote add origin <your-repo> && git push -u origin main`.
5. **Vercel** — vercel.com → Add New Project → import the GitHub repo (Next.js auto-detected).
6. **Env vars** — in Vercel project settings add `FRED_API_KEY` (Production + Preview + Development). Optional `OPENFDA_API_KEY`.
7. **Deploy.** Grab the `*.vercel.app` URL.
8. **Deployment Protection** — Settings → Deployment Protection → set **Vercel Authentication → Disabled** (or *Only Preview*). This is the v1 blocker; without it the URL asks visitors to log in.

### Guaranteeing hourly refresh

Data caches for ~55 min, so it refreshes on the next visit after the hour. To force it even with zero traffic, pick ONE:

- **Vercel Cron** (already in `vercel.json`, path `/api/cron`, hourly) — runs hourly on **Vercel Pro** ($20/mo). On the free Hobby plan Vercel cron only fires once/day, so instead use →
- **GitHub Actions** (free) — add `.github/workflows/warm.yml`:
  ```yaml
  name: warm
  on:
    schedule: [{ cron: "0 * * * *" }]
  jobs:
    ping:
      runs-on: ubuntu-latest
      steps:
        - run: curl -sf https://YOUR-APP.vercel.app/api/cron
  ```
- **cron-job.org** (free) — point an hourly job at `https://YOUR-APP.vercel.app/api/cron`.

An open browser tab also self-polls `/api/data` every 30 min, so a left-open dashboard updates on its own.

### Making the market desks live *intraday* (optional add-ons)

FRED is daily/weekly/monthly at source. For desks that move minute-to-minute, add a quotes feed — each needs a route I can wire:

| Feed | Cost | Unlocks | Signup |
|---|---|---|---|
| **Finnhub** | free ~60/min | index/sector/thematic ETF quotes & momentum, VIX, FX spot, econ calendar | finnhub.io |
| **EIA** | free key | crude/gasoline inventories, nat-gas storage (Commodities) | eia.gov/opendata |
| **CoinGecko** | free | BTC/ETH, dominance (if you add a crypto desk) | coingecko.com/api |
| **Kalshi + Polymarket** | free | real prediction-market odds (Prediction desk) | kalshi.com / polymarket public API |

### Stays seeded even in production (no free feed)

SEP dot plot, Fed speaker leans/roster, dealer GEX/gamma, fund & factor flows, short interest, CDX/iTraxx, country PMIs, central-bank calendar, geopolitical/OSINT. These need paid vendors (Bloomberg / S&P / ICE / SpotGamma) or hand-maintenance — badge them clearly and update manually.

