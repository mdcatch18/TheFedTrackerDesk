// app/api/recession/route.js
// Recession signals via FRED. Uses existing FRED_API_KEY.
export const revalidate = 21600; // 6h — these update monthly

const KEY = process.env.FRED_API_KEY;
const BASE = "https://api.stlouisfed.org/fred/series/observations";

// label -> [series, unit hint]  (NY Fed prob is already a %, Sahm is a level)
const SERIES = [
  ["NY Fed (curve, 12m)", "RECPROUSM156N"], // % probability
  ["Sahm Rule",           "SAHMREALTIME"],  // level, >0.50 trips
];

async function latest(id) {
  const url = `${BASE}?series_id=${id}&api_key=${KEY}&file_type=json&sort_order=desc&limit=8`;
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(`${id} ${r.status}`);
  const j = await r.json();
  const obs = (j.observations || []).find((o) => o.value !== "." && o.value != null);
  return obs ? parseFloat(obs.value) : null;
}

export async function GET() {
  if (!KEY) return Response.json({ ok:false, error:"FRED_API_KEY missing", rows:[] }, { status:200 });
  const settled = await Promise.allSettled(SERIES.map(([, id]) => latest(id)));
  const rows = [];
  SERIES.forEach(([label], i) => {
    if (settled[i].status === "fulfilled" && settled[i].value != null) {
      rows.push({ label, v: settled[i].value });
    }
  });
  return Response.json(
    { ok: rows.length > 0, asof: new Date().toISOString(), rows },
    { headers: { "cache-control": "public, s-maxage=21600, stale-while-revalidate=43200" } }
  );
}
