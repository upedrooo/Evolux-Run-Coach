import { describe, expect, it } from "vitest";
import { callWithFallback, LlmError, type CallModel } from "../llm-fallback";

/** Simula um modelo que "trava": só responde (com erro de prazo) quando o AbortSignal dispara. */
const hang: CallModel = (_m, signal) =>
  new Promise((_, reject) => {
    signal?.addEventListener("abort", () => reject(new LlmError("prazo", "timeout")));
  });

describe("fallback entre modelos com prazo por modelo", () => {
  it("passa ao próximo quando o primeiro está ocupado ou descontinuado", async () => {
    const calls: string[] = [];
    const call: CallModel = async (m) => {
      calls.push(m);
      if (m === "ocupado") throw new LlmError("503", "busy");
      if (m === "antigo") throw new LlmError("404", "unavailable");
      return "ok";
    };
    const res = await callWithFallback(["ocupado", "antigo", "bom"], call, { perModelMs: 1000 });
    expect(res).toEqual({ model: "bom", text: "ok" });
    expect(calls).toEqual(["ocupado", "antigo", "bom"]);
  });

  it("um modelo que trava estoura o prazo dele e o próximo é tentado (sem esperar o prazo geral)", async () => {
    const call: CallModel = (m, signal) => (m === "travado" ? hang(m, signal) : Promise.resolve("ok"));
    const started = Date.now();
    const res = await callWithFallback(["travado", "bom"], call, { perModelMs: 50, signal: AbortSignal.timeout(5000) });
    expect(res.model).toBe("bom");
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("se o prazo GERAL estourar, não tenta outros modelos", async () => {
    let calls = 0;
    const call: CallModel = (m, signal) => { calls++; return hang(m, signal); };
    await expect(
      callWithFallback(["a", "b"], call, { perModelMs: 5000, signal: AbortSignal.timeout(50) }),
    ).rejects.toMatchObject({ kind: "timeout" });
    expect(calls).toBe(1);
  });

  it("erros de verdade (ex.: 500) não passam ao próximo modelo", async () => {
    let calls = 0;
    const call: CallModel = async () => { calls++; throw new LlmError("500", "failed"); };
    await expect(callWithFallback(["a", "b"], call, { perModelMs: 1000 })).rejects.toMatchObject({ kind: "failed" });
    expect(calls).toBe(1);
  });

  it("se todos falharem por sobrecarga, o erro final é 'busy'; se só por 404, 'unavailable'", async () => {
    const busy: CallModel = async () => { throw new LlmError("503", "busy"); };
    const gone: CallModel = async () => { throw new LlmError("404", "unavailable"); };
    await expect(callWithFallback(["a", "b"], busy, { perModelMs: 1000 })).rejects.toMatchObject({ kind: "busy" });
    await expect(callWithFallback(["a", "b"], gone, { perModelMs: 1000 })).rejects.toMatchObject({ kind: "unavailable" });
  });
});
