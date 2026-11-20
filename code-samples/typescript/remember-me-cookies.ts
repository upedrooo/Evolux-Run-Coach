/**
 * Server-side "Keep me signed in" for passwordless auth (email OTP / Google).
 *
 * How it works:
 *  - sign-in runs through API routes (not directly from the browser), so the server owns ALL session cookies;
 *  - checked: session cookies keep their long lifetime (Max-Age/Expires) and survive browser restarts;
 *  - unchecked: strip Max-Age/Expires → becomes a session cookie, cleared when the browser closes;
 *  - the preference is stored in its own cookie (`remember`). When absent, the default is to KEEP signed in
 *    so existing sessions are never unexpectedly logged out.
 *
 * The same filter is applied everywhere session cookies are written (login routes, Google OAuth callback,
 * and token refresh inside Next.js `proxy` on every navigation).
 */

export type CookieOptions = {
  path?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

export const REMEMBER_COOKIE = "remember";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function withRemember(options: CookieOptions, remember: boolean): CookieOptions {
  if (remember) return options;
  const { maxAge: _maxAge, expires: _expires, ...session } = options; // no expiry = session cookie
  void _maxAge;
  void _expires;
  return session;
}

/** Missing cookie = default behavior (remember). Only "0" opts out. */
export const parseRemember = (value: string | undefined): boolean => value !== "0";

/** Options for the preference cookie itself. HttpOnly + Secure in production. */
export function rememberCookieOptions(remember: boolean, isProd: boolean): CookieOptions {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    ...(remember ? { maxAge: ONE_YEAR } : {}),
  };
}
