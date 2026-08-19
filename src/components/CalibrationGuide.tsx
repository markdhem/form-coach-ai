import { Check, Loader2 } from "lucide-react";

type CalibrationGuideProps = {
  coverage: number;
  countdown: number | null;
  setup: string[];
};

export function CalibrationGuide({ coverage, countdown, setup }: CalibrationGuideProps) {
  const pct = Math.round(coverage * 100);
  const ready = coverage >= 1;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
      <div
        className={`mx-auto flex h-full w-[62%] max-w-sm items-center justify-center rounded-[2rem] border-2 border-dashed transition-colors ${
          ready ? "border-good/80" : "border-white/35"
        }`}
      >
        {countdown !== null ? (
          <span className="font-display text-[9rem] leading-none text-good drop-shadow-lg">
            {countdown}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl bg-card/85 p-4 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {ready ? (
            <Check className="size-4 text-good" />
          ) : (
            <Loader2 className="size-4 animate-spin text-warn" />
          )}
          <span>
            {ready ? "Full body detected — hold still" : `Body in frame: ${pct}%`}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${ready ? "bg-good" : "bg-warn"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {setup.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
