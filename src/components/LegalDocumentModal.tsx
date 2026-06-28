import React, { useState } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "./CustomButton";

export interface LegalDocumentModalProps {
  visible: boolean;
  title: string;
  content: string;
  /** "Onaylıyorum"a basıldığında — kutucuk işaretlenir, modal kapanır */
  onApprove: () => void;
  /** Onaylamadan kapatma (X / geri) */
  onClose: () => void;
}

/**
 * Yasal metni (KVKK / Aydınlatma) tam ekran popup'ta gösterir. Kullanıcı metni
 * sonuna kadar okumadan (en alta kaydırmadan) "Onaylıyorum" butonu aktif olmaz.
 */
export default function LegalDocumentModal({
  visible,
  title,
  content,
  onApprove,
  onClose,
}: LegalDocumentModalProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  // Modal her açıldığında okuma durumunu sıfırla
  React.useEffect(() => {
    if (visible) setScrolledToEnd(false);
  }, [visible]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const paddingToBottom = 24;
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      setScrolledToEnd(true);
    }
  };

  // İçerik ekrana sığıyorsa (kaydırmaya gerek yoksa) butonu doğrudan aç
  const handleContentSizeChange = (_w: number, contentHeight: number) => {
    // onLayout ölçüsü olmadan yaklaşık: çok kısa metinleri kaydırma gerektirmeden onaylat
    if (contentHeight < 400) setScrolledToEnd(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        {/* Başlık */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-100">
          <Text className="text-secondary-900 text-base font-bold flex-1 pr-4">
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text className="text-neutral-400 text-3xl leading-none">×</Text>
          </TouchableOpacity>
        </View>

        {/* Metin */}
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingVertical: 20 }}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
        >
          <Text className="text-neutral-600 text-sm leading-6">{content}</Text>
        </ScrollView>

        {/* Onayla */}
        <View className="px-6 pt-3 pb-2 border-t border-neutral-100">
          {!scrolledToEnd && (
            <Text className="text-neutral-400 text-xs text-center mb-2">
              Onaylamak için metni sonuna kadar okuyun.
            </Text>
          )}
          <CustomButton
            label="ONAYLIYORUM"
            fullWidth
            disabled={!scrolledToEnd}
            onPress={onApprove}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
