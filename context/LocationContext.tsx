import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  district: string;
}

// Lokasi default (Surabaya) — dipakai jika GPS gagal dan tidak ada cache
const DEFAULT_LOCATION: LocationData = {
  latitude: -7.2575,
  longitude: 112.7521,
  city: 'Surabaya',
  district: '',
};

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  setManualLocation: (loc: LocationData) => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: true,
  error: null,
  refreshLocation: async () => {},
  setManualLocation: async () => {},
});

export const useLocation = () => useContext(LocationContext);

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; district: string }> {
  try {
    const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (result && result.length > 0) {
      const place = result[0];
      const city = place.city || place.subregion || place.region || 'Kota Tidak Diketahui';
      const district = place.district || place.subregion || '';
      return { city, district };
    }
  } catch (e) {}
  return { city: 'Lokasi Saat Ini', district: '' };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Mount: baca cache, lalu auto-GPS jika tidak ada cache ───────────────
  useEffect(() => {
    (async () => {
      try {
        // 1. Cek cache dulu
        const cached = await AsyncStorage.getItem('last_location');
        if (cached) {
          setLocation(JSON.parse(cached));
          setLoading(false);
          return; // Ada cache → langsung tampilkan, selesai
        }

        // 2. Tidak ada cache → coba GPS otomatis (install pertama kali)
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const { city, district } = await reverseGeocode(
              loc.coords.latitude,
              loc.coords.longitude
            );
            const locationData: LocationData = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              city,
              district,
            };
            setLocation(locationData);
            await AsyncStorage.setItem('last_location', JSON.stringify(locationData));
          } catch {
            // GPS timeout atau gagal → pakai default
            setLocation(DEFAULT_LOCATION);
          }
        } else {
          // Izin ditolak → pakai default tanpa error (ini mount awal, bukan user action)
          setLocation(DEFAULT_LOCATION);
        }
      } catch {
        // AsyncStorage error → pakai default
        setLocation(DEFAULT_LOCATION);
      } finally {
        setLoading(false); // SELALU set false agar tidak stuck
      }
    })();
  }, []);

  // ─── User aktif minta GPS (tombol refresh / "Gunakan GPS Otomatis") ───────
  const refreshLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Izin lokasi ditolak. Aktifkan lokasi untuk jadwal sholat akurat.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { city, district } = await reverseGeocode(
        loc.coords.latitude,
        loc.coords.longitude
      );

      const locationData: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        city,
        district,
      };

      setLocation(locationData);
      setError(null);
      await AsyncStorage.setItem('last_location', JSON.stringify(locationData));
    } catch (e) {
      setError('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
    } finally {
      setLoading(false);
    }
  };

  // ─── User pilih kota manual ───────────────────────────────────────────────
  const setManualLocation = async (loc: LocationData) => {
    setError(null);
    setLocation(loc);
    await AsyncStorage.setItem('last_location', JSON.stringify(loc));
  };

  return (
    <LocationContext.Provider
      value={{ location, loading, error, refreshLocation, setManualLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
}
