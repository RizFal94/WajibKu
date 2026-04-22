import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from '../context/LocationContext';
import { PrayerProvider } from '../context/PrayerContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* StatusBar global untuk seluruh aplikasi */}
      <StatusBar barStyle="light-content" backgroundColor="#0F1B2D" />

      {/* Provider di sini agar bisa diakses semua screen */}
      <LocationProvider>
        <PrayerProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PrayerProvider>
      </LocationProvider>
    </SafeAreaProvider>
  );
}
