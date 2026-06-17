import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

import {
  marketplaceApi,
  DtoCreateListing,
  ListingType,
} from "@/api/marketplace";
import { uploadApi } from "@/api/upload";
import { colors } from "@/theme/color";
import { BackButton, CustomButton } from "@/components";

// ─── Sabit değerler ───────────────────────────────────────────────────────────

const CATEGORIES = [
  "Elektronik",
  "Giyim / Tekstil",
  "Kitap",
  "Ev Eşyası",
  "Bitki / Çiçek",
  "Spor",
  "Oyuncak",
  "El İşleri",
  "Araç Gereç",
  "Diğer",
];

// ─── Tip ─────────────────────────────────────────────────────────────────────

type FormErrors = {
  title?: string;
  imageUrl?: string;
  price?: string;
  category?: string;
};

// ─── Görsel Yükleme Bölümü ───────────────────────────────────────────────────

function ImageUploadSection({
  imageUrl,
  isUploading,
  onPress,
  onRemove,
}: {
  imageUrl: string;
  isUploading: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  if (imageUrl) {
    return (
      <View className="mx-4 mb-2">
        <View className="relative rounded-[16px] overflow-hidden">
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: "100%",
              aspectRatio: 4 / 3,
              borderRadius: 12,
            }}
            contentFit="cover"
            transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
            cachePolicy="memory-disk"
          />
          {/* Kaldır butonu */}
          <TouchableOpacity
            onPress={onRemove}
            activeOpacity={0.8}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          {/* Değiştir butonu */}
          <TouchableOpacity
            onPress={onPress}
            disabled={isUploading}
            activeOpacity={0.85}
            className="absolute bottom-3 right-3 flex-row items-center gap-1.5 px-4 py-2 rounded-full bg-black/55"
          >
            <Ionicons name="camera" size={14} color="#fff" />
            <Text className="text-white text-[13px] font-semibold">
              Değiştir
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isUploading}
      className="mx-4 mb-2"
    >
      <View className="rounded-[16px] items-center py-10 gap-4 bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1]">
        <View className="w-[62px] h-[62px] rounded-full items-center justify-center bg-[#F1F5F9]">
          {isUploading ? (
            <ActivityIndicator color={colors.primary.DEFAULT} />
          ) : (
            <Ionicons name="camera-outline" size={28} color="#94A3B8" />
          )}
        </View>

        <View className="items-center gap-1 px-6">
          <Text className="text-[16px] font-bold text-neutral-800 text-center">
            {isUploading ? "Yükleniyor..." : "Fotoğraf Ekle"}
          </Text>
          {!isUploading && (
            <Text className="text-[12px] text-neutral-400 text-center">
              En az bir fotoğraf ekleyerek ürününüzü daha hızlı satın.
            </Text>
          )}
        </View>

        {!isUploading && (
          <View className="px-6 py-3 rounded-2xl bg-[#121223]">
            <Text className="text-white text-[14px] font-bold">
              Fotoğraf Seç
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Bölüm Etiketi ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="text-[13px] font-bold text-neutral-400 tracking-widest uppercase mb-2 ml-1">
      {text}
    </Text>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function MarketplaceCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [listingType, setListingType] = useState<ListingType>("FOR_SALE");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { mutate: createListing, isPending } = useMutation({
    mutationFn: (data: DtoCreateListing) => marketplaceApi.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "me"] });
      Alert.alert(
        "İlan Yayınlandı",
        "İlanınız mahalle akışına başarıyla eklendi.",
        [{ text: "Tamam", onPress: () => router.back() }],
      );
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message);
    },
  });

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = "Ürün başlığı boş olamaz.";
    if (!imageUrl.trim() && !localImageUri)
      errs.imageUrl = "Lütfen bir ürün fotoğrafı ekleyin.";
    if (listingType === "FOR_SALE") {
      const p = parseFloat(price);
      if (!price.trim() || isNaN(p) || p <= 0)
        errs.price = "Satılık ilanlar için geçerli bir fiyat giriniz.";
    }
    if (!category) errs.category = "Lütfen bir kategori seçin.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onShare = async () => {
    if (!validate()) return;

    let finalImageUrl = imageUrl;

    if (localImageUri) {
      setIsUploadingImage(true);
      try {
        finalImageUrl = await uploadApi.uploadListingImage(localImageUri);
      } catch {
        Alert.alert(
          "Hata",
          "Fotoğraf yüklenirken bir sorun oluştu, tekrar dene.",
        );
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    createListing({
      title: title.trim(),
      imageUrl: finalImageUrl.trim(),
      type: listingType,
      price: listingType === "FOR_SALE" ? parseFloat(price) : null,
      category,
    });
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin Gerekli", "Galeri erişimine izin vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setLocalImageUri(result.assets[0].uri);
    setErrors((prev) => ({ ...prev, imageUrl: undefined }));
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin Gerekli", "Kamera erişimine izin vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setLocalImageUri(result.assets[0].uri);
    setErrors((prev) => ({ ...prev, imageUrl: undefined }));
  };

  const onPickImage = () => {
    Alert.alert("Fotoğraf Ekle", "Nasıl eklemek istersiniz?", [
      { text: "Kamera", onPress: openCamera },
      { text: "Galeri", onPress: openGallery },
      { text: "İptal", style: "cancel" },
    ]);
  };

  const onRemoveImage = () => {
    setLocalImageUri(null);
    setImageUrl("");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar
        backgroundColor={colors.secondary.DEFAULT}
        barStyle="light-content"
        animated={true}
      />
      {/* ── Başlık ── */}
      <View className="flex-row items-center px-4 py-4 border-b border-[#F1F5F9]">
        <BackButton light={false} />

        <View className="flex-1 items-center">
          <Text className="text-[18px] font-bold text-neutral-900 tracking-[-0.45px]">
            Ürün Ekle
          </Text>
        </View>

        {/* Sağ tarafı dengele */}
        <View className="w-[44px]" />
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        bottomOffset={24}
      >
        {/* Fotoğraf yükleme */}
        <ImageUploadSection
          imageUrl={localImageUri || imageUrl}
          isUploading={isUploadingImage}
          onPress={onPickImage}
          onRemove={onRemoveImage}
        />
        {errors.imageUrl && (
          <Text className="text-red-500 text-xs mx-5 mb-3">
            {errors.imageUrl}
          </Text>
        )}

        {/* Ürün Başlığı */}
        <View className="px-4 pt-6 pb-3">
          <SectionLabel text="Ürün Başlığı" />
          <View
            className={`rounded-[12px] px-4 h-[56px] justify-center bg-[#F0F5FA] border ${
              errors.title ? "border-red-500" : "border-[#E2E8F0]"
            }`}
          >
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (errors.title)
                  setErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="Örn: Sabunluk, Sukulent, Çocuk Kitabı..."
              placeholderTextColor="#94A3B8"
              className="text-[16px] text-neutral-900"
              returnKeyType="next"
            />
          </View>
          {errors.title && (
            <Text className="text-red-500 text-xs mt-1 ml-1">
              {errors.title}
            </Text>
          )}
        </View>

        {/* İlan Türü */}
        <View className="px-4 py-3">
          <SectionLabel text="İlan Türü" />
          <View className="flex-row items-center h-[56px] p-1.5 rounded-[12px] bg-[#F0F5FA]">
            {(
              [
                { value: "FOR_SALE", label: "Satılık" },
                { value: "TRADE_GIFT", label: "Hediye / Takas" },
              ] as { value: ListingType; label: string }[]
            ).map((opt) => {
              const active = listingType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setListingType(opt.value);
                    if (opt.value === "TRADE_GIFT") {
                      setPrice("");
                      setErrors((p) => ({ ...p, price: undefined }));
                    }
                  }}
                  activeOpacity={0.8}
                  className="flex-1 h-full items-center justify-center rounded-[8px]"
                  style={
                    active
                      ? {
                          backgroundColor: colors.primary.DEFAULT,
                          shadowColor: colors.primary.DEFAULT,
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 2,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-[14px] font-bold ${
                      active ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fiyat — sadece Satılık ise görünür */}
        {listingType === "FOR_SALE" && (
          <View className="px-4 py-3">
            <SectionLabel text="Fiyat" />
            <View className="relative">
              <View
                className={`rounded-[12px] h-[56px] justify-center pl-10 pr-4 bg-[#F0F5FA] border ${
                  errors.price ? "border-red-500" : "border-[#E2E8F0]"
                }`}
              >
                <TextInput
                  value={price}
                  onChangeText={(v) => {
                    setPrice(v);
                    if (errors.price)
                      setErrors((p) => ({ ...p, price: undefined }));
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  className="text-[18px] font-bold text-neutral-900"
                />
              </View>
              {/* ₺ sembolü */}
              <Text className="absolute left-4 text-[18px] font-bold text-neutral-800 top-[17px]">
                ₺
              </Text>
            </View>
            {errors.price && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                {errors.price}
              </Text>
            )}
          </View>
        )}

        {/* Kategori */}
        <View className="px-4 py-3">
          <SectionLabel text="Kategori" />
          <TouchableOpacity
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <View
              className={`rounded-[12px] h-[56px] flex-row items-center justify-between px-4 bg-[#F0F5FA] border ${
                errors.category ? "border-red-500" : "border-[#E2E8F0]"
              }`}
            >
              <Text
                className={`text-[16px] ${
                  category ? "text-[#121223]" : "text-slate-400"
                }`}
              >
                {category || "Kategori Seçin"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
          {errors.category && (
            <Text className="text-red-500 text-xs mt-1 ml-1">
              {errors.category}
            </Text>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* ── Sabit Alt Buton ── */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-4 py-3">
        <CustomButton
          label={isUploadingImage ? "Fotoğraf Yükleniyor..." : "İlanı Paylaş"}
          onPress={onShare}
          loading={isPending}
          disabled={isPending || isUploadingImage}
          fullWidth
          rightIcon={
            !isPending ? (
              <Ionicons name="paper-plane-outline" size={18} color="#fff" />
            ) : undefined
          }
        />
      </View>

      {/* ── Kategori Modalı ── */}
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
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] overflow-hidden max-h-[60%]">
            <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
              <Text className="text-[16px] font-bold text-[#121223]">
                Kategori Seçin
              </Text>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-[#F5F6FA] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = category === item;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setCategory(item);
                      setErrors((p) => ({ ...p, category: undefined }));
                      setCategoryModalVisible(false);
                    }}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-6 py-4 border-b border-[#F8FAFC] ${
                      selected ? "bg-[#FFF1EE]" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`flex-1 text-[15px] ${
                        selected ? "font-semibold" : "font-normal"
                      }`}
                      style={{
                        color: selected ? colors.primary.DEFAULT : "#32343E",
                      }}
                    >
                      {item}
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
    </SafeAreaView>
  );
}
