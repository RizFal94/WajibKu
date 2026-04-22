import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../../context/LocationContext';
import { usePrayer } from '../../context/PrayerContext';
import { PrayerTime } from '../../services/prayerService';

const { width } = Dimensions.get('window');

const PRAYER_ICONS: Record<string, string> = {
  fajr: 'partly-sunny-outline',
  sunrise: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'cloudy-outline',
  maghrib: 'partly-sunny-outline',
  isha: 'moon-outline',
};

const CITY_PRESETS = [
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Medan', lat: 3.5952, lng: 98.6722 },
  { name: 'Makassar', lat: -5.1477, lng: 119.4327 },
  { name: 'Semarang', lat: -6.9667, lng: 110.4167 },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Palembang', lat: -2.9761, lng: 104.7754 },
  { name: 'Denpasar', lat: -8.6705, lng: 115.2126 },
  { name: 'Malang', lat: -7.9667, lng: 112.6326 },
  { name: 'Balikpapan', lat: -1.2654, lng: 116.8312 },
  { name: 'Manado', lat: 1.4748, lng: 124.8421 },
  { name: 'Pontianak', lat: -0.0263, lng: 109.3425 },
  { name: 'Pekanbaru', lat: 0.5071, lng: 101.4477 },
  { name: 'Aceh', lat: 5.5483, lng: 95.3238 },
];

