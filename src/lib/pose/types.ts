export type Keypoint = {
  x: number;
  y: number;
  score: number;
  name: string;
};

export type KeypointMap = Record<string, Keypoint | undefined>;

export type Severity = "good" | "warn" | "error";

export type ExerciseId = "squat" | "pushup";

export type FormIssue = {
  id: string;
  label: string;
  cue: string;
  severity: Severity;
  /** joint names involved, used to color the skeleton */
  joints: string[];
};

export type RepPhase = "top" | "descending" | "bottom" | "ascending";

export type FrameResult = {
  phase: RepPhase;
  /** 0..1 progress through the range of motion */
  depth: number;
  issues: FormIssue[];
  repCompleted: boolean;
  repClean: boolean;
  /** cues to speak on this frame */
  cues: string[];
};

export interface FormEngine {
  readonly id: ExerciseId;
  readonly requiredJoints: string[];
  reset(): void;
  update(kp: KeypointMap, timeMs: number): FrameResult;
}

export type SessionRecord = {
  id: string;
  startedAt: string;
  exercise: ExerciseId;
  durationMs: number;
  totalReps: number;
  cleanReps: number;
  flaggedReps: number;
  formScore: number;
  errorCounts: Record<string, number>;
};