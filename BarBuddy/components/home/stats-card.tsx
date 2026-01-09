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
    backgroundColor: BarBuddyColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: BarBuddyColors.border,
  },
  title: {
    color: BarBuddyColors.whiteText,
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
    backgroundColor: BarBuddyColors.innerBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BarBuddyColors.border,
  },
  iconContainer: {
    marginBottom: 8,
  },
  statValue: {
    color: BarBuddyColors.whiteText,
    fontSize: 28,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  statLabel: {
    color: BarBuddyColors.gray,
    fontSize: 12,
    textAlign: 'center',
  },
});
