import { describe, expect, it } from "vitest";
import { fmtPace, paceAtFraction, trainingPaces, vdotFromEffort } from "../pace-zones";

describe("VDOT e zonas de ritmo (validadas contra as tabelas publicadas)", () => {
  it("5 km em 19:57 e 10 km em 41:21 dão VDOT ≈ 50", () => {
    expect(vdotFromEffort(5000, 19 * 60 + 57)).toBeCloseTo(50, 0);
    expect(vdotFromEffort(10000, 41 * 60 + 21)).toBeCloseTo(50, 0);
  });

  it("ritmos de referência para VDOT 50 (tolerância de ±6 s/km)", () => {
    // Tabela: maratona ≈ 4:31, limiar ≈ 4:15, intervalado ≈ 3:56 /km
    expect(paceAtFraction(50, 0.82)).toBeGreaterThan(4 * 60 + 25);
    expect(paceAtFraction(50, 0.82)).toBeLessThan(4 * 60 + 37);
    expect(paceAtFraction(50, 0.88)).toBeGreaterThan(4 * 60 + 9);
    expect(paceAtFraction(50, 0.88)).toBeLessThan(4 * 60 + 21);
    expect(paceAtFraction(50, 0.98)).toBeGreaterThan(3 * 60 + 50);
    expect(paceAtFraction(50, 0.98)).toBeLessThan(4 * 60 + 2);
  });

  it("as zonas ficam ordenadas: leve é mais lenta que maratona, limiar, intervalado e repetição", () => {
    const p = trainingPaces(45);
    expect(p.E.fastSecKm).toBeGreaterThan(p.M.slowSecKm - 1);
    expect(p.M.fastSecKm).toBeGreaterThan(p.T.slowSecKm - 1);
    expect(p.T.fastSecKm).toBeGreaterThan(p.I.slowSecKm - 1);
    expect(p.I.fastSecKm).toBeGreaterThan(p.R.slowSecKm - 1);
    for (const z of Object.values(p)) expect(z.fastSecKm).toBeLessThan(z.slowSecKm);
  });

  it("formata o ritmo como m:ss", () => {
    expect(fmtPace(359.6)).toBe("6:00");
    expect(fmtPace(305)).toBe("5:05");
  });
});
