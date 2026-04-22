import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Styling tab bar
        tabBarStyle: {
          backgroundColor: '#0F1B2D',
          borderTopColor: '#1E3A5F',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 5,
          height: 70,
        },

        // Warna icon & label
        tabBarActiveTintColor: '#C9A84C',
        tabBarInactiveTintColor: '#4A6B8A',

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'moon' : 'moon-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="QiblaScreen"
        options={{
          title: 'Kiblat',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
