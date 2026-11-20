import { describe, expect, it } from "vitest";
import { buildWeeklyTargets, interpolate } from "../training-skeleton";

const base = { weeks: 12, startKm: 20, peakKm: 60, growth: 1.1, goalKm: 21.1, taper: [0.8, 0.6] };

describe("weekly volume skeleton", () => {
  const t = buildWeeklyTargets(base);

  it("produces one target per week and starts at current volume", () => {
    expect(t).toHaveLength(12);
    expect(t[0]).toMatchObject({ week: 1, targetKm: 20, kind: "build" });
  });

  it("never grows faster than the growth cap between consecutive build weeks", () => {
    for (let i = 1; i < t.length; i++) {
      if (t[i].kind === "build" && t[i - 1].kind === "build") {
        expect(t[i].targetKm / t[i - 1].targetKm).toBeLessThanOrEqual(1.1 + 0.03); // +0.03 = 0.5 km rounding tolerance
      }
    }
  });

  it("schedules a cutback on week 4 with lower mileage than week 3", () => {
    expect(t[3].kind).toBe("cutback");
    expect(t[3].targetKm).toBeLessThan(t[2].targetKm);
  });

  it("ends with taper and goal week accommodating the goal distance + shakeout", () => {
    expect(t.slice(-2).map((w) => w.kind)).toEqual(["taper", "goal"]);
    expect(t[11].targetKm).toBeGreaterThanOrEqual(21.1 + 6 - 0.5);
  });

  it("respects the volume ceiling even when starting high", () => {
    const high = buildWeeklyTargets({ ...base, weeks: 16, startKm: 55, peakKm: 55, goalKm: 42.2, taper: [0.85, 0.65, 0.45] });
    expect(Math.max(...high.filter((w) => w.kind !== "goal").map((w) => w.targetKm))).toBeLessThanOrEqual(55);
  });

  it("linearly interpolates between anchors and clamps out-of-range values", () => {
    const anchors: [number, number][] = [[5, 10], [10, 20]];
    expect(interpolate(anchors, 1)).toBe(10);
    expect(interpolate(anchors, 7.5)).toBe(15);
    expect(interpolate(anchors, 99)).toBe(20);
  });
});
