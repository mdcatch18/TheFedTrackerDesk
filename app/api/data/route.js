import { last, yoy, mom, chg } from "../../../lib/fred";
import { M_MAP, BOARD_MAP } from "../../../lib/map";

export const revalidate = 3300; // ~55min so an hourly cron always finds it expired

const call = (spec) => {
  const sc = spec.sc ?? 1;
  if (spec.m === "yoy") return yoy(spec.id);
  if (spec.m === "mom") return mom(spec.id);
  if (spec.m === "chg") return chg(spec.id, sc);
  return last(spec.id, sc);
};

async function resolve(mapObj) {
  const keys = Object.keys(mapObj);
  const out = {}, errors = [];
  const results = await Promise.allSettled(keys.map((k) => call(mapObj[k])));
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value != null) out[keys[i]] = r.value;
    else errors.push(keys[i]);
  });
  return { out, errors };
}

export async function GET() {
  if (!process.env.FRED_API_KEY) {
    return Response.json(
      { ok: false, reason: "FRED_API_KEY not set", m: {}, board: {}, meta: { live: [], errors: [] } },
      { status: 200 }
    );
  }
  try {
    const [mRes, bRes] = await Promise.all([resolve(M_MAP), resolve(BOARD_MAP)]);
    return Response.json({
      ok: true,
      m: mRes.out,
      board: bRes.out,
      meta: {
        fetchedAt: new Date().toISOString(),
        live: [...Object.keys(mRes.out), ...Object.keys(bRes.out)],
        errors: [...mRes.errors, ...bRes.errors],
      },
    });
  } catch (e) {
    return Response.json(
      { ok: false, reason: String(e), m: {}, board: {}, meta: { live: [], errors: [] } },
      { status: 200 }
    );
  }
}
