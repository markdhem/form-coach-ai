import type { RefObject, ReactNode } from "react";

type CameraStageProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  mirrored: boolean;
  children?: ReactNode;
};

export function CameraStage({ videoRef, canvasRef, mirrored, children }: CameraStageProps) {
  const transform = mirrored ? "scaleX(-1)" : undefined;
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform }}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ transform }}
      />
      {children}
    </div>
  );
}