import { useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { marketplaceApi, DtoCreateListing, ListingType } from "@/api/marketplace";
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
    onPress,
}: {
    imageUrl: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            className="mx-4 mb-2"
        >
            <View
                className={`rounded-[12px] items-center py-10 gap-4 bg-[#F8FAFC] border-2 border-dashed ${imageUrl ? "" : "border-[#CBD5E1]"
                    }`}
                style={imageUrl ? { borderColor: colors.primary.DEFAULT } : {}}
            >
                <View
                    className={`w-[62px] h-[62px] rounded-full items-center justify-center ${imageUrl ? "bg-[#FFF1EE]" : "bg-[#F1F5F9]"
                        }`}
                >
                    <Ionicons
                        name={imageUrl ? "image" : "camera-outline"}
                        size={28}
                        color={imageUrl ? colors.primary.DEFAULT : "#94A3B8"}
                    />
                </View>

                <View className="items-center gap-1 px-6">
                    <Text className="text-[16px] font-bold text-neutral-800 text-center">
                        {imageUrl ? "Fotoğraf Eklendi" : "Fotoğraf Ekle veya Çek"}
                    </Text>
                    <Text className="text-[12px] text-neutral-400 text-center">
                        {imageUrl
                            ? imageUrl.length > 40
                                ? imageUrl.substring(0, 40) + "..."
                                : imageUrl
                            : "En az bir fotoğraf ekleyerek ürününüzü daha hızlı satın."}
                    </Text>
                </View>

                <View className="px-6 py-3 rounded-2xl bg-[#121223]">
                    <Text className="text-white text-[14px] font-bold">
                        {imageUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Seç"}
                    </Text>
                </View>
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
                [{ text: "Tamam", onPress: () => router.back() }]
            );
        },
        onError: (err: Error) => {
            Alert.alert("Hata", err.message);
        },
    });

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!title.trim()) errs.title = "Ürün başlığı boş olamaz.";
        if (!imageUrl.trim()) errs.imageUrl = "Lütfen bir fotoğraf URL'si girin.";
        if (listingType === "FOR_SALE") {
            const p = parseFloat(price);
            if (!price.trim() || isNaN(p) || p <= 0)
                errs.price = "Satılık ilanlar için geçerli bir fiyat giriniz.";
        }
        if (!category) errs.category = "Lütfen bir kategori seçin.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const onShare = () => {
        if (!validate()) return;
        createListing({
            title: title.trim(),
            imageUrl: imageUrl.trim(),
            type: listingType,
            price: listingType === "FOR_SALE" ? parseFloat(price) : null,
            category,
        });
    };

    const onPickImage = () => {
        Alert.prompt(
            "Fotoğraf URL",
            "Ürün fotoğrafının URL'sini girin:",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Kaydet",
                    onPress: (value?: string) => {
                        if (value !== undefined) {
                            setImageUrl(value);
                            setErrors((prev) => ({ ...prev, imageUrl: undefined }));
                        }
                    },
                },
            ],
            "plain-text",
            imageUrl
        );
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

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
                >
                    {/* Fotoğraf yükleme */}
                    <ImageUploadSection imageUrl={imageUrl} onPress={onPickImage} />
                    {errors.imageUrl && (
                        <Text className="text-red-500 text-xs mx-5 mb-3">
                            {errors.imageUrl}
                        </Text>
                    )}

                    {/* Ürün Başlığı */}
                    <View className="px-4 pt-6 pb-3">
                        <SectionLabel text="Ürün Başlığı" />
                        <View
                            className={`rounded-[12px] px-4 h-[56px] justify-center bg-[#F0F5FA] border ${errors.title ? "border-red-500" : "border-[#E2E8F0]"
                                }`}
                        >
                            <TextInput
                                value={title}
                                onChangeText={(v) => {
                                    setTitle(v);
                                    if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                                }}
                                placeholder="Örn: Sabunluk, Sukulent, Çocuk Kitabı..."
                                placeholderTextColor="#94A3B8"
                                className="text-[16px] text-neutral-900"
                                returnKeyType="next"
                            />
                        </View>
                        {errors.title && (
                            <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
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
                                            className={`text-[14px] font-bold ${active ? "text-white" : "text-slate-500"
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
                                    className={`rounded-[12px] h-[56px] justify-center pl-10 pr-4 bg-[#F0F5FA] border ${errors.price ? "border-red-500" : "border-[#E2E8F0]"
                                        }`}
                                >
                                    <TextInput
                                        value={price}
                                        onChangeText={(v) => {
                                            setPrice(v);
                                            if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
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
                                <Text className="text-red-500 text-xs mt-1 ml-1">{errors.price}</Text>
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
                                className={`rounded-[12px] h-[56px] flex-row items-center justify-between px-4 bg-[#F0F5FA] border ${errors.category ? "border-red-500" : "border-[#E2E8F0]"
                                    }`}
                            >
                                <Text
                                    className={`text-[16px] ${category ? "text-[#121223]" : "text-slate-400"
                                        }`}
                                >
                                    {category || "Kategori Seçin"}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                        {errors.category && (
                            <Text className="text-red-500 text-xs mt-1 ml-1">{errors.category}</Text>
                        )}
                    </View>
                </ScrollView>

                {/* ── Sabit Alt Buton ── */}
                <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-4 py-3">
                    <CustomButton
                        label="İlanı Paylaş"
                        onPress={onShare}
                        loading={isPending}
                        disabled={isPending}
                        fullWidth
                        rightIcon={
                            !isPending ? (
                                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                            ) : undefined
                        }
                    />
                </View>
            </KeyboardAvoidingView>

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
                                        className={`flex-row items-center px-6 py-4 border-b border-[#F8FAFC] ${selected ? "bg-[#FFF1EE]" : "bg-white"
                                            }`}
                                    >
                                        <Text
                                            className={`flex-1 text-[15px] ${selected ? "font-semibold" : "font-normal"
                                                }`}
                                            style={{ color: selected ? colors.primary.DEFAULT : "#32343E" }}
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