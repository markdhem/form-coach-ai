import type { Keypoint, KeypointMap } from "./types";

export const MIN_CONFIDENCE = 0.5;

export function toMap(keypoints: Keypoint[]): KeypointMap {
  const map: KeypointMap = {};
  for (const kp of keypoints) map[kp.name] = kp;
  return map;
}

export function visible(kp: Keypoint | undefined): kp is Keypoint {
  return !!kp && kp.score >= MIN_CONFIDENCE;
}

export function allVisible(map: KeypointMap, names: string[]): boolean {
  return names.every((n) => visible(map[n]));
}

export function visibleRatio(map: KeypointMap, names: string[]): number {
  if (names.length === 0) return 0;
  return names.filter((n) => visible(map[n])).length / names.length;
}

/** Interior angle at point b, formed by a-b-c, in degrees (0..180). */
export function angleAt(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magA = Math.hypot(abx, aby);
  const magC = Math.hypot(cbx, cby);
  if (magA === 0 || magC === 0) return 180;
  const cos = Math.min(1, Math.max(-1, dot / (magA * magC)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Smallest angle between segment a-b and segment c-d, in degrees (0..90). */
export function segmentAngle(a: Keypoint, b: Keypoint, c: Keypoint, d: Keypoint): number {
  const v1 = { x: b.x - a.x, y: b.y - a.y };
  const v2 = { x: d.x - c.x, y: d.y - c.y };
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.abs((v1.x * v2.x + v1.y * v2.y) / (m1 * m2));
  return (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
}

export function midpoint(a: Keypoint, b: Keypoint): Keypoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score, b.score),
    name: "mid",
  };
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Simple exponential smoothing helper for noisy angle signals. */
export class Smoothed {
  private value: number | null = null;
  constructor(private readonly alpha = 0.4) {}
  push(v: number): number {
    this.value = this.value === null ? v : this.alpha * v + (1 - this.alpha) * this.value;
    return this.value;
  }
  get current(): number | null {
    return this.value;
  }
  reset() {
    this.value = null;
  }
}