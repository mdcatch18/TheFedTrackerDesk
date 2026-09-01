// app/api/vol/route.js
// Cross-asset spot volatility via FRED. Uses existing FRED_API_KEY.
export const revalidate = 3600;

const KEY = process.env.FRED_API_KEY;
const BASE = "https://api.stlouisfed.org/fred/series/observations";

const SERIES = [
  ["VIX · equity",   "VIXCLS"],
  ["VXN · Nasdaq",   "VXNCLS"],
  ["VXD · Dow",      "VXDCLS"],
  ["OVX · oil",      "OVXCLS"],
  ["GVZ · gold",     "GVZCLS"],
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
  try {
    const rows = await Promise.all(
      SERIES.map(async ([label, id]) => ({ label, v: await latest(id) }))
    );
    return Response.json(
      { ok:true, asof:new Date().toISOString(), rows:rows.filter(r=>r.v!=null) },
      { headers:{ "cache-control":"public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (e) {
    return Response.json({ ok:false, error:String(e.message||e), rows:[] }, { status:200 });
  }
}
