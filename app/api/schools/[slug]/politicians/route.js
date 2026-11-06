import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req, { params }) {
  const sb = getSupabase();
  const { data: school } = await sb.from("schools").select("id, name, slug, is_open").eq("slug", params.slug).maybeSingle();
  if (!school) return Response.json({ error: "School not found." }, { status: 404 });

  const [pols, regs] = await Promise.all([
    sb.from("politicians").select("id, name, party, constituency, role").order("name"),
    sb.from("registrations").select("politician_id").eq("school_id", school.id),
  ]);
  const err = pols.error || regs.error;
  if (err) {
    console.error("Supabase error:", err.message);
    return Response.json({ error: "Could not load the list." }, { status: 500 });
  }
  const taken = new Set(regs.data.map((r) => r.politician_id));
  return Response.json(
    {
      school: { name: school.name, slug: school.slug, is_open: school.is_open },
      politicians: pols.data.map((p) => ({ ...p, taken: taken.has(p.id) })),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
