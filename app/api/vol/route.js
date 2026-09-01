// app/api/vol/route.js
// Cross-asset spot volatility via FRED. Uses existing FRED_API_KEY.
// Each series independent — one failure won't kill the rest.
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
  const settled = await Promise.allSettled(SERIES.map(([, id]) => latest(id)));
  const rows = [];
  SERIES.forEach(([label], i) => {
    if (settled[i].status === "fulfilled" && settled[i].value != null) {
      rows.push({ label, v: settled[i].value });
    }
  });
  return Response.json(
    { ok: rows.length > 0, asof: new Date().toISOString(), rows },
    { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
