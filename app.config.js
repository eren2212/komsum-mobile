export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config ?? {}),
      // iOS'ta react-native-maps PROVIDER_GOOGLE için Google Maps SDK'sı bu key ile
      // başlatılır (prebuild AppDelegate'e enjekte eder). Key olmadan harita boş gelir.
      // iOS'a özel key varsa onu, yoksa ortak key'e düş (geriye dönük uyumlu).
      googleMapsApiKey:
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ??
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  plugins: [
    ...(config.plugins || []),
  ],
});
