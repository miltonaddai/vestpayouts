import { createHmac, randomBytes } from "node:crypto";

/**
 * Minimal X (Twitter) API v2 client for posting as one account.
 * Uses OAuth 1.0a user context, signed with the app's consumer key/secret and
 * the account's access token/secret. Credentials come from env vars and are
 * never logged.
 */

const POST_URL = "https://api.x.com/2/tweets";

export interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export function xCredentials(): XCredentials | null {
  const c = {
    apiKey: (process.env.X_API_KEY || "").trim(),
    apiSecret: (process.env.X_API_SECRET || "").trim(),
    accessToken: (process.env.X_ACCESS_TOKEN || "").trim(),
    accessSecret: (process.env.X_ACCESS_SECRET || "").trim(),
  };
  return c.apiKey && c.apiSecret && c.accessToken && c.accessSecret ? c : null;
}

/** RFC 3986 encoding, as OAuth 1.0a requires. */
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);

function authHeader(method: string, url: string, creds: XCredentials) {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };
  // JSON bodies are not part of the signature; only the oauth_* params are.
  const params = Object.keys(oauth)
    .sort()
    .map((k) => `${enc(k)}=${enc(oauth[k])}`)
    .join("&");
  const base = [method.toUpperCase(), enc(url), enc(params)].join("&");
  const key = `${enc(creds.apiSecret)}&${enc(creds.accessSecret)}`;
  oauth.oauth_signature = createHmac("sha1", key).update(base).digest("base64");
  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${enc(k)}="${enc(oauth[k])}"`)
      .join(", ")
  );
}

/** The account these credentials post as. Costs one read request. */
export async function xWhoAmI(creds: XCredentials): Promise<{ id: string; username: string; name: string }> {
  const url = "https://api.x.com/2/users/me";
  const res = await fetch(url, {
    headers: { authorization: authHeader("GET", url, creds) },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as { data?: { id: string; username: string; name: string }; detail?: string; title?: string } | null;
  if (!res.ok || !body?.data) throw new XPostError(body?.detail || body?.title || `HTTP ${res.status}`, res.status, res.status === 429 || res.status >= 500);
  return body.data;
}

export class XPostError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Worth trying again later (rate limit, server error, network). */
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

/** Upload a PNG/JPEG and return the media id to attach to a post. */
export async function uploadImageToX(image: Buffer, creds: XCredentials): Promise<string> {
  const url = "https://api.x.com/2/media/upload";
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { authorization: authHeader("POST", url, creds), "content-type": "application/json" },
      body: JSON.stringify({ media: image.toString("base64"), media_category: "tweet_image" }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw new XPostError(`media upload network error: ${(err as Error).message}`, 0, true);
  }
  const body = (await res.json().catch(() => null)) as { data?: { id?: string }; detail?: string; title?: string } | null;
  if (res.ok && body?.data?.id) return body.data.id;
  throw new XPostError(`media upload: ${body?.detail || body?.title || `HTTP ${res.status}`}`, res.status, res.status === 429 || res.status >= 500);
}

export async function postToX(text: string, creds: XCredentials, mediaIds: string[] = []): Promise<{ id: string }> {
  let res: Response;
  try {
    res = await fetch(POST_URL, {
      method: "POST",
      headers: { authorization: authHeader("POST", POST_URL, creds), "content-type": "application/json" },
      body: JSON.stringify(mediaIds.length ? { text, media: { media_ids: mediaIds } } : { text }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw new XPostError(`network error: ${(err as Error).message}`, 0, true);
  }
  const body = (await res.json().catch(() => null)) as { data?: { id?: string }; detail?: string; title?: string } | null;
  if (res.ok && body?.data?.id) return { id: body.data.id };
  const reset = res.headers.get("x-rate-limit-reset");
  const detail = body?.detail || body?.title || `HTTP ${res.status}`;
  throw new XPostError(
    `${detail}${res.status === 429 && reset ? ` (resets ${new Date(Number(reset) * 1000).toISOString()})` : ""}`,
    res.status,
    res.status === 429 || res.status >= 500,
  );
}
