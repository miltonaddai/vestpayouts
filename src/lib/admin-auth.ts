import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "pt_admin";

function token(password: string) {
  return createHmac("sha256", password).update("paidtape-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function isAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const got = (await cookies()).get(COOKIE)?.value;
  return Boolean(got && safeEqual(got, token(password)));
}

export async function setAdminCookie() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;
  (await cookies()).set(COOKIE, token(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}
