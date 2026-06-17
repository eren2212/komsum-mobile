import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  MapPressEvent,
} from "react-native-maps";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { eventApi, EventCategory, DtoCreateEvent } from "@/api/event";
import { uploadApi } from "@/api/upload";
import { colors } from "@/theme/color";
import { BackButton } from "@/components";

// ─── Kategori Tanımları ───────────────────────────────────────────────────────

interface CategoryMeta {
  key: EventCategory;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "SPORTS",
    label: "Spor",
    icon: "football",
    color: "#0EA5E9",
    bg: "#E0F2FE",
  },
  {
    key: "ARTS_MUSIC",
    label: "Sanat & Müzik",
    icon: "musical-notes",
    color: "#8B5CF6",
    bg: "#EDE9FE",
  },
  {
    key: "FOOD_DRINK",
    label: "Yeme & İçme",
    icon: "restaurant",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    key: "TRAVEL",
    label: "Gezi",
    icon: "compass",
    color: "#10B981",
    bg: "#D1FAE5",
  },
  {
    key: "EDUCATION",
    label: "Eğitim",
    icon: "school",
    color: "#3B82F6",
    bg: "#DBEAFE",
  },
  {
    key: "OTHER",
    label: "Diğer",
    icon: "ellipsis-horizontal-circle",
    color: "#6B7280",
    bg: "#F3F4F6",
  },
];

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

/** Date nesnesini ekranda göstermek için formatlar: "28 Nisan 2025, 19:30" */
function formatDateDisplay(date: Date): string {
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Date nesnesini backend LocalDateTime formatına çevirir: "2025-04-28T19:30:00" */
function toBackendDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

// ─── Bölüm Başlığı ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <Ionicons name={icon as any} size={16} color={colors.primary.DEFAULT} />
      <Text className="text-[13px] font-bold text-[#32343E] tracking-[0.2px] uppercase">
        {title}
      </Text>
    </View>
  );
}

// ─── Ekran ───────────────────────────────────────────────────────────────────

