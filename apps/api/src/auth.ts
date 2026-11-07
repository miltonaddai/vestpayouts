import { createHmac, timingSafeEqual } from "node:crypto";

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function issueAdminToken(password: string) {
  return createHmac("sha256", password).update("vestpayouts-admin-v1").digest("hex");
}

export function passwordOk(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(expected) && same(password, expected);
}

export function tokenOk(token: string) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password || !token) return false;
  return same(token, issueAdminToken(password));
}

export function bearer(header: string | undefined) {
  return header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
}

export function secretOk(expected: string | undefined, got: string) {
  return Boolean(expected) && same(got, expected!);
}
