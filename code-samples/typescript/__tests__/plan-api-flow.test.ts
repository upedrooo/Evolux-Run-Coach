import { describe, expect, it } from "vitest";
import { createPlan, type Deps } from "../plan-api-flow";

/** Dependências falsas com um "banco" em memória para a cota. */
function setup(over: Partial<Deps<{ km: number }, { km: number }, string>> = {}, used = 0, max = 3) {
  const db = { used, refunds: 0, saved: [] as string[] };
  const deps: Deps<{ km: number }, { km: number }, string> = {
    getUserId: async () => "user-1",
    parseInput: (raw) => (typeof (raw as { km?: unknown })?.km === "number" ? { ok: true, value: raw as { km: number } } : { ok: false, message: "km inválido" }),
    buildContext: (i) => (i.km > 0 ? { ok: true, ctx: i } : { ok: false, error: "distância inválida" }),
    claimSlot: async () => (db.used < max ? (db.used++, true) : false),
    refundSlot: async () => { db.used = Math.max(0, db.used - 1); db.refunds++; },
    generate: async (ctx) => `plano de ${ctx.km} km`,
    save: async (_u, plan) => { db.saved.push(plan); return "plan-id"; },
    isBusyError: (e) => e instanceof Error && e.message === "busy",
    ...over,
  };
  return { deps, db };
}

describe("criação de plano: fluxo e cota", () => {
  it("caminho feliz: gera, salva e mantém a vaga consumida", async () => {
    const { deps, db } = setup();
    expect(await createPlan(deps, { km: 10 })).toEqual({ status: 200, id: "plan-id" });
    expect(db).toMatchObject({ used: 1, refunds: 0, saved: ["plano de 10 km"] });
  });

  it("sem login: 401, sem tocar na cota", async () => {
    const { deps, db } = setup({ getUserId: async () => null });
    expect(await createPlan(deps, { km: 10 })).toMatchObject({ status: 401 });
    expect(db.used).toBe(0);
  });

  it("entrada inválida ou regra de negócio violada: recusa ANTES de consumir cota", async () => {
    const { deps, db } = setup();
    expect(await createPlan(deps, { km: "x" })).toMatchObject({ status: 400 });
    expect(await createPlan(deps, { km: -1 })).toMatchObject({ status: 422 });
    expect(db.used).toBe(0);
  });

  it("limite atingido: 403 sem chamar a IA", async () => {
    let generated = 0;
    const { deps } = setup({ generate: async () => { generated++; return "x"; } }, 3);
    expect(await createPlan(deps, { km: 10 })).toMatchObject({ status: 403 });
    expect(generated).toBe(0);
  });

  it("falha da IA devolve a vaga; sobrecarga vira 503, outros erros 502", async () => {
    const busy = setup({ generate: async () => { throw new Error("busy"); } });
    expect(await createPlan(busy.deps, { km: 10 })).toMatchObject({ status: 503 });
    expect(busy.db).toMatchObject({ used: 0, refunds: 1 });

    const broken = setup({ generate: async () => { throw new Error("boom"); } });
    expect(await createPlan(broken.deps, { km: 10 })).toMatchObject({ status: 502 });
    expect(broken.db.used).toBe(0);
  });

  it("falha ao SALVAR também devolve a vaga", async () => {
    const { deps, db } = setup({ save: async () => { throw new Error("db down"); } });
    expect(await createPlan(deps, { km: 10 })).toMatchObject({ status: 502 });
    expect(db).toMatchObject({ used: 0, refunds: 1 });
  });
});
