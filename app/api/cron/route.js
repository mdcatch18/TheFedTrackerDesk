// Cache-warmer. Ping this hourly (Vercel Cron, GitHub Actions, or cron-job.org)
// to guarantee fresh data even with zero traffic.
export const dynamic = "force-dynamic";
export async function GET(request) {
  const base = new URL(request.url).origin;
  const targets = ["/api/data", "/api/trials", "/api/fda"];
  const results = await Promise.allSettled(
    targets.map((t) => fetch(`${base}${t}`, { cache: "no-store" }).then((r) => r.ok))
  );
  return Response.json({
    ok: true,
    warmedAt: new Date().toISOString(),
    routes: targets.map((t, i) => ({ t, ok: results[i].status === "fulfilled" && results[i].value })),
  });
}
