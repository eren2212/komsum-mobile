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

export interface DtoChatRoom {
  id: number;
  otherUserId: number;
  otherUserFirstName: string;
  otherUserLastName: string;
  otherUserAvatarUrl?: string | null;
  lastMessageAt?: string | null;
  lastMessageContent?: string | null;
  unreadCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}

export interface DtoMessage {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export const chatApi = {
  startChat: (targetUserId: number): Promise<DtoChatRoom> =>
    apiClient
      .post<RootEntity<DtoChatRoom>>("/api/chats/start", { targetUserId })
      .then((res) => unwrap(res.data)),

  sendMessage: (roomId: number, content: string): Promise<DtoMessage> =>
    apiClient
      .post<RootEntity<DtoMessage>>(`/api/chats/${roomId}/messages`, { content })
      .then((res) => unwrap(res.data)),

  getChatMessages: (
    roomId: number,
    pageNo = 0,
    pageSize = 50
  ): Promise<PageResponse<DtoMessage>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoMessage>>>(`/api/chats/${roomId}/messages`, {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  getMyChatRooms: (pageNo = 0, pageSize = 20): Promise<PageResponse<DtoChatRoom>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoChatRoom>>>("/api/chats/inbox", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  markAsRead: (roomId: number): Promise<void> =>
    apiClient
      .put<RootEntity<null>>(`/api/chats/${roomId}/read`)
      .then(() => {}),
};
