import { describe, expect, it } from "vitest";
import { fmtPace, paceAtFraction, trainingPaces, vdotFromEffort } from "../pace-zones";

describe("VDOT and pace zones (verified against published tables)", () => {
  it("5 km in 19:57 and 10 km in 41:21 yield VDOT ≈ 50", () => {
    expect(vdotFromEffort(5000, 19 * 60 + 57)).toBeCloseTo(50, 0);
    expect(vdotFromEffort(10000, 41 * 60 + 21)).toBeCloseTo(50, 0);
  });

  it("reference paces for VDOT 50 (±6 s/km tolerance)", () => {
    // Table: marathon ≈ 4:31, threshold ≈ 4:15, interval ≈ 3:56 /km
    expect(paceAtFraction(50, 0.82)).toBeGreaterThan(4 * 60 + 25);
    expect(paceAtFraction(50, 0.82)).toBeLessThan(4 * 60 + 37);
    expect(paceAtFraction(50, 0.88)).toBeGreaterThan(4 * 60 + 9);
    expect(paceAtFraction(50, 0.88)).toBeLessThan(4 * 60 + 21);
    expect(paceAtFraction(50, 0.98)).toBeGreaterThan(3 * 60 + 50);
    expect(paceAtFraction(50, 0.98)).toBeLessThan(4 * 60 + 2);
  });

  it("zones are strictly ordered: Easy slower than Marathon, Threshold, Interval, and Repetition", () => {
    const p = trainingPaces(45);
    expect(p.E.fastSecKm).toBeGreaterThan(p.M.slowSecKm - 1);
    expect(p.M.fastSecKm).toBeGreaterThan(p.T.slowSecKm - 1);
    expect(p.T.fastSecKm).toBeGreaterThan(p.I.slowSecKm - 1);
    expect(p.I.fastSecKm).toBeGreaterThan(p.R.slowSecKm - 1);
    for (const z of Object.values(p)) expect(z.fastSecKm).toBeLessThan(z.slowSecKm);
  });

  it("formats pace as m:ss", () => {
    expect(fmtPace(359.6)).toBe("6:00");
    expect(fmtPace(305)).toBe("5:05");
  });
});
