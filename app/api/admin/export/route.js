import { getSupabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Stops spreadsheet apps from running cells that start with = + - @
const cell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req) {
  if (!isAdmin()) return new Response("Not signed in.", { status: 401 });
  const sb = getSupabase();
  const slug = new URL(req.url).searchParams.get("school");

  let q = sb
    .from("registrations")
    .select("*, politicians(name, party, constituency), schools(name, slug)")
    .order("created_at", { ascending: true });

  if (slug) {
    const { data: sc } = await sb.from("schools").select("id").eq("slug", slug).maybeSingle();
    if (!sc) return new Response("School not found.", { status: 404 });
    q = q.eq("school_id", sc.id);
  }

  const { data, error } = await q;
  if (error) return new Response("Could not export.", { status: 500 });

  const head = ["Sr No", "School", "Registered at (IST)", "Full name", "Enrollment no", "Email", "Phone", "Course", "Year", "Politician", "Party", "Constituency"];
  const rows = data.map((r, i) => [
    i + 1,
    r.schools?.name,
    new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    r.full_name, r.enrollment_no, r.email, r.phone, r.course, r.year,
    r.politicians?.name, r.politicians?.party, r.politicians?.constituency,
  ]);
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="youth-parliament-${slug || "all-schools"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
