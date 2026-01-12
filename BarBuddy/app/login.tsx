import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { BarBuddyColors } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    await signIn();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <ThemedText style={styles.logoText}>🏋️‍♂️</ThemedText>
          </View>
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>Welcome to BarBuddy</ThemedText>
          <ThemedText style={styles.subtitle}>
            Track your lifts, monitor your progress, and achieve your fitness goals.
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
            <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.footerText}>
            Sign in or create an account to continue
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 60,
    backgroundColor: BarBuddyColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BarBuddyColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 50,
    paddingTop: 25,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BarBuddyColors.light,
    textAlign: 'center',
    paddingTop: 50,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: BarBuddyColors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: BarBuddyColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: BarBuddyColors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: BarBuddyColors.dark,
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 14,
    color: BarBuddyColors.gray,
    textAlign: 'center',
  },
});