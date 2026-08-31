// app/api/kalshi/route.js
// Live Kalshi macro prediction odds — public read API, NO auth / signing needed.
// Batches a curated set of economic series, handles two market shapes:
//   - "ladder": rate-level strikes (Above X%) -> differenced into 25bp band probabilities
//   - "list":   plain binary contracts -> top contracts by probability, yes-price = implied prob
// Cached 5 min. Returns { asof, groups:[{key,label,items:[...]}] }.

export const revalidate = 300; // 5 minutes

const API = "https://api.elections.kalshi.com/trade-api/v2";

// group: fed | inflation | growth  |  kind: ladder | list
const CONFIG = [
  // --- Fed path ---
  { ticker: "KXFED",          group: "fed",       label: "Fed funds — next meeting",     kind: "ladder" },
  { ticker: "KXRATECUTCOUNT", group: "fed",       label: "Rate cuts this year",          kind: "list", top: 4 },
  { ticker: "KXRATEHIKE",     group: "fed",       label: "Rate hikes this year",         kind: "list", top: 3 },
  // --- Inflation ---
  { ticker: "KXCPIYOY",       group: "inflation", label: "CPI YoY",                      kind: "list", top: 4 },
  { ticker: "KXCPICOREYOY",   group: "inflation", label: "Core CPI YoY",                 kind: "list", top: 4 },
  { ticker: "KXPCECORE",      group: "inflation", label: "Core PCE",                     kind: "list", top: 4 },
  // --- Growth & recession ---
  { ticker: "KXNBERRECESSQ",  group: "growth",    label: "Next recession start",         kind: "list", top: 4 },
  { ticker: "KXGDP",          group: "growth",    label: "US GDP growth",                kind: "list", top: 4 },
  { ticker: "KXU3",           group: "growth",    label: "Unemployment rate",            kind: "list", top: 4 },
  { ticker: "KXSAHM",         group: "growth",    label: "Sahm Rule triggers",           kind: "list", top: 2 },
];

const GROUP_LABELS = { fed: "Fed Path", inflation: "Inflation", growth: "Growth & Recession" };

// Implied probability (0-100) from a market. Prefer mid when spread is tight & liquid,
// otherwise fall back to last traded price.
function impliedProb(m) {
  const bid = parseFloat(m.yes_bid_dollars);
  const ask = parseFloat(m.yes_ask_dollars);
  const last = parseFloat(m.last_price_dollars);
  let p;
  if (isFinite(bid) && isFinite(ask) && ask > 0 && ask - bid <= 0.15) p = (bid + ask) / 2;
  else if (isFinite(last) && last > 0) p = last;
  else if (isFinite(bid) && isFinite(ask)) p = (bid + ask) / 2;
  else p = 0;
  return Math.round(p * 100);
}

async function fetchSeries(ticker) {
  const url = `${API}/markets?series_ticker=${ticker}&status=open&limit=200`;
  const r = await fetch(url, { next: { revalidate }, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${ticker} ${r.status}`);
  const j = await r.json();
  return j.markets || [];
}

// Pick the event (meeting/print) with the nearest future expiration.
function nearestEvent(markets) {
  const now = Date.now();
  const byEvent = {};
  for (const m of markets) {
    const t = new Date(m.close_time).getTime();
    if (!isFinite(t)) continue;
    (byEvent[m.event_ticker] ||= []).push({ m, t });
  }
  let best = null;
  for (const [ev, arr] of Object.entries(byEvent)) {
    const minT = Math.min(...arr.map((x) => x.t));
    const future = minT > now - 6 * 3600e3; // small grace window
    if (!future) continue;
    if (!best || minT < best.minT) best = { ev, minT, markets: arr.map((x) => x.m) };
  }
  // fallback: if nothing "future", just take the soonest-closing event overall
  if (!best) {
    for (const [ev, arr] of Object.entries(byEvent)) {
      const minT = Math.min(...arr.map((x) => x.t));
      if (!best || minT < best.minT) best = { ev, minT, markets: arr.map((x) => x.m) };
    }
  }
  return best;
}

// Turn an "Above X%" cumulative ladder into 25bp band probabilities.
function ladderBuckets(markets) {
  const rungs = markets
    .filter((m) => isFinite(parseFloat(m.floor_strike)))
    .map((m) => ({ strike: parseFloat(m.floor_strike), pAbove: impliedProb(m) / 100 }))
    .sort((a, b) => a.strike - b.strike);
  if (rungs.length < 2) return null;

  const buckets = [];
  for (let i = 0; i < rungs.length - 1; i++) {
    const lo = rungs[i].strike;
    const hi = rungs[i + 1].strike;
    const p = Math.max(0, rungs[i].pAbove - rungs[i + 1].pAbove); // P(lo < rate <= hi)
    buckets.push({ range: `${lo.toFixed(2)}–${hi.toFixed(2)}%`, lo, hi, prob: Math.round(p * 100) });
  }
  // top open-ended band: > highest strike
  const topRung = rungs[rungs.length - 1];
  buckets.push({
    range: `> ${topRung.strike.toFixed(2)}%`,
    lo: topRung.strike,
    hi: null,
    prob: Math.round(topRung.pAbove * 100),
  });

  const modal = buckets.reduce((a, b) => (b.prob > a.prob ? b : a), buckets[0]);
  return { buckets, modal };
}

export async function GET() {
  const results = await Promise.allSettled(
    CONFIG.map(async (cfg) => {
      const markets = await fetchSeries(cfg.ticker);
      if (!markets.length) return { cfg, item: null };

      const ev = nearestEvent(markets);
      const evMarkets = ev ? ev.markets : markets;
      const meetingDate = ev ? new Date(ev.minT).toISOString().slice(0, 10) : null;

      if (cfg.kind === "ladder") {
        const b = ladderBuckets(evMarkets);
        if (!b) return { cfg, item: null };
        return {
          cfg,
          item: {
            ticker: cfg.ticker,
            label: cfg.label,
            kind: "ladder",
            meetingDate,
            modal: b.modal,
            buckets: b.buckets,
          },
        };
      }

      // list: top contracts by implied probability
      const contracts = evMarkets
        .map((m) => ({
          name: m.yes_sub_title || m.subtitle || m.title,
          prob: impliedProb(m),
          vol: parseFloat(m.volume_fp) || 0,
          vol24: parseFloat(m.volume_24h_fp) || 0,
        }))
        .sort((a, b) => b.prob - a.prob || b.vol24 - a.vol24 || b.vol - a.vol)
        .slice(0, cfg.top || 4);

      return {
        cfg,
        item: { ticker: cfg.ticker, label: cfg.label, kind: "list", meetingDate, contracts },
      };
    })
  );

  const groups = {};
  for (const key of Object.keys(GROUP_LABELS)) groups[key] = { key, label: GROUP_LABELS[key], items: [] };

  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value.item) continue;
    const { cfg, item } = r.value;
    groups[cfg.group].items.push(item);
  }

  return Response.json(
    { asof: new Date().toISOString(), groups: Object.values(groups) },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
