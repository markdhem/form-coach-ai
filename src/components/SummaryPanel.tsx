import { Link } from "@tanstack/react-router";
import { RotateCcw, History, Dumbbell } from "lucide-react";
import { EXERCISE_LABELS, ISSUE_LABELS, formatDuration } from "@/lib/history";
import type { SessionRecord } from "@/lib/pose/types";

export function SummaryPanel({ record, onRestart }: { record: SessionRecord; onRestart: () => void }) {
  const errors = Object.entries(record.errorCounts).sort((a, b) => b[1] - a[1]);
  const totalErrorFrames = errors.reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 p-5">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Session complete</p>
        <h1 className="font-display text-4xl">{EXERCISE_LABELS[record.exercise]}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDuration(record.durationMs)} · saved to your history on this device
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total reps" value={record.totalReps} />
        <Stat label="Form score" value={`${record.formScore}%`} accent />
        <Stat label="Clean reps" value={record.cleanReps} />
        <Stat label="Flagged reps" value={record.flaggedReps} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">What to work on</h2>
        {errors.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No form errors detected. Clean session.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {errors.map(([id, count]) => (
              <li key={id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{ISSUE_LABELS[id] ?? id}</span>
                  <span className="text-muted-foreground">
                    {Math.round((count / Math.max(totalErrorFrames, 1)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warn"
                    style={{ width: `${Math.round((count / Math.max(totalErrorFrames, 1)) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"
        >
          <RotateCcw className="size-4" /> Go again
        </button>
        <Link
          to="/history"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary font-semibold text-secondary-foreground"
        >
          <History className="size-4" /> View history
        </Link>
        <Link
          to="/"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border font-semibold"
        >
          <Dumbbell className="size-4" /> Pick another exercise
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display text-4xl ${accent ? "text-good" : ""}`}>{value}</p>
    </div>
  );
}