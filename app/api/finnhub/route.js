// Finnhub live quotes (free tier: US ETFs/stocks). Key stays server-side.
export const revalidate = 300; // 5 min cache — well under 60 calls/min free limit
const SYMS = [
  // cross-asset tape
  "SPY","QQQ","IWM","DIA","VIXY","TLT","HYG","LQD","GLD","SLV","USO","DBC","UUP","BITO","ETHA","EFA",
  // GICS sectors
  "XLK","XLF","XLV","XLY","XLP","XLE","XLI","XLB","XLU","XLRE","XLC",
  // thematics
  "SMH","AIQ","CIBR","IGV","BLOK","URA","TAN","GRID","GDX","XOP","COPX","ITA","IBIT","KRE","VNQ","MCHI","KWEB","VGK","EMXC","MTUM","USMV",
  // foreign markets (Global Risk desk)
  "EWJ","FXI","EWG","EWU","EWQ","EWC","EWA","EWZ","EWY","INDA","EWH","EWT",
  // metals proxies (Commodities desk, later)
  "CPER","PPLT",
];
export async function GET() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return Response.json({ ok: false, reason: "FINNHUB_API_KEY not set", quotes: {} }, { status: 200 });
  }
  const out = {};
  await Promise.allSettled(
    SYMS.map(async (s) => {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`, { next: { revalidate: 300 } });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      if (j && typeof j.c === "number" && j.c > 0) out[s] = { c: j.c, dp: j.dp ?? 0, d: j.d ?? 0 };
    })
  );
  return Response.json({
    ok: true,
    quotes: out,
    count: Object.keys(out).length,
    fetchedAt: new Date().toISOString(),
  });
}
