import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: '#FF6B4A',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                animation: 'fade',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Akış',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
                    )
                }}
            />
            <Tabs.Screen
                name="ver-al"
                options={{
                    title: 'Ver-Al',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "gift" : "gift-outline"} color={color} size={24} />
                    )
                }}
            />

            {/* ORTADAKİ YENİ GÖNDERİ (+) BUTONU */}
            <Tabs.Screen
                name="create"
                options={{
                    title: '', // Yazı olmasın, sadece ikon görünsün
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.floatingButton}>
                            <Ionicons name="add" color="#FFFFFF" size={32} />
                        </View>
                    )
                }}
            />

            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Mesajlar',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "chatbox" : "chatbox-outline"} color={color} size={24} />
                    )
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
                    )
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 25 : 15, // Ekranın altından biraz yukarıda (Floating)
        marginVertical: 10,
        marginHorizontal: 10,
        right: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 30, // Tam oval kenarlar
        height: 65,
        borderTopWidth: 0, // Üstteki varsayılan ince çizgiyi yok eder

        // Tasarıma derinlik katan gölge ayarları
        shadowColor: '#191970', // Lacivert renginin gölgesi premium durur
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5, // Android için gölge
    },
    tabBarLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: Platform.OS === 'ios' ? 0 : 5,
    },
    floatingButton: {
        width: 60,
        height: 60,
        borderRadius: 30, // Tam yuvarlak
        backgroundColor: '#FF6B4A', // Ana turuncu renk
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -30,

        // Butonun kendine has parlayan gölgesi
        shadowColor: '#FF6B4A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    }
});