import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabase().from("politician_status").select("*");
  if (error) {
    console.error("Supabase error:", error.message);
    return Response.json({ error: "Could not load the list." }, { status: 500 });
  }
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}