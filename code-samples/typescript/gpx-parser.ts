/**
 * Client-side GPX workout parser (runs in the browser).
 *
 * Goal: extract only what the training plan needs (date, distance, moving time, average HR)
 * and DISCARD all coordinates. GPS routes reveal where a runner lives; for privacy, they never leave the device.
 *
 * Robustness edge cases handled here (learned from real exports):
 *  - auto-pauses: gaps > 60 s between track points do not count as moving time;
 *  - GPS spikes: impossible running speeds (> 43 km/h) are ignored in distance;
 *  - XML namespaces (e.g., gpxtpx:hr) stripped so heart rate can be read reliably;
 *  - sport filtering: skips cycling/walking via `<type>` or activity name.
 */
import { XMLParser } from "fast-xml-parser";

export type Activity = { date: string; distanceM: number; durationS: number; avgHr?: number };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (name) => name === "trk" || name === "trkseg" || name === "trkpt",
});

/** Great-circle distance between two coordinates (Haversine formula), in meters. */
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const NOT_RUN = /bik|ride|cycl|pedal|walk|hik|swim/i;

export function parseGpx(xml: string): Activity | null {
  const trks = parser.parse(xml)?.gpx?.trk as Record<string, unknown>[] | undefined;
  if (!trks?.length) return null;
  if (NOT_RUN.test(String(trks[0].type ?? trks[0].name ?? ""))) return null;

  type Pt = { lat: number; lon: number; t: number; hr: number | null };
  const pts: Pt[] = [];
  for (const trk of trks) {
    for (const seg of (trk.trkseg as Record<string, unknown>[]) ?? []) {
      for (const p of (seg.trkpt as Record<string, unknown>[]) ?? []) {
        const t = Date.parse(String(p.time));
        if (!Number.isFinite(t)) continue;
        const hr = Number(JSON.stringify(p.extensions ?? "").match(/"hr":"?(\d+)/)?.[1]);
        pts.push({ lat: Number(p["@_lat"]), lon: Number(p["@_lon"]), t, hr: Number.isFinite(hr) ? hr : null });
      }
    }
  }
  if (pts.length < 2) return null;

  let distance = 0;
  let moving = 0;
  for (let i = 1; i < pts.length; i++) {
    const dt = (pts[i].t - pts[i - 1].t) / 1000;
    if (dt <= 0 || dt > 60) continue; // auto-pause
    const d = haversineM(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
    if (d / dt > 12) continue; // GPS spike
    distance += d;
    moving += dt;
  }
  if (distance < 100 || moving < 30) return null;

  const hrs = pts.map((p) => p.hr).filter((h): h is number => h !== null && h > 30 && h < 230);
  return {
    date: new Date(pts[0].t).toISOString(),
    distanceM: Math.round(distance),
    durationS: Math.round(moving),
    avgHr: hrs.length ? Math.round(hrs.reduce((s, h) => s + h, 0) / hrs.length) : undefined,
  };
}
