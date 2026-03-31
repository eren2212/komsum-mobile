import { Button, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
    const width = useSharedValue<number>(100);

    const handlePress = () => {
        width.value = withSpring(Math.random() * 100 + 50);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: width.value }],
        };
    });

    return (
        <SafeAreaView className="flex-1 items-center justify-center">
            <Animated.View className="h-10 w-10 bg-red-500" style={animatedStyle} />
            <Button onPress={handlePress} title="Click me" color="blue" />
        </SafeAreaView>
    );
}

