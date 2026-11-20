/**
 * Weekly volume "skeleton": code decides HOW MUCH to run each week.
 * The AI then decides HOW to distribute that mileage across individual sessions.
 *
 * Rules implemented (didactic version; production values are tuned by level and goal distance):
 *  - progressive overload: each build week grows by at most `growth` (e.g., +8% to +10%);
 *  - cutback week every 4th week (80% of prior volume) so the body adapts;
 *  - taper across the final weeks, dropping mileage relative to peak volume;
 *  - the final week is the "goal week": must accommodate the target distance plus light shakeout runs;
 *  - weekly volume never exceeds the ceiling (`peakKm`).
 */

export type WeekKind = "build" | "cutback" | "taper" | "goal";
export type WeekTarget = { week: number; targetKm: number; kind: WeekKind };

export type SkeletonInput = {
  weeks: number;
  startKm: number;
  peakKm: number;
  /** e.g., 1.08 = +8% per week */
  growth: number;
  goalKm: number;
  /** fractions of peak volume for the final weeks, e.g., [0.8, 0.6] */
  taper: number[];
};

const round05 = (x: number) => Math.round(x * 2) / 2;

export function buildWeeklyTargets(p: SkeletonInput): WeekTarget[] {
  const taper = p.taper.slice(0, Math.max(0, p.weeks - 3)); // short plans keep at least 3 build weeks
  const buildWeeks = p.weeks - taper.length;

  const out: WeekTarget[] = [];
  let prevBuild = Math.min(p.startKm, p.peakKm);
  let peak = prevBuild;

  for (let week = 1; week <= p.weeks; week++) {
    if (week > buildWeeks) {
      const isGoalWeek = week === p.weeks;
      const fraction = taper[week - buildWeeks - 1];
      const floor = isGoalWeek ? p.goalKm + 6 : 0; // goal distance + ~6 km shakeout
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

/** Linear interpolation between anchor points (e.g., volume cap by goal distance); clamped outside range. */
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
