import React, { Component, ReactNode } from "react";
import { Text, View } from "react-native";

import CustomButton from "./CustomButton";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Uygulama genelinde beklenmeyen render hatalarını yakalar. Yakalamazsa
 * React Native tüm ekranı beyaz/boş bırakır — kullanıcıya bir çıkış yolu
 * (yeniden dene) sunmak için burada tutuyoruz.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    if (__DEV__) {
      console.error("[KOMSUM] Yakalanmamış render hatası:", error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-white px-8">
          <Text className="mb-2 text-center text-lg font-bold text-neutral-900">
            Bir şeyler ters gitti
          </Text>
          <Text className="mb-6 text-center text-sm text-neutral-500">
            Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
          </Text>
          <CustomButton label="Tekrar Dene" onPress={this.handleReset} />
        </View>
      );
    }

    return this.props.children;
  }
}
