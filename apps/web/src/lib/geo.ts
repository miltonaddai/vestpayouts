/**
 * Two-letter country code from the host's geo headers, or null.
 *
 * Netlify sends `x-nf-geo` (base64 JSON, `country.code`) and `x-country`.
 * Vercel and Cloudflare headers are read too, so moving hosts doesn't drop it.
 */
export function requestCountry(headers: Headers): string | null {
  const nfGeo = headers.get("x-nf-geo");
  if (nfGeo) {
    try {
      const code = (JSON.parse(atob(nfGeo)) as { country?: { code?: string } }).country?.code;
      if (code) return normalize(code);
    } catch {
      // Malformed header: fall through to the plain ones.
    }
  }
  const plain = headers.get("x-country") || headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry");
  return plain ? normalize(plain) : null;
}

function normalize(code: string) {
  const c = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : null;
}
