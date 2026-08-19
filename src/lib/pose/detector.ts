import type { Keypoint } from "./types";

type Detector = {
  estimatePoses: (
    input: HTMLVideoElement | HTMLCanvasElement,
    config?: { flipHorizontal?: boolean },
  ) => Promise<Array<{ keypoints: Array<{ x: number; y: number; score?: number; name?: string }> }>>;
  dispose?: () => void;
};

let detectorPromise: Promise<Detector> | null = null;

/**
 * Loads MoveNet SinglePose Lightning lazily, in the browser only.
 * Model weights are fetched from the TF Hub CDN so nothing bloats the bundle.
 */
export async function getDetector(): Promise<Detector> {
  if (typeof window === "undefined") throw new Error("Pose detection is browser-only");
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const tf = await import("@tensorflow/tfjs-core");
      await import("@tensorflow/tfjs-backend-webgl");
      await import("@tensorflow/tfjs-converter");
      const poseDetection = await import("@tensorflow-models/pose-detection");

      try {
        await tf.setBackend("webgl");
      } catch {
        // fall through to whatever backend is registered
      }
      await tf.ready();

      return (await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      })) as unknown as Detector;
    })();
  }
  return detectorPromise;
}

export function disposeDetector() {
  const pending = detectorPromise;
  detectorPromise = null;
  void pending?.then((d) => d.dispose?.()).catch(() => undefined);
}

export function normalizeKeypoints(
  raw: Array<{ x: number; y: number; score?: number; name?: string }>,
): Keypoint[] {
  return raw.map((kp, i) => ({
    x: kp.x,
    y: kp.y,
    score: kp.score ?? 0,
    name: kp.name ?? String(i),
  }));
}

export const SKELETON_EDGES: Array<[string, string]> = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];