/**
 * Orquestração da criação de um plano (o "caminho feliz" e todos os desvios).
 *
 * Padrão usado: injeção de dependências. As partes com efeito colateral (banco, IA, autenticação) entram como
 * funções, então a regra de negócio é testável sem rede e sem banco (ver __tests__/plan-api-flow.test.ts).
 *
 * Ordem importa:
 *  1) autentica;
 *  2) valida a entrada e calcula tudo o que é determinístico. Falhas aqui NÃO consomem cota;
 *  3) reserva 1 das N vagas de forma ATÔMICA (no banco); sem vaga → 403 sem chamar a IA;
 *  4) gera e salva; QUALQUER falha depois da reserva devolve a vaga (finally).
 */

export type Result = { status: 200; id: string } | { status: 400 | 401 | 403 | 422 | 502 | 503; error: string };

export type Deps<TInput, TContext, TPlan> = {
  getUserId: () => Promise<string | null>;
  parseInput: (raw: unknown) => { ok: true; value: TInput } | { ok: false; message: string };
  buildContext: (input: TInput) => { ok: true; ctx: TContext } | { ok: false; error: string };
  /** true = vaga reservada. Implementado como UPDATE condicional atômico no banco. */
  claimSlot: (userId: string) => Promise<boolean>;
  refundSlot: (userId: string) => Promise<void>;
  generate: (ctx: TContext) => Promise<TPlan>;
  save: (userId: string, plan: TPlan) => Promise<string>;
  isBusyError: (e: unknown) => boolean;
};

export async function createPlan<TInput, TContext, TPlan>(
  deps: Deps<TInput, TContext, TPlan>,
  raw: unknown,
): Promise<Result> {
  const userId = await deps.getUserId();
  if (!userId) return { status: 401, error: "Faça login para continuar." };

  const parsed = deps.parseInput(raw);
  if (!parsed.ok) return { status: 400, error: parsed.message };

  const built = deps.buildContext(parsed.value);
  if (!built.ok) return { status: 422, error: built.error };

  if (!(await deps.claimSlot(userId))) return { status: 403, error: "Você já usou todas as fichas disponíveis." };

  let saved = false;
  try {
    const plan = await deps.generate(built.ctx);
    const id = await deps.save(userId, plan);
    saved = true;
    return { status: 200, id };
  } catch (e) {
    return deps.isBusyError(e)
      ? { status: 503, error: "O serviço de IA está no limite agora. Sua vaga não foi descontada." }
      : { status: 502, error: "Não foi possível gerar a ficha agora. Sua vaga não foi descontada." };
  } finally {
    if (!saved) await deps.refundSlot(userId); // nunca cobra por uma ficha que não existe
  }
}
