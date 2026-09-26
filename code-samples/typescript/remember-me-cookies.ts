/**
 * "Mantenha-me conectado" com login sem senha (código por e-mail / Google), feito no SERVIDOR.
 *
 * Como funciona:
 *  - o login acontece em rotas de API (não no navegador), então o servidor controla TODOS os cookies de sessão;
 *  - marcado: o cookie de sessão mantém validade longa (Max-Age/Expires) e sobrevive ao fechar o navegador;
 *  - desmarcado: removemos Max-Age/Expires → vira "cookie de sessão", apagado quando o navegador fecha;
 *  - a escolha é guardada num cookie próprio (`remember`). Se ele não existir, o padrão é MANTER conectado,
 *    para nunca deslogar quem já estava dentro.
 *
 * O mesmo filtro é aplicado em todo lugar que grava cookies de sessão (rotas de login, callback do Google e
 * a renovação de token feita no `proxy` do Next.js a cada navegação).
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
  const { maxAge: _maxAge, expires: _expires, ...session } = options; // sem validade = cookie de sessão
  void _maxAge;
  void _expires;
  return session;
}

/** Ausência do cookie = comportamento padrão (lembrar). Só o valor "0" desliga. */
export const parseRemember = (value: string | undefined): boolean => value !== "0";

/** Opções do cookie que guarda a própria escolha. HttpOnly + Secure em produção. */
export function rememberCookieOptions(remember: boolean, isProd: boolean): CookieOptions {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    ...(remember ? { maxAge: ONE_YEAR } : {}),
  };
}
