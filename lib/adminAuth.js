import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "ypr_admin";
const sign = (v) => crypto.createHmac("sha256", process.env.ADMIN_PASSWORD || "").update(v).digest("hex");
const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

export function passwordOk(input) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return crypto.timingSafeEqual(digest(input), digest(process.env.ADMIN_PASSWORD));
}

export function makeToken() {
  const v = String(Date.now() + 12 * 3600 * 1000); // valid 12 hours
  return `${v}.${sign(v)}`;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 12 * 3600,
};

export function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const t = cookies().get(COOKIE)?.value;
  if (!t) return false;
  const [v, s] = t.split(".");
  if (!v || !s) return false;
  const a = Buffer.from(s), b = Buffer.from(sign(v));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(v) > Date.now();
}
