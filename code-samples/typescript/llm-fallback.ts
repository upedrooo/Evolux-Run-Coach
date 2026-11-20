/**
 * Resilient LLM client: model fallback list with a PER-MODEL timeout.
 *
 * Real-world problem (free-tier LLM API): an overloaded model can take ~40 s just to return
 * a 503 error. With a single global 42 s timeout, that one model consumed the entire budget and
 * the next model was never even tried.
 *
 * Solution: every model (except the last) gets a short deadline; if it times out, is busy, or is
 * unavailable → try the next one. The last model gets whatever time remains. Genuine failures
 * (500, malformed response) do NOT fall through to the next model.
 *
 * Techniques: AbortSignal.timeout, AbortSignal.any (combines per-model and overall deadlines), and typed errors.
 */

export type LlmErrorKind = "busy" | "unavailable" | "timeout" | "failed";

export class LlmError extends Error {
  constructor(message: string, public kind: LlmErrorKind) {
    super(message);
  }
}

export type CallModel = (model: string, signal: AbortSignal | undefined) => Promise<string>;

export async function callWithFallback(
  models: string[],
  callModel: CallModel,
  opts: { perModelMs: number; signal?: AbortSignal },
): Promise<{ model: string; text: string }> {
  let sawBusy = false;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const isLast = i === models.length - 1;

    // per-model deadline (except for the last model), combined with the overall request deadline
    const own = isLast ? undefined : AbortSignal.timeout(opts.perModelMs);
    const signal = own && opts.signal ? AbortSignal.any([opts.signal, own]) : (own ?? opts.signal);

    try {
      return { model, text: await callModel(model, signal) };
    } catch (e) {
      const parentAborted = opts.signal?.aborted === true;
      const skippable =
        e instanceof LlmError &&
        (e.kind === "busy" || e.kind === "unavailable" || (e.kind === "timeout" && !parentAborted && !isLast));
      if (!skippable) throw e;
      sawBusy ||= e.kind === "busy" || e.kind === "timeout";
    }
  }

  throw sawBusy
    ? new LlmError("The AI provider is currently overloaded.", "busy")
    : new LlmError("No configured model is available.", "unavailable");
}
