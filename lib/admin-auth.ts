/**
 * Shared admin console session helpers.
 *
 * The password lives only in `ADMIN_PASSWORD` on the server, so the browser
 * never receives it: `/api/admin-auth` checks it once and hands back a signed
 * session cookie that the proxy verifies on every admin request.
 */

export const ADMIN_COOKIE = "admin_session";

/** Sessions last 8 hours, then the password is asked for again. */
export const SESSION_MAX_AGE = 60 * 60 * 8;

const encoder = new TextEncoder();

/** Constant-time string compare so a secret cannot be guessed by timing. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** HMAC-SHA256 via Web Crypto so this works in both Node and Edge proxies. */
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** `<expiresAt>.<hmac>` — unforgeable without the configured password. */
export async function createSession(now = Date.now()) {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  const expires = now + SESSION_MAX_AGE * 1000;
  return `${expires}.${await sign(String(expires), secret)}`;
}

export async function verifySession(token: string | undefined, now = Date.now()) {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  if (!secret || !token) return false;

  const separator = token.indexOf(".");
  if (separator === -1) return false;

  const expiresRaw = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < now) return false;

  return safeEqual(signature, await sign(expiresRaw, secret));
}
