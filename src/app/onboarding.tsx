import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { router } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';

// 1. SLIDE VERİ TİPİNİ (INTERFACE) OLUŞTURUYORUZ
interface SlideItem {
    key: string;
    title: string;
    text: string;
    image: ImageSourcePropType; // Resimler için React Native'in kendi tipini kullanıyoruz
}

// Verilerimize bu tipi atıyoruz
const slides: SlideItem[] = [
    {
        key: '1',
        title: 'Tüm Mahalle Tek Çatıda!',
        text: 'Mahallenin nabzını tut, komşularınla etkileşime geç ve aradığın her şeye anında ulaş. Mahalle kültürü artık cebinde.',
        image: require('../../assets/images/onboarding/onboarding1.png'),
    },
    {
        key: '2',
        title: 'Güvenilir Ustalar Bir Tık Ötende',
        text: 'Tesisatçı, boyacı veya temizlikçi mi lazım? Mahallede oylanan, referanslı en iyi ustaları saniyeler içinde bul ve çağır.',
        image: require('../../assets/images/onboarding/onboarding2.png'),
    },
    {
        key: '3',
        title: 'Kullanmıyorsan Paylaş İhtiyacın Varsa Al',
        text: 'Evindeki fazlalıkları komşularınla takas et, hediye et veya pazar yerinden güvenle ikinci el alışveriş yap.',
        image: require('../../assets/images/onboarding/onboarding3.png'),
    },
    {
        key: '4',
        title: 'Güvendesin ve Asla Yalnız Değilsin',
        text: 'Acil durum butonuyla anında yardım çağır veya yolculuk paylaşımıyla masrafları bölüş. Hadi, mahallene katıl!',
        image: require('../../assets/images/onboarding/onboarding4.png'),
    }
];

export default function OnboardingScreen() {
    const sliderRef = useRef<AppIntroSlider>(null);
    const markAsSeen = useOnboardingStore((s) => s.markAsSeen);

    const handleDone = async () => {
        await markAsSeen(); // SecureStore'a yazar + store state'ini günceller
        router.replace('/auth/signin');
    };

    // 3. ITEM PARAMETRESİNE TİP VERİYORUZ (Hata 7031 Çözümü)
    const renderItem = ({ item }: { item: SlideItem }) => {
        return (
            <View className="flex-1 bg-[#F9F9F9] items-center pt-24 px-8">
                <Image
                    source={item.image}
                    className="w-full h-72 rounded-3xl mb-8"
                    resizeMode="cover"
                />
                <Text className="text-2xl font-extrabold text-[#191970] text-center mb-4 leading-8">
                    {item.title}
                </Text>
                <Text className="text-sm font-medium text-gray-500 text-center leading-6">
                    {item.text}
                </Text>
            </View>
        );
    };

    // 4. ACTIVEINDEX PARAMETRESİNE NUMBER TİPİNİ VERİYORUZ (Hata 7006 Çözümü)
    const renderPagination = (activeIndex: number) => {
        const isLastSlide = activeIndex === slides.length - 1;

        return (
            <View className="absolute bottom-10 left-0 right-0 px-8 items-center">

                {/* Noktalar (Dots) */}
                <View className="flex-row items-center justify-center mb-8">
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            className={`h-2.5 rounded-full mx-1.5 ${i === activeIndex ? 'w-2.5 bg-[#FF6B4A]' : 'w-2.5 bg-orange-200'
                                }`}
                        />
                    ))}
                </View>

                {/* Ana Turuncu Buton */}
                <TouchableOpacity
                    className="w-full bg-[#FF6B4A] py-4 rounded-2xl items-center justify-center mb-4"
                    activeOpacity={0.8}
                    onPress={() => {
                        if (isLastSlide) {
                            handleDone();
                        } else {
                            // Artık ref tipi belli olduğu için goToSlide hata vermez
                            sliderRef.current?.goToSlide(activeIndex + 1, true);
                        }
                    }}
                >
                    <Text className="text-white font-bold text-sm tracking-widest">
                        {isLastSlide ? 'HEMEN BAŞLA' : 'İLERİ'}
                    </Text>
                </TouchableOpacity>

                {/* Geç (Skip) Butonu */}
                {!isLastSlide ? (
                    <TouchableOpacity onPress={handleDone} activeOpacity={0.6}>
                        <Text className="text-gray-400 font-bold text-xs tracking-wider">GEÇ</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="h-4" />
                )}

            </View>
        );
    };

    return (
        <View className="flex-1 bg-[#F9F9F9]">
            <AppIntroSlider
                ref={sliderRef}
                renderItem={renderItem}
                data={slides}
                renderPagination={renderPagination}
                bottomButton
            />
        </View>
    );
}