/**
 * Plan creation orchestration (happy path and every failure branch).
 *
 * Pattern used: dependency injection. Side effects (database, AI, auth) are passed in as
 * functions, making the business flow unit-testable with zero network or DB (see __tests__/plan-api-flow.test.ts).
 *
 * Order matters:
 *  1) authenticate;
 *  2) validate input and compute all deterministic values. Failures here do NOT consume quota;
 *  3) atomically claim 1 of N slots (in PostgreSQL); if full → 403 without calling the AI;
 *  4) generate and save; ANY failure after claiming refunds the slot (`finally`).
 */

export type Result = { status: 200; id: string } | { status: 400 | 401 | 403 | 422 | 502 | 503; error: string };

export type Deps<TInput, TContext, TPlan> = {
  getUserId: () => Promise<string | null>;
  parseInput: (raw: unknown) => { ok: true; value: TInput } | { ok: false; message: string };
  buildContext: (input: TInput) => { ok: true; ctx: TContext } | { ok: false; error: string };
  /** true = slot reserved. Implemented as an atomic conditional UPDATE in PostgreSQL. */
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
  if (!userId) return { status: 401, error: "Sign in to continue." };

  const parsed = deps.parseInput(raw);
  if (!parsed.ok) return { status: 400, error: parsed.message };

  const built = deps.buildContext(parsed.value);
  if (!built.ok) return { status: 422, error: built.error };

  if (!(await deps.claimSlot(userId))) return { status: 403, error: "You have already used all available plan credits." };

  let saved = false;
  try {
    const plan = await deps.generate(built.ctx);
    const id = await deps.save(userId, plan);
    saved = true;
    return { status: 200, id };
  } catch (e) {
    return deps.isBusyError(e)
      ? { status: 503, error: "The AI service is at capacity right now. Your plan credit was not deducted." }
      : { status: 502, error: "Could not generate the plan right now. Your plan credit was not deducted." };
  } finally {
    if (!saved) await deps.refundSlot(userId); // never charge for a plan that wasn't saved
  }
}
