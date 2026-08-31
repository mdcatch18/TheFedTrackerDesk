export const revalidate = 3600;

const SERIES = {
  wti:          "PET.RWTC.D",
  brent:        "PET.RBRTE.D",
  henryhub:     "NG.RNGWHHD.D",
  crude:        "PET.WCESTUS1.W",
  cushing:      "PET.W_EPC0_SAX_YCUOK_MBBL.W",
  gasoline:     "PET.WGTSTUS1.W",
  distillate:   "PET.WDISTUS1.W",
  spr:          "PET.WCSSTUS1.W",
  refutil:      "PET.WPULEUS3.W",
  production:   "PET.WCRFPUS2.W",
  natgasstorage:"NG.NW2_EPG0_SWO_R48_BCF.W",
};

export async function GET() {
  const key = process.env.EIA_API_KEY;
  if (!key) {
    return Response.json({ ok: false, reason: "EIA_API_KEY not set", series: {} }, { status: 200 });
  }
  const out = {};
  await Promise.allSettled(
    Object.entries(SERIES).map(async ([k, id]) => {
      const url = `https://api.eia.gov/v2/seriesid/${id}?api_key=${key}&length=10`;
      const r = await fetch(url, { next: { revalidate: 3600 } });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      let d = (j && j.response && j.response.data) || [];
      d = d.filter((x) => x && x.value != null && x.period)
           .sort((a, b) => String(b.period).localeCompare(String(a.period)));
      if (d.length) {
        const v = parseFloat(d[0].value);
        const p = d.length > 1 ? parseFloat(d[1].value) : null;
        out[k] = { value: v, prev: p, change: p != null ? +(v - p).toFixed(1) : null, period: d[0].period };
      }
    })
  );
  return Response.json({ ok: true, series: out, count: Object.keys(out).length, fetchedAt: new Date().toISOString() });
}
