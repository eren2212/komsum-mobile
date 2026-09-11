import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Router } from "expo-router";

import { notificationApi } from "@/api/notification";
import { extractErrorMessage } from "@/utils/apiError";

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
    if (__DEV__) console.log("[notifications] Push sadece gerçek cihazda çalışır, atlanıyor.");
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
    if (__DEV__) console.log("[notifications] Kullanıcı izin vermedi.");
    return null;
  }

  // getExpoPushTokenAsync projectId olmadan ERR_NOTIFICATIONS_NO_EXPERIENCE_ID fırlatır.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    if (__DEV__) console.warn("[notifications] projectId bulunamadı (app.json → extra.eas.projectId), atlanıyor.");
    return null;
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResult?.data;
    // Token'ın değeri loglanmaz: cihaza doğrudan bildirim gönderilmesini
    // sağlayan bir adrestir, log'a düşerse kötüye kullanılabilir.
    if (__DEV__) console.log("[notifications] Expo push token alındı:", token ? "VAR" : "BOŞ");

    if (typeof token !== "string" || !token.startsWith(EXPO_TOKEN_PREFIX)) {
      if (__DEV__) console.warn("[notifications] Expo push token geçersiz, backend'e gönderilmiyor.");
      return null;
    }

    await notificationApi.saveFcmToken(token);
    if (__DEV__) console.log("[notifications] Expo push token backend'e kaydedildi.");
    return token;
  } catch (err) {
    // err objesinin tamamı loglanmaz: axios hatasında err.config.headers
    // Authorization başlığını taşıyabiliyor.
    if (__DEV__) console.warn("[notifications] Expo push token alınamadı:", extractErrorMessage(err));
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
    if (__DEV__) console.warn("[notifications] Token silme başarısız:", extractErrorMessage(err));
  }
}

/**
 * Bir bildirimin taşıdığı yönlendirme verisi. Hem push data'sından
 * (backend `baseData()`) hem de in-app bildirim DTO'sundan gelebilir.
 */
export type NotificationRouteData = {
  relatedEntityType?: string | null;
  relatedEntityId?: string | number | null;
  actorFirstName?: string | null;
  actorLastName?: string | null;
  actorAvatarUrl?: string | null;
};

/**
 * Bildirim verisine göre ilgili detay ekranına yönlendirir.
 * Üç tap noktası da (push tap, in-app liste, cold-start) bunu kullanır ki
 * yönlendirme mantığı tek yerde dursun.
 */
export function navigateFromNotification(
  router: Router,
  data?: NotificationRouteData,
) {
  if (!data?.relatedEntityType || data.relatedEntityId == null) return;

  const id = String(data.relatedEntityId);
  switch (data.relatedEntityType) {
    case "POST":
      router.push(`/post/${id}` as never);
      break;
    case "EVENT":
      router.push(`/event/${id}` as never);
      break;
    case "BADGE":
      router.push("/profile/my-tasks" as never);
      break;
    case "CHAT_ROOM":
      // roomId + gönderen bilgisi → sohbet header'ı dolu açılsın
      router.push({
        pathname: "/chat/[roomId]",
        params: {
          roomId: id,
          otherUserFirstName: data.actorFirstName ?? "",
          otherUserLastName: data.actorLastName ?? "",
          ...(data.actorAvatarUrl
            ? { otherUserAvatarUrl: data.actorAvatarUrl }
            : {}),
        },
      } as never);
      break;
  }
}

/**
 * Bildirim tap'lendiğinde ilgili ekrana yönlendir.
 * Uygulama açıkken push iconuna basılırsa veya arka plandan açılırsa tetiklenir.
 */
export function setupNotificationListeners(router: Router) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | NotificationRouteData
      | undefined;
    navigateFromNotification(router, data);
  });

  return () => sub.remove();
}

/**
 * Uygulama tamamen kapalıyken bir bildirime basılarak açıldıysa, o bildirimin
 * ekranına yönlendir. `addNotificationResponseReceivedListener` bu durumda
 * tetiklenmediği için ayrıca ele alınır. Auth hazır olduktan sonra bir kez
 * çağrılmalı (bkz. _layout.tsx).
 */
export async function handleColdStartNotification(router: Router) {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification.request.content.data as
    | NotificationRouteData
    | undefined;
  navigateFromNotification(router, data);
}
