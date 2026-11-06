import { cookies } from "next/headers";
import { COOKIE } from "@/lib/adminAuth";

export async function POST() {
  cookies().delete(COOKIE);
  return Response.json({ ok: true });
}
