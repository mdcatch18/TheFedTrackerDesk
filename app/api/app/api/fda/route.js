// openFDA drugsfda — recent approvals. Key optional (raises rate limit).
export const revalidate = 21600;

export async function GET() {
  const key = process.env.OPENFDA_API_KEY ? `&api_key=${process.env.OPENFDA_API_KEY}` : "";
  const url =
    "https://api.fda.gov/drug/drugsfda.json?" +
    "search=submissions.submission_status:AP&sort=submissions.submission_status_date:desc&limit=12" +
    key;
  try {
    const r = await fetch(url, { next: { revalidate: 21600 } });
    if (!r.ok) throw new Error("openFDA " + r.status);
    const j = await r.json();
    const rows = (j.results || []).map((x) => ({
      brand: x.products?.[0]?.brand_name || x.openfda?.brand_name?.[0] || "—",
      generic: x.products?.[0]?.active_ingredients?.[0]?.name || x.openfda?.generic_name?.[0] || "—",
      sponsor: x.sponsor_name,
      app: x.application_number,
    }));
    return Response.json({ ok: true, rows, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e), rows: [] }, { status: 200 });
  }
}
