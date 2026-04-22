/**
 * services/widgetService.ts
 *
 * Jembatan antara React Native (JS) dan Android Widget (Java/Native).
 * Import dan panggil updateWidgetData() dari PrayerContext setiap kali
 * jadwal sholat diperbarui.
 */

import { NativeModules, Platform } from 'react-native';

interface WidgetData {
  city: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  nextName: string;
  nextTime: string;
}

/**
 * Push prayer time data ke Android Widget via Native Module.
 * Fungsi ini safe dipanggil di iOS (no-op) maupun saat widget belum terpasang.
 */
export async function updateWidgetData(data: WidgetData): Promise<void> {
  // Widget hanya ada di Android
  if (Platform.OS !== 'android') return;

  try {
    const { WidgetDataModule } = NativeModules;
    if (!WidgetDataModule) {
      // Native module belum terdaftar — skip saja, jangan crash
      console.warn('[WidgetService] WidgetDataModule not found. Widget will not update.');
      return;
    }
    await WidgetDataModule.updateWidgetData(data);
  } catch (e) {
    // Jangan crash app hanya karena widget gagal update
    console.warn('[WidgetService] Failed to update widget:', e);
  }
}
