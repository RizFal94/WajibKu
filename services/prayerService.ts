import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';

export interface PrayerTime {
  name: string;
  arabicName: string;
  time: Date;
  timeString: string;
  key: string;
}

export interface PrayerSchedule {
  date: Date;
  city: string;
  prayers: PrayerTime[];
  nextPrayer: PrayerTime | null;
  nextPrayerCountdown: string;
}

const PRAYER_NAMES: Record<string, { name: string; arabicName: string }> = {
  fajr:    { name: 'Subuh',   arabicName: 'الفجر' },
  sunrise: { name: 'Syuruq (Terbit)',  arabicName: 'الشروق' },
  dhuhr:   { name: 'Dzuhur',  arabicName: 'الظهر' },
  asr:     { name: 'Ashar',   arabicName: 'العصر' },
  maghrib: { name: 'Maghrib', arabicName: 'المغرب' },
  isha:    { name: 'Isya',    arabicName: 'العشاء' },
};

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): PrayerTime[] {
  const coords = new Coordinates(latitude, longitude);
  // Menggunakan metode Kemenag (MoonsightingCommittee paling dekat untuk Indonesia)
  // Atau bisa pakai CalculationMethod.MuslimWorldLeague() / CalculationMethod.MoonsightingCommittee()
  const params = CalculationMethod.MoonsightingCommittee();
  params.madhab = Madhab.Shafi; // Mayoritas Indonesia Syafi'i
  params.fajrAngle = 20; // Kemenag RI
  params.ishaAngle = 18;

  const prayerTimes = new PrayerTimes(coords, date, params);

  const prayers: PrayerTime[] = [
    {
      key: 'fajr',
      ...PRAYER_NAMES['fajr'],
      time: prayerTimes.fajr,
      timeString: formatTime(prayerTimes.fajr),
    },
    {
      key: 'sunrise',
      ...PRAYER_NAMES['sunrise'],
      time: prayerTimes.sunrise,
      timeString: formatTime(prayerTimes.sunrise),
    },
    {
      key: 'dhuhr',
      ...PRAYER_NAMES['dhuhr'],
      time: prayerTimes.dhuhr,
      timeString: formatTime(prayerTimes.dhuhr),
    },
    {
      key: 'asr',
      ...PRAYER_NAMES['asr'],
      time: prayerTimes.asr,
      timeString: formatTime(prayerTimes.asr),
    },
    {
      key: 'maghrib',
      ...PRAYER_NAMES['maghrib'],
      time: prayerTimes.maghrib,
      timeString: formatTime(prayerTimes.maghrib),
    },
    {
      key: 'isha',
      ...PRAYER_NAMES['isha'],
      time: prayerTimes.isha,
      timeString: formatTime(prayerTimes.isha),
    },
  ];

  return prayers;
}

export function getNextPrayer(prayers: PrayerTime[]): PrayerTime | null {
  const now = new Date();
  // Hanya tampilkan sholat wajib 5 waktu (skip sunrise)
  const fivePrayers = prayers.filter(p => p.key !== 'sunrise');
  const next = fivePrayers.find(p => p.time > now);
  return next || fivePrayers[0]; // Kalau sudah lewat semua, kembali ke Subuh
}

export function getCountdown(targetTime: Date): string {
  const now = new Date();
  let diff = targetTime.getTime() - now.getTime();
  if (diff < 0) {
    // Tambah 1 hari kalau sudah lewat
    diff += 24 * 60 * 60 * 1000;
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function getCurrentPrayer(prayers: PrayerTime[]): PrayerTime | null {
  const now = new Date();
  const fivePrayers = prayers.filter(p => p.key !== 'sunrise');
  let current: PrayerTime | null = null;
  for (const prayer of fivePrayers) {
    if (prayer.time <= now) {
      current = prayer;
    } else {
      break;
    }
  }
  return current;
}

export function getHijriDate(): string {
  const now = new Date();
  try {
    const hijri = new Intl.DateTimeFormat('id-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    return hijri;
  } catch {
    return '';
  }
}
