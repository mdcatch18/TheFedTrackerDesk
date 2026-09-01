// app/api/news/route.js
// Live market news via Finnhub (free tier: /news?category=general). Cache 5 min.
export const revalidate = 300;

// words that flag a market-moving / shock headline -> sorted to top, tinted
const SHOCK = /\b(crash|plunge|plummet|surge|soar|spike|selloff|sell-off|rout|tumble|collapse|halt|halted|circuit breaker|recession|default|downgrade|bankrupt|war|strike|sanction|tariff|inflation|fed|fomc|rate cut|rate hike|jobs report|cpi|ppi|jobless|layoff|earnings miss|guidance cut|warning|probe|lawsuit|bailout|contagion|crisis|emergency)\b/i;

export async function GET() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ ok:false, error:"FINNHUB_API_KEY missing", items:[] }, { status:200 });
  try {
    const r = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`, { next: { revalidate } });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const raw = Array.isArray(j) ? j : [];

    const items = raw
      .filter((n) => n.headline && n.datetime)
      .map((n) => ({
        headline: n.headline,
        source: n.source || "",
        url: n.url || "",
        ts: n.datetime, // unix seconds
        shock: SHOCK.test(n.headline),
      }))
      // newest first, but shock headlines float up within recent window
      .sort((a, b) => (b.shock - a.shock) || (b.ts - a.ts))
      .slice(0, 30);

    return Response.json(
      { ok:true, asof:new Date().toISOString(), count:items.length, items },
      { headers:{ "cache-control":"public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (e) {
    return Response.json({ ok:false, error:String(e.message||e), items:[] }, { status:200 });
  }
}
