// Server-side FRED helpers. Key stays in env — never shipped to the client.
const BASE = "https://api.stlouisfed.org/fred/series/observations";

async function obs(id, limit = 14) {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY missing");
  const url = `${BASE}?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  const r = await fetch(url, { next: { revalidate: 3300 } });
  if (!r.ok) throw new Error(`FRED ${id} ${r.status}`);
  const j = await r.json();
  return (j.observations || [])
    .map((o) => ({ date: o.date, v: o.value === "." ? null : parseFloat(o.value) }))
    .filter((o) => o.v != null);
}

export async function last(id, sc = 1) {
  const o = await obs(id, 2);
  return o.length ? +(o[0].v * sc).toFixed(4) : null;
}
export async function mom(id) {
  const o = await obs(id, 3);
  if (o.length < 2) return null;
  return +(((o[0].v / o[1].v) - 1) * 100).toFixed(2);
}
export async function chg(id, sc = 1) {
  const o = await obs(id, 3);
  if (o.length < 2) return null;
  return +((o[0].v - o[1].v) * sc).toFixed(2);
}
export async function yoy(id) {
  const o = await obs(id, 14);
  if (o.length < 13) return null;
  return +(((o[0].v / o[12].v) - 1) * 100).toFixed(2);
}
export async function zscore(id, n = 260) {
  const o = await obs(id, n);
  if (o.length < 30) return null;
  const vals = o.map((x) => x.v);
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
  if (!sd) return null;
  return { z: +(((vals[0] - mean) / sd)).toFixed(2), value: vals[0] };
}
export { obs };
