import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BarBuddyColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken, getIdToken, getRefreshToken } from '@/services/cognito-auth';

export default function ProfileScreen() {
  const { signOut, clearTokens, isLoading } = useAuth();
  const [tokens, setTokens] = useState({
    accessToken: null as string | null,
    idToken: null as string | null,
    refreshToken: null as string | null,
  });

  useEffect(() => {
    const fetchTokens = async () => {
      const access = await getAccessToken();
      const id = await getIdToken();
      const refresh = await getRefreshToken();
      setTokens({
        accessToken: access,
        idToken: id,
        refreshToken: refresh,
      });
    };
    fetchTokens();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <ThemedText type="title" style={styles.title}>
          Profile
        </ThemedText>
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ThemedText style={styles.sectionTitle}>Auth Tokens</ThemedText>
        
        {isLoading ? (
          <ThemedText style={styles.loadingText}>Loading tokens...</ThemedText>
        ) : (
          <>
            <View style={styles.tokenContainer}>
              <ThemedText style={styles.tokenLabel}>Access Token:</ThemedText>
              <ThemedText style={styles.tokenValue}>
                {tokens.accessToken ? `${tokens.accessToken.substring(0, 50)}...` : 'Not available'}
              </ThemedText>
            </View>

            <View style={styles.tokenContainer}>
              <ThemedText style={styles.tokenLabel}>ID Token:</ThemedText>
              <ThemedText style={styles.tokenValue}>
                {tokens.idToken ? `${tokens.idToken.substring(0, 50)}...` : 'Not available'}
              </ThemedText>
            </View>

            <View style={styles.tokenContainer}>
              <ThemedText style={styles.tokenLabel}>Refresh Token:</ThemedText>
              <ThemedText style={styles.tokenValue}>
                {tokens.refreshToken ? `${tokens.refreshToken.substring(0, 50)}...` : 'Not available'}
              </ThemedText>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={() => clearTokens()}>
          <ThemedText style={styles.clearButtonText}>Clear Tokens (Debug)</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  headerContainer: {
    backgroundColor: BarBuddyColors.primary,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BarBuddyColors.gray,
  },
  title: {
    color: BarBuddyColors.dark,
    fontSize: 28,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: BarBuddyColors.primary,
  },
  tokenContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: BarBuddyColors.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BarBuddyColors.border,
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: BarBuddyColors.dark,
  },
  tokenValue: {
    fontSize: 14,
    color: BarBuddyColors.gray,
    fontFamily: 'monospace',
  },
  loadingText: {
    fontSize: 16,
    color: BarBuddyColors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  signOutButton: {
    backgroundColor: '#FF3B30', // Red color for sign out
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#FFA500', // Orange color for debug
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },});