import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatsCard } from '@/components/home/stats-card';
import { LiftUploadCard } from '@/components/home/lift-upload-card';
import { BarBuddyColors } from '@/constants/theme';

export default function HomeScreen() {
  const [selectedLiftType, setSelectedLiftType] = useState<string | null>(null);

  const handleLiftTypeSelect = (liftTypeId: string) => {
    setSelectedLiftType(liftTypeId);
  };

  const handleUpload = () => {
    if (!selectedLiftType) {
      alert('Please select a lift type first');
      return;
    }
    alert(`Uploading ${selectedLiftType} lift for analysis`);
  };

  const stats = [
    { icon: 'chart.line.uptrend.xyaxis', value: '0', label: 'Total Lifts' },
    { icon: 'target', value: '0', label: 'Valid Lifts' },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header with title */}
      <View style={styles.headerContainer}>
        <ThemedText type="title" style={styles.title}>
          Bar Buddy
        </ThemedText>
      </View>

      {/* Main content area - scrollable if needed but optimized to fit */}
      <ScrollView
        style={styles.contentScroll}
        scrollEnabled={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Stats Card */}
        <StatsCard stats={stats} />

        {/* Lift Upload Card */}
        <LiftUploadCard
          selectedLiftType={selectedLiftType}
          onLiftTypeSelect={handleLiftTypeSelect}
          onUpload={handleUpload}
        />
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
    backgroundColor: BarBuddyColors.dark,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BarBuddyColors.gray,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
});
