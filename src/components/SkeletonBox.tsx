import { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export interface SkeletonBoxProps {
  width: number;
  height: number;
  borderRadius?: number;
  /**
   * Koyu arka plan üzerindeyse true.
   * - true  → koyu lacivert tonlar (#1C1C35 / #2D2D57)
   * - false → açık gri tonlar    (#EBEBF0 / #D8D8E2)
   */
  isDark?: boolean;
  style?: ViewStyle;
}

/**
 * Tek satır shimmer skeleton kutusu.
 * expo-linear-gradient + react-native-reanimated kullanır.
 *
 * @example
 * // Açık arka plan
 * <SkeletonBox width={120} height={16} borderRadius={8} />
 *
 * @example
 * // Koyu arka plan (profil header vs.)
 * <SkeletonBox width={96} height={96} borderRadius={48} isDark />
 */
export function SkeletonBox({
  width,
  height,
  borderRadius = 4,
  isDark = false,
  style,
}: SkeletonBoxProps) {
  const offset = useSharedValue(-width);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(width, { duration: 1100, easing: Easing.linear }),
      -1,
      false
    );
  }, [offset, width]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const bg = isDark ? "#1C1C35" : "#EBEBF0";
  const shimmerColors = isDark
    ? (["#1C1C35", "#2D2D57", "#1C1C35"] as const)
    : (["#EBEBF0", "#D8D8E2", "#EBEBF0"] as const);

  return (
    <View
      style={[
        { width, height, borderRadius, overflow: "hidden", backgroundColor: bg },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width, height }}
        />
      </Animated.View>
    </View>
  );
}
