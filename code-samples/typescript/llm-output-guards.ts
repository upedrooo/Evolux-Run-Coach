/**
 * Guardrails for LLM output.
 *
 * Principle: NEVER blindly trust an LLM response. The model writes the sessions, while code
 * validates every safety rule and—if anything is off—returns the exact list of issues for a
 * retry ("self-repair"). If the second attempt still fails, the request aborts and the user's quota is refunded.
 *
 * This sample shows a representative subset of rules; the full validator checks allowed days, long runs,
 * hard sessions, cutback/taper weeks, and the race/goal session.
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
 * Deterministic normalization BEFORE validation: a "run" without distance (e.g., "active rest" labeled
 * as recovery) adds no mileage; convert it to cross-training instead of rejecting the entire plan.
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

/** Returns a list of issues (empty = plan accepted). The list is sent back to the AI on retry. */
export function validatePlan(plan: Plan, ctx: Context): string[] {
  const errors: string[] = [];
  if (plan.weeks.length !== ctx.weeks.length) {
    return [`Plan must have exactly ${ctx.weeks.length} weeks, got ${plan.weeks.length}.`];
  }

  plan.weeks.forEach((w, i) => {
    const target = ctx.weeks[i];
    const label = `Week ${i + 1}`;
    const isGoalWeek = target.kind === "goal";
    const seen = new Set<Day>();
    let total = 0;
    let quality = 0;
    let longRuns = 0;

    for (const s of w.sessions) {
      if (!ctx.availableDays.includes(s.day) && !(isGoalWeek && s.type === "race" && s.day === ctx.longRunDay)) {
        errors.push(`${label}: day "${s.day}" is not in available days.`);
      }
      if (seen.has(s.day)) errors.push(`${label}: two sessions on the same day (${s.day}).`);
      seen.add(s.day);

      if (isRun(s.type)) total += km(s.distanceKm);
      if (s.type === "tempo" || s.type === "interval") quality++;
      if (s.type === "long") {
        longRuns++;
        if (km(s.distanceKm) > ctx.longRunCapKm) errors.push(`${label}: long run of ${s.distanceKm} km exceeds cap of ${ctx.longRunCapKm} km.`);
      }
      if (s.type === "interval" && target.kind !== "build") errors.push(`${label}: ${target.kind} week cannot include intervals.`);
    }

    if (longRuns > 1) errors.push(`${label}: more than one long run.`);
    if (quality > ctx.maxQualitySessions) errors.push(`${label}: ${quality} quality sessions (max ${ctx.maxQualitySessions}).`);

    // Prompt asks for ±10%; code accepts ±15% (+1 km buffer) to avoid rejecting a solid plan over minor rounding.
    const lo = target.targetKm * 0.85 - 1;
    const hi = target.targetKm * 1.15 + 1;
    if (total < lo || total > hi) {
      errors.push(`${label}: running total is ${total.toFixed(1)} km, but target is ${target.targetKm} km.`);
    }
  });

  return errors;
}
