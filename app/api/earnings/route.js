// app/api/earnings/route.js
// Upcoming earnings via Finnhub /calendar/earnings (free tier). Cache 6h.
export const revalidate = 21600;

export async function GET() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ ok:false, error:"FINNHUB_API_KEY missing", rows:[] }, { status:200 });
  try {
    const today = new Date();
    const to = new Date(today.getTime() + 21 * 864e5); // +21 days
    const f = (d) => d.toISOString().slice(0, 10);
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${f(today)}&to=${f(to)}&token=${key}`;
    const r = await fetch(url, { next: { revalidate } });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const raw = (j && Array.isArray(j.earningsCalendar)) ? j.earningsCalendar : [];

    // keep entries with a symbol + date, sort by date, cap to 25
    const rows = raw
      .filter((e) => e.symbol && e.date)
      .map((e) => ({
        date: e.date,
        symbol: e.symbol,
        epsEst: e.epsEstimate ?? null,
        hour: e.hour || "",
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 25);

    return Response.json(
      { ok:true, asof:new Date().toISOString(), count:rows.length, rows },
      { headers:{ "cache-control":"public, s-maxage=21600, stale-while-revalidate=43200" } }
    );
  } catch (e) {
    return Response.json({ ok:false, error:String(e.message||e), rows:[] }, { status:200 });
  }
}
