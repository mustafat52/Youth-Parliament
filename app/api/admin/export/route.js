import { getSupabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Stops spreadsheet apps from running cells that start with = + - @
const cell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!isAdmin()) return new Response("Not signed in.", { status: 401 });
  const { data, error } = await getSupabase()
    .from("registrations")
    .select("*, politicians(name, party)")
    .order("created_at", { ascending: true });
  if (error) return new Response("Could not export.", { status: 500 });

  const head = ["Sr No", "Registered at (IST)", "Full name", "Enrollment no", "Email", "Phone", "Course", "Year", "Politician", "Party"];
  const rows = data.map((r, i) => [
    i + 1,
    new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    r.full_name, r.enrollment_no, r.email, r.phone, r.course, r.year,
    r.politicians?.name, r.politicians?.party,
  ]);
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="youth-parliament-registrations.csv"',
      "Cache-Control": "no-store",
    },
  });
}