export default function CreateEventScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Form state ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [location, setLocation] = useState("");
  const [priceText, setPriceText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ── Tarih state ──
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // iOS: inline picker görünürlüğü + spinner değeri
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState<Date>(new Date());
  // Android: iki adımlı picker (önce tarih, sonra saat)
  const [showAndroidDate, setShowAndroidDate] = useState(false);
  const [showAndroidTime, setShowAndroidTime] = useState(false);
  const [androidTempDate, setAndroidTempDate] = useState<Date>(new Date());

  // ── Konum pin state ──
  const [pin, setPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // Modal içinde gezerken geçici pin tutmak için (Tamam'a basınca asıl pin set edilir)
  const [mapVisible, setMapVisible] = useState(false);
  const [tempPin, setTempPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ── Mutation ──
  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: eventApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      Alert.alert("Harika!", "Etkinliğin başarıyla oluşturuldu.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message ?? "Etkinlik oluşturulamadı.");
    },
  });

  // ── Fotoğraf seçici ──
  const openGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin Gerekli", "Galeri erişimine izin vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin Gerekli", "Kamera erişimine izin vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const onPickImage = () => {
    Alert.alert("Fotoğraf Ekle", "Nasıl eklemek istersiniz?", [
      { text: "Kamera", onPress: openCamera },
      { text: "Galeri", onPress: openGallery },
      { text: "İptal", style: "cancel" },
    ]);
  };

  // ── Tarih picker ──

  const openDatePicker = () => {
    const base = selectedDate ?? new Date();
    if (Platform.OS === "ios") {
      setIosPickerValue(base);
      setShowIOSPicker(true);
    } else {
      setAndroidTempDate(base);
      setShowAndroidDate(true);
    }
  };

  // iOS: spinner değeri değişti (henüz confirm edilmedi)
  const onIOSChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) setIosPickerValue(date);
  };

  const onIOSConfirm = () => {
    setSelectedDate(iosPickerValue);
    setShowIOSPicker(false);
  };

  const onIOSCancel = () => {
    setShowIOSPicker(false);
  };

  // Android 1. adım: tarih seçildi
  const onAndroidDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowAndroidDate(false);
    if (event.type === "set" && date) {
      setAndroidTempDate(date);
      // Seçilen tarihin saatini mevcut selectedDate'ten koru
      setShowAndroidTime(true);
    }
  };

  // Android 2. adım: saat seçildi
  const onAndroidTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowAndroidTime(false);
    if (event.type === "set" && date) {
      const combined = new Date(androidTempDate);
      combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setSelectedDate(combined);
    }
  };

  // ── Modal aç/kapat + haritada pin bırak ──
  const openMap = () => {
    setTempPin(pin); // mevcut pin varsa modal'a taşı
    setMapVisible(true);
  };

  const onMapPress = (e: MapPressEvent) => {
    setTempPin(e.nativeEvent.coordinate);
  };

  const confirmMapPin = () => {
    if (tempPin) setPin(tempPin);
    setMapVisible(false);
  };

  const cancelMap = () => {
    setMapVisible(false);
  };

  // ── Gönder ──
  const onSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Eksik Alan", "Etkinlik başlığını girmelisin.");
      return;
    }
    if (!category) {
      Alert.alert("Eksik Alan", "Lütfen bir kategori seç.");
      return;
    }
    if (!selectedDate) {
      Alert.alert("Eksik Alan", "Etkinlik tarihini ve saatini seçmelisin.");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Eksik Alan", "Etkinlik konumunu girmelisin.");
      return;
    }
    if (!pin) {
      Alert.alert(
        "Konum Seçilmedi",
        "Lütfen haritadan etkinlik konumunu işaretle.",
      );
      return;
    }

    let uploadedImageUrl: string | undefined;
    if (imageUri) {
      setIsUploadingImage(true);
      try {
        uploadedImageUrl = await uploadApi.uploadEventImage(imageUri);
      } catch {
        const proceed = await new Promise<boolean>((resolve) =>
          Alert.alert(
            "Fotoğraf Yüklenemedi",
            "Fotoğraf yüklenirken sorun oluştu. Fotoğrafsız devam etmek ister misin?",
            [
              { text: "İptal", style: "cancel", onPress: () => resolve(false) },
              { text: "Fotoğrafsız Devam Et", onPress: () => resolve(true) },
            ],
          ),
        );
        if (!proceed) {
          setIsUploadingImage(false);
          return;
        }
      } finally {
        setIsUploadingImage(false);
      }
    }

    const payload: DtoCreateEvent = {
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: uploadedImageUrl,
      category,
      eventDate: toBackendDateTime(selectedDate),
      location: location.trim(),
      latitude: pin.latitude,
      longitude: pin.longitude,
      priceText: priceText.trim() || undefined,
    };

    createEvent(payload);
  };

  const canSubmit =
    title.trim().length > 0 &&
    !!category &&
    !!selectedDate &&
    location.trim().length > 0 &&
    !!pin &&
    !isPending &&
    !isUploadingImage;

  const isLoading = isPending || isUploadingImage;

  // Minimum seçilebilir tarih: şu an
  const minDate = new Date();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#E8EAF0]">
        <BackButton />

        <Text className="text-[17px] font-bold text-[#121223] tracking-[-0.4px]">
          Etkinlik Oluştur
        </Text>

        <TouchableOpacity
          onPress={onSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
          className="px-5 py-2 rounded-[20px]"
          style={{
            backgroundColor: canSubmit ? colors.primary.DEFAULT : "#E8EAF0",
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              className="text-[13px] font-bold"
              style={{ color: canSubmit ? "#fff" : "#A0A5BA" }}
            >
              Oluştur
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {/* ── Kapak Fotoğrafı ── */}
        <SectionTitle icon="image" title="Kapak Fotoğrafı" />
        <TouchableOpacity
          onPress={onPickImage}
          activeOpacity={0.85}
          className="w-full rounded-2xl overflow-hidden mb-6"
          style={{ aspectRatio: 16 / 7 }}
        >
          {imageUri ? (
            <View className="flex-1 relative">
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View className="absolute inset-0 bg-black/20 items-center justify-center">
                <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-black/40">
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text className="text-white text-[13px] font-semibold">
                    Değiştir
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              className="flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D1D5E0]"
              style={{ backgroundColor: "#F5F6FA" }}
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#FFF1EE" }}
              >
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={colors.primary.DEFAULT}
                />
              </View>
              <Text className="text-[13px] font-semibold text-[#646982]">
                Fotoğraf Ekle
              </Text>
              <Text className="text-[11px] text-[#A0A5BA]">İsteğe bağlı</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Başlık ── */}
        <SectionTitle icon="text" title="Başlık" />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Etkinlik adını gir..."
          placeholderTextColor="#A0A5BA"
          maxLength={100}
          className="text-[15px] text-[#32343E] px-4 py-3 rounded-2xl border border-[#E8EAF0] bg-[#F5F6FA] mb-6"
          style={{ fontWeight: "500" }}
        />

        {/* ── Kategori ── */}
        <SectionTitle icon="grid" title="Kategori" />
        <View className="flex-row flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => {
            const selected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.8}
                className="flex-row items-center gap-2 px-3 py-2 rounded-[14px] border-[1.5px]"
                style={{
                  borderColor: selected ? cat.color : "#E8EAF0",
                  backgroundColor: selected ? cat.bg : "#F5F6FA",
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={15}
                  color={selected ? cat.color : "#A0A5BA"}
                />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: selected ? cat.color : "#646982" }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tarih & Saat ── */}
        <SectionTitle icon="calendar" title="Tarih & Saat" />

        {/* Tetikleyici buton */}
        <TouchableOpacity
          onPress={openDatePicker}
          activeOpacity={0.8}
          className="flex-row items-center px-4 py-3 rounded-2xl border mb-2"
          style={{
            borderColor: selectedDate ? colors.primary.DEFAULT : "#E8EAF0",
            backgroundColor: selectedDate ? "#FFF1EE" : "#F5F6FA",
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={selectedDate ? colors.primary.DEFAULT : "#A0A5BA"}
            style={{ marginRight: 10 }}
          />
          <Text
            className="flex-1 text-[15px]"
            style={{
              color: selectedDate ? "#32343E" : "#A0A5BA",
              fontWeight: selectedDate ? "600" : "400",
            }}
          >
            {selectedDate
              ? formatDateDisplay(selectedDate)
              : "Tarih ve saat seç..."}
          </Text>
          {selectedDate && (
            <Pressable hitSlop={8} onPress={() => setSelectedDate(null)}>
              <Ionicons name="close-circle" size={18} color="#A0A5BA" />
            </Pressable>
          )}
        </TouchableOpacity>

        {/* iOS: inline spinner picker */}
        {Platform.OS === "ios" && showIOSPicker && (
          <View
            className="rounded-2xl overflow-hidden border border-[#E8EAF0] mb-4"
            style={{ backgroundColor: "#F5F6FA" }}
          >
            <DateTimePicker
              value={iosPickerValue}
              mode="datetime"
              display="spinner"
              minimumDate={minDate}
              onChange={onIOSChange}
              locale="tr"
              textColor="#32343E"
              style={{ height: 180 }}
            />
            {/* Onayla / İptal */}
            <View className="flex-row border-t border-[#E8EAF0]">
              <TouchableOpacity
                onPress={onIOSCancel}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-[14px] font-semibold text-[#A0A5BA]">
                  İptal
                </Text>
              </TouchableOpacity>
              <View className="w-px bg-[#E8EAF0]" />
              <TouchableOpacity
                onPress={onIOSConfirm}
                className="flex-1 py-3 items-center"
              >
                <Text
                  className="text-[14px] font-bold"
                  style={{ color: colors.primary.DEFAULT }}
                >
                  Tamam
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Android: native dialog picker'lar */}
        {Platform.OS === "android" && showAndroidDate && (
          <DateTimePicker
            value={androidTempDate}
            mode="date"
            display="default"
            minimumDate={minDate}
            onChange={onAndroidDateChange}
            locale="tr"
          />
        )}
        {Platform.OS === "android" && showAndroidTime && (
          <DateTimePicker
            value={androidTempDate}
            mode="time"
            display="default"
            onChange={onAndroidTimeChange}
            locale="tr"
            is24Hour
          />
        )}

        <Text className="text-[11px] text-[#A0A5BA] mb-6 ml-1">
          {Platform.OS === "android"
            ? "Önce tarih, ardından saat seçilecek"
            : "Tarih ve saati seçmek için yukarıya dokun"}
        </Text>

        {/* ── Konum Metni ── */}
        <SectionTitle icon="location" title="Konum Açıklaması" />
        <View className="flex-row items-center border border-[#E8EAF0] bg-[#F5F6FA] rounded-2xl px-4 py-3 mb-6">
          <Ionicons
            name="location-outline"
            size={18}
            color="#A0A5BA"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Meydanı, parkı veya tam adresi yaz..."
            placeholderTextColor="#A0A5BA"
            className="flex-1 text-[15px] text-[#32343E]"
            style={{ fontWeight: "500" }}
          />
        </View>

        {/* ── Harita (Konum Seçici) ── */}
        <SectionTitle icon="map" title="Haritadan Konum Seç" />
        {pin && (
          <View className="flex-row items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-[#DCFCE7]">
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text className="text-[12px] font-semibold text-[#16A34A] flex-1">
              Konum seçildi: {pin.latitude.toFixed(5)},{" "}
              {pin.longitude.toFixed(5)}
            </Text>
            <Pressable hitSlop={8} onPress={() => setPin(null)}>
              <Ionicons name="close-circle" size={18} color="#16A34A" />
            </Pressable>
          </View>
        )}
        <Pressable
          onPress={openMap}
          className="flex-row items-center justify-between px-4 py-3 rounded-2xl border border-[#E8EAF0] bg-[#F5F6FA] mb-6"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="map-outline"
              size={18}
              color={pin ? colors.primary.DEFAULT : "#646982"}
            />
            <Text
              className="text-[13px] font-semibold"
              style={{ color: pin ? colors.primary.DEFAULT : "#646982" }}
            >
              {pin ? "Konumu Değiştir" : "Haritayı Aç"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#A0A5BA" />
        </Pressable>

        {/* ── Açıklama ── */}
        <SectionTitle icon="document-text" title="Açıklama" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Etkinlik hakkında daha fazla bilgi ver... (isteğe bağlı)"
          placeholderTextColor="#A0A5BA"
          multiline
          maxLength={1000}
          className="text-[15px] text-[#32343E] px-4 py-3 rounded-2xl border border-[#E8EAF0] bg-[#F5F6FA] mb-6 min-h-[100px]"
          style={{ textAlignVertical: "top", fontWeight: "500" }}
        />

        {/* ── Fiyat Bilgisi ── */}
        <SectionTitle icon="pricetag" title="Fiyat Bilgisi" />
        <View className="flex-row items-center border border-[#E8EAF0] bg-[#F5F6FA] rounded-2xl px-4 py-3 mb-6">
          <Ionicons
            name="pricetag-outline"
            size={18}
            color="#A0A5BA"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={priceText}
            onChangeText={setPriceText}
            placeholder="Ücretsiz veya fiyat bilgisi... (isteğe bağlı)"
            placeholderTextColor="#A0A5BA"
            className="flex-1 text-[15px] text-[#32343E]"
            style={{ fontWeight: "500" }}
          />
        </View>

        {/* ── Mahalle Notu ── */}
        <View className="flex-row items-center gap-2 px-4 py-3 rounded-2xl bg-[#FFF1EE] mb-2">
          <Ionicons
            name="information-circle"
            size={18}
            color={colors.primary.DEFAULT}
          />
          <Text className="text-[12px] text-[#646982] flex-1 leading-[18px]">
            Etkinliğin mahalleye atanacak ve ilçendeki komşulara gösterilecek.
          </Text>
        </View>
      </KeyboardAwareScrollView>

      {/* ── Full-screen Harita Modal ── */}
      {/* MapView ScrollView içine konulamaz (gesture çakışması). Bu yüzden Modal'da
          tam ekran açıyoruz — kullanıcı rahatça pan/zoom yapabilir, pin koyar, onaylar. */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={cancelMap}
      >
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#E8EAF0]">
            <TouchableOpacity onPress={cancelMap} activeOpacity={0.7}>
              <Ionicons name="close" size={26} color="#32343E" />
            </TouchableOpacity>
            <Text className="text-[16px] font-bold text-[#121223]">
              Konum Seç
            </Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Bilgi şeridi */}
          <View className="flex-row items-center gap-2 px-4 py-2.5 bg-[#FFF1EE]">
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.primary.DEFAULT}
            />
            <Text className="text-[12px] text-[#646982] flex-1">
              Haritada uzun basarak etkinlik konumunu işaretle.
            </Text>
          </View>

          {/* Harita — flex-1 ile ekranı kaplar, gesture çakışması yok */}
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: tempPin?.latitude ?? 41.015137,
              longitude: tempPin?.longitude ?? 28.97953,
              latitudeDelta: tempPin ? 0.01 : 0.05,
              longitudeDelta: tempPin ? 0.01 : 0.05,
            }}
            onLongPress={onMapPress}
            scrollEnabled
            zoomEnabled
            pitchEnabled
            rotateEnabled
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
                    <Ionicons name="calendar" size={20} color="#fff" />
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

          {/* Alt aksiyon barı */}
          <View
            className="px-4 py-3 bg-white border-t border-[#E8EAF0]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
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
