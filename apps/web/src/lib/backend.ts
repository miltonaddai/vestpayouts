/** Base URL of apps/api. Server-only. Defaults to the local API port. */
export function backendUrl() {
  return (process.env.BACKEND_URL || "http://127.0.0.1:4318").replace(/\/$/, "");
}

export async function backendFetch(path: string, init: RequestInit & { token?: string | null } = {}) {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const { token: _token, ...rest } = init;
  void _token;
  return fetch(`${backendUrl()}${path}`, { ...rest, headers, cache: "no-store" });
}
