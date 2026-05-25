import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Router } from "expo-router";

import { notificationApi } from "@/api/notification";

/**
 * Foreground davranışı: Uygulama açıkken FCM bildirimi gelirse
 * görsel uyarı GÖSTERME — inbox ekranında zaten DB'den çekiliyor,
 * mesajlar Supabase Realtime ile ekrana düşüyor.
 *
 * Bu setNotificationHandler tüm bildirim türleri için geçerli.
 */
export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Bildirim iznini ister, FCM device token alır ve backend'e kaydeder.
 * Login/register sonrası tek seferlik çağrılır.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[notifications] Emülatörde FCM yok, atlanıyor.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#FF6B4A",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("[notifications] Kullanıcı izin vermedi.");
    return null;
  }

  try {
    // Android'de getDevicePushTokenAsync doğrudan FCM token verir.
    // iOS'ta APNs üzerinden FCM'e yönlendirilir (Firebase Console'da APNs key gerekir).
    const tokenResult = await Notifications.getDevicePushTokenAsync();
    const token = tokenResult?.data;
    console.log("[notifications] FCM token alındı:", token ? `${String(token).substring(0, 20)}...` : "BOŞ");
    if (!token || typeof token !== "string") {
      console.warn("[notifications] FCM token geçersiz, backend'e gönderilmiyor.");
      return null;
    }
    await notificationApi.saveFcmToken(token);
    console.log("[notifications] FCM token backend'e kaydedildi.");
    return token;
  } catch (err) {
    console.warn("[notifications] FCM token alınamadı:", err);
    return null;
  }
}

/**
 * Logout'ta backend'den token'ı sil. Sessizce başarısız olabilir
 * (network hatası, token zaten yok vs.) — logout akışını bloklamaz.
 */
export async function unregisterPushNotifications() {
  try {
    await notificationApi.deleteFcmToken();
  } catch (err) {
    console.warn("[notifications] Token silme başarısız:", err);
  }
}

/**
 * Bildirim tap'lendiğinde ilgili ekrana yönlendir.
 * Uygulama açıkken push iconuna basılırsa veya arka plandan açılırsa tetiklenir.
 */
export function setupNotificationListeners(router: Router) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | {
          relatedEntityType?: string;
          relatedEntityId?: string;
        }
      | undefined;

    if (!data?.relatedEntityType || !data?.relatedEntityId) return;

    const id = data.relatedEntityId;
    switch (data.relatedEntityType) {
      case "POST":
        router.push(`/post/${id}` as never);
        break;
      case "EVENT":
        // event detay ekranı varsa oraya, yoksa events feed
        router.push(`/(protected)/(tabs)` as never);
        break;
      case "CHAT_ROOM":
        router.push(`/chat/${id}` as never);
        break;
    }
  });

  return () => sub.remove();
}
