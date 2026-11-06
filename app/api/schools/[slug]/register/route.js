import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req, { params }) {
  let b;
  try { b = await req.json(); } catch { return bad("Invalid request."); }

  // Hidden field that only bots fill in
  if (b.website) return Response.json({ ok: true });

  const sb = getSupabase();
  const { data: school } = await sb.from("schools").select("id, is_open").eq("slug", params.slug).maybeSingle();
  if (!school) return bad("This registration link is not valid.", 404);
  if (!school.is_open) return bad("Registration for this school is closed.", 403);

  const f = {
    school_id: school.id,
    full_name: String(b.full_name || "").trim(),
    enrollment_no: String(b.enrollment_no || "").trim().toUpperCase(),
    email: String(b.email || "").trim().toLowerCase(),
    phone: String(b.phone || "").replace(/\s+/g, ""),
    course: String(b.course || "").trim(),
    year: String(b.year || "").trim(),
    politician_id: Number(b.politician_id),
  };

  if (Object.values(f).some((v) => !v)) return bad("Please fill in every field.");
  if (!/^\S+@\S+\.\S+$/.test(f.email)) return bad("Enter a valid email address.");
  if (!/^[6-9]\d{9}$/.test(f.phone)) return bad("Enter a valid 10-digit mobile number.");
  if (f.full_name.length > 100 || f.course.length > 100 || f.enrollment_no.length > 40)
    return bad("One of the fields is too long.");

  const { error } = await sb.from("registrations").insert(f);

  if (error) {
    if (error.code === "23505") {
      const m = error.message || "";
      if (m.includes("politician")) return bad("Someone just chose this politician. Please pick another one.", 409);
      if (m.includes("email")) return bad("This email is already registered.", 409);
      return bad("This enrollment number is already registered.", 409);
    }
    return bad("Something went wrong. Please try again.", 500);
  }
  return Response.json({ ok: true });
}
