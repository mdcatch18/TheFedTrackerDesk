// app/api/credit/route.js
// Credit spreads via FRED (OAS, percentage points -> bp). Uses existing FRED_API_KEY.
export const revalidate = 3600;

const KEY = process.env.FRED_API_KEY;
const BASE = "https://api.stlouisfed.org/fred/series/observations";

// label -> [current series, historical series for percentile]
const SERIES = [
  ["IG",  "BAMLC0A0CM"],
  ["BBB", "BAMLC0A4CBBB"],
  ["HY",  "BAMLH0A0HYM2"],
  ["CCC", "BAMLH0A3HYC"],
  ["EM",  "BAMLEMCBPIOAS"],
];

async function hist(series, limit = 780) {
  const url = `${BASE}?series_id=${series}&api_key=${KEY}&file_type=json&sort_order=desc&limit=${limit}`;
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(`${series} ${r.status}`);
  const j = await r.json();
  return (j.observations || [])
    .map((o) => (o.value === "." ? null : parseFloat(o.value)))
    .filter((v) => v != null);
}

// percentile rank of the latest value within its own history (0-100)
function pct(vals) {
  if (!vals.length) return null;
  const latest = vals[0];
  const below = vals.filter((v) => v <= latest).length;
  return Math.round((below / vals.length) * 100);
}

export async function GET() {
  if (!KEY) return Response.json({ ok:false, error:"FRED_API_KEY missing" }, { status:200 });
  try {
    const rows = await Promise.all(
      SERIES.map(async ([label, sid]) => {
        const vals = await hist(sid);
        const bp = vals.length ? Math.round(vals[0] * 100) : null; // OAS is in %, *100 -> bp
        return { label, bp, pctile: pct(vals) };
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
