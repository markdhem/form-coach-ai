import { Pause, Play, SwitchCamera, Volume2, VolumeX, Square } from "lucide-react";
import type { FormIssue, RepPhase } from "@/lib/pose/types";

type TrackingHUDProps = {
  exerciseName: string;
  reps: { total: number; clean: number };
  phase: RepPhase;
  issues: FormIssue[];
  fps: number;
  paused: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onFlipCamera: () => void;
  onFinish: () => void;
};

const PHASE_LABEL: Record<RepPhase, string> = {
  top: "Ready",
  descending: "Lowering",
  bottom: "Bottom",
  ascending: "Driving up",
};

export function TrackingHUD({
  exerciseName,
  reps,
  phase,
  issues,
  fps,
  paused,
  muted,
  onToggleMute,
  onTogglePause,
  onFlipCamera,
  onFinish,
}: TrackingHUDProps) {
  const worst = issues.find((i) => i.severity === "error") ?? issues[0];
  const score = reps.total === 0 ? 100 : Math.round((reps.clean / reps.total) * 100);
  const badge = worst
    ? worst.severity === "error"
      ? "bg-danger text-danger-foreground"
      : "bg-warn text-warn-foreground"
    : "bg-good text-good-foreground";

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-card/80 px-4 py-3 backdrop-blur">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            {exerciseName}
          </p>
          <p className="font-display text-6xl leading-none">{reps.total}</p>
          <p className="text-xs text-muted-foreground">
            {reps.clean} clean · {reps.total - reps.clean} flagged
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge}`}>
            {worst ? worst.label : "Good form"}
          </span>
          <span className="rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            {score}% · {PHASE_LABEL[phase]} · {fps} fps
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {worst ? (
          <div
            className={`rounded-2xl px-4 py-3 text-center text-lg font-semibold ${
              worst.severity === "error"
                ? "bg-danger text-danger-foreground"
                : "bg-warn text-warn-foreground"
            }`}
          >
            {worst.cue}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-card/85 p-2 backdrop-blur">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute coaching cues" : "Mute coaching cues"}
            className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <button
            type="button"
            onClick={onFlipCamera}
            aria-label="Switch camera"
            className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
          >
            <SwitchCamera className="size-5" />
          </button>
          <button
            type="button"
            onClick={onTogglePause}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"
          >
            {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-danger px-4 font-semibold text-danger-foreground"
          >
            <Square className="size-4" />
            End
          </button>
        </div>
      </div>
    </div>
  );
}