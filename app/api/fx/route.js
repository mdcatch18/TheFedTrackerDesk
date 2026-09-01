// app/api/fx/route.js
// FX spot via FRED H.10 (daily). Uses existing FRED_API_KEY.
export const revalidate = 3600;

const KEY = process.env.FRED_API_KEY;
const BASE = "https://api.stlouisfed.org/fred/series/observations";

// label -> [FRED series, invert?]  (invert when FRED quotes it backwards from market convention)
const PAIRS = [
  ["EUR/USD", "DEXUSEU", false],
  ["USD/JPY", "DEXJPUS", false],
  ["GBP/USD", "DEXUSUK", false],
  ["USD/CHF", "DEXSZUS", false],
  ["USD/CAD", "DEXCAUS", false],
  ["AUD/USD", "DEXUSAL", false],
  ["USD/CNY", "DEXCHUS", false],
  ["USD/MXN", "DEXMXUS", false],
  ["USD/BRL", "DEXBZUS", false],
  ["USD/INR", "DEXINUS", false],
];

// pull enough history to compute a YTD-ish % (1 year of daily obs)
async function series(id) {
  const url = `${BASE}?series_id=${id}&api_key=${KEY}&file_type=json&sort_order=desc&limit=260`;
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(`${id} ${r.status}`);
  const j = await r.json();
  return (j.observations || [])
    .map((o) => (o.value === "." ? null : parseFloat(o.value)))
    .filter((v) => v != null);
}

export async function GET() {
  if (!KEY) return Response.json({ ok:false, error:"FRED_API_KEY missing" }, { status:200 });
  try {
    const rows = await Promise.all(
      PAIRS.map(async ([label, id]) => {
        const v = await series(id);
        const spot = v.length ? v[0] : null;
        const yrAgo = v.length >= 250 ? v[249] : (v.length ? v[v.length - 1] : null);
        const chg = spot != null && yrAgo ? +(((spot / yrAgo) - 1) * 100).toFixed(1) : null;
        return { label, spot: spot != null ? +spot.toFixed(4) : null, chg };
      })
    );
    return Response.json(
      { ok:true, asof:new Date().toISOString(), rows },
      { headers:{ "cache-control":"public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (e) {
    return Response.json({ ok:false, error:String(e.message||e) }, { status:200 });
  }
}
