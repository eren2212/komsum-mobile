import EventSource from "react-native-sse";

/**
 * Kendi sunucumuz üzerinden canlı mesaj akışı (SSE).
 * Supabase Realtime'ın yerine geçer.
 *
 * Backend tarafında `GET /api/chats/stream` JWT korumalı bir SSE endpoint'idir;
 * mesaj kaydedilince odadaki her iki katılımcıya `event: "message"` push eder.
 *
 * Tek bir bağlantı açılır (singleton); hem sohbet ekranı hem inbox
 * `addMessageListener` ile aynı akışı dinler.
 */

// Backend DtoRealtimeMessage ile birebir aynı şekil.
export interface RealtimeMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

type MessageListener = (msg: RealtimeMessage) => void;

// Sunucunun gönderdiği özel event adları ("connected") tip olarak tanıtılır.
type StreamEvents = "connected";

let es: EventSource<StreamEvents> | null = null;
let currentToken: string | null = null;
const listeners = new Set<MessageListener>();

function emit(msg: RealtimeMessage) {
  listeners.forEach((cb) => {
    try {
      cb(msg);
    } catch {
      // tek bir dinleyicinin hatası diğerlerini etkilemesin
    }
  });
}

export const realtimeChat = {
  /**
   * Verilen access token ile SSE bağlantısını açar.
   * Aynı token ile zaten bağlıysa hiçbir şey yapmaz; farklı token gelirse
   * (ör. refresh sonrası) eski bağlantıyı kapatıp yenisini açar.
   */
  connect(token: string) {
    if (es && currentToken === token) return;
    this.disconnect();

    currentToken = token;
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
    const url = `${baseUrl}api/chats/stream`;

    es = new EventSource<StreamEvents>(url, {
      headers: { Authorization: `Bearer ${token}` },
      // SSE uzun ömürlüdür; istemci tarafı timeout'u kapat. Bağlantı canlılığını
      // sunucunun ~20sn'lik heartbeat'i ve react-native-sse'nin reconnect'i sağlar.
      timeout: 0,
    });

    es.addEventListener("message", (event) => {
      if (!event.data) return;
      try {
        const msg = JSON.parse(event.data) as RealtimeMessage;
        emit(msg);
      } catch {
        // bozuk payload — yok say
      }
    });
  },

  /** Bağlantıyı kapatır (logout veya token değişiminde). */
  disconnect() {
    if (es) {
      es.removeAllEventListeners();
      es.close();
      es = null;
    }
    currentToken = null;
  },

  /**
   * Canlı mesaj dinleyicisi ekler. Geri dönen fonksiyon dinleyiciyi kaldırır
   * (useEffect cleanup için).
   */
  addMessageListener(cb: MessageListener): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
