// ClinicalTrials.gov v2 — no key. Surfaces active late-phase readouts.
export const revalidate = 21600; // 6h

export async function GET() {
  const url =
    "https://clinicaltrials.gov/api/v2/studies?" +
    "query.term=AREA%5BPhase%5DPHASE3&filter.overallStatus=RECRUITING%2CACTIVE_NOT_RECRUITING" +
    "&sort=LastUpdatePostDate%3Adesc&pageSize=12" +
    "&fields=NCTId,BriefTitle,Phase,OverallStatus,PrimaryCompletionDate,Condition";
  try {
    const r = await fetch(url, { next: { revalidate: 21600 } });
    if (!r.ok) throw new Error("CT.gov " + r.status);
    const j = await r.json();
    const rows = (j.studies || []).map((s) => {
      const p = s.protocolSection || {};
      return {
        nct: p.identificationModule?.nctId,
        title: p.identificationModule?.briefTitle,
        phase: (p.designModule?.phases || []).join("/"),
        status: p.statusModule?.overallStatus,
        pcd: p.statusModule?.primaryCompletionDateStruct?.date,
        cond: (p.conditionsModule?.conditions || []).slice(0, 2).join(", "),
      };
    });
    return Response.json({ ok: true, rows, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e), rows: [] }, { status: 200 });
  }
}
