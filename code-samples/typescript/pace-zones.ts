/**
 * Zonas de ritmo a partir do VDOT (modelo de Jack Daniels).
 *
 * Ideia: dado UM esforço recente (ex.: 5 km em 25:00), estimar a "capacidade aeróbia" (VDOT)
 * e derivar os ritmos de treino (leve, maratona, limiar, intervalado, repetição).
 *
 *   VO2(v)     = -4,60 + 0,182258·v + 0,000104·v²                (v em m/min)
 *   %VO2max(t) = 0,8 + 0,1894393·e^(-0,012778·t) + 0,2989558·e^(-0,1932605·t)   (t em min)
 *   VDOT       = VO2(v) / %VO2max(t)
 *
 * Por que isso é feito em CÓDIGO e não pela IA: é uma conta exata, barata, testável e sem "alucinação".
 * A IA só recebe as faixas prontas e escolhe em qual zona cada treino cai.
 */

export type Zone = "E" | "M" | "T" | "I" | "R";
export type PaceRange = { fastSecKm: number; slowSecKm: number };

/** VDOT estimado a partir de uma distância (m) e um tempo (s). */
export function vdotFromEffort(distanceM: number, timeSec: number): number {
  const t = timeSec / 60;
  const v = distanceM / t;
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  return vo2 / pct;
}

/** Inverte VO2(v): resolve a equação de 2º grau para achar a velocidade (m/min) de um consumo de O2. */
function velocityForVo2(vo2: number): number {
  const a = 0.000104, b = 0.182258, c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** Ritmo (s/km) quando se corre a uma fração do VDOT. */
export const paceAtFraction = (vdot: number, fraction: number): number =>
  (1000 / velocityForVo2(fraction * vdot)) * 60;

/** Faixas [mais lento, mais rápido] de cada zona, como fração do VDOT (calibradas contra as tabelas publicadas). */
const ZONE_FRACTION: Record<Zone, [slow: number, fast: number]> = {
  E: [0.62, 0.70], // leve (conversa fácil)
  M: [0.80, 0.84], // ritmo de maratona
  T: [0.86, 0.90], // limiar
  I: [0.96, 1.0], //  intervalado (VO2máx)
  R: [1.03, 1.08], // repetição (velocidade)
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

/** 359,6 s/km → "6:00" */
export function fmtPace(secKm: number): string {
  const total = Math.round(secKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
