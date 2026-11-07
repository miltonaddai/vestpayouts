import "server-only";
import { cookies } from "next/headers";

const COOKIE = "vp_admin";

/** The cookie stores a token issued by the API. This app never sees ADMIN_PASSWORD. */
export async function getAdminToken() {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function setAdminCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
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