// ─── Location Picker Modal ────────────────────────────────────────────────────
function LocationPickerModal({
  visible,
  onClose,
  onSelectCity,
  onUseGPS,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (city: { name: string; lat: number; lng: number }) => void;
  onUseGPS: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = CITY_PRESETS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ms.overlay} activeOpacity={1} onPress={onClose}>
        {/* Prevent tap-through to overlay from sheet */}
        <TouchableOpacity activeOpacity={1} style={ms.sheet}>
          <LinearGradient colors={['#132035', '#0F1B2D']} style={ms.sheetInner}>
            {/* Handle bar */}
            <View style={ms.handle} />

            <Text style={ms.title}>Pilih Lokasi</Text>

            {/* Search input */}
            <View style={ms.searchBox}>
              <Ionicons name="search-outline" size={16} color="#4A6B8A" />
              <TextInput
                style={ms.searchInput}
                placeholder="Cari kota..."
                placeholderTextColor="#4A6B8A"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#4A6B8A" />
                </TouchableOpacity>
              )}
            </View>

            {/* GPS Button */}
            <TouchableOpacity style={ms.gpsBtn} onPress={onUseGPS}>
              <View style={ms.gpsBtnLeft}>
                <View style={ms.gpsIconBox}>
                  <Ionicons name="locate" size={20} color="#7EC8A0" />
                </View>
                <View>
                  <Text style={ms.gpsBtnTitle}>Gunakan GPS Otomatis</Text>
                  <Text style={ms.gpsBtnSub}>Deteksi lokasi perangkat saat ini</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#4A6B8A" />
            </TouchableOpacity>

            <View style={ms.divider} />
            <Text style={ms.presetLabel}>— Pilih Kota —</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={ms.cityList}>
              {filtered.map(city => (
                <TouchableOpacity
                  key={city.name}
                  style={ms.cityRow}
                  onPress={() => onSelectCity(city)}
                >
                  <Ionicons name="location-outline" size={16} color="#C9A84C" />
                  <Text style={ms.cityName}>{city.name}</Text>
                  <Text style={ms.cityCoord}>
                    {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
              <Text style={ms.cancelText}>Batal</Text>
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { prayers, nextPrayer, currentPrayer, countdown, hijriDate, todayDate, loading } =
    usePrayer();
  const { location, error: locationError, refreshLocation, setManualLocation } = useLocation();

  const countdownAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [loading]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(countdownAnim, { toValue: 1.03, duration: 500, useNativeDriver: true }),
      Animated.timing(countdownAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [countdown]);

  const handleSelectCity = (city: { name: string; lat: number; lng: number }) => {
    setShowLocationPicker(false);
    setManualLocation({ latitude: city.lat, longitude: city.lng, city: city.name, district: '' });
  };

  const handleUseGPS = () => {
    setShowLocationPicker(false);
    refreshLocation();
  };

  // Build display list: semua sholat + sisipkan sunrise setelah fajr
  const sunrisePrayer = prayers.find(p => p.key === 'sunrise');
  const fivePrayers = prayers.filter(p => p.key !== 'sunrise');
  const displayPrayers: PrayerTime[] = [];
  for (const p of fivePrayers) {
    displayPrayers.push(p);
    if (p.key === 'fajr' && sunrisePrayer) {
      displayPrayers.push(sunrisePrayer);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9A84C" />
        <Text style={styles.loadingText}>Menghitung jadwal sholat...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0A1628', '#0F1B2D', '#162040']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshLocation} tintColor="#C9A84C" />
          }
        >
          {/* ── Header Lokasi ── */}
          <View style={styles.header}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#C9A84C" />
              <Text style={styles.locationText} numberOfLines={1}>
                {location ? location.city : 'Mendeteksi lokasi...'}
              </Text>

              {/* Tombol Ubah Lokasi */}
              <TouchableOpacity
                style={styles.changeLocBtn}
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal-outline" size={13} color="#C9A84C" />
                <Text style={styles.changeLocText}>Ubah</Text>
              </TouchableOpacity>

              {/* Tombol Refresh GPS */}
              <TouchableOpacity onPress={refreshLocation} style={styles.refreshBtn}>
                <Ionicons name="refresh-outline" size={16} color="#4A6B8A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.dateText}>{todayDate}</Text>
            {hijriDate ? <Text style={styles.hijriText}>{hijriDate}</Text> : null}
          </View>

          {locationError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
              <Text style={styles.errorText}>{locationError}</Text>
            </View>
          ) : null}

          {/* ── Card Sholat Berikutnya ── */}
          {nextPrayer && (
            <LinearGradient
              colors={['#1A3A5C', '#0D2540', '#0A1F3A']}
              style={styles.nextPrayerCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.nextPrayerDecor} />
              <Text style={styles.nextPrayerLabel}>Sholat Berikutnya</Text>
              <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
              <Text style={styles.nextPrayerArabic}>{nextPrayer.arabicName}</Text>
              <Text style={styles.nextPrayerTime}>{nextPrayer.timeString}</Text>

              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>Menghitung mundur</Text>
                <Animated.Text
                  style={[styles.countdownText, { transform: [{ scale: countdownAnim }] }]}
                >
                  {countdown}
                </Animated.Text>
              </View>

              <View style={styles.moonOrna}>
                <Ionicons name="moon" size={80} color="rgba(201,168,76,0.07)" />
              </View>
            </LinearGradient>
          )}

          <Text style={styles.sectionTitle}>Jadwal Sholat Hari Ini</Text>

          {displayPrayers.map((prayer, index) => (
            <PrayerCard
              key={prayer.key}
              prayer={prayer}
              isNext={nextPrayer?.key === prayer.key}
              isCurrent={currentPrayer?.key === prayer.key}
              isSunrise={prayer.key === 'sunrise'}
              index={index}
            />
          ))}

          <View style={{ height: 30 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      {/* ── Location Picker Modal ── */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectCity={handleSelectCity}
        onUseGPS={handleUseGPS}
      />
    </LinearGradient>
  );
}

// ─── Prayer Card ──────────────────────────────────────────────────────────────
function PrayerCard({
  prayer,
  isNext,
  isCurrent,
  isSunrise,
  index,
}: {
  prayer: PrayerTime;
  isNext: boolean;
  isCurrent: boolean;
  isSunrise: boolean;
  index: number;
}) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 70, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const iconColor = isNext
    ? '#C9A84C'
    : isCurrent
    ? '#7EC8A0'
    : isSunrise
    ? '#E8A838'
    : '#4A6B8A';

  return (
    <Animated.View
      style={[
        styles.prayerCard,
        isNext && styles.prayerCardNext,
        isCurrent && !isNext && styles.prayerCardCurrent,
        isSunrise && styles.prayerCardSunrise,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      {/* Left accent bar */}
      {isNext && <View style={styles.nextIndicator} />}
      {isSunrise && <View style={styles.sunriseIndicator} />}

      {/* Icon */}
      <View style={[styles.prayerIconBox, isSunrise && styles.prayerIconBoxSunrise]}>
        <Ionicons name={(PRAYER_ICONS[prayer.key] || 'time-outline') as any} size={22} color={iconColor} />
      </View>

      {/* Name */}
      <View style={styles.prayerInfo}>
        <Text
          style={[
            styles.prayerName,
            isNext && styles.prayerNameNext,
            isCurrent && !isNext && styles.prayerNameCurrent,
            isSunrise && styles.prayerNameSunrise,
          ]}
        >
          {prayer.name}
        </Text>
        <Text style={styles.prayerArabic}>{prayer.arabicName}</Text>
      </View>

      {/* Time + Badge */}
      <View style={styles.prayerRight}>
        <Text
          style={[
            styles.prayerTime,
            isNext && styles.prayerTimeNext,
            isSunrise && styles.prayerTimeSunrise,
          ]}
        >
          {prayer.timeString}
        </Text>
        {isNext && (
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>Berikutnya</Text>
          </View>
        )}
        {isCurrent && !isNext && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Sekarang</Text>
          </View>
        )}
        {isSunrise && (
          <View style={styles.sunriseBadge}>
            <Text style={styles.sunriseBadgeText}>Syuruq</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  loadingContainer: {
    flex: 1, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { color: '#4A6B8A', fontSize: 14, fontStyle: 'italic' },

  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  locationText: { color: '#C9A84C', fontSize: 15, fontWeight: '700', flex: 1 },

  changeLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderColor: 'rgba(201,168,76,0.35)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  changeLocText: { color: '#C9A84C', fontSize: 11, fontWeight: '700' },
  refreshBtn: { padding: 4 },

  dateText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', opacity: 0.8 },
  hijriText: { color: '#C9A84C', fontSize: 12, opacity: 0.7, marginTop: 2 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,107,107,0.1)', borderColor: 'rgba(255,107,107,0.3)',
    borderWidth: 1, marginHorizontal: 20, marginBottom: 12, padding: 10, borderRadius: 10,
  },
  errorText: { color: '#FF6B6B', fontSize: 12, flex: 1 },

  nextPrayerCard: {
    marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', overflow: 'hidden', position: 'relative',
  },
  nextPrayerDecor: {
    position: 'absolute', top: -30, right: -30, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(201,168,76,0.05)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)',
  },
  moonOrna: { position: 'absolute', bottom: -10, right: 10, opacity: 0.5 },
  nextPrayerLabel: {
    color: '#C9A84C', fontSize: 11, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
  },
  nextPrayerName: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  nextPrayerArabic: { color: 'rgba(201,168,76,0.6)', fontSize: 20, marginBottom: 4 },
  nextPrayerTime: {
    color: '#FFFFFF', fontSize: 42, fontWeight: '200', letterSpacing: 2, marginBottom: 16,
  },
  countdownContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 12,
    alignSelf: 'flex-start', minWidth: 180,
  },
  countdownLabel: {
    color: '#4A6B8A', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
  },
  countdownText: {
    color: '#C9A84C', fontSize: 24, fontWeight: '700', letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },

  sectionTitle: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '700',
    paddingHorizontal: 20, marginBottom: 12, opacity: 0.9,
  },

  prayerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 20, marginBottom: 8,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden', position: 'relative',
  },
  prayerCardNext: {
    backgroundColor: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.3)',
  },
  prayerCardCurrent: {
    backgroundColor: 'rgba(126,200,160,0.06)', borderColor: 'rgba(126,200,160,0.2)',
  },
  prayerCardSunrise: {
    backgroundColor: 'rgba(232,168,56,0.05)',
    borderColor: 'rgba(232,168,56,0.2)',
    borderStyle: 'dashed',
  },

  nextIndicator: {
    position: 'absolute', left: 0, top: 10, bottom: 10,
    width: 3, backgroundColor: '#C9A84C', borderRadius: 3,
  },
  sunriseIndicator: {
    position: 'absolute', left: 0, top: 10, bottom: 10,
    width: 3, backgroundColor: '#E8A838', borderRadius: 3, opacity: 0.6,
  },

  prayerIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  prayerIconBoxSunrise: { backgroundColor: 'rgba(232,168,56,0.08)' },

  prayerInfo: { flex: 1 },
  prayerName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  prayerNameNext: { color: '#C9A84C' },
  prayerNameCurrent: { color: '#7EC8A0' },
  prayerNameSunrise: { color: '#E8A838', opacity: 0.85, fontSize: 15 },
  prayerArabic: { color: '#4A6B8A', fontSize: 13, marginTop: 2 },

  prayerRight: { alignItems: 'flex-end', gap: 4 },
  prayerTime: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  prayerTimeNext: { color: '#C9A84C' },
  prayerTimeSunrise: { color: '#E8A838', opacity: 0.8, fontSize: 17 },

  nextBadge: {
    backgroundColor: 'rgba(201,168,76,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  nextBadgeText: { color: '#C9A84C', fontSize: 10, fontWeight: '700' },
  currentBadge: {
    backgroundColor: 'rgba(126,200,160,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  currentBadgeText: { color: '#7EC8A0', fontSize: 10, fontWeight: '700' },
  sunriseBadge: {
    backgroundColor: 'rgba(232,168,56,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  sunriseBadgeText: { color: '#E8A838', fontSize: 10, fontWeight: '600' },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end',
  },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '85%' },
  sheetInner: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 14 },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 18,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14, padding: 0 },

  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(126,200,160,0.08)',
    borderColor: 'rgba(126,200,160,0.3)', borderWidth: 1,
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  gpsBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gpsIconBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(126,200,160,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  gpsBtnTitle: { color: '#7EC8A0', fontSize: 14, fontWeight: '700' },
  gpsBtnSub: { color: '#4A6B8A', fontSize: 11, marginTop: 2 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 12 },
  presetLabel: {
    color: '#4A6B8A', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    textAlign: 'center', marginBottom: 10,
  },

  cityList: { maxHeight: 280 },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cityName: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1 },
  cityCoord: { color: '#4A6B8A', fontSize: 11 },

  cancelBtn: {
    marginTop: 16, alignItems: 'center', paddingVertical: 13,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
  },
  cancelText: { color: '#4A6B8A', fontSize: 14, fontWeight: '600' },
});
