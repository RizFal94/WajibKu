# WajibKu (maintenance)

### Aplikasi Jadwal Sholat Fardhu untuk Android

*Jadwal sholat akurat berbasis GPS · Kompas kiblat real-time · Widget homescreen Android*

</div>

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Jadwal Sholat Akurat** | Perhitungan berbasis koordinat GPS menggunakan metode Kemenag RI (Fajr 20°, Isha 18°, Mazhab Syafi'i) |
| **Deteksi Lokasi Otomatis** | GPS otomatis saat pertama kali install, dengan fallback ke 15+ kota preset Indonesia |
| **Kompas Kiblat Real-time** | Kompas interaktif dengan sensor magnetometer + GPS fusion, dilengkapi indikator alignment |
| **Widget Homescreen** | Widget Android yang menampilkan 5 waktu sholat, sholat berikutnya, dan countdown langsung di homescreen |
| **Tanggal Hijriyah** | Konversi otomatis ke kalender Hijriyah setiap hari |
| **Notifikasi Sholat** | Pengingat azan per waktu sholat yang bisa dikustomisasi |
| **Pilih Kota Manual** | Ganti lokasi ke kota manapun lewat modal pencarian tanpa perlu GPS |

---

## Tech Stack

```
WajibKu/
├── Frontend        React Native + Expo Router (TypeScript)
├── Kalkulasi       adhan-js  —  library perhitungan waktu sholat
├── Lokasi          expo-location  —  GPS + reverse geocoding
├── Sensor          expo-sensors (Magnetometer) + Location heading
├── Storage         AsyncStorage  —  cache lokasi & preferensi
├── Notifikasi      expo-notifications
├── Widget          Kotlin Native Module  —  Android AppWidget
└── UI              LinearGradient + Animated API + React Native StyleSheet
```

---

## Struktur Proyek

```
WajibKu/
├── app/
│   ├── (tabs)/
│   │   ├── HomeScreen.tsx          # Jadwal sholat & countdown
│   │   ├── QiblaScreen.tsx         # Kompas kiblat
│   │   └── SettingsScreen.tsx      # Pengaturan notifikasi
│   └── _layout.tsx                 # Root layout + providers
├── context/
│   ├── LocationContext.tsx         # GPS, reverse geocode, manual location
│   └── PrayerContext.tsx           # Kalkulasi & state jadwal sholat
├── services/
│   ├── prayerService.ts            # Wrapper adhan-js + Hijri date
│   └── widgetService.ts            # Bridge JS → Android Native Module
└── android/app/src/main/
    ├── java/com/wajibku/
    │   ├── PrayerWidgetProvider.kt  # Android AppWidget provider
    │   ├── WidgetDataModule.kt      # React Native Native Module
    │   ├── WidgetDataPackage.kt     # RN package registration
    │   └── BootReceiver.kt         # Widget revival after reboot
    └── res/
        ├── layout/widget_prayer_times.xml
        └── xml/prayer_widget_info.xml
```

---

## Cara Menjalankan

### Prasyarat

- Node.js 18+
- Java JDK 17+
- Android Studio (untuk emulator/build)
- Expo CLI: `npm install -g expo-cli`

### Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/yourusername/WajibKu.git
cd WajibKu

# 2. Install dependencies
npm install

# 3. Jalankan di development mode
npx expo start

# 4. Buka di Android (pilih salah satu)
npx expo run:android          # Physical device / emulator
```

### Build APK Release

```bash
# Generate APK
cd android
./gradlew assembleRelease

# APK tersedia di:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Memasang Widget Android

Setelah install APK:

1. **Buka aplikasi** WajibKu minimal sekali agar data jadwal tersimpan
2. **Tekan lama** area kosong di homescreen Android
3. Pilih **"Widget"**
4. Cari **"WajibKu"** di daftar widget
5. **Seret** widget ke posisi yang diinginkan

> Widget mendukung resize horizontal & vertikal, dan auto-update setiap menit.

---

<div align="center">

Dibuat dengan semangat, doa, dan "asisten" hehe — semoga bermanfaat


</div>
