import { describe, expect, it } from "vitest";
import { normalizePlan, validatePlan, type Context, type Plan } from "../llm-output-guards";

const ctx: Context = {
  weeks: [
    { targetKm: 18, kind: "build" },
    { targetKm: 14, kind: "cutback" },
  ],
  availableDays: ["tue", "thu", "sun"],
  longRunDay: "sun",
  longRunCapKm: 14,
  maxQualitySessions: 1,
};

/** Um plano que respeita todas as regras (simula uma IA obediente). */
const good = (): Plan => ({
  weeks: [
    { week: 1, sessions: [
      { day: "tue", type: "easy", title: "Rodagem", distanceKm: 6 },
      { day: "thu", type: "tempo", title: "Limiar", distanceKm: 5 },
      { day: "sun", type: "long", title: "Longão", distanceKm: 7 },
    ] },
    { week: 2, sessions: [
      { day: "tue", type: "easy", title: "Rodagem", distanceKm: 5 },
      { day: "sun", type: "long", title: "Longão", distanceKm: 9 },
    ] },
  ],
});

describe("validação da resposta da IA", () => {
  it("aceita um plano que segue as regras", () => {
    expect(validatePlan(good(), ctx)).toEqual([]);
  });

  it("rejeita número errado de semanas (e para por aí)", () => {
    const p = good();
    p.weeks.pop();
    expect(validatePlan(p, ctx)).toHaveLength(1);
    expect(validatePlan(p, ctx)[0]).toMatch(/exatamente 2 semanas/);
  });

  it("rejeita dia indisponível, dois treinos no mesmo dia e dois longões", () => {
    const p = good();
    p.weeks[0].sessions[0].day = "mon";
    p.weeks[0].sessions[1].day = "sun";
    p.weeks[0].sessions.push({ day: "thu", type: "long", title: "x", distanceKm: 1 });
    const errors = validatePlan(p, ctx).join("\n");
    expect(errors).toMatch(/dia "mon" não está entre os dias disponíveis/);
    expect(errors).toMatch(/duas sessões no mesmo dia/);
    expect(errors).toMatch(/mais de um treino longo/);
  });

  it("rejeita volume fora da tolerância da meta e longão acima do teto", () => {
    const p = good();
    p.weeks[0].sessions[2].distanceKm = 40;
    const errors = validatePlan(p, ctx).join("\n");
    expect(errors).toMatch(/passa do limite de 14 km/);
    expect(errors).toMatch(/a soma das corridas é 51.0 km/);
  });

  it("rejeita intervalado em semana de recuperação", () => {
    const p = good();
    p.weeks[1].sessions[0].type = "interval";
    expect(validatePlan(p, ctx).join()).toMatch(/semana cutback não pode ter intervalado/);
  });

  it("'descanso ativo' sem distância vira cross-training em vez de reprovar o plano", () => {
    const p = good();
    p.weeks[1].sessions.push({ day: "thu", type: "recovery", title: "Descanso ativo", distanceKm: null });
    const fixed = normalizePlan(p);
    const s = fixed.weeks[1].sessions.at(-1)!;
    expect(s).toMatchObject({ type: "cross", distanceKm: null });
    expect(validatePlan(fixed, ctx)).toEqual([]);
  });
});
