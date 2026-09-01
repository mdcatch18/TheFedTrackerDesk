// app/api/symbol-news/route.js
// Live company/ETF news for a single symbol via Finnhub /company-news. Cache 10 min.
export const revalidate = 600;

export async function GET(request) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ ok:false, error:"FINNHUB_API_KEY missing", items:[] }, { status:200 });

  const { searchParams } = new URL(request.url);
  const sym = (searchParams.get("symbol") || "").toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 8);
  if (!sym) return Response.json({ ok:false, error:"no symbol", items:[] }, { status:200 });

  try {
    const today = new Date();
    const from = new Date(today.getTime() - 21 * 864e5); // last 3 weeks
    const f = (d) => d.toISOString().slice(0, 10);
    const url = `https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${f(from)}&to=${f(today)}&token=${key}`;
    const r = await fetch(url, { next: { revalidate } });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const raw = Array.isArray(j) ? j : [];

    const items = raw
      .filter((n) => n.headline && n.datetime)
      .map((n) => ({ headline: n.headline, source: n.source || "", url: n.url || "", ts: n.datetime }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 12);

    return Response.json(
      { ok:true, symbol:sym, count:items.length, items },
      { headers:{ "cache-control":"public, s-maxage=600, stale-while-revalidate=1200" } }
    );
  } catch (e) {
    return Response.json({ ok:false, error:String(e.message||e), items:[] }, { status:200 });
  }
}
