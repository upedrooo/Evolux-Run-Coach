import { describe, expect, it } from "vitest";
import { haversineM, parseGpx } from "../gpx-parser";

/** Synthetic GPX: running due north at 6:00/km (2.778 m/s), 1 track point per second. */
function makeGpx(opts: { type?: string; name?: string; secs?: number; hr?: number; jumpAtSec?: number } = {}): string {
  const { type, name = "Morning Run", secs = 1800, hr, jumpAtSec } = opts;
  const t0 = Date.parse("2026-08-01T09:00:00Z");
  const pts: string[] = [];
  for (let i = 0; i <= secs; i++) {
    const lat = (i === jumpAtSec ? -20 : -23.5) + (i * 2.778) / 111320; // ~380 km GPS spike on a single point
    const ext = hr ? `<extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>${hr}</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>` : "";
    pts.push(`<trkpt lat="${lat}" lon="-46.6"><time>${new Date(t0 + i * 1000).toISOString()}</time>${ext}</trkpt>`);
  }
  return `<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"><trk><name>${name}</name>${type ? `<type>${type}</type>` : ""}<trkseg>${pts.join("")}</trkseg></trk></gpx>`;
}

describe("GPX parsing", () => {
  it("computes distance, moving time, average HR, and date", () => {
    const a = parseGpx(makeGpx({ type: "running", hr: 150 }))!;
    expect(a.distanceM).toBeGreaterThan(4950);
    expect(a.distanceM).toBeLessThan(5050);
    expect(a.durationS).toBe(1800);
    expect(a.avgHr).toBe(150);
    expect(a.date).toBe("2026-08-01T09:00:00.000Z");
  });

  it("ignores cycling (by type or name) and invalid files", () => {
    expect(parseGpx(makeGpx({ type: "cycling" }))).toBeNull();
    expect(parseGpx(makeGpx({ name: "Morning Ride" }))).toBeNull();
    expect(parseGpx("not xml")).toBeNull();
  });

  it("discards GPS spikes from distance calculation", () => {
    const a = parseGpx(makeGpx({ secs: 600, jumpAtSec: 300 }))!;
    expect(a.distanceM).toBeLessThan(2000); // without the filter, the ~380 km spike would inflate distance
  });

  it("Haversine: 1 degree of latitude ≈ 111 km", () => {
    expect(haversineM(0, 0, 1, 0) / 1000).toBeCloseTo(111.2, 0);
  });
});
