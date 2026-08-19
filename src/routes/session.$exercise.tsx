import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { CameraStage } from "@/components/CameraStage";
import { CalibrationGuide } from "@/components/CalibrationGuide";
import { TrackingHUD } from "@/components/TrackingHUD";
import { SummaryPanel } from "@/components/SummaryPanel";
import { usePoseSession } from "@/hooks/usePoseSession";
import { EXERCISES, isExerciseId } from "@/lib/pose/exercises";

export const Route = createFileRoute("/session/$exercise")({
  beforeLoad: ({ params }) => {
    if (!isExerciseId(params.exercise)) throw notFound();
  },
  head: ({ params }) => {
    const name = isExerciseId(params.exercise) ? EXERCISES[params.exercise].name : "Workout";
    const title = `${name} Form Session — FormCheck AI`;
    const description = `Live ${name.toLowerCase()} tracking with on-device pose detection: automatic rep counting, form scoring, and instant voice corrections.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: SessionPage,
});

function SessionPage() {
  const { exercise } = Route.useParams();
  const navigate = useNavigate();
  const meta = EXERCISES[exercise as "squat" | "pushup"];
  const session = usePoseSession(meta.id);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (session.status === "finished" && session.summary) {
    return (
      <main className="min-h-screen">
        <SummaryPanel record={session.summary} onRestart={session.restart} />
      </main>
    );
  }

  const showStartScreen = session.status === "idle" || session.status === "error";

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <CameraStage
        videoRef={session.videoRef}
        canvasRef={session.canvasRef}
        mirrored={session.mirrored}
      >
        {session.status === "calibrating" || session.status === "countdown" ? (
          <CalibrationGuide
            coverage={session.coverage}
            countdown={session.status === "countdown" ? session.countdown : null}
            setup={meta.setup}
          />
        ) : null}

        {session.status === "tracking" || session.status === "paused" ? (
          <TrackingHUD
            exerciseName={meta.name}
            reps={session.reps}
            phase={session.phase}
            issues={session.status === "paused" ? [] : session.issues}
            fps={session.fps}
            paused={session.status === "paused"}
            muted={session.muted}
            onToggleMute={() => session.setMuted(!session.muted)}
            onTogglePause={session.status === "paused" ? session.resume : session.pause}
            onFlipCamera={session.flipCamera}
            onFinish={session.finish}
          />
        ) : null}

        {session.status === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90">
            <Loader2 className="size-8 animate-spin text-good" />
            <p className="text-sm text-muted-foreground">Loading the on-device pose model…</p>
          </div>
        ) : null}

        {showStartScreen ? (
          <div className="absolute inset-0 flex flex-col justify-end bg-background/95 p-5">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="absolute left-5 top-5 inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <ArrowLeft className="size-4" /> Back
            </button>

            <div className="mx-auto w-full max-w-md space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  {meta.tagline}
                </p>
                <h1 className="font-display text-5xl">{meta.name}</h1>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {meta.setup.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
              {session.errorMessage ? (
                <p className="rounded-xl bg-danger/15 p-3 text-sm text-danger">
                  {session.errorMessage}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!mounted}
                onClick={() => void session.start()}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground disabled:opacity-50"
              >
                <Camera className="size-5" />
                {session.status === "error" ? "Try again" : "Enable camera & start"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Video is processed entirely on your device. Nothing is uploaded or recorded.
              </p>
            </div>
          </div>
        ) : null}
      </CameraStage>
    </main>
  );
}