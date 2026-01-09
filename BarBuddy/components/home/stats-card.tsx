import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BarBuddyColors } from '@/constants/theme';

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

interface StatsCardProps {
  stats: StatItem[];
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Your Stats
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Track your progress over time
      </ThemedText>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.iconContainer}>
              <IconSymbol
                name={stat.icon as any}
                size={24}
                color={BarBuddyColors.primary}
              />
            </View>
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
            <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BarBuddyColors.dark,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: BarBuddyColors.gray,
    fontSize: 14,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#2A2D30',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: BarBuddyColors.gray,
    fontSize: 12,
    textAlign: 'center',
  },
});
