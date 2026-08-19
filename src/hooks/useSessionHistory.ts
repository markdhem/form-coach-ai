import { useCallback, useEffect, useState } from "react";
import {
  clearSessions,
  deleteSession,
  loadSessions,
  summarize,
  type HistoryStats,
} from "@/lib/history";
import type { SessionRecord } from "@/lib/pose/types";

export function useSessionHistory(): {
  sessions: SessionRecord[];
  stats: HistoryStats;
  hydrated: boolean;
  remove: (id: string) => void;
  clear: () => void;
  refresh: () => void;
} {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setHydrated(true);
  }, []);

  const refresh = useCallback(() => setSessions(loadSessions()), []);
  const remove = useCallback((id: string) => setSessions(deleteSession(id)), []);
  const clear = useCallback(() => setSessions(clearSessions()), []);

  return { sessions, stats: summarize(sessions), hydrated, remove, clear, refresh };
}