import { Smoothed, angleAt, clamp01, visible } from "./geometry";
import type { FormEngine, FormIssue, FrameResult, KeypointMap, RepPhase } from "./types";

const TOP_ANGLE = 160;
const BOTTOM_ANGLE = 100;
const DEPTH_TARGET = 90;

export const SQUAT_JOINTS = [
  "left_shoulder",
  "right_shoulder",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
];

export function createSquatEngine(): FormEngine {
  const knee = new Smoothed(0.45);
  let phase: RepPhase = "top";
  let minKneeAngle = 180;
  let repIssues = new Set<string>();

  const reset = () => {
    knee.reset();
    phase = "top";
    minKneeAngle = 180;
    repIssues = new Set();
  };

  return {
    id: "squat",
    requiredJoints: SQUAT_JOINTS,
    reset,
    update(kp: KeypointMap): FrameResult {
      const issues: FormIssue[] = [];
      const cues: string[] = [];

      const angles: number[] = [];
      for (const side of ["left", "right"] as const) {
        const hip = kp[`${side}_hip`];
        const kn = kp[`${side}_knee`];
        const ankle = kp[`${side}_ankle`];
        if (visible(hip) && visible(kn) && visible(ankle)) angles.push(angleAt(hip, kn, ankle));
      }

      if (angles.length === 0) {
        return { phase, depth: 0, issues, repCompleted: false, repClean: true, cues };
      }

      const raw = angles.reduce((a, b) => a + b, 0) / angles.length;
      const kneeAngle = knee.push(raw);
      const depth = clamp01((TOP_ANGLE - kneeAngle) / (TOP_ANGLE - 70));

      // Knee valgus: knees drifting inside the ankles relative to hip width.
      const lk = kp["left_knee"];
      const rk = kp["right_knee"];
      const la = kp["left_ankle"];
      const ra = kp["right_ankle"];
      if (visible(lk) && visible(rk) && visible(la) && visible(ra)) {
        const kneeWidth = Math.abs(lk.x - rk.x);
        const ankleWidth = Math.abs(la.x - ra.x);
        if (ankleWidth > 1 && kneeWidth / ankleWidth < 0.75 && kneeAngle < 150) {
          issues.push({
            id: "knee_valgus",
            label: "Knees caving in",
            cue: "Push your knees out",
            severity: "error",
            joints: ["left_knee", "right_knee", "left_ankle", "right_ankle"],
          });
        }
      }

      // Track the deepest point of the current rep.
      if (kneeAngle < minKneeAngle) minKneeAngle = kneeAngle;

      let repCompleted = false;
      let repClean = true;
      const prevPhase = phase;

      if (phase === "top" && kneeAngle < TOP_ANGLE - 12) phase = "descending";
      else if (phase === "descending" && kneeAngle <= BOTTOM_ANGLE + 15) phase = "bottom";
      else if (phase === "bottom" && kneeAngle > minKneeAngle + 12) phase = "ascending";
      else if (phase === "ascending" && kneeAngle >= TOP_ANGLE) {
        // Rep finished — evaluate depth at the bottom.
        if (minKneeAngle > DEPTH_TARGET) {
          repIssues.add("shallow_depth");
        }
        repCompleted = true;
        repClean = repIssues.size === 0;
        if (repIssues.has("shallow_depth")) cues.push("Go lower");
        else if (repIssues.has("knee_valgus")) cues.push("Push your knees out");
        else cues.push("Good rep");
        repIssues = new Set();
        minKneeAngle = 180;
        phase = "top";
      }

      if (phase === "bottom" && kneeAngle > DEPTH_TARGET + 15) {
        issues.push({
          id: "shallow_depth",
          label: "Not deep enough",
          cue: "Go lower",
          severity: "warn",
          joints: ["left_knee", "right_knee", "left_hip", "right_hip"],
        });
      }

      for (const issue of issues) repIssues.add(issue.id);
      if (prevPhase !== "bottom" && phase === "bottom" && minKneeAngle > DEPTH_TARGET + 15) {
        cues.push("Go lower");
      }
      if (issues.some((i) => i.id === "knee_valgus")) cues.push("Push your knees out");

      return { phase, depth, issues, repCompleted, repClean, cues };
    },
  };
}