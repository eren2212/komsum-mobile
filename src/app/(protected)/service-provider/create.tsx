import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  LongPressEvent,
} from "react-native-maps";
import * as Location from "expo-location";

import {
  serviceProviderApi,
  DtoCreateServiceProvider,
  ServiceCategory,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_ICONS,
} from "@/api/serviceProvider";
import { colors } from "@/theme/color";
import { BackButton, CustomInput, CustomButton } from "@/components";
import { useUserLocation } from "@/hooks/useUserLocation";

// Haritada konum işaretlenmezken varsayılan merkez (İstanbul)
const DEFAULT_REGION = { latitude: 41.015137, longitude: 28.97953 };

type Pin = { latitude: number; longitude: number };

// ─── Tipler ───────────────────────────────────────────────────────────────────

type FormData = {
  title: string;
  category: ServiceCategory | "";
  experienceYears: string; // input string → submit'te number
  priceInfo: string;
  phone: string;
  address: string;
  description: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

// ─── Adım Göstergesi ─────────────────────────────────────────────────────────

function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {[1, 2].map((s) => (
        <View
          key={s}
          className={`h-[6px] rounded-[3px] ${
            s === current ? "w-[20px]" : "w-[6px] bg-[#E2E8F0]"
          }`}
          style={s === current ? { backgroundColor: colors.primary.DEFAULT } : {}}
        />
      ))}
    </View>
  );
}

// ─── Adım 1: Hizmet bilgileri ─────────────────────────────────────────────────

function Step1Content({
  form,
  errors,
  onUpdate,
  onCategoryPress,
}: {
  form: FormData;
  errors: FormErrors;
  onUpdate: (key: keyof FormData, value: string) => void;
  onCategoryPress: () => void;
}) {
  return (
    <View className="px-6 pt-4">
      {/* Başlık */}
      <View className="mb-5">
        <CustomInput
          label="Başlık"
          placeholder="örn. Matematik Öğretmeni"
          value={form.title}
          onChangeText={(v) => onUpdate("title", v)}
          error={errors.title}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      {/* Kategori seçici */}
      <View className="mb-5">
        <Text className="text-[13px] font-normal uppercase text-neutral-600 mb-2 tracking-wide">
          Meslek
        </Text>
        <TouchableOpacity
          onPress={onCategoryPress}
          activeOpacity={0.7}
          className={`flex-row items-center h-[62px] rounded-[16px] px-4 bg-[#F5F6FA] border gap-3 ${
            errors.category ? "border-[#EF4444]" : "border-[#E8EAF0]"
          }`}
        >
          <Ionicons
            name={form.category ? SERVICE_CATEGORY_ICONS[form.category] : "briefcase-outline"}
            size={18}
            color={form.category ? colors.primary.DEFAULT : "#A0A5BA"}
          />
          <Text
            className={`flex-1 text-[14px] ${
              form.category ? "text-[#32343E]" : "text-[#A0A5BA]"
            }`}
          >
            {form.category
              ? SERVICE_CATEGORY_LABELS[form.category]
              : "Meslek seçin..."}
          </Text>
          <Ionicons name="chevron-expand" size={18} color="#A0A5BA" />
        </TouchableOpacity>
        {errors.category && (
          <Text className="text-xs text-red-500 mt-1.5 ml-1">
            {errors.category}
          </Text>
        )}
      </View>

      {/* Deneyim yılı */}
      <View className="mb-5">
        <CustomInput
          label="Deneyim Yılı (İsteğe Bağlı)"
          placeholder="örn. 8"
          value={form.experienceYears}
          onChangeText={(v) =>
            onUpdate("experienceYears", v.replace(/[^0-9]/g, ""))
          }
          error={errors.experienceYears}
          keyboardType="number-pad"
          returnKeyType="next"
          leftIcon={<Ionicons name="time-outline" size={18} color="#A0A5BA" />}
        />
      </View>

      {/* Ücret bilgisi */}
      <View className="mb-5">
        <CustomInput
          label="Ücret Bilgisi (İsteğe Bağlı)"
          placeholder="örn. 500₺/saat veya Pazarlığa açık"
          value={form.priceInfo}
          onChangeText={(v) => onUpdate("priceInfo", v)}
          autoCapitalize="sentences"
          returnKeyType="next"
          leftIcon={
            <Ionicons name="pricetag-outline" size={18} color="#A0A5BA" />
          }
        />
      </View>
    </View>
  );
}

