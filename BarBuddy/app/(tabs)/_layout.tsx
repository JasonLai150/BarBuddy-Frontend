import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useJobPolling } from '@/hooks/use-job-polling';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs } from '@/contexts/JobContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  const { syncWithBackend } = useJobs();
  
  // Start background job polling
  useJobPolling();

  // Sync jobs with backend on auth
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[TabLayout] Syncing jobs with backend');
      syncWithBackend();
    }
  }, [isAuthenticated, syncWithBackend]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].icon,
        headerShown: false,
        title: '',
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopColor: Colors[colorScheme ?? 'light'].icon,
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="view"
        options={{
          title: 'View',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="binoculars.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
