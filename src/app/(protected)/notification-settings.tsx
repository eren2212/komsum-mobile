import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  DtoNotificationPreferences,
  notificationApi,
} from "@/api/notification";
import { BackButton } from "@/components";
import { colors } from "@/theme/color";

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onChange,
  disabled,
}: RowProps) {
  return (
    <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 mb-3">
      <View className="w-11 h-11 rounded-xl bg-primary/15 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color={colors.primary.DEFAULT} />
      </View>
      <View className="flex-1 mr-3">
        <Text className="text-[15px] font-bold text-[#181c2e]">{title}</Text>
        <Text className="text-[12px] text-neutral-400 mt-0.5" numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: "#D1D5DB", true: colors.primary.DEFAULT }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: notificationApi.getPreferences,
  });

  // Lokal state — toggle anında UI'ı güncelle, mutation arka planda sync etsin
  const [prefs, setPrefs] = useState<DtoNotificationPreferences | null>(null);

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (next: DtoNotificationPreferences) =>
      notificationApi.updatePreferences(next),
    onSuccess: (saved) => {
      queryClient.setQueryData(["notification-preferences"], saved);
    },
    onError: () => {
      // Hata olursa sunucu değerine geri dön
      if (data) setPrefs(data);
    },
  });

  const handleToggle = (
    key: keyof DtoNotificationPreferences,
    value: boolean,
  ) => {
    if (!prefs) return;
    const next: DtoNotificationPreferences = { ...prefs, [key]: value };
    setPrefs(next);
    updateMutation.mutate(next);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]" edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
        <BackButton />

        <Text className="text-neutral-600 text-[17px] font-bold">
          Bildirim Ayarları
        </Text>

        {/* Sağ tarafı dengele */}
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary.DEFAULT} />
        </View>
      ) : error || !prefs ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={48} color="#C8CADE" />
          <Text className="text-[14px] text-neutral-400 mt-3 text-center">
            Bildirim ayarların yüklenemedi. Lütfen daha sonra tekrar dene.
          </Text>
        </View>
      ) : (
        <View className="flex-1 px-4 pt-5">
          <Text className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wide mb-3 ml-1">
            Hangi bildirimleri almak istiyorsun?
          </Text>

          <PreferenceRow
            icon="document-text-outline"
            title="Post Bildirimleri"
            description="Mahallendeki yeni gönderiler için bildirim al."
            value={prefs.postEnabled}
            onChange={(v) => handleToggle("postEnabled", v)}
            disabled={updateMutation.isPending}
          />

          <PreferenceRow
            icon="calendar-outline"
            title="Etkinlik Bildirimleri"
            description="Yeni mahalle etkinlikleri eklendiğinde haberdar ol."
            value={prefs.eventEnabled}
            onChange={(v) => handleToggle("eventEnabled", v)}
            disabled={updateMutation.isPending}
          />

          <PreferenceRow
            icon="chatbubble-ellipses-outline"
            title="Mesaj Bildirimleri"
            description="Sana yeni mesaj geldiğinde anlık bildirim gör."
            value={prefs.messageEnabled}
            onChange={(v) => handleToggle("messageEnabled", v)}
            disabled={updateMutation.isPending}
          />

          <View className="mt-4 px-2">
            <Text className="text-[11px] text-neutral-400 leading-[18px]">
              Bu ayarlar hem bu cihazdaki anlık bildirimleri hem de hesabındaki
              bildirim listesini etkiler.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
