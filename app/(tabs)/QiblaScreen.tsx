import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../../context/LocationContext';

const KAABAH_LAT = 21.4225;
const KAABAH_LNG = 39.8262;

function getQiblaDirection(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABAH_LAT * Math.PI) / 180;
  const Δλ = ((KAABAH_LNG - lng) * Math.PI) / 180;
  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function getDistance(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABAH_LAT * Math.PI) / 180;
  const Δφ = ((KAABAH_LAT - lat) * Math.PI) / 180;
  const Δλ = ((KAABAH_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Smooth angle interpolation (shortest path)
function lerpAngle(current: number, target: number): number {
  let diff = target - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return current + diff * 0.15; // easing factor
}

export default function QiblaScreen() {
  const { location, loading } = useLocation();
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [heading, setHeading] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [isAligned, setIsAligned] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const alignPulse = useRef(new Animated.Value(1)).current;
  const currentAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Compute Qibla when location changes
  useEffect(() => {
    if (location) {
      const angle = getQiblaDirection(location.latitude, location.longitude);
      const dist = getDistance(location.latitude, location.longitude);
      setQiblaAngle(angle);
      setDistance(Math.round(dist));
    }
  }, [location]);

  // Real-time compass via Magnetometer + Location heading
  useEffect(() => {
    let magSub: any = null;
    let headingSub: any = null;

    const startSensors = async () => {
      // Try device heading first (more accurate, uses fusion)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          headingSub = await Location.watchHeadingAsync((headingData) => {
            const h = headingData.trueHeading >= 0
              ? headingData.trueHeading
              : headingData.magHeading;
            setHeading(h);
          });
          return; // heading watcher started, no need for magnetometer
        }
      } catch (_) {}

      // Fallback: raw magnetometer
      const isAvail = await Magnetometer.isAvailableAsync();
      if (!isAvail) {
        setSensorAvailable(false);
        return;
      }
      Magnetometer.setUpdateInterval(100);
      magSub = Magnetometer.addListener(({ x, y }) => {
        // Convert magnetometer to heading (0 = North)
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle = (angle + 360) % 360;
        // Magnetometer gives bearing from East — adjust to North
        angle = (90 - angle + 360) % 360;
        setHeading(angle);
      });
    };

    startSensors();

    return () => {
      if (magSub) magSub.remove();
      if (headingSub) headingSub.remove();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Animate compass rotation smoothly
  useEffect(() => {
    // Needle should point to Qibla: rotate compass ring opposite to device heading
    // so the arrow always points toward Mecca in world space
    const targetAngle = qiblaAngle - heading;

    const animate = () => {
      const smoothed = lerpAngle(currentAngleRef.current, targetAngle);
      currentAngleRef.current = smoothed;
      rotateAnim.setValue(smoothed);

      // Check alignment (within ±5°)
      const diff = Math.abs(((smoothed - targetAngle) + 360) % 360);
      const aligned = diff < 5 || diff > 355;
      setIsAligned(aligned);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [qiblaAngle, heading]);

  // Pulse when aligned
  useEffect(() => {
    if (isAligned) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(alignPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(alignPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      alignPulse.setValue(1);
    }
  }, [isAligned]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-360, 0, 360, 720],
    outputRange: ['-360deg', '0deg', '360deg', '720deg'],
  });

  const compassBorderColor = isAligned ? 'rgba(126,200,160,0.8)' : 'rgba(201,168,76,0.3)';

  return (
    <LinearGradient colors={['#0A1628', '#0F1B2D', '#162040']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Arah Kiblat</Text>
        <Text style={styles.subtitle}>Menuju Ka'bah, Mekkah Al-Mukarramah</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#C9A84C" />
            <Text style={styles.loadingText}>Mendeteksi lokasi...</Text>
          </View>
        ) : (
          <>
            {/* Alignment badge */}
            <View style={[styles.alignBadge, isAligned && styles.alignBadgeActive]}>
              <Ionicons
                name={isAligned ? 'checkmark-circle' : 'navigate-circle-outline'}
                size={16}
                color={isAligned ? '#7EC8A0' : '#4A6B8A'}
              />
              <Text style={[styles.alignText, isAligned && styles.alignTextActive]}>
                {isAligned ? 'Menghadap Kiblat ✓' : 'Arahkan ke Kiblat'}
              </Text>
            </View>

            <View style={styles.compassContainer}>
              {/* Outer glow ring */}
              <Animated.View
                style={[
                  styles.outerRing,
                  isAligned && { borderColor: 'rgba(126,200,160,0.4)' },
                  { transform: [{ scale: isAligned ? alignPulse : 1 }] },
                ]}
              />

              {/* Compass body — rotates with device heading (world-locked) */}
              <Animated.View
                style={[
                  styles.compass,
                  { borderColor: compassBorderColor },
                  { transform: [{ rotate: rotation }] },
                ]}
              >
                {/* Cardinal directions */}
                {[
                  { label: 'U', top: 10, left: '50%', tx: -8 },
                  { label: 'T', right: 10, top: '50%', ty: -8 },
                  { label: 'S', bottom: 10, left: '50%', tx: -8 },
                  { label: 'B', left: 10, top: '50%', ty: -8 },
                ].map(({ label, ...pos }) => (
                  <View key={label} style={[styles.dirLabel, pos as any]}>
                    <Text style={[styles.dirText, label === 'U' && styles.northText]}>
                      {label}
                    </Text>
                  </View>
                ))}

                {/* Tick marks */}
                {Array.from({ length: 36 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tick,
                      {
                        transform: [
                          { rotate: `${i * 10}deg` },
                          { translateY: -108 },
                        ],
                        height: i % 9 === 0 ? 12 : i % 3 === 0 ? 8 : 5,
                        opacity: i % 9 === 0 ? 0.8 : 0.3,
                      },
                    ]}
                  />
                ))}

                {/* Qibla arrow — fixed upward in compass space, compass rotates */}
                <View style={styles.arrowWrapper}>
                  <View style={styles.arrowUp}>
                    <Ionicons
                      name="caret-up"
                      size={52}
                      color={isAligned ? '#7EC8A0' : '#C9A84C'}
                    />
                    <Text style={styles.kaabaEmoji}>🕋</Text>
                  </View>
                  <View style={styles.arrowDown}>
                    <Ionicons
                      name="caret-down"
                      size={52}
                      color={isAligned ? 'rgba(126,200,160,0.25)' : 'rgba(201,168,76,0.2)'}
                    />
                  </View>
                </View>

                {/* Center dot */}
                <View style={[styles.centerDot, isAligned && styles.centerDotAligned]} />
              </Animated.View>
            </View>

            {!sensorAvailable && (
              <View style={styles.noSensorBanner}>
                <Ionicons name="warning-outline" size={14} color="#FF6B6B" />
                <Text style={styles.noSensorText}>
                  Sensor kompas tidak tersedia. Arahkan manual sesuai sudut kiblat.
                </Text>
              </View>
            )}

            {/* Info cards */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Sudut Kiblat</Text>
                  <Text style={styles.infoValue}>{Math.round(qiblaAngle)}°</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Arah Device</Text>
                  <Text style={styles.infoValue}>{Math.round(heading)}°</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Jarak Ka'bah</Text>
                  <Text style={styles.infoValue}>{distance.toLocaleString('id-ID')} km</Text>
                </View>
              </View>
            </View>

            {location && (
              <View style={styles.locationCard}>
                <Ionicons name="location" size={14} color="#C9A84C" />
                <Text style={styles.locationText}>
                  {location.city} ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                </Text>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#4A6B8A',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#4A6B8A', fontSize: 14 },

  alignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74,107,138,0.15)',
    borderColor: 'rgba(74,107,138,0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  alignBadgeActive: {
    backgroundColor: 'rgba(126,200,160,0.15)',
    borderColor: 'rgba(126,200,160,0.4)',
  },
  alignText: { color: '#4A6B8A', fontSize: 13, fontWeight: '600' },
  alignTextActive: { color: '#7EC8A0' },

  compassContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  outerRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  compass: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(15,27,45,0.95)',
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dirLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
  },
  dirText: { color: '#4A6B8A', fontSize: 12, fontWeight: '700' },
  northText: { color: '#C9A84C' },

  tick: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#C9A84C',
    borderRadius: 1,
    top: '50%',
    left: '50%',
    marginLeft: -1,
    transformOrigin: 'center bottom',
  },

  arrowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  arrowUp: { alignItems: 'center' },
  kaabaEmoji: {
    fontSize: 18,
    position: 'absolute',
    top: -2,
  },
  arrowDown: { marginTop: -10, alignItems: 'center' },

  centerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C9A84C',
    borderWidth: 2,
    borderColor: '#0F1B2D',
  },
  centerDotAligned: { backgroundColor: '#7EC8A0' },

  noSensorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderColor: 'rgba(255,107,107,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    width: '100%',
  },
  noSensorText: { color: '#FF6B6B', fontSize: 11, flex: 1 },

  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    padding: 20,
    width: '100%',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { color: '#4A6B8A', fontSize: 11, marginBottom: 4 },
  infoValue: { color: '#C9A84C', fontSize: 18, fontWeight: '700' },
  infoDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(201,168,76,0.2)',
  },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: { color: '#4A6B8A', fontSize: 12 },
});
