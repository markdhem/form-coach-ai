import type { ExerciseId, SessionRecord } from "./pose/types";

const STORAGE_KEY = "formtracker.sessions.v1";
const MAX_SESSIONS = 100;

function isRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SessionRecord>;
  return (
    typeof v.id === "string" &&
    typeof v.startedAt === "string" &&
    (v.exercise === "squat" || v.exercise === "pushup") &&
    typeof v.totalReps === "number"
  );
}

export function loadSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  } catch {
    return [];
  }
}

function persist(sessions: SessionRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    // storage full or blocked — history is best-effort
  }
}

export function saveSession(record: SessionRecord): SessionRecord[] {
  const next = [record, ...loadSessions().filter((s) => s.id !== record.id)].slice(0, MAX_SESSIONS);
  persist(next);
  return next;
}

export function deleteSession(id: string): SessionRecord[] {
  const next = loadSessions().filter((s) => s.id !== id);
  persist(next);
  return next;
}

export function clearSessions(): SessionRecord[] {
  persist([]);
  return [];
}

export type HistoryStats = {
  sessions: number;
  totalReps: number;
  bestScore: number;
  lastSevenDayReps: number;
};

export function summarize(sessions: SessionRecord[]): HistoryStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    sessions: sessions.length,
    totalReps: sessions.reduce((sum, s) => sum + s.totalReps, 0),
    bestScore: sessions.reduce((best, s) => Math.max(best, s.formScore), 0),
    lastSevenDayReps: sessions
      .filter((s) => new Date(s.startedAt).getTime() >= weekAgo)
      .reduce((sum, s) => sum + s.totalReps, 0),
  };
}

export function makeSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ISSUE_LABELS: Record<string, string> = {
  shallow_depth: "Not deep enough",
  knee_valgus: "Knees caving in",
  hip_line: "Hips out of line",
  elbow_flare: "Elbows flaring out",
};

export const EXERCISE_LABELS: Record<ExerciseId, string> = {
  squat: "Squat",
  pushup: "Push-up",
};

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}