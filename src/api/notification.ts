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

export type NotificationType = "NEW_POST" | "NEW_EVENT" | "NEW_MESSAGE";
export type RelatedEntityType = "POST" | "EVENT" | "CHAT_ROOM";

export interface DtoNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  relatedEntityType: RelatedEntityType | null;
  relatedEntityId: number | null;
  actorId: number | null;
  actorFirstName: string | null;
  actorLastName: string | null;
  actorAvatarUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}

export interface DtoNotificationPreferences {
  postEnabled: boolean;
  eventEnabled: boolean;
  messageEnabled: boolean;
}

export const notificationApi = {
  getMyNotifications: (
    pageNo = 0,
    pageSize = 20,
  ): Promise<PageResponse<DtoNotification>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoNotification>>>("/api/notifications", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  getUnreadCount: (): Promise<number> =>
    apiClient
      .get<RootEntity<{ count: number }>>("/api/notifications/unread-count")
      .then((res) => unwrap(res.data).count),

  markAsRead: (id: number): Promise<void> =>
    apiClient
      .put<RootEntity<null>>(`/api/notifications/${id}/read`)
      .then(() => {}),

  markAllAsRead: (): Promise<void> =>
    apiClient.put<RootEntity<null>>("/api/notifications/read-all").then(() => {}),

  saveFcmToken: (token: string): Promise<void> =>
    apiClient
      .post<RootEntity<null>>("/api/notifications/fcm-token", { token })
      .then(() => {}),

  deleteFcmToken: (): Promise<void> =>
    apiClient
      .delete<RootEntity<null>>("/api/notifications/fcm-token")
      .then(() => {}),

  getPreferences: (): Promise<DtoNotificationPreferences> =>
    apiClient
      .get<RootEntity<DtoNotificationPreferences>>("/api/notifications/preferences")
      .then((res) => unwrap(res.data)),

  updatePreferences: (
    prefs: DtoNotificationPreferences,
  ): Promise<DtoNotificationPreferences> =>
    apiClient
      .put<RootEntity<DtoNotificationPreferences>>(
        "/api/notifications/preferences",
        prefs,
      )
      .then((res) => unwrap(res.data)),
};
