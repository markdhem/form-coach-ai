import { createPushupEngine, PUSHUP_JOINTS } from "./pushup";
import { createSquatEngine, SQUAT_JOINTS } from "./squat";
import type { ExerciseId, FormEngine } from "./types";

export type ExerciseMeta = {
  id: ExerciseId;
  name: string;
  tagline: string;
  setup: string[];
  watchFor: string[];
  requiredJoints: string[];
  createEngine: () => FormEngine;
};

export const EXERCISES: Record<ExerciseId, ExerciseMeta> = {
  squat: {
    id: "squat",
    name: "Squat",
    tagline: "Depth + knee tracking",
    setup: [
      "Prop your phone at hip height, 2–3 m away",
      "Stand side-on or at 45° to the camera",
      "Make sure head to ankles stay in frame",
    ],
    watchFor: ["Squat depth below parallel", "Knees caving inward"],
    requiredJoints: SQUAT_JOINTS,
    createEngine: createSquatEngine,
  },
  pushup: {
    id: "pushup",
    name: "Push-up",
    tagline: "Elbow path + hip line",
    setup: [
      "Place your phone on the floor, 2–3 m to your side",
      "Set up fully side-on to the camera",
      "Keep shoulders through ankles in frame",
    ],
    watchFor: ["Elbows flaring out", "Hips sagging or piking"],
    requiredJoints: PUSHUP_JOINTS,
    createEngine: createPushupEngine,
  },
};

export const EXERCISE_LIST = Object.values(EXERCISES);

export function isExerciseId(value: string): value is ExerciseId {
  return value === "squat" || value === "pushup";
}