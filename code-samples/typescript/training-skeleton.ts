/**
 * "Esqueleto" de volume semanal: o código decide QUANTO correr em cada semana.
 * A IA depois decide COMO distribuir esse volume em sessões.
 *
 * Regras implementadas (versão didática; os valores reais de produção são ajustados por nível e distância):
 *  - sobrecarga progressiva: a cada semana de construção, sobe no máximo `growth` (ex.: +8% a +10%);
 *  - semana de recuperação a cada 4ª semana (80% do volume anterior), para o corpo assimilar o treino;
 *  - polimento (taper) nas semanas finais, reduzindo o volume em relação ao pico;
 *  - a última semana é a "semana da meta": precisa comportar a distância-alvo + soltura antes dela;
 *  - o volume nunca passa do teto (`peakKm`).
 */

export type WeekKind = "build" | "cutback" | "taper" | "goal";
export type WeekTarget = { week: number; targetKm: number; kind: WeekKind };

export type SkeletonInput = {
  weeks: number;
  startKm: number;
  peakKm: number;
  /** ex.: 1.08 = +8% por semana */
  growth: number;
  goalKm: number;
  /** frações do pico nas semanas finais, ex.: [0.8, 0.6] */
  taper: number[];
};

const round05 = (x: number) => Math.round(x * 2) / 2;

export function buildWeeklyTargets(p: SkeletonInput): WeekTarget[] {
  const taper = p.taper.slice(0, Math.max(0, p.weeks - 3)); // planos curtos mantêm ao menos 3 semanas de construção
  const buildWeeks = p.weeks - taper.length;

  const out: WeekTarget[] = [];
  let prevBuild = Math.min(p.startKm, p.peakKm);
  let peak = prevBuild;

  for (let week = 1; week <= p.weeks; week++) {
    if (week > buildWeeks) {
      const isGoalWeek = week === p.weeks;
      const fraction = taper[week - buildWeeks - 1];
      const floor = isGoalWeek ? p.goalKm + 6 : 0; // a meta + ~6 km de soltura
      out.push({ week, targetKm: round05(Math.max(peak * fraction, floor)), kind: isGoalWeek ? "goal" : "taper" });
    } else if (week === 1) {
      out.push({ week, targetKm: round05(prevBuild), kind: "build" });
    } else if (week % 4 === 0 && week < buildWeeks) {
      out.push({ week, targetKm: round05(prevBuild * 0.8), kind: "cutback" });
    } else {
      prevBuild = Math.min(p.peakKm, prevBuild * p.growth);
      peak = Math.max(peak, prevBuild);
      out.push({ week, targetKm: round05(prevBuild), kind: "build" });
    }
  }
  return out;
}

/** Interpolação linear entre âncoras (ex.: teto de volume por distância-alvo); fora do intervalo, trava nas pontas. */
export function interpolate(anchors: [x: number, y: number][], x: number): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    if (x <= x1) {
      const [x0, y0] = anchors[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return anchors[anchors.length - 1][1];
}
