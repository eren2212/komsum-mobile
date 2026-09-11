import { apiClient } from "./client";

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

function unwrap<T>(entity: RootEntity<T>): T {
  if (!entity.result) {
    throw new Error(entity.errormessage ?? "Sunucu hatası.");
  }
  return entity.data;
}

// ─── Tipler ───────────────────────────────────────────────────────────────────

/** Backend TaskType enum ile birebir eşleşir */
export type TaskType = "CREATE_POST" | "JOIN_EVENT" | "WRITE_COMMENT";

export interface DtoDailyTask {
  type: TaskType;
  title: string;
  description?: string | null;
  pointsValue: number;
  completed: boolean;
}

export interface DtoBadge {
  id: number;
  name: string;
  description?: string | null;
  pointThreshold: number;
  iconUrl?: string | null;
  earned: boolean;
  earnedAt?: string | null;
}

export interface DtoPointsSummary {
  totalPoints: number;
  earnedBadgeCount: number;
  badges: DtoBadge[];
  pointsToNextBadge?: number | null;
  nextBadgeName?: string | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const taskApi = {
  getTodayTasks: (): Promise<DtoDailyTask[]> =>
    apiClient
      .get<RootEntity<DtoDailyTask[]>>("/api/tasks/today")
      .then((res) => unwrap(res.data)),

  getMyPointsSummary: (): Promise<DtoPointsSummary> =>
    apiClient
      .get<RootEntity<DtoPointsSummary>>("/api/tasks/me/summary")
      .then((res) => unwrap(res.data)),
};
