import { describe, expect, it } from "vitest";
import { callWithFallback, LlmError, type CallModel } from "../llm-fallback";

/** Simulates a hung model: only settles (with a timeout error) when AbortSignal fires. */
const hang: CallModel = (_m, signal) =>
  new Promise((_, reject) => {
    signal?.addEventListener("abort", () => reject(new LlmError("timeout", "timeout")));
  });

describe("multi-model fallback with per-model timeout", () => {
  it("moves to the next model when earlier ones are busy or unavailable", async () => {
    const calls: string[] = [];
    const call: CallModel = async (m) => {
      calls.push(m);
      if (m === "busy-model") throw new LlmError("503", "busy");
      if (m === "deprecated-model") throw new LlmError("404", "unavailable");
      return "ok";
    };
    const res = await callWithFallback(["busy-model", "deprecated-model", "good-model"], call, { perModelMs: 1000 });
    expect(res).toEqual({ model: "good-model", text: "ok" });
    expect(calls).toEqual(["busy-model", "deprecated-model", "good-model"]);
  });

  it("times out a hung model on its own deadline and tries the next one (without waiting for the overall deadline)", async () => {
    const call: CallModel = (m, signal) => (m === "hung-model" ? hang(m, signal) : Promise.resolve("ok"));
    const started = Date.now();
    const res = await callWithFallback(["hung-model", "good-model"], call, { perModelMs: 50, signal: AbortSignal.timeout(5000) });
    expect(res.model).toBe("good-model");
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("stops trying additional models once the OVERALL deadline expires", async () => {
    let calls = 0;
    const call: CallModel = (m, signal) => { calls++; return hang(m, signal); };
    await expect(
      callWithFallback(["a", "b"], call, { perModelMs: 5000, signal: AbortSignal.timeout(50) }),
    ).rejects.toMatchObject({ kind: "timeout" });
    expect(calls).toBe(1);
  });

  it("does not fall back on genuine errors (e.g., 500)", async () => {
    let calls = 0;
    const call: CallModel = async () => { calls++; throw new LlmError("500", "failed"); };
    await expect(callWithFallback(["a", "b"], call, { perModelMs: 1000 })).rejects.toMatchObject({ kind: "failed" });
    expect(calls).toBe(1);
  });

  it("returns 'busy' if any model was overloaded, or 'unavailable' if all returned 404", async () => {
    const busy: CallModel = async () => { throw new LlmError("503", "busy"); };
    const gone: CallModel = async () => { throw new LlmError("404", "unavailable"); };
    await expect(callWithFallback(["a", "b"], busy, { perModelMs: 1000 })).rejects.toMatchObject({ kind: "busy" });
    await expect(callWithFallback(["a", "b"], gone, { perModelMs: 1000 })).rejects.toMatchObject({ kind: "unavailable" });
  });
});
