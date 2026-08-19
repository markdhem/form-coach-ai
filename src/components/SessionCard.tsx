import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { EXERCISE_LABELS, ISSUE_LABELS, formatDuration } from "@/lib/history";
import type { SessionRecord } from "@/lib/pose/types";

export function SessionCard({
  session,
  onDelete,
}: {
  session: SessionRecord;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const errors = Object.entries(session.errorCounts).sort((a, b) => b[1] - a[1]);
  const date = new Date(session.startedAt);

  return (
    <li className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex-1">
          <p className="font-semibold">{EXERCISE_LABELS[session.exercise]}</p>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
            {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} ·{" "}
            {formatDuration(session.durationMs)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl leading-none">{session.totalReps}</p>
          <p className="text-xs text-muted-foreground">reps</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${
            session.formScore >= 80
              ? "bg-good text-good-foreground"
              : session.formScore >= 50
                ? "bg-warn text-warn-foreground"
                : "bg-danger text-danger-foreground"
          }`}
        >
          {session.formScore}%
        </span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            {session.cleanReps} clean · {session.flaggedReps} flagged
          </p>
          {errors.length === 0 ? (
            <p className="text-sm text-good">No form errors detected.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {errors.map(([id, count]) => (
                <li key={id} className="flex justify-between">
                  <span>{ISSUE_LABELS[id] ?? id}</span>
                  <span className="text-muted-foreground">{count} frames</span>
                </li>
              ))}
            </ul>
          )}
          {confirming ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onDelete(session.id)}
                className="h-10 flex-1 rounded-xl bg-danger text-sm font-semibold text-danger-foreground"
              >
                Delete session
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-10 flex-1 rounded-xl border border-border text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          )}
        </div>
      ) : null}
    </li>
  );
}