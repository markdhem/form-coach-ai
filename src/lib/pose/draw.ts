import { SKELETON_EDGES } from "./detector";
import { MIN_CONFIDENCE } from "./geometry";
import type { FormIssue, Keypoint, Severity } from "./types";

const COLORS: Record<Severity, string> = {
  good: "#b8ff2e",
  warn: "#ffc531",
  error: "#ff4d4d",
};

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  issues: FormIssue[],
) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  if (keypoints.length === 0) return;

  const byName = new Map(keypoints.map((kp) => [kp.name, kp]));
  const jointSeverity = new Map<string, Severity>();
  for (const issue of issues) {
    for (const joint of issue.joints) {
      const current = jointSeverity.get(joint);
      if (current === "error") continue;
      jointSeverity.set(joint, issue.severity);
    }
  }

  const severityFor = (...names: string[]): Severity => {
    let result: Severity = "good";
    for (const n of names) {
      const s = jointSeverity.get(n);
      if (s === "error") return "error";
      if (s === "warn") result = "warn";
    }
    return result;
  };

  const scale = Math.max(width, height) / 480;
  ctx.lineCap = "round";

  for (const [a, b] of SKELETON_EDGES) {
    const ka = byName.get(a);
    const kb = byName.get(b);
    if (!ka || !kb) continue;
    const faded = ka.score < MIN_CONFIDENCE || kb.score < MIN_CONFIDENCE;
    ctx.globalAlpha = faded ? 0.18 : 0.95;
    ctx.strokeStyle = COLORS[severityFor(a, b)];
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(ka.x, ka.y);
    ctx.lineTo(kb.x, kb.y);
    ctx.stroke();
  }

  for (const kp of keypoints) {
    if (kp.name.includes("eye") || kp.name.includes("ear")) continue;
    const faded = kp.score < MIN_CONFIDENCE;
    ctx.globalAlpha = faded ? 0.2 : 1;
    ctx.fillStyle = COLORS[severityFor(kp.name)];
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}