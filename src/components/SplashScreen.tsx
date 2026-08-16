import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { G, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const ORANGE = '#FF6B4A';
const NAVY = '#191970';
const FAN_SLICES = 20;

// Köşeden çıkan yelpaze dekorasyonu
function FanDecoration({
  radius,
  color,
  opacity = 1,
}: {
  radius: number;
  color: string;
  opacity?: number;
}) {
  const totalAngle = 90;
  const sliceAngle = totalAngle / FAN_SLICES;
  const paths: React.ReactNode[] = [];

  for (let i = 0; i < FAN_SLICES; i++) {
    if (i % 2 !== 0) continue; // her iki dilimi bir atla
    const startRad = (i * sliceAngle * Math.PI) / 180;
    const endRad = ((i + 1) * sliceAngle * Math.PI) / 180;
    const x1 = Math.cos(startRad) * radius;
    const y1 = Math.sin(startRad) * radius;
    const x2 = Math.cos(endRad) * radius;
    const y2 = Math.sin(endRad) * radius;
    paths.push(
      <Path
        key={i}
        d={`M 0 0 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
        fill={color}
        opacity={opacity}
      />,
    );
  }

  return <G>{paths}</G>;
}

// Logo: K + ev ikonu + MŞUM (el yazması wordmark — yerini arayüz logosu aldı, bkz. render)
// function KomsumLogo() {
//   return (
//     <View className="flex-row items-center">
//       <Text className="text-5xl font-extrabold text-[#191970] tracking-[1px]">K</Text>
//       {/* Ev ikonu — "O" yerine */}
//       <View className="mx-[2px] -mt-[2px]">
//         <Svg width={46} height={46} viewBox="0 0 46 46" fill="none">
//           {/* Çatı */}
//           <Path
//             d="M6 22L23 7L40 22"
//             stroke={ORANGE}
//             strokeWidth="3.2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//           {/* Gövde */}
//           <Rect x="10" y="22" width="26" height="18" rx="2" fill="white" stroke={ORANGE} strokeWidth="2.5" />
//           {/* Kapı */}
//           <Rect x="18" y="29" width="10" height="11" rx="5" fill={ORANGE} opacity={0.25} />
//           <Rect x="18" y="29" width="10" height="11" rx="5" stroke={ORANGE} strokeWidth="2" fill="none" />
//         </Svg>
//       </View>
//       <Text className="text-5xl font-extrabold text-[#191970] tracking-[1px]">MŞUM</Text>
//     </View>
//   );
// }

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      {/* Sol üst küçük yelpaze */}
      <View
        className="absolute"
        style={{ top: -width * 0.1, left: -width * 0.1 }}
      >
        <Svg width={width * 0.55} height={width * 0.55}>
          <G transform={`translate(0, ${width * 0.55}) rotate(-90)`}>
            <FanDecoration radius={width * 0.55} color="#E8E8F0" opacity={0.9} />
          </G>
        </Svg>
      </View>

      {/* Sağ alt büyük turuncu yelpaze */}
      <View
        className="absolute"
        style={{ bottom: -width * 0.1, right: -width * 0.1 }}
      >
        <Svg width={width * 0.88} height={width * 0.88}>
          <G transform={`translate(${width * 0.88}, 0) rotate(90)`}>
            <FanDecoration radius={width * 0.88} color={ORANGE} opacity={0.85} />
          </G>
        </Svg>
      </View>

      {/* Logo — arayüz logosu (transparan) */}
      <Animated.View
        className="items-center"
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        <Image
          source={require('../../assets/images/logo/transparan_arayuz_logo.png')}
          style={{ width: width * 0.68, height: width * 0.68 }}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}