import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Router } from "expo-router";

import { notificationApi } from "@/api/notification";

/** Expo Push Service'in ürettiği token'lar bu önekle başlar. Backend de aynı öneke bakıyor. */
const EXPO_TOKEN_PREFIX = "ExponentPushToken[";

/**
 * Foreground davranışı: Uygulama açıkken push bildirimi gelirse
 * görsel uyarı GÖSTERME — inbox ekranında zaten DB'den çekiliyor,
 * mesajlar kendi sunucumuzun SSE akışı ile ekrana düşüyor.
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
 * Bildirim iznini ister, Expo push token alır ve backend'e kaydeder.
 * Login/register sonrası tek seferlik çağrılır.
 *
 * Not: Expo Push Service bir relay'dir — Android'de token'ın altında
 * yine FCM vardır (getExpoPushTokenAsync içeride getDevicePushTokenAsync
 * çağırır), iOS'ta ise Expo doğrudan APNs'e gider.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[notifications] Push sadece gerçek cihazda çalışır, atlanıyor.");
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

  // getExpoPushTokenAsync projectId olmadan ERR_NOTIFICATIONS_NO_EXPERIENCE_ID fırlatır.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("[notifications] projectId bulunamadı (app.json → extra.eas.projectId), atlanıyor.");
    return null;
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResult?.data;
    console.log("[notifications] Expo push token alındı:", token ?? "BOŞ");

    if (typeof token !== "string" || !token.startsWith(EXPO_TOKEN_PREFIX)) {
      console.warn("[notifications] Expo push token geçersiz, backend'e gönderilmiyor.");
      return null;
    }

    await notificationApi.saveFcmToken(token);
    console.log("[notifications] Expo push token backend'e kaydedildi.");
    return token;
  } catch (err) {
    console.warn("[notifications] Expo push token alınamadı:", err);
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
