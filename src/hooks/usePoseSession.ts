import { useCallback, useEffect, useRef, useState } from "react";
import { disposeDetector, getDetector, normalizeKeypoints } from "@/lib/pose/detector";
import { drawSkeleton, clearCanvas } from "@/lib/pose/draw";
import { toMap, visibleRatio } from "@/lib/pose/geometry";
import { EXERCISES } from "@/lib/pose/exercises";
import type { ExerciseId, FormIssue, RepPhase, SessionRecord } from "@/lib/pose/types";
import { makeSessionId, saveSession } from "@/lib/history";
import { useSpeechCues } from "./useSpeechCues";

export type SessionStatus =
  | "idle"
  | "loading"
  | "calibrating"
  | "countdown"
  | "tracking"
  | "paused"
  | "finished"
  | "error";

const CALIBRATION_HOLD_MS = 1500;
const TARGET_INTERVAL_MS = 1000 / 24;

export function usePoseSession(exercise: ExerciseId) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastFrameRef = useRef(0);
  const engineRef = useRef(EXERCISES[exercise].createEngine());
  const statusRef = useRef<SessionStatus>("idle");
  const readySinceRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const errorCountsRef = useRef<Record<string, number>>({});
  const repsRef = useRef({ total: 0, clean: 0 });
  const savedRef = useRef(false);

  const [status, setStatusState] = useState<SessionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coverage, setCoverage] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [reps, setReps] = useState({ total: 0, clean: 0 });
  const [phase, setPhase] = useState<RepPhase>("top");
  const [issues, setIssues] = useState<FormIssue[]>([]);
  const [fps, setFps] = useState(0);
  const [muted, setMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [summary, setSummary] = useState<SessionRecord | null>(null);

  const { speak, cancel } = useSpeechCues(!muted);

  const setStatus = useCallback((next: SessionStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stopLoop]);

  const buildSummary = useCallback((): SessionRecord => {
    const total = repsRef.current.total;
    const clean = repsRef.current.clean;
    const score = total === 0 ? 0 : Math.round((clean / total) * 100);
    return {
      id: makeSessionId(),
      startedAt: new Date(startedAtRef.current || Date.now()).toISOString(),
      exercise,
      durationMs: startedAtRef.current ? Date.now() - startedAtRef.current : 0,
      totalReps: total,
      cleanReps: clean,
      flaggedReps: total - clean,
      formScore: score,
      errorCounts: { ...errorCountsRef.current },
    };
  }, [exercise]);

  const finish = useCallback(() => {
    if (statusRef.current === "finished") return;
    stopCamera();
    cancel();
    const record = buildSummary();
    if (!savedRef.current && record.totalReps > 0) {
      savedRef.current = true;
      saveSession(record);
    }
    setSummary(record);
    setStatus("finished");
  }, [buildSummary, cancel, setStatus, stopCamera]);

  const tick = useCallback(async () => {
    rafRef.current = requestAnimationFrame(() => void tick());

    const state = statusRef.current;
    if (state !== "calibrating" && state !== "countdown" && state !== "tracking") return;
    if (busyRef.current) return;

    const now = performance.now();
    if (now - lastFrameRef.current < TARGET_INTERVAL_MS) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return;

    busyRef.current = true;
    try {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const detector = await getDetector();
      const poses = await detector.estimatePoses(video, { flipHorizontal: false });
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;
      setFps(Math.round(1000 / Math.max(delta, 1)));

      const ctx = canvas.getContext("2d");
      const pose = poses[0];
      if (!pose) {
        if (ctx) clearCanvas(ctx);
        setCoverage(0);
        readySinceRef.current = null;
        return;
      }

      const keypoints = normalizeKeypoints(pose.keypoints);
      const map = toMap(keypoints);
      const required = EXERCISES[exercise].requiredJoints;
      const ratio = visibleRatio(map, required);
      setCoverage(ratio);

      let frameIssues: FormIssue[] = [];

      if (statusRef.current === "tracking") {
        const result = engineRef.current.update(map, now);
        frameIssues = result.issues;
        setPhase(result.phase);
        setIssues(result.issues);
        for (const issue of result.issues) {
          errorCountsRef.current[issue.id] = (errorCountsRef.current[issue.id] ?? 0) + 1;
        }
        if (result.repCompleted) {
          repsRef.current = {
            total: repsRef.current.total + 1,
            clean: repsRef.current.clean + (result.repClean ? 1 : 0),
          };
          setReps({ ...repsRef.current });
        }
        for (const cue of result.cues) speak(cue);
      } else if (statusRef.current === "calibrating") {
        if (ratio >= 1) {
          readySinceRef.current = readySinceRef.current ?? now;
          if (now - readySinceRef.current >= CALIBRATION_HOLD_MS) {
            readySinceRef.current = null;
            setStatus("countdown");
          }
        } else {
          readySinceRef.current = null;
        }
      }

      if (ctx) drawSkeleton(ctx, keypoints, frameIssues);
    } catch (err) {
      console.error(err);
    } finally {
      busyRef.current = false;
    }
  }, [exercise, setStatus, speak]);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setStatus("loading");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser doesn't support camera access.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      await getDetector();
      engineRef.current = EXERCISES[exercise].createEngine();
      readySinceRef.current = null;
      setStatus("calibrating");
      stopLoop();
      rafRef.current = requestAnimationFrame(() => void tick());
    } catch (err) {
      const message =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access and try again."
          : err instanceof Error
            ? err.message
            : "Could not start the camera.";
      setErrorMessage(message);
      setStatus("error");
      stopCamera();
    }
  }, [exercise, facingMode, setStatus, stopCamera, stopLoop, tick]);

  // Countdown before tracking begins.
  useEffect(() => {
    if (status !== "countdown") return;
    setCountdown(3);
    let value = 3;
    speak("Get ready");
    const interval = setInterval(() => {
      value -= 1;
      if (value <= 0) {
        clearInterval(interval);
        engineRef.current.reset();
        repsRef.current = { total: 0, clean: 0 };
        errorCountsRef.current = {};
        savedRef.current = false;
        setReps({ total: 0, clean: 0 });
        setIssues([]);
        startedAtRef.current = Date.now();
        setStatus("tracking");
        speak("Go");
      } else {
        setCountdown(value);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [setStatus, speak, status]);

  const pause = useCallback(() => {
    if (statusRef.current !== "tracking") return;
    cancel();
    setStatus("paused");
  }, [cancel, setStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    setStatus("tracking");
  }, [setStatus]);

  const restart = useCallback(() => {
    savedRef.current = false;
    setSummary(null);
    setReps({ total: 0, clean: 0 });
    setIssues([]);
    void start();
  }, [start]);

  const flipCamera = useCallback(() => {
    setFacingMode((f) => (f === "user" ? "environment" : "user"));
  }, []);

  // Pause automatically when the tab is hidden, and always release the camera.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  useEffect(() => {
    return () => {
      stopCamera();
      cancel();
      disposeDetector();
    };
  }, [cancel, stopCamera]);

  return {
    videoRef,
    canvasRef,
    status,
    errorMessage,
    coverage,
    countdown,
    reps,
    phase,
    issues,
    fps,
    muted,
    setMuted,
    facingMode,
    flipCamera,
    summary,
    start,
    pause,
    resume,
    finish,
    restart,
    mirrored: facingMode === "user",
  };
}