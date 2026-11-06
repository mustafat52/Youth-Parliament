import { getSupabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";
import { slugify, validSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const no = () => Response.json({ error: "Not signed in." }, { status: 401 });

export async function GET() {
  if (!isAdmin()) return no();
  const sb = getSupabase();
  const [s, r, p] = await Promise.all([
    sb.from("schools").select("*").order("created_at", { ascending: false }),
    sb.from("registrations").select("school_id"),
    sb.from("politicians").select("id", { count: "exact", head: true }),
  ]);
  if (s.error || r.error) return Response.json({ error: "Could not load schools." }, { status: 500 });
  const counts = {};
  r.data.forEach((x) => { counts[x.school_id] = (counts[x.school_id] || 0) + 1; });
  return Response.json(
    { schools: s.data.map((x) => ({ ...x, count: counts[x.id] || 0 })), totalPoliticians: p.count ?? 0 },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req) {
  if (!isAdmin()) return no();
  let b = {};
  try { b = await req.json(); } catch {}
  const name = String(b.name || "").trim();
  const slug = slugify(String(b.slug || name));
  if (!name || name.length > 120) return Response.json({ error: "Enter the school name." }, { status: 400 });
  if (!validSlug(slug))
    return Response.json({ error: "Link name must be 2 to 50 letters, numbers or hyphens, and not a reserved word." }, { status: 400 });
  const { data, error } = await getSupabase().from("schools").insert({ name, slug }).select().single();
  if (error) {
    if (error.code === "23505") return Response.json({ error: "That link name is already used. Choose another." }, { status: 409 });
    return Response.json({ error: "Could not create the school." }, { status: 500 });
  }
  return Response.json({ ok: true, school: data });
}

export async function PATCH(req) {
  if (!isAdmin()) return no();
  let b = {};
  try { b = await req.json(); } catch {}
  if (!b.id) return Response.json({ error: "Missing id." }, { status: 400 });
  const patch = {};
  if (typeof b.is_open === "boolean") patch.is_open = b.is_open;
  if (typeof b.name === "string" && b.name.trim()) patch.name = b.name.trim();
  if (!Object.keys(patch).length) return Response.json({ error: "Nothing to update." }, { status: 400 });
  const { error } = await getSupabase().from("schools").update(patch).eq("id", b.id);
  if (error) return Response.json({ error: "Could not update." }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req) {
  if (!isAdmin()) return no();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
  const { error } = await getSupabase().from("schools").delete().eq("id", id);
  if (error) return Response.json({ error: "Could not delete." }, { status: 500 });
  return Response.json({ ok: true });
}
