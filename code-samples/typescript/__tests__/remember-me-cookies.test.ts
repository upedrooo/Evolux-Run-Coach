import { describe, expect, it } from "vitest";
import { parseRemember, rememberCookieOptions, withRemember } from "../remember-me-cookies";

const persistent = { path: "/", maxAge: 34_560_000, expires: new Date("2027-10-30"), sameSite: "lax" as const };

describe("mantenha-me conectado (cookies de sessão)", () => {
  it("marcado: mantém a validade longa do cookie", () => {
    expect(withRemember(persistent, true)).toEqual(persistent);
  });

  it("desmarcado: remove Max-Age e Expires (vira cookie de sessão), preservando o resto", () => {
    const opts = withRemember(persistent, false);
    expect(opts).toEqual({ path: "/", sameSite: "lax" });
    expect("maxAge" in opts).toBe(false);
    expect("expires" in opts).toBe(false);
  });

  it("sem o cookie de preferência, o padrão é lembrar (não desloga quem já estava dentro)", () => {
    expect(parseRemember(undefined)).toBe(true);
    expect(parseRemember("1")).toBe(true);
    expect(parseRemember("0")).toBe(false);
  });

  it("o cookie de preferência é HttpOnly, Secure em produção e só persiste quando marcado", () => {
    expect(rememberCookieOptions(true, true)).toMatchObject({ httpOnly: true, secure: true, maxAge: 31_536_000 });
    expect("maxAge" in rememberCookieOptions(false, true)).toBe(false);
    expect(rememberCookieOptions(true, false).secure).toBe(false); // em desenvolvimento (http)
  });
});
