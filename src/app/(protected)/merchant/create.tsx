import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { merchantApi, DtoCreateMerchant } from "@/api/merchant";
import { colors } from "@/theme/color";
import { BackButton, CustomInput, CustomButton } from "@/components";

// ─── Sabit değerler ──────────────────────────────────────────────────────────

const CATEGORIES = [
  "Restoran",
  "Kafe",
  "Market / Bakkal",
  "Fırın / Pastane",
  "Berber / Kuaför",
  "Eczane",
  "Elektronik",
  "Giyim / Tekstil",
  "Temizlik",
  "Spor",
  "Sağlık",
  "Çiçekçi",
  "Hizmet",
  "Diğer",
];

// ─── Tipler ───────────────────────────────────────────────────────────────────

type FormData = {
  shopName: string;
  category: string;
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
          className={`h-[6px] rounded-[3px] ${s === current ? "w-[20px]" : "w-[6px] bg-[#E2E8F0]"
            }`}
          style={s === current ? { backgroundColor: colors.primary.DEFAULT } : {}}
        />
      ))}
    </View>
  );
}

// ─── Adım 1: Mağaza bilgileri ─────────────────────────────────────────────────

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
      {/* Kapak fotoğrafı alanı */}
      {/* <View className="h-[190px] w-full rounded-xl overflow-hidden mb-6">
        <View className="flex-1 items-center justify-center bg-[#F0F5FA]">
          <View className="w-[64px] h-[64px] rounded-full bg-[rgba(255,107,74,0.12)] items-center justify-center mb-3">
            <Ionicons
              name="image-outline"
              size={30}
              color={colors.primary.DEFAULT}
            />
          </View>
          <Text className="text-[16px] font-semibold text-[#0F172A] mb-1">
            Kapak Fotoğrafı
          </Text>
          <Text className="text-[13px] text-[#94A3B8] text-center">
            Müşterilerinizi etkileyecek bir görsel seçin
          </Text>
        </View>
      </View> */}

      {/* Mağaza adı */}
      <View className="mb-5">
        <CustomInput
          label="Mağaza Adı"
          placeholder="örn. Meram Etli Ekmek Salonu"
          value={form.shopName}
          onChangeText={(v) => onUpdate("shopName", v)}
          error={errors.shopName}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      {/* Kategori seçici */}
      <View className="mb-5">
        <Text className="text-[13px] font-normal uppercase text-neutral-600 mb-2 tracking-wide">
          Kategori
        </Text>
        <TouchableOpacity
          onPress={onCategoryPress}
          activeOpacity={0.7}
          className={`flex-row items-center h-[62px] rounded-[16px] px-4 bg-[#F5F6FA] border gap-3 ${errors.category ? "border-[#EF4444]" : "border-[#E8EAF0]"
            }`}
        >
          <Ionicons name="grid-outline" size={18} color="#A0A5BA" />
          <Text
            className={`flex-1 text-[14px] ${form.category ? "text-[#32343E]" : "text-[#A0A5BA]"
              }`}
          >
            {form.category || "Kategori seçin..."}
          </Text>
          <Ionicons name="chevron-expand" size={18} color="#A0A5BA" />
        </TouchableOpacity>
        {errors.category && (
          <Text className="text-xs text-red-500 mt-1.5 ml-1">
            {errors.category}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Adım 2: İletişim bilgileri ───────────────────────────────────────────────

function Step2Content({
  form,
  errors,
  onUpdate,
}: {
  form: FormData;
  errors: FormErrors;
  onUpdate: (key: keyof FormData, value: string) => void;
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
          label="Adres"
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

      {/* Açıklama (isteğe bağlı) */}
      <View className="mb-5">
        <CustomInput
          label="Açıklama (İsteğe Bağlı)"
          placeholder="İşletmenizi kısaca tanıtın..."
          value={form.description}
          onChangeText={(v) => onUpdate("description", v)}
          autoCapitalize="sentences"
          returnKeyType="done"
          leftIcon={
            <Ionicons
              name="document-text-outline"
              size={18}
              color="#A0A5BA"
            />
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

export default function MerchantCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>({
    shopName: "",
    category: "",
    phone: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const { mutate: createProfile, isPending } = useMutation({
    mutationFn: (data: DtoCreateMerchant) =>
      merchantApi.createMerchantProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMerchantProfile"] });
      queryClient.invalidateQueries({ queryKey: ["merchantDirectory"] });
      Alert.alert(
        "Profil Oluşturuldu",
        "Esnaf profiliniz oluşturuldu ve onay sürecine alındı.",
        [{ text: "Tamam", onPress: () => router.back() }]
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
    if (!form.shopName.trim()) errs.shopName = "Mağaza adı boş olamaz.";
    if (!form.category) errs.category = "Lütfen bir kategori seçin.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.phone.trim()) errs.phone = "Telefon numarası zorunludur.";
    if (!form.address.trim()) errs.address = "Açık adres girmelisiniz.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
    createProfile({
      shopName: form.shopName.trim(),
      category: form.category,
      phone: form.phone.trim(),
      address: form.address.trim(),
      description: form.description.trim() || undefined,
    });
  };

  const stepHeadings = {
    1: { title: "Mağazanızı Tanıtalım", subtitle: "Müşterilerinizin sizi daha iyi tanıması için bilgilerinizi güncelleyin." },
    2: { title: "İletişim Bilgileri", subtitle: "Müşterilerinizin size ulaşabilmesi için iletişim bilgilerini girin." },
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* ── Navigasyon Çubuğu ── */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
        {/* Geri butonu */}
        <BackButton onPress={handleBack} />

        {/* Başlık ve adım */}
        <View className="items-center">
          <Text className="text-[17px] font-bold text-[#121223] tracking-[-0.4px]">
            İşletme Profili
          </Text>
          <Text
            className="text-[11px] font-bold tracking-[1.1px] uppercase mt-[2px]"
            style={{ color: colors.primary.DEFAULT }}
          >
            ADIM {step}/2
          </Text>
        </View>

        {/* Adım göstergesi (sağ) */}
        <View className="w-[44px] items-center">
          <StepDots current={step} />
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-[140px]"
        >
          {/* Başlık metni */}
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
            <Step2Content form={form} errors={errors} onUpdate={update} />
          )}
        </ScrollView>

        {/* ── Sabit Alt Buton ── */}
        <View
          className={`absolute bottom-0 left-0 right-0 bg-white border-t border-[#F1F5F9] px-6 pt-4 ${Platform.OS === "ios" ? "pb-8" : "pb-5"
            }`}
        >
          {step === 1 ? (
            <CustomButton
              label="İleri"
              onPress={handleNext}
              fullWidth
              rightIcon={
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              }
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
      </KeyboardAvoidingView>

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
            {/* Modal başlık */}
            <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
              <Text className="text-[16px] font-bold text-[#121223]">
                Kategori Seçin
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
              data={CATEGORIES}
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
                    className={`flex-row items-center px-6 py-4 border-b border-[#F8FAFC] ${selected ? "bg-[#FFF1EE]" : "bg-white"
                      }`}
                  >
                    <Text
                      className={`flex-1 text-[15px] ${selected ? "font-semibold" : "font-normal text-[#32343E]"
                        }`}
                      style={selected ? { color: colors.primary.DEFAULT } : {}}
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