// ─── Adım 2: İletişim & Konum ─────────────────────────────────────────────────

function Step2Content({
  form,
  errors,
  onUpdate,
  available,
  onToggleAvailable,
  pin,
  pinError,
  locating,
  onOpenMap,
  onUseMyLocation,
}: {
  form: FormData;
  errors: FormErrors;
  onUpdate: (key: keyof FormData, value: string) => void;
  available: boolean;
  onToggleAvailable: (v: boolean) => void;
  pin: Pin | null;
  pinError?: string;
  locating: boolean;
  onOpenMap: () => void;
  onUseMyLocation: () => void;
}) {
  return (
    <View className="px-6 pt-4">
      {/* Telefon */}
      <View className="mb-5">
        <CustomInput
          label="Telefon Numarası"
          placeholder="0212 XXX XX XX"
          value={form.phone}
          onChangeText={(v) => onUpdate("phone", v)}
          error={errors.phone}
          keyboardType="phone-pad"
          returnKeyType="next"
          leftIcon={<Ionicons name="call-outline" size={18} color="#A0A5BA" />}
        />
      </View>

      {/* Adres */}
      <View className="mb-5">
        <CustomInput
          label="Adres / Hizmet Bölgesi"
          placeholder="Açık adresinizi girin..."
          value={form.address}
          onChangeText={(v) => onUpdate("address", v)}
          error={errors.address}
          autoCapitalize="sentences"
          returnKeyType="next"
          leftIcon={
            <Ionicons name="location-outline" size={18} color="#A0A5BA" />
          }
        />
      </View>

      {/* Konum (harita) — backend zorunlu kılıyor */}
      <View className="mb-5">
        <Text className="text-[13px] font-normal uppercase text-neutral-600 mb-2 tracking-wide">
          Konum
        </Text>

        {pin ? (
          <View className="flex-row items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-[#DCFCE7]">
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text className="text-[12px] font-semibold text-[#16A34A] flex-1">
              Konum seçildi: {pin.latitude.toFixed(5)},{" "}
              {pin.longitude.toFixed(5)}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onOpenMap}
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center justify-center gap-2 h-[52px] rounded-[16px] bg-[#F5F6FA] border ${
              pinError ? "border-[#EF4444]" : "border-[#E8EAF0]"
            }`}
          >
            <Ionicons
              name="map-outline"
              size={18}
              color={pin ? colors.primary.DEFAULT : "#646982"}
            />
            <Text
              className="text-[13px] font-semibold"
              style={{ color: pin ? colors.primary.DEFAULT : "#646982" }}
            >
              {pin ? "Haritada Değiştir" : "Haritadan Seç"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onUseMyLocation}
            disabled={locating}
            activeOpacity={0.8}
            className="flex-row items-center justify-center gap-2 px-4 h-[52px] rounded-[16px]"
            style={{
              backgroundColor: colors.primary.DEFAULT,
              opacity: locating ? 0.7 : 1,
            }}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="navigate" size={18} color="#fff" />
            )}
            <Text className="text-[13px] font-bold text-white">Konumum</Text>
          </TouchableOpacity>
        </View>
        {pinError ? (
          <Text className="text-xs text-red-500 mt-1.5 ml-1">{pinError}</Text>
        ) : null}
      </View>

      {/* Müsaitlik durumu */}
      <View className="mb-5 flex-row items-center justify-between rounded-[16px] px-4 py-3.5 bg-[#F5F6FA] border border-[#E8EAF0]">
        <View className="flex-row items-center gap-3 flex-1">
          <Ionicons
            name="checkmark-done-circle-outline"
            size={20}
            color={available ? colors.primary.DEFAULT : "#A0A5BA"}
          />
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-[#32343E]">
              Şu an iş alıyorum
            </Text>
            <Text className="text-[11px] text-neutral-400">
              Kapalıyken rehberde "müsait değil" görünürsün.
            </Text>
          </View>
        </View>
        <Switch
          value={available}
          onValueChange={onToggleAvailable}
          trackColor={{ false: "#E8EAF0", true: colors.primary.light }}
          thumbColor={available ? colors.primary.DEFAULT : "#f4f3f4"}
        />
      </View>

      {/* Açıklama (isteğe bağlı) */}
      <View className="mb-5">
        <CustomInput
          label="Açıklama (İsteğe Bağlı)"
          placeholder="Verdiğin hizmeti kısaca tanıt..."
          value={form.description}
          onChangeText={(v) => onUpdate("description", v)}
          autoCapitalize="sentences"
          returnKeyType="done"
          leftIcon={
            <Ionicons name="document-text-outline" size={18} color="#A0A5BA" />
          }
        />
      </View>

      {/* Bilgi notu */}
      <View className="flex-row items-start gap-3 rounded-2xl p-4 bg-[#FFF1EE]">
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.primary.DEFAULT}
          className="mt-[1px]"
        />
        <Text className="flex-1 text-[12px] text-[#64748B] leading-[18px]">
          Profiliniz oluşturulduktan sonra admin onayına gönderilir. Onay
          sürecinde bilgileriniz mahallenizle paylaşılmaz.
        </Text>
      </View>
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function ServiceProviderCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>({
    title: "",
    category: "",
    experienceYears: "",
    priceInfo: "",
    phone: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [available, setAvailable] = useState(true);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // ── Konum state ──
  const [pin, setPin] = useState<Pin | null>(null);
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [tempPin, setTempPin] = useState<Pin | null>(null);
  // Harita varsayılan olarak kullanıcının konumuna ortalansın diye GPS konumu
  const mapRef = useRef<MapView>(null);
  const { coords: userCoords, request: requestLocation } = useUserLocation();

  const { mutate: createProfile, isPending } = useMutation({
    mutationFn: (data: DtoCreateServiceProvider) =>
      serviceProviderApi.createServiceProviderProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myServiceProviderProfile"] });
      queryClient.invalidateQueries({ queryKey: ["serviceProviderNearby"] });
      Alert.alert(
        "Profil Oluşturuldu",
        "Usta profiliniz oluşturuldu ve onay sürecine alındı.",
        [{ text: "Tamam", onPress: () => router.back() }],
      );
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message);
    },
  });

  const update = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = "Başlık boş olamaz.";
    if (!form.category) errs.category = "Lütfen bir meslek seçin.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.phone.trim()) errs.phone = "Telefon numarası zorunludur.";
    if (!form.address.trim()) errs.address = "Açık adres girmelisiniz.";
    setErrors(errs);

    const geoMissing = !pin;
    setPinError(
      geoMissing
        ? "Konumunu haritadan seç veya 'Konumum'a bas."
        : undefined,
    );

    return Object.keys(errs).length === 0 && !geoMissing;
  };

  // ── Konum: haritadan seç ──
  const openMap = () => {
    setTempPin(pin);
    requestLocation(); // kullanıcının konumunu al (cache'liyse anında döner)
    setMapVisible(true);
  };

  // Harita açıkken kullanıcı henüz pin koymadıysa, konum geldiğinde haritayı
  // kullanıcının bulunduğu yere kaydır (initialRegion sadece ilk mount'ta okunur).
  useEffect(() => {
    if (mapVisible && userCoords && !tempPin) {
      mapRef.current?.animateToRegion(
        { ...userCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500,
      );
    }
  }, [mapVisible, userCoords, tempPin]);

  const onMapPress = (e: LongPressEvent) => {
    setTempPin(e.nativeEvent.coordinate);
  };

  const confirmMapPin = () => {
    if (tempPin) {
      setPin(tempPin);
      setPinError(undefined);
    }
    setMapVisible(false);
  };

  // ── Konum: cihaz GPS'ini kullan ──
  const useMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Konum İzni Gerekli",
          "Konumunu işaretlemek için konum iznine ihtiyaç var. Haritadan da elle seçebilirsin.",
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPin({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setPinError(undefined);
    } catch {
      Alert.alert("Konum Alınamadı", "Konum alınamadı. Lütfen haritadan elle seç.");
    } finally {
      setLocating(false);
    }
  };

  const handleNext = () => {
    if (validateStep1()) {
      setErrors({});
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setErrors({});
      setStep(1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    if (!validateStep2()) return;
    const years = form.experienceYears.trim()
      ? Number(form.experienceYears)
      : undefined;
    createProfile({
      title: form.title.trim(),
      category: form.category as ServiceCategory,
      phone: form.phone.trim(),
      address: form.address.trim(),
      description: form.description.trim() || undefined,
      experienceYears: years,
      priceInfo: form.priceInfo.trim() || undefined,
      available,
      latitude: pin!.latitude,
      longitude: pin!.longitude,
    });
  };

  const stepHeadings = {
    1: {
      title: "Hizmetini Tanıtalım",
      subtitle:
        "Komşuların seni kolayca bulabilmesi için mesleğini ve deneyimini gir.",
    },
    2: {
      title: "İletişim & Konum",
      subtitle:
        "Komşuların sana ulaşabilmesi için iletişim ve konum bilgilerini gir.",
    },
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* ── Navigasyon Çubuğu ── */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
        <BackButton onPress={handleBack} />

        <View className="items-center">
          <Text className="text-[17px] font-bold text-[#121223] tracking-[-0.4px]">
            Usta Profili
          </Text>
          <Text
            className="text-[11px] font-bold tracking-[1.1px] uppercase mt-[2px]"
            style={{ color: colors.primary.DEFAULT }}
          >
            ADIM {step}/2
          </Text>
        </View>

        <View className="w-[44px] items-center">
          <StepDots current={step} />
        </View>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 140 }}
        bottomOffset={24}
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-[24px] font-extrabold text-[#121223] tracking-[-0.6px] mb-1.5">
            {stepHeadings[step].title}
          </Text>
          <Text className="text-[15px] text-[#64748B] leading-[24px]">
            {stepHeadings[step].subtitle}
          </Text>
        </View>

        {step === 1 ? (
          <Step1Content
            form={form}
            errors={errors}
            onUpdate={update}
            onCategoryPress={() => setCategoryModalVisible(true)}
          />
        ) : (
          <Step2Content
            form={form}
            errors={errors}
            onUpdate={update}
            available={available}
            onToggleAvailable={setAvailable}
            pin={pin}
            pinError={pinError}
            locating={locating}
            onOpenMap={openMap}
            onUseMyLocation={useMyLocation}
          />
        )}
      </KeyboardAwareScrollView>

      {/* ── Sabit Alt Buton ── */}
      <View
        className={`absolute bottom-0 left-0 right-0 bg-white border-t border-[#F1F5F9] px-6 pt-4 ${
          Platform.OS === "ios" ? "pb-8" : "pb-5"
        }`}
      >
        {step === 1 ? (
          <CustomButton
            label="İleri"
            onPress={handleNext}
            fullWidth
            rightIcon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
          />
        ) : (
          <CustomButton
            label={isPending ? "Oluşturuluyor..." : "Profili Oluştur"}
            onPress={handleSubmit}
            loading={isPending}
            fullWidth
            rightIcon={
              !isPending ? (
                <Ionicons name="checkmark" size={18} color="#fff" />
              ) : undefined
            }
          />
        )}
      </View>

      {/* ── Kategori Modal ── */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/45"
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] overflow-hidden max-h-[70%]">
            <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
              <Text className="text-[16px] font-bold text-[#121223]">
                Meslek Seçin
              </Text>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                activeOpacity={0.7}
                className="w-[32px] h-[32px] rounded-full bg-[#F5F6FA] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={SERVICE_CATEGORIES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = form.category === item;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      update("category", item);
                      setCategoryModalVisible(false);
                    }}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-6 py-4 border-b border-[#F8FAFC] gap-3 ${
                      selected ? "bg-[#FFF1EE]" : "bg-white"
                    }`}
                  >
                    <Ionicons
                      name={SERVICE_CATEGORY_ICONS[item]}
                      size={20}
                      color={selected ? colors.primary.DEFAULT : "#A0A5BA"}
                    />
                    <Text
                      className={`flex-1 text-[15px] ${
                        selected ? "font-semibold" : "font-normal text-[#32343E]"
                      }`}
                      style={selected ? { color: colors.primary.DEFAULT } : {}}
                    >
                      {SERVICE_CATEGORY_LABELS[item]}
                    </Text>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary.DEFAULT}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Harita Konum Seçici Modal ── */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#E8EAF0]">
            <TouchableOpacity
              onPress={() => setMapVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={26} color="#32343E" />
            </TouchableOpacity>
            <Text className="text-[16px] font-bold text-[#121223]">Konum</Text>
            <View style={{ width: 26 }} />
          </View>

          <View className="flex-row items-center gap-2 px-4 py-2.5 bg-[#FFF1EE]">
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.primary.DEFAULT}
            />
            <Text className="text-[12px] text-[#646982] flex-1">
              Haritada uzun basarak konumunu işaretle.
            </Text>
          </View>

          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude:
                tempPin?.latitude ??
                userCoords?.latitude ??
                DEFAULT_REGION.latitude,
              longitude:
                tempPin?.longitude ??
                userCoords?.longitude ??
                DEFAULT_REGION.longitude,
              latitudeDelta: tempPin || userCoords ? 0.01 : 0.05,
              longitudeDelta: tempPin || userCoords ? 0.01 : 0.05,
            }}
            onLongPress={onMapPress}
            scrollEnabled
            zoomEnabled
          >
            {tempPin && (
              <Marker coordinate={tempPin}>
                <View className="items-center">
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: colors.primary.DEFAULT,
                      shadowColor: colors.primary.DEFAULT,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 7,
                      borderRightWidth: 7,
                      borderTopWidth: 10,
                      borderLeftColor: "transparent",
                      borderRightColor: "transparent",
                      borderTopColor: colors.primary.DEFAULT,
                      marginTop: -1,
                    }}
                  />
                </View>
              </Marker>
            )}
          </MapView>

          <View className="px-4 py-3 bg-white border-t border-[#E8EAF0]">
            {tempPin ? (
              <View className="flex-row items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-[#DCFCE7]">
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text className="text-[12px] font-semibold text-[#16A34A] flex-1">
                  Pin koyuldu: {tempPin.latitude.toFixed(5)},{" "}
                  {tempPin.longitude.toFixed(5)}
                </Text>
                <Pressable hitSlop={8} onPress={() => setTempPin(null)}>
                  <Ionicons name="close-circle" size={18} color="#16A34A" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-[#F5F6FA]">
                <Ionicons name="hand-left-outline" size={16} color="#A0A5BA" />
                <Text className="text-[12px] text-[#646982] flex-1">
                  Konumu işaretlemek için haritaya uzun bas
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={confirmMapPin}
              disabled={!tempPin}
              activeOpacity={0.85}
              className="py-3.5 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: tempPin ? colors.primary.DEFAULT : "#E8EAF0",
              }}
            >
              <Text
                className="text-[15px] font-bold"
                style={{ color: tempPin ? "#fff" : "#A0A5BA" }}
              >
                Onayla
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
