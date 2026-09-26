import { describe, expect, it } from "vitest";
import { buildWeeklyTargets, interpolate } from "../training-skeleton";

const base = { weeks: 12, startKm: 20, peakKm: 60, growth: 1.1, goalKm: 21.1, taper: [0.8, 0.6] };

describe("esqueleto de volume semanal", () => {
  const t = buildWeeklyTargets(base);

  it("gera uma meta para cada semana e começa no volume atual", () => {
    expect(t).toHaveLength(12);
    expect(t[0]).toMatchObject({ week: 1, targetKm: 20, kind: "build" });
  });

  it("nunca sobe mais que a taxa de crescimento entre semanas de construção consecutivas", () => {
    for (let i = 1; i < t.length; i++) {
      if (t[i].kind === "build" && t[i - 1].kind === "build") {
        expect(t[i].targetKm / t[i - 1].targetKm).toBeLessThanOrEqual(1.1 + 0.03); // +0,03 = arredondamento de 0,5 km
      }
    }
  });

  it("tem semana de recuperação na 4ª semana, com volume menor que a anterior", () => {
    expect(t[3].kind).toBe("cutback");
    expect(t[3].targetKm).toBeLessThan(t[2].targetKm);
  });

  it("termina com polimento e a semana da meta, que comporta a meta + soltura", () => {
    expect(t.slice(-2).map((w) => w.kind)).toEqual(["taper", "goal"]);
    expect(t[11].targetKm).toBeGreaterThanOrEqual(21.1 + 6 - 0.5);
  });

  it("respeita o teto de volume mesmo partindo alto", () => {
    const high = buildWeeklyTargets({ ...base, weeks: 16, startKm: 55, peakKm: 55, goalKm: 42.2, taper: [0.85, 0.65, 0.45] });
    expect(Math.max(...high.filter((w) => w.kind !== "goal").map((w) => w.targetKm))).toBeLessThanOrEqual(55);
  });

  it("interpola linearmente entre âncoras e trava nas pontas", () => {
    const anchors: [number, number][] = [[5, 10], [10, 20]];
    expect(interpolate(anchors, 1)).toBe(10);
    expect(interpolate(anchors, 7.5)).toBe(15);
    expect(interpolate(anchors, 99)).toBe(20);
  });
});
