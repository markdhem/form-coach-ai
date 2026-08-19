import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { SessionCard } from "@/components/SessionCard";
import { useSessionHistory } from "@/hooks/useSessionHistory";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Workout History — FormCheck AI" },
      {
        name: "description",
        content:
          "Review every squat and push-up session tracked on this device: reps, clean vs flagged reps, and form scores.",
      },
      { property: "og:title", content: "Workout History — FormCheck AI" },
      {
        property: "og:description",
        content: "Your saved training sessions with rep counts and form scores, stored on-device.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { sessions, stats, hydrated, remove, clear } = useSessionHistory();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-5">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <h1 className="mt-4 font-display text-4xl">History</h1>
      <p className="text-sm text-muted-foreground">
        Saved on this device only. Clearing your browser data removes it.
      </p>

      <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-4 text-center">
        <Stat label="Sessions" value={stats.sessions} />
        <Stat label="Reps" value={stats.totalReps} />
        <Stat label="Best" value={`${stats.bestScore}%`} />
        <Stat label="7 days" value={stats.lastSevenDayReps} />
      </div>

      {!hydrated ? null : sessions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
          <Link
            to="/"
            className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          >
            Start training
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={remove} />
            ))}
          </ul>

          <div className="mt-6">
            {confirmClear ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setConfirmClear(false);
                  }}
                  className="h-11 flex-1 rounded-xl bg-danger font-semibold text-danger-foreground"
                >
                  Yes, clear everything
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="h-11 flex-1 rounded-xl border border-border font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm text-muted-foreground"
              >
                <Trash2 className="size-4" /> Clear all history
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-2xl leading-none">{value}</p>
      <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}