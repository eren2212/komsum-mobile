import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BackButton, CustomButton } from "@/components";
import { useSignupStore } from "@/store/signupStore";
import { useAuthStore } from "@/store/authStore";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Image } from "expo-image";

// ─── Logo ────────────────────────────────────────────────────────────────────

function KomsumLogo() {
  return (
    <View className="justify-center items-center">
      <Image
        source={require("../../../assets/images/logo/transparan_arayuz_logo.png")}
        style={{ width: 200, height: 200 }}
        contentFit="contain"
      />
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
            <Text className="text-red-500 text-sm text-center">{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-neutral-400 text-sm text-center">
              Sonuç bulunamadı
            </Text>
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

// ─── Seçim Satırı ─────────────────────────────────────────────────────────────

interface SelectRowProps {
  label: string;
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
}

function SelectRow({ label, value, placeholder, disabled = false, onPress }: SelectRowProps) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1 ml-1">
        {label}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        className="h-[56px] rounded-2xl px-4 justify-center border"
        style={{
          backgroundColor: disabled ? "#F5F5F5" : "#F9F9F9",
          borderColor: value ? "#FF6B4A" : "#E5E5E5",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text
          className="text-sm"
          style={{ color: value ? "#32343E" : "#A0A5BA" }}
        >
          {value ?? placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NeighborhoodSelectScreen() {
  const {
    pending,
    cities,
    districts,
    neighborhoods,
    selectedCity,
    selectedDistrict,
    selectedNeighborhood,
    pickerStep,
    citiesLoading,
    districtsLoading,
    neighborhoodsLoading,
    citiesError,
    districtsError,
    neighborhoodsError,
    fetchCities,
    setPickerStep,
    selectCity,
    selectDistrict,
    selectNeighborhood,
    clearAll,
  } = useSignupStore();

  const { register, isLoading, error, clearError } = useAuthStore();

  // Sayfa açıldığında illeri yükle
  useEffect(() => {
    fetchCities();
  }, []);

  // Sunucu kayıt hatasını göster
  useEffect(() => {
    if (error) {
      Alert.alert("Kayıt Hatası", error, [{ text: "Tamam", onPress: clearError }]);
    }
  }, [error]);

  const handleOnayla = async () => {
    if (!selectedNeighborhood) {
      Alert.alert("Mahalle Seçin", "Lütfen mahallenizi seçin.");
      return;
    }
    if (!pending) {
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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-6">
        {/* Geri butonu */}
        <View className="pt-4 pb-2">
          <BackButton />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <KomsumLogo />

          <Text
            className="text-neutral-600 text-[22px] text-center "
            style={{ fontFamily: "Sen_400Regular" }}
          >
            Neredesin Komşum{" "}
            <FontAwesome5 name="smile-wink" size={24} color="black" />
          </Text>

          <Text className="text-neutral-400 text-base text-center mt-3 leading-[26px] opacity-85">
            Mahalleni seç ve başla. Unutma yılda sadece 2 kez mahalle
            değiştirilebiliyor!
          </Text>

          {/* ── 3 adımlı seçim ── */}
          <View className="mt-6 w-full">
            {/* İl */}
            <SelectRow
              label="İl"
              value={selectedCity?.name ?? null}
              placeholder="İl seçin..."
              onPress={() => setPickerStep("city")}
            />

            {/* İlçe */}
            <SelectRow
              label="İlçe"
              value={selectedDistrict?.name ?? null}
              placeholder={selectedCity ? "İlçe seçin..." : "Önce il seçin"}
              disabled={!selectedCity}
              onPress={() => selectedCity && setPickerStep("district")}
            />

            {/* Mahalle */}
            <SelectRow
              label="Mahalle"
              value={selectedNeighborhood?.name ?? null}
              placeholder={selectedDistrict ? "Mahalle seçin..." : "Önce ilçe seçin"}
              disabled={!selectedDistrict}
              onPress={() => selectedDistrict && setPickerStep("neighborhood")}
            />

            {/* Onayla */}
            <View className="mt-4">
              <CustomButton
                label="ONAYLA"
                fullWidth
                loading={isLoading}
                disabled={!selectedNeighborhood || isLoading}
                onPress={handleOnayla}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── İl Modalı ── */}
      <PickerModal
        visible={pickerStep === "city"}
        title="İl Seçin"
        items={cities}
        loading={citiesLoading}
        error={citiesError}
        getLabel={(c) => c.name}
        onSelect={(city) => selectCity(city)}
        onClose={() => setPickerStep(null)}
      />

      {/* ── İlçe Modalı ── */}
      <PickerModal
        visible={pickerStep === "district"}
        title="İlçe Seçin"
        items={districts}
        loading={districtsLoading}
        error={districtsError}
        getLabel={(d) => d.name}
        onSelect={(district) => selectDistrict(district)}
        onClose={() => setPickerStep(null)}
      />

      {/* ── Mahalle Modalı ── */}
      <PickerModal
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
