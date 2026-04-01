import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BackButton, CustomButton } from "@/components";
import { useSignupStore } from "@/store/signupStore";
import { useAuthStore } from "@/store/authStore";
import { DtoNeighborhood } from "@/api/neighborhood";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Logo from "../../../assets/images/logo/komsum-logo-turuncu.svg"

// ─── KOMŞUM Logosu ────────────────────────────────────────────────────────────

function KomsumLogo() {
  return (
    <View className="justify-center items-center ml-auto mb-28">
      <Logo width={330} height={80} />
    </View>
  );
}

// ─── Picker Modal ─────────────────────────────────────────────────────────────

interface PickerModalProps<T> {
  visible: boolean;
  title: string;
  items: T[];
  loading: boolean;
  error: string | null;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  onClose: () => void;
}

function PickerModal<T>({
  visible,
  title,
  items,
  loading,
  error,
  getLabel,
  onSelect,
  onClose,
}: PickerModalProps<T>) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/40"
        activeOpacity={1}
        onPress={onClose}
      />

      <SafeAreaView className="bg-white rounded-tl-xl3 rounded-tr-xl3 max-h-[60%] absolute bottom-0 left-0 right-0">
        {/* Başlık */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-100">
          <Text className="text-secondary-900 text-base font-bold uppercase tracking-wide">
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text className="text-neutral-400 text-2xl leading-none">×</Text>
          </TouchableOpacity>
        </View>

        {/* İçerik */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#FF6B4A" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-error text-sm text-center">{error}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
                className="px-6 py-4 border-b border-neutral-50 active:bg-neutral-50"
              >
                <Text className="text-neutral-600 text-sm">
                  {getLabel(item)}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NeighborhoodSelectScreen() {
  const {
    pending,
    districts,
    neighborhoods,
    selectedDistrict,
    selectedNeighborhood,
    pickerStep,
    districtsLoading,
    neighborhoodsLoading,
    neighborhoodsError,
    districtsError,
    fetchDistricts,
    setPickerStep,
    selectDistrict,
    selectNeighborhood,
    clearAll,
  } = useSignupStore();

  const { register, isLoading, error, clearError } = useAuthStore();

  // Sayfa açıldığında ilçeleri yükle
  useEffect(() => {
    if (districts.length === 0) {
      fetchDistricts();
    }
  }, []);

  // Sunucu hatalarını göster
  useEffect(() => {
    if (error) {
      Alert.alert("Kayıt Hatası", error, [{ text: "Tamam", onPress: clearError }]);
    }
  }, [error]);

  // Mahalle alanına tıklandığında ilçe listesini aç
  const handleFieldPress = () => {
    setPickerStep("district");
  };

  const handleOnayla = async () => {
    if (!selectedNeighborhood) {
      Alert.alert("Mahalle Seçin", "Lütfen mahallenizi seçin.");
      return;
    }

    if (!pending) {
      // Beklenen form verisi kaybolmuş, başa dön
      router.replace("/auth/signup");
      return;
    }

    const success = await register({
      ...pending,
      neighborhoodId: selectedNeighborhood.id,
    });

    if (success) {
      clearAll();
      router.replace("/");
    }
  };

  // Seçili değerin gösterim metni
  const displayValue = selectedNeighborhood
    ? `${selectedNeighborhood.name} (${selectedDistrict})`
    : selectedDistrict
      ? "Mahalle seçin..."
      : "İlçe seçmek için dokunun";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-6">
        {/* ── Geri butonu ── */}
        <View className="pt-4 pb-2">
          <BackButton light={false} />
        </View>

        {/* ── Logo ── */}
        <View className="flex-1 items-center justify-center flex-col">
          <KomsumLogo />
          {/* Başlık */}
          <Text
            className="text-neutral-600 text-[22px] text-center mt-10"
            style={{ fontFamily: "Sen_400Regular" }}
          >
            Neredesin Komşum <FontAwesome5 name="smile-wink" size={24} color="black" />
          </Text>

          {/* Açıklama */}
          <Text className="text-neutral-400 text-base text-center mt-3 leading-[26px] opacity-85">
            Mahalleni seç ve başla. Unutma yılda sadece 2 kez mahalle seçiliyor!
          </Text>

          {/* ── Mahalle seçim alanı ── */}
          <View className="pb-4 mt-10 w-full">
            <TouchableOpacity
              onPress={handleFieldPress}
              activeOpacity={0.8}
              className="h-[62px] bg-neutral-50 border border-neutral-100 rounded-2xl px-4 justify-center mb-4"
            >
              <Text
                className={
                  selectedNeighborhood
                    ? "text-neutral-600 text-sm"
                    : "text-neutral-300 text-sm"
                }
              >
                {displayValue}
              </Text>
            </TouchableOpacity>

            {/* ONAYLA butonu */}
            <CustomButton
              label="ONAYLA"
              fullWidth
              loading={isLoading}
              disabled={!selectedNeighborhood}
              onPress={handleOnayla}
            />
          </View>
        </View>



      </View>

      {/* ── İlçe seçim modalı ── */}
      <PickerModal
        visible={pickerStep === "district"}
        title="İlçe Seçin"
        items={districts}
        loading={districtsLoading}
        error={districtsError}
        getLabel={(d) => d}
        onSelect={(district) => selectDistrict(district)}
        onClose={() => setPickerStep(null)}
      />

      {/* ── Mahalle seçim modalı ── */}
      <PickerModal<DtoNeighborhood>
        visible={pickerStep === "neighborhood"}
        title="Mahalle Seçin"
        items={neighborhoods}
        loading={neighborhoodsLoading}
        error={neighborhoodsError}
        getLabel={(n) => n.name}
        onSelect={(n) => selectNeighborhood(n)}
        onClose={() => setPickerStep(null)}
      />
    </SafeAreaView>
  );
}
