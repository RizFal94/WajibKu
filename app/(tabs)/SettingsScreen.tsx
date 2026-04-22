import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Settings {
  notifFajr: boolean;
  notifDhuhr: boolean;
  notifAsr: boolean;
  notifMaghrib: boolean;
  notifIsha: boolean;
  notifBeforeMinutes: number;
}

const DEFAULT_SETTINGS: Settings = {
  notifFajr: true,
  notifDhuhr: true,
  notifAsr: true,
  notifMaghrib: true,
  notifIsha: true,
  notifBeforeMinutes: 10,
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [notifPermission, setNotifPermission] = useState(false);

  useEffect(() => {
    loadSettings();
    checkNotifPermission();
  }, []);

  async function loadSettings() {
    const saved = await AsyncStorage.getItem('settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }

  async function saveSettings(newSettings: Settings) {
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
  }

  async function checkNotifPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    setNotifPermission(status === 'granted');
  }

  async function requestNotifPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert(
        'Izin Diperlukan',
        'Aktifkan notifikasi di pengaturan perangkat untuk mendapatkan pengingat sholat.',
      );
    }
  }

  const toggleSetting = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof Settings] };
    saveSettings(newSettings);
  };

  const PRAYER_NOTIF_ITEMS = [
    { key: 'notifFajr', label: 'Subuh', icon: 'partly-sunny-outline' },
    { key: 'notifDhuhr', label: 'Dzuhur', icon: 'sunny' },
    { key: 'notifAsr', label: 'Ashar', icon: 'cloudy-outline' },
    { key: 'notifMaghrib', label: 'Maghrib', icon: 'partly-sunny-outline' },
    { key: 'notifIsha', label: 'Isya', icon: 'moon-outline' },
  ];

  return (
    <LinearGradient colors={['#0A1628', '#0F1B2D', '#162040']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Pengaturan</Text>

          {/* Notifikasi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifikasi Sholat</Text>
            
            {!notifPermission && (
              <TouchableOpacity
                style={styles.permissionBanner}
                onPress={requestNotifPermission}
              >
                <Ionicons name="notifications-off-outline" size={20} color="#FF6B6B" />
                <Text style={styles.permissionText}>
                  Izin notifikasi belum diberikan. Ketuk untuk mengaktifkan.
                </Text>
              </TouchableOpacity>
            )}

            {PRAYER_NOTIF_ITEMS.map((item) => (
              <View key={item.key} style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name={item.icon as any} size={18} color="#C9A84C" />
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={settings[item.key as keyof Settings] as boolean}
                  onValueChange={() => toggleSetting(item.key as keyof Settings)}
                  trackColor={{ false: '#1E3A5F', true: 'rgba(201,168,76,0.4)' }}
                  thumbColor={
                    (settings[item.key as keyof Settings] as boolean) ? '#C9A84C' : '#4A6B8A'
                  }
                />
              </View>
            ))}
          </View>

          {/* Widget Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Widget Android</Text>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#4A6B8A" />
              <Text style={styles.infoText}>
                Untuk menambahkan widget jadwal sholat di layar utama:{'\n\n'}
                1. Tekan lama area kosong di homescreen{'\n'}
                2. Pilih "Widget"{'\n'}
                3. Cari "WajibKu"{'\n'}
                4. Seret widget ke posisi yang diinginkan
              </Text>
            </View>
          </View>

          {/* Tentang */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutName}>WajibKu</Text>
              <Text style={styles.aboutVersion}>Versi 1.0.0</Text>
              <Text style={styles.aboutDesc}>
                Aplikasi jadwal sholat fardhu, menggunakan metode
                perhitungan sesuai standar Kementerian Agama Republik Indonesia.
              </Text>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 20 },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    color: '#C9A84C',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderColor: 'rgba(255,107,107,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  permissionText: {
    color: '#FF6B6B',
    fontSize: 12,
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  infoText: {
    color: '#8AA8C4',
    fontSize: 13,
    lineHeight: 22,
    flex: 1,
  },
  methodText: {
    color: '#8AA8C4',
    fontSize: 13,
    lineHeight: 22,
  },
  methodLabel: {
    color: '#C9A84C',
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
  },
  aboutName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  aboutVersion: {
    color: '#C9A84C',
    fontSize: 12,
    marginBottom: 12,
  },
  aboutDesc: {
    color: '#4A6B8A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
