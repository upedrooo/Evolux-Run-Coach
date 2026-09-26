/**
 * Guard-rails para a resposta da IA.
 *
 * Princípio: NUNCA confiar cegamente na saída de uma LLM. O modelo escreve as sessões, mas o código
 * valida cada regra de segurança e, se algo estiver errado, devolve a lista de problemas para uma
 * nova tentativa ("self-repair"). Se a segunda falhar, o pedido é abortado e a cota do usuário é devolvida.
 *
 * Aqui há um subconjunto ilustrativo das regras; a lista completa cobre dias permitidos, treino longo,
 * sessões intensas, semanas de recuperação/polimento e a sessão da meta.
 */

export type SessionType = "easy" | "long" | "tempo" | "interval" | "recovery" | "race" | "strength" | "cross";
export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Session = { day: Day; type: SessionType; title: string; distanceKm?: number | null };
export type Week = { week: number; sessions: Session[] };
export type Plan = { weeks: Week[] };

export type Context = {
  weeks: { targetKm: number; kind: "build" | "cutback" | "taper" | "goal" }[];
  availableDays: Day[];
  longRunDay: Day;
  longRunCapKm: number;
  maxQualitySessions: number;
};

const RUN_TYPES: SessionType[] = ["easy", "long", "tempo", "interval", "recovery", "race"];
const isRun = (t: SessionType) => RUN_TYPES.includes(t);
const km = (x?: number | null) => (typeof x === "number" ? x : 0);

/**
 * Correção determinística ANTES de validar: uma "corrida" sem distância (ex.: "descanso ativo" rotulado
 * como recuperação) não conta quilometragem; vira cross-training em vez de reprovar o plano inteiro.
 */
export function normalizePlan(plan: Plan): Plan {
  return {
    weeks: plan.weeks.map((w) => ({
      ...w,
      sessions: w.sessions.map((s) =>
        isRun(s.type) && s.type !== "race" && !(km(s.distanceKm) > 0)
          ? { ...s, type: "cross" as const, distanceKm: null }
          : s,
      ),
    })),
  };
}

/** Devolve a lista de problemas (vazia = plano aceito). A lista é reenviada à IA na nova tentativa. */
export function validatePlan(plan: Plan, ctx: Context): string[] {
  const errors: string[] = [];
  if (plan.weeks.length !== ctx.weeks.length) {
    return [`O plano deve ter exatamente ${ctx.weeks.length} semanas, mas veio com ${plan.weeks.length}.`];
  }

  plan.weeks.forEach((w, i) => {
    const target = ctx.weeks[i];
    const label = `Semana ${i + 1}`;
    const isGoalWeek = target.kind === "goal";
    const seen = new Set<Day>();
    let total = 0;
    let quality = 0;
    let longRuns = 0;

    for (const s of w.sessions) {
      if (!ctx.availableDays.includes(s.day) && !(isGoalWeek && s.type === "race" && s.day === ctx.longRunDay)) {
        errors.push(`${label}: dia "${s.day}" não está entre os dias disponíveis.`);
      }
      if (seen.has(s.day)) errors.push(`${label}: duas sessões no mesmo dia (${s.day}).`);
      seen.add(s.day);

      if (isRun(s.type)) total += km(s.distanceKm);
      if (s.type === "tempo" || s.type === "interval") quality++;
      if (s.type === "long") {
        longRuns++;
        if (km(s.distanceKm) > ctx.longRunCapKm) errors.push(`${label}: treino longo de ${s.distanceKm} km passa do limite de ${ctx.longRunCapKm} km.`);
      }
      if (s.type === "interval" && target.kind !== "build") errors.push(`${label}: semana ${target.kind} não pode ter intervalado.`);
    }

    if (longRuns > 1) errors.push(`${label}: mais de um treino longo.`);
    if (quality > ctx.maxQualitySessions) errors.push(`${label}: ${quality} sessões de qualidade (máximo ${ctx.maxQualitySessions}).`);

    // O prompt pede ±10%; o código aceita ±15% (+1 km de folga) para não reprovar um bom plano por pouco.
    const lo = target.targetKm * 0.85 - 1;
    const hi = target.targetKm * 1.15 + 1;
    if (total < lo || total > hi) {
      errors.push(`${label}: a soma das corridas é ${total.toFixed(1)} km, mas a meta é ${target.targetKm} km.`);
    }
  });

  return errors;
}
