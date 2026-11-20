import { describe, expect, it } from "vitest";
import { parseRemember, rememberCookieOptions, withRemember } from "../remember-me-cookies";

const persistent = { path: "/", maxAge: 34_560_000, expires: new Date("2027-10-30"), sameSite: "lax" as const };

describe("keep me signed in (session cookies)", () => {
  it("checked: preserves long-lived cookie expiry", () => {
    expect(withRemember(persistent, true)).toEqual(persistent);
  });

  it("unchecked: strips Max-Age and Expires (becomes a session cookie), keeping other flags", () => {
    const opts = withRemember(persistent, false);
    expect(opts).toEqual({ path: "/", sameSite: "lax" });
    expect("maxAge" in opts).toBe(false);
    expect("expires" in opts).toBe(false);
  });

  it("missing preference cookie defaults to remember (never logs out existing users)", () => {
    expect(parseRemember(undefined)).toBe(true);
    expect(parseRemember("1")).toBe(true);
    expect(parseRemember("0")).toBe(false);
  });

  it("preference cookie is HttpOnly, Secure in production, and only persists when checked", () => {
    expect(rememberCookieOptions(true, true)).toMatchObject({ httpOnly: true, secure: true, maxAge: 31_536_000 });
    expect("maxAge" in rememberCookieOptions(false, true)).toBe(false);
    expect(rememberCookieOptions(true, false).secure).toBe(false); // local dev over http
  });
});
