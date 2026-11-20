/**
 * Training pace zones from VDOT (Jack Daniels' model).
 *
 * Idea: given ONE recent effort (e.g., 5 km in 25:00), estimate aerobic fitness (VDOT)
 * and derive training paces (Easy, Marathon, Threshold, Interval, Repetition).
 *
 *   VO2(v)     = -4.60 + 0.182258·v + 0.000104·v²                              (v in m/min)
 *   %VO2max(t) = 0.8 + 0.1894393·e^(-0.012778·t) + 0.2989558·e^(-0.1932605·t)  (t in min)
 *   VDOT       = VO2(v) / %VO2max(t)
 *
 * Why this runs in CODE instead of AI: exact math, zero token cost, unit-testable, and hallucination-free.
 * The AI receives precomputed ranges and only chooses which zone fits each workout.
 */

export type Zone = "E" | "M" | "T" | "I" | "R";
export type PaceRange = { fastSecKm: number; slowSecKm: number };

/** Estimated VDOT from a distance (m) and elapsed time (s). */
export function vdotFromEffort(distanceM: number, timeSec: number): number {
  const t = timeSec / 60;
  const v = distanceM / t;
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  return vo2 / pct;
}

/** Inverts VO2(v): solves the quadratic equation for velocity (m/min) at a given oxygen demand. */
function velocityForVo2(vo2: number): number {
  const a = 0.000104, b = 0.182258, c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** Pace (s/km) when running at a given fraction of VDOT. */
export const paceAtFraction = (vdot: number, fraction: number): number =>
  (1000 / velocityForVo2(fraction * vdot)) * 60;

/** [slow, fast] ranges for each zone as a fraction of VDOT (calibrated against published Daniels tables). */
const ZONE_FRACTION: Record<Zone, [slow: number, fast: number]> = {
  E: [0.62, 0.70], // easy (conversational)
  M: [0.80, 0.84], // marathon pace
  T: [0.86, 0.90], // threshold
  I: [0.96, 1.0], //  interval (VO2max)
  R: [1.03, 1.08], // repetition (speed)
};

export function trainingPaces(vdot: number): Record<Zone, PaceRange> {
  const out = {} as Record<Zone, PaceRange>;
  for (const z of Object.keys(ZONE_FRACTION) as Zone[]) {
    const [slowF, fastF] = ZONE_FRACTION[z];
    out[z] = {
      slowSecKm: Math.round(paceAtFraction(vdot, slowF)),
      fastSecKm: Math.round(paceAtFraction(vdot, fastF)),
    };
  }
  return out;
}

/** 359.6 s/km → "6:00" */
export function fmtPace(secKm: number): string {
  const total = Math.round(secKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
