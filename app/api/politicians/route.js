import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const sb = getSupabase();
  const [pols, regs] = await Promise.all([
    sb.from("politicians").select("id, name, party, constituency, role").order("name"),
    sb.from("registrations").select("politician_id"),
  ]);

  const err = pols.error || regs.error;
  if (err) {
    console.error("Supabase error:", err.message);
    return Response.json({ error: "Could not load the list." }, { status: 500 });
  }

  const taken = new Set(regs.data.map((r) => r.politician_id));
  const list = pols.data.map((p) => ({ ...p, taken: taken.has(p.id) }));
  return Response.json(list, { headers: { "Cache-Control": "no-store, max-age=0" } });
}