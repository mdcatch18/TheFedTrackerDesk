// Server-side FRED helpers. Key stays in env — never shipped to the client.
const BASE = "https://api.stlouisfed.org/fred/series/observations";
async function obs(id, limit = 14) {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY missing");
  const url = `${BASE}?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  const r = await fetch(url, { next: { revalidate: 3300 } });
  if (!r.ok) throw new Error(`FRED ${id} ${r.status}`);
  const j = await r.json();
  // newest-first; drop "." (missing) values FRED returns as ".".
  return (j.observations || [])
    .map((o) => ({ date: o.date, v: o.value === "." ? null : parseFloat(o.value) }))
    .filter((o) => o.v != null);
}
// last value
export async function last(id, sc = 1) {
  const o = await obs(id, 2);
  return o.length ? +(o[0].v * sc).toFixed(4) : null;
}
// month/period-over-period % change of the level
export async function mom(id) {
  const o = await obs(id, 3);
  if (o.length < 2) return null;
  return +(((o[0].v / o[1].v) - 1) * 100).toFixed(2);
}
// level change (e.g. payrolls diff, thousands)
export async function chg(id, sc = 1) {
  const o = await obs(id, 3);
  if (o.length < 2) return null;
  return +((o[0].v - o[1].v) * sc).toFixed(2);
}
// year-over-year % (needs ~13 monthly obs)
export async function yoy(id) {
  const o = await obs(id, 14);
  if (o.length < 13) return null;
  return +(((o[0].v / o[12].v) - 1) * 100).toFixed(2);
}
// z-score: how many std-devs the latest value sits from its own recent history.
// Returns { z, value } so the Anomaly Monitor can show both.
export async function zscore(id, sc = 1, lookback = 260) {
  const o = await obs(id, lookback);
  if (o.length < 20) return null;
  const vals = o.map((x) => x.v * sc);
  const latest = vals[0];
  const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
  const variance = vals.reduce((s, x) => s + (x - mean) ** 2, 0) / vals.length;
  const sd = Math.sqrt(variance);
  const z = sd > 0 ? (latest - mean) / sd : 0;
  return { z: +z.toFixed(2), value: +latest.toFixed(4) };
}
export { obs };
