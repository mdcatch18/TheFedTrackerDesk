// app/api/ism/route.js
// ISM Manufacturing PMI via DBnomics (free, no auth). Monthly data -> cache 6h.
// Guards against DBnomics tail-glitch values (valid PMI is ~30–80).

export const revalidate = 21600; // 6 hours

const URL = "https://api.db.nomics.world/v22/series/ISM/pmi?observations=1";

export async function GET() {
  try {
    const r = await fetch(URL, { next: { revalidate }, headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`dbnomics ${r.status}`);
    const j = await r.json();
    const doc = j?.series?.docs?.[0];
    if (!doc) throw new Error("no series doc");

    const periods = doc.period || [];
    const values = doc.value || [];

    // Pair up, drop nulls and impossible PMI values (glitch guard: valid 30–80)
    const clean = [];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (typeof v === "number" && isFinite(v) && v >= 30 && v <= 80) {
        clean.push({ period: periods[i], value: v });
      }
    }
    if (!clean.length) throw new Error("no valid ISM values");

    const latest = clean[clean.length - 1];
    // last 26 clean points for a sparkline
    const history = clean.slice(-26).map((d) => d.value);

    return Response.json(
      { ok: true, ism: latest.value, period: latest.period, history },
      { headers: { "cache-control": "public, s-maxage=21600, stale-while-revalidate=43200" } }
    );
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 200 });
  }
}
