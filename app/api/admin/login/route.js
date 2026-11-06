import { cookies } from "next/headers";
import { COOKIE, cookieOptions, makeToken, passwordOk } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let b = {};
  try { b = await req.json(); } catch {}
  if (!process.env.ADMIN_PASSWORD)
    return Response.json({ error: "ADMIN_PASSWORD is not set on the server." }, { status: 500 });
  if (!passwordOk(b.password || "")) {
    await new Promise((r) => setTimeout(r, 800)); // slows down guessing
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  cookies().set(COOKIE, makeToken(), cookieOptions);
  return Response.json({ ok: true });
}
