import { last, yoy, mom, chg, zscore } from "../../../lib/fred";
import * as MAPS from "../../../lib/map";

export const revalidate = 3300;

const M_MAP = MAPS.M_MAP || {};
const BOARD_MAP = MAPS.BOARD_MAP || {};
const ZMAP = MAPS.ZMAP || {};

const call = (spec) => {
  const sc = spec.sc ?? 1;
  if (spec.m === "yoy") return yoy(spec.id);
  if (spec.m === "mom") return mom(spec.id);
  if (spec.m === "chg") return chg(spec.id, sc);
  return last(spec.id, sc);
};

async function resolve(mapObj) {
  const keys = Object.keys(mapObj || {});
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
    return Response.json({ ok: false, reason: "FRED_API_KEY not set", m: {}, board: {}, z: {}, meta: { live: [], errors: [] } }, { status: 200 });
  }
  try {
    const zKeys = Object.keys(ZMAP);
    const [mRes, bRes, zRes] = await Promise.all([
      resolve(M_MAP),
      resolve(BOARD_MAP),
      Promise.allSettled(zKeys.map((k) => zscore(ZMAP[k].id, ZMAP[k].n))),
    ]);
    const z = {};
    zRes.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value && r.value.z != null) z[zKeys[i]] = { z: r.value.z, value: r.value.value };
    });
    return Response.json({
      ok: true, m: mRes.out, board: bRes.out, z,
      meta: { fetchedAt: new Date().toISOString(), live: [...Object.keys(mRes.out), ...Object.keys(bRes.out)], zlive: Object.keys(z), errors: [...mRes.errors, ...bRes.errors] },
    });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e), m: {}, board: {}, z: {}, meta: { live: [], errors: [] } }, { status: 200 });
  }
}
