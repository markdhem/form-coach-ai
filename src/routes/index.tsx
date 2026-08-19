import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, History, ShieldCheck, Zap } from "lucide-react";
import { EXERCISE_LIST } from "@/lib/pose/exercises";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { EXERCISE_LABELS } from "@/lib/history";

const TITLE = "FormCheck AI — Live Workout Form Tracker";
const DESCRIPTION =
  "Turn your phone camera into a real-time form coach. On-device AI counts your squat and push-up reps, scores your technique, and calls out mistakes as they happen.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  const { sessions, hydrated } = useSessionHistory();
  const recent = sessions.slice(0, 3);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-5">
      <header className="pt-6">
        <p className="text-xs uppercase tracking-[0.3em] text-good">FormCheck AI</p>
        <h1 className="mt-2 font-display text-5xl leading-[0.95]">
          Your camera is
          <br />
          the coach.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Real-time pose tracking counts your reps, scores your form, and corrects you out loud —
          all processed on your device.
        </p>
      </header>

      <div className="mt-5 flex gap-2 text-[0.7rem]">
        <Badge icon={<ShieldCheck className="size-3.5" />} label="100% on-device" />
        <Badge icon={<Zap className="size-3.5" />} label="Instant cues" />
      </div>

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Choose an exercise
        </h2>
        <div className="mt-3 space-y-3">
          {EXERCISE_LIST.map((exercise) => (
            <Link
              key={exercise.id}
              to="/session/$exercise"
              params={{ exercise: exercise.id }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-good"
            >
              <div className="flex-1">
                <p className="font-display text-3xl leading-none">{exercise.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{exercise.tagline}</p>
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {exercise.watchFor.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>

      {hydrated && recent.length > 0 ? (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Recent sessions
            </h2>
            <Link to="/history" className="inline-flex items-center gap-1 text-xs text-good">
              <History className="size-3.5" /> All
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {recent.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
              >
                <span>{EXERCISE_LABELS[s.exercise]}</span>
                <span className="text-muted-foreground">
                  {s.totalReps} reps · {s.formScore}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Sessions you finish are saved to this device so you can track progress over time.
        </p>
      )}
    </main>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}
