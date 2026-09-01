// app/api/rates/route.js
// US Treasury curve + spreads + real yields via FRED. Uses your existing FRED_API_KEY.
// Daily data -> cache 1h.

export const revalidate = 3600;

const KEY = process.env.FRED_API_KEY;
const BASE = "https://api.stlouisfed.org/fred/series/observations";

const TENORS = [
  ["1m","DGS1MO"],["3m","DGS3MO"],["6m","DGS6MO"],["1y","DGS1"],
  ["2y","DGS2"],["3y","DGS3"],["5y","DGS5"],["7y","DGS7"],
  ["10y","DGS10"],["20y","DGS20"],["30y","DGS30"],
];
const EXTRA = [
  ["DFII10"],["T5YIFR"],["T10YIE"],["T10Y2Y"],["T10Y3M"],
];

async function latest(series) {
  const url = `${BASE}?series_id=${series}&api_key=${KEY}&file_type=json&sort_order=desc&limit=8`;
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(`${series} ${r.status}`);
  const j = await r.json();
  const obs = (j.observations || []).find((o) => o.value !== "." && o.value != null);
  return obs ? parseFloat(obs.value) : null;
}

export async function GET() {
  if (!KEY) return Response.json({ ok:false, error:"FRED_API_KEY missing" }, { status:200 });
  try {
    const ids = [...TENORS.map(t=>t[1]), ...EXTRA.map(e=>e[0])];
    const res = await Promise.allSettled(ids.map(latest));
    const map = {};
    ids.forEach((id,i)=>{ map[id] = res[i].status==="fulfilled" ? res[i].value : null; });

    const curve = TENORS.map(([t,id])=>({ t, y: map[id] })).filter(x=>x.y!=null);
    const y2=map.DGS2, y5=map.DGS5, y10=map.DGS10, y30=map.DGS30, y3m=map.DGS3MO;

    const spreads = {
      s2s10: map.T10Y2Y!=null ? Math.round(map.T10Y2Y*100) : (y10!=null&&y2!=null?Math.round((y10-y2)*100):null),
      s3m10: map.T10Y3M!=null ? Math.round(map.T10Y3M*100) : (y10!=null&&y3m!=null?Math.round((y10-y3m)*100):null),
      s5s30: (y30!=null&&y5!=null)?Math.round((y30-y5)*100):null,
      fly2510: (y2!=null&&y5!=null&&y10!=null)?Math.round((2*y5-y2-y10)*100):null,
    };
    const real = { real10: map.DFII10, be5y5y: map.T5YIFR, be10y: map.T10YIE };

    return Response.json(
      { ok:true, asof:new Date().toISOString(), curve, tenors:map, spreads, real },
      { headers:{ "cache-control":"public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (e) {
    return Response.json({ ok:false, error:String(e.message||e) }, { status:200 });
  }
}
