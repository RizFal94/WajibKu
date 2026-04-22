import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import { PrayerTime } from '../services/prayerService';

const { WidgetModule } = NativeModules;

/**
 * Hook: useWidgetSync
 * 
 * Otomatis mengirim data jadwal sholat ke Android Widget
 * setiap kali data prayers atau nextPrayer berubah.
 * 
 * Penggunaan:
 * // Di PrayerContext atau HomeScreen:
 * useWidgetSync(prayers, nextPrayer, location?.city || '');
 */
export function useWidgetSync(
  prayers: PrayerTime[],
  nextPrayer: PrayerTime | null,
  city: string
) {
  useEffect(() => {
    // Widget hanya tersedia di Android
    if (Platform.OS !== 'android') return;
    if (!WidgetModule || !prayers.length) return;

    const get = (key: string) =>
      prayers.find(p => p.key === key)?.timeString || '--:--';

    try {
      WidgetModule.updateWidget({
        fajr:       get('fajr'),
        dhuhr:      get('dhuhr'),
        asr:        get('asr'),
        maghrib:    get('maghrib'),
        isha:       get('isha'),
        city:       city || 'Lokasi Anda',
        nextPrayer: nextPrayer?.name || '',
        nextTime:   nextPrayer?.timeString || '',
      });
    } catch (e) {
      console.warn('[WidgetSync] Gagal update widget:', e);
    }
  }, [prayers, nextPrayer, city]);
}
