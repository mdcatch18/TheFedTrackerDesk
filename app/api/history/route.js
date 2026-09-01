// app/api/history/route.js
// ~26 recent points per series for real sparklines. FRED weekly-ish sampling. Cache 6h.
export const revalidate = 21600;

const KEY = process.env.FRED_API_KEY;
const BASE = "https://api.stlouisfed.org/fred/series/observations";

// key -> [series, scale]  (scale applied to each point)
const SERIES = {
  hy:   ["BAMLH0A0HYM2", 100],   // HY OAS -> bp
  wti:  ["DCOILWTICO",   1],
  vix:  ["VIXCLS",       1],
  dxy:  ["DTWEXBGS",     1],
  s2s10:["T10Y2Y",       100],   // -> bp
  gold: ["IAU",          1],     // gold ETF proxy (FRED carries some; may fail -> skipped)
};

async function series(id, scale) {
  // pull ~180 daily obs, then thin to ~26 evenly-spaced points
  const url = `${BASE}?series_id=${id}&api_key=${KEY}&file_type=json&sort_order=desc&limit=180`;
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(`${id} ${r.status}`);
  const j = await r.json();
  const vals = (j.observations || [])
    .map((o) => (o.value === "." ? null : parseFloat(o.value)))
    .filter((v) => v != null)
    .reverse(); // oldest -> newest
  if (!vals.length) return null;
  // thin to 26 points
  const N = 26;
  const step = Math.max(1, Math.floor(vals.length / N));
  const out = [];
  for (let i = 0; i < vals.length; i += step) out.push(+(vals[i] * scale).toFixed(3));
  const last26 = out.slice(-N);
  return last26;
}

export async function GET() {
  if (!KEY) return Response.json({ ok:false, error:"FRED_API_KEY missing", h:{} }, { status:200 });
  const keys = Object.keys(SERIES);
  const settled = await Promise.allSettled(keys.map((k) => series(SERIES[k][0], SERIES[k][1])));
  const h = {};
  keys.forEach((k, i) => {
    if (settled[i].status === "fulfilled" && settled[i].value) h[k] = settled[i].value;
  });
  return Response.json(
    { ok: Object.keys(h).length > 0, asof: new Date().toISOString(), h },
    { headers: { "cache-control": "public, s-maxage=21600, stale-while-revalidate=43200" } }
  );
}
