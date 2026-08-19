import { Smoothed, angleAt, clamp01, segmentAngle, visible } from "./geometry";
import type { FormEngine, FormIssue, FrameResult, KeypointMap, RepPhase } from "./types";

const TOP_ANGLE = 155;
const BOTTOM_ANGLE = 95;
const SPINE_MIN = 160;
const ELBOW_FLARE_MAX = 75;

export const PUSHUP_JOINTS = [
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_ankle",
  "right_ankle",
];

export function createPushupEngine(): FormEngine {
  const elbow = new Smoothed(0.45);
  let phase: RepPhase = "top";
  let minElbowAngle = 180;
  let repIssues = new Set<string>();

  const reset = () => {
    elbow.reset();
    phase = "top";
    minElbowAngle = 180;
    repIssues = new Set();
  };

  return {
    id: "pushup",
    requiredJoints: PUSHUP_JOINTS,
    reset,
    update(kp: KeypointMap): FrameResult {
      const issues: FormIssue[] = [];
      const cues: string[] = [];

      const elbowAngles: number[] = [];
      for (const side of ["left", "right"] as const) {
        const sh = kp[`${side}_shoulder`];
        const el = kp[`${side}_elbow`];
        const wr = kp[`${side}_wrist`];
        if (visible(sh) && visible(el) && visible(wr)) elbowAngles.push(angleAt(sh, el, wr));
      }

      if (elbowAngles.length === 0) {
        return { phase, depth: 0, issues, repCompleted: false, repClean: true, cues };
      }

      const raw = elbowAngles.reduce((a, b) => a + b, 0) / elbowAngles.length;
      const elbowAngle = elbow.push(raw);
      const depth = clamp01((TOP_ANGLE - elbowAngle) / (TOP_ANGLE - 70));

      // Spine line: shoulder-hip-ankle should stay close to straight.
      for (const side of ["left", "right"] as const) {
        const sh = kp[`${side}_shoulder`];
        const hip = kp[`${side}_hip`];
        const ankle = kp[`${side}_ankle`];
        if (visible(sh) && visible(hip) && visible(ankle)) {
          const spine = angleAt(sh, hip, ankle);
          if (spine < SPINE_MIN) {
            issues.push({
              id: "hip_line",
              label: "Hips out of line",
              cue: "Straighten your hips",
              severity: "error",
              joints: [`${side}_shoulder`, `${side}_hip`, `${side}_ankle`],
            });
          }
          break;
        }
      }

      // Elbow flare: upper arm angle relative to the torso line.
      for (const side of ["left", "right"] as const) {
        const sh = kp[`${side}_shoulder`];
        const el = kp[`${side}_elbow`];
        const hip = kp[`${side}_hip`];
        if (visible(sh) && visible(el) && visible(hip)) {
          const flare = 90 - segmentAngle(sh, el, sh, hip);
          if (flare > ELBOW_FLARE_MAX && elbowAngle < 150) {
            issues.push({
              id: "elbow_flare",
              label: "Elbows flaring out",
              cue: "Tuck your elbows",
              severity: "warn",
              joints: [`${side}_shoulder`, `${side}_elbow`],
            });
          }
          break;
        }
      }

      if (elbowAngle < minElbowAngle) minElbowAngle = elbowAngle;

      let repCompleted = false;
      let repClean = true;

      if (phase === "top" && elbowAngle < TOP_ANGLE - 12) phase = "descending";
      else if (phase === "descending" && elbowAngle <= BOTTOM_ANGLE + 15) phase = "bottom";
      else if (phase === "bottom" && elbowAngle > minElbowAngle + 12) phase = "ascending";
      else if (phase === "ascending" && elbowAngle >= TOP_ANGLE) {
        if (minElbowAngle > BOTTOM_ANGLE) repIssues.add("shallow_depth");
        repCompleted = true;
        repClean = repIssues.size === 0;
        if (repIssues.has("shallow_depth")) cues.push("Lower your chest");
        else if (repIssues.has("hip_line")) cues.push("Straighten your hips");
        else if (repIssues.has("elbow_flare")) cues.push("Tuck your elbows");
        else cues.push("Good rep");
        repIssues = new Set();
        minElbowAngle = 180;
        phase = "top";
      }

      if (phase === "bottom" && elbowAngle > BOTTOM_ANGLE + 20) {
        issues.push({
          id: "shallow_depth",
          label: "Not deep enough",
          cue: "Lower your chest",
          severity: "warn",
          joints: ["left_elbow", "right_elbow"],
        });
      }

      for (const issue of issues) repIssues.add(issue.id);
      for (const issue of issues) if (issue.severity === "error") cues.push(issue.cue);

      return { phase, depth, issues, repCompleted, repClean, cues };
    },
  };
}