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

/** A plan that satisfies every rule (simulates an obedient AI). */
const good = (): Plan => ({
  weeks: [
    { week: 1, sessions: [
      { day: "tue", type: "easy", title: "Easy Run", distanceKm: 6 },
      { day: "thu", type: "tempo", title: "Threshold", distanceKm: 5 },
      { day: "sun", type: "long", title: "Long Run", distanceKm: 7 },
    ] },
    { week: 2, sessions: [
      { day: "tue", type: "easy", title: "Easy Run", distanceKm: 5 },
      { day: "sun", type: "long", title: "Long Run", distanceKm: 9 },
    ] },
  ],
});

describe("AI output validation", () => {
  it("accepts a plan that follows all rules", () => {
    expect(validatePlan(good(), ctx)).toEqual([]);
  });

  it("rejects the wrong number of weeks (and stops early)", () => {
    const p = good();
    p.weeks.pop();
    expect(validatePlan(p, ctx)).toHaveLength(1);
    expect(validatePlan(p, ctx)[0]).toMatch(/exactly 2 weeks/);
  });

  it("rejects unavailable days, duplicate days, and multiple long runs", () => {
    const p = good();
    p.weeks[0].sessions[0].day = "mon";
    p.weeks[0].sessions[1].day = "sun";
    p.weeks[0].sessions.push({ day: "thu", type: "long", title: "x", distanceKm: 1 });
    const errors = validatePlan(p, ctx).join("\n");
    expect(errors).toMatch(/day "mon" is not in available days/);
    expect(errors).toMatch(/two sessions on the same day/);
    expect(errors).toMatch(/more than one long run/);
  });

  it("rejects out-of-tolerance mileage and long runs above the cap", () => {
    const p = good();
    p.weeks[0].sessions[2].distanceKm = 40;
    const errors = validatePlan(p, ctx).join("\n");
    expect(errors).toMatch(/exceeds cap of 14 km/);
    expect(errors).toMatch(/running total is 51.0 km/);
  });

  it("rejects intervals during a cutback week", () => {
    const p = good();
    p.weeks[1].sessions[0].type = "interval";
    expect(validatePlan(p, ctx).join()).toMatch(/cutback week cannot include intervals/);
  });

  it("converts 'active rest' with no distance to cross-training instead of rejecting the plan", () => {
    const p = good();
    p.weeks[1].sessions.push({ day: "thu", type: "recovery", title: "Active Rest", distanceKm: null });
    const fixed = normalizePlan(p);
    const s = fixed.weeks[1].sessions.at(-1)!;
    expect(s).toMatchObject({ type: "cross", distanceKm: null });
    expect(validatePlan(fixed, ctx)).toEqual([]);
  });
});
