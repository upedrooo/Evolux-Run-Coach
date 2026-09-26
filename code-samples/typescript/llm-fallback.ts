/**
 * Cliente de LLM resiliente: lista de modelos com prazo POR modelo.
 *
 * Problema real (plano gratuito de uma API de LLM): um modelo "sobrecarregado" pode levar ~40 s só para devolver
 * um erro 503. Com um único prazo global de 42 s, esse modelo consumia o orçamento inteiro e o modelo seguinte
 * nunca chegava a ser tentado.
 *
 * Solução: cada modelo (exceto o último) recebe um prazo curto; estourou, ocupado ou descontinuado → tenta o próximo.
 * O último modelo usa todo o tempo que restar. Erros "de verdade" (500, resposta inválida) NÃO passam ao próximo.
 *
 * Técnicas: AbortSignal.timeout, AbortSignal.any (combina o prazo do modelo com o prazo geral) e erros tipados.
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

    // prazo próprio do modelo (exceto o último), combinado com o prazo geral da requisição
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
    ? new LlmError("O provedor de IA está sobrecarregado.", "busy")
    : new LlmError("Nenhum modelo configurado está disponível.", "unavailable");
}
