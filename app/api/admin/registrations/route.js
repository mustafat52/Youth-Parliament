import { getSupabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return Response.json({ error: "Not signed in." }, { status: 401 });
  const sb = getSupabase();
  const [regs, pols] = await Promise.all([
    sb.from("registrations").select("*, politicians(name, party)").order("created_at", { ascending: false }),
    sb.from("politicians").select("id", { count: "exact", head: true }),
  ]);
  if (regs.error) return Response.json({ error: "Could not load registrations." }, { status: 500 });
  return Response.json({ registrations: regs.data, totalPoliticians: pols.count ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req) {
  if (!isAdmin()) return Response.json({ error: "Not signed in." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
  const { error } = await getSupabase().from("registrations").delete().eq("id", id);
  if (error) return Response.json({ error: "Could not delete." }, { status: 500 });
  return Response.json({ ok: true });
}
