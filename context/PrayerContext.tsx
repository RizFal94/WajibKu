import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  PrayerTime,
  calculatePrayerTimes,
  getCountdown,
  getCurrentPrayer,
  getHijriDate,
  getNextPrayer,
} from '../services/prayerService';
import { updateWidgetData } from '../services/widgetService';
import { useLocation } from './LocationContext';

interface PrayerContextType {
  prayers: PrayerTime[];
  nextPrayer: PrayerTime | null;
  currentPrayer: PrayerTime | null;
  countdown: string;
  hijriDate: string;
  todayDate: string;
  loading: boolean;
}

const PrayerContext = createContext<PrayerContextType>({
  prayers: [],
  nextPrayer: null,
  currentPrayer: null,
  countdown: '00:00:00',
  hijriDate: '',
  todayDate: '',
  loading: true,
});

export const usePrayer = () => useContext(PrayerContext);

export function PrayerProvider({ children }: { children: ReactNode }) {
  const { location, loading: locationLoading } = useLocation();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<PrayerTime | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');
  const [hijriDate, setHijriDate] = useState('');
  const [todayDate, setTodayDate] = useState('');
  const [loading, setLoading] = useState(true);

  const calculatePrayers = useCallback(() => {
    // ── FIX: jika location null tapi locationLoading sudah selesai → stop loading
    if (!location) {
      if (!locationLoading) setLoading(false);
      return;
    }

    const now = new Date();
    const result = calculatePrayerTimes(location.latitude, location.longitude, now);
    setPrayers(result);
    setNextPrayer(getNextPrayer(result));
    setCurrentPrayer(getCurrentPrayer(result));
    setHijriDate(getHijriDate());
    setTodayDate(
      now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
    setLoading(false);

    const fajr    = result.find(p => p.key === 'fajr');
    const dhuhr   = result.find(p => p.key === 'dhuhr');
    const asr     = result.find(p => p.key === 'asr');
    const maghrib = result.find(p => p.key === 'maghrib');
    const isha    = result.find(p => p.key === 'isha');


    updateWidgetData({
      city:     location.city,
      fajr:     fajr?.timeString    ?? '--:--',
      dhuhr:    dhuhr?.timeString   ?? '--:--',
      asr:      asr?.timeString     ?? '--:--',
      maghrib:  maghrib?.timeString ?? '--:--',
      isha:     isha?.timeString    ?? '--:--',
      nextName: nextPrayer?.name          ?? '',
      nextTime: nextPrayer?.timeString    ?? '--:--',
    });
  }, [location, locationLoading]);

  useEffect(() => {
    calculatePrayers();
  }, [calculatePrayers]);

  // Recalculate setiap tengah malam
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 5, 0);
    const msToMidnight = midnight.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      calculatePrayers();
    }, msToMidnight);
    return () => clearTimeout(timeout);
  }, [calculatePrayers]);

  // Update countdown tiap detik
  useEffect(() => {
    if (!nextPrayer) return;
    const interval = setInterval(() => {
      const np = getNextPrayer(prayers);
      setNextPrayer(np);
      setCurrentPrayer(getCurrentPrayer(prayers));
      if (np) setCountdown(getCountdown(np.time));
    }, 1000);
    return () => clearInterval(interval);
  }, [prayers, nextPrayer]);

  return (
    <PrayerContext.Provider
      value={{ prayers, nextPrayer, currentPrayer, countdown, hijriDate, todayDate, loading }}
    >
      {children}
    </PrayerContext.Provider>
  );
}
