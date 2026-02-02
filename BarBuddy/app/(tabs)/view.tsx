import { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { JobDetailModal } from '@/components/JobDetailModal';
import { BarBuddyColors } from '@/constants/theme';
import { useJobs } from '@/contexts/JobContext';
import { LocalJob, LocalJobStatus } from '@/services/api-service';

export default function ViewScreen() {
  const insets = useSafeAreaInsets();
  const { jobs, refreshJobs, isLoading } = useJobs();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<LocalJob | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshJobs();
    setRefreshing(false);
  };

  const handleJobPress = (job: LocalJob) => {
    // Only open modal for completed jobs
    if (job.status === 'DONE') {
      setSelectedJob(job);
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedJob(null);
  };

  const getStatusColor = (status: LocalJobStatus) => {
    switch (status) {
      case 'DONE':
        return BarBuddyColors.success;
      case 'PROCESSING':
      case 'UPLOADED':
        return BarBuddyColors.warning;
      case 'ERROR':
        return BarBuddyColors.error;
      default:
        return BarBuddyColors.textSecondary;
    }
  };

  const getStatusIcon = (status: LocalJobStatus) => {
    switch (status) {
      case 'DONE':
        return 'checkmark.circle.fill';
      case 'PROCESSING':
      case 'UPLOADED':
        return 'clock.fill';
      case 'ERROR':
        return 'exclamationmark.triangle.fill';
      default:
        return 'circle';
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderJobCard = (job: LocalJob) => {
    const hasPreview = job.preview?.thumbnailBase64 && !job.preview?.error;
    const isCompleted = job.status === 'DONE';

    return (
      <TouchableOpacity 
        key={job.jobId}
        style={styles.jobCard}
        activeOpacity={0.7}
        onPress={() => handleJobPress(job)}
        disabled={!isCompleted}
      >
        {/* Preview Image or Placeholder */}
        <View style={styles.previewContainer}>
          {hasPreview && job.preview?.thumbnailBase64 ? (
            <Image 
              source={{ uri: job.preview.thumbnailBase64 }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <IconSymbol 
                name="video.fill" 
                size={32} 
                color={BarBuddyColors.textSecondary} 
              />
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <IconSymbol 
              name={getStatusIcon(job.status) as any} 
              size={12} 
              color={BarBuddyColors.whiteText} 
            />
            <ThemedText style={styles.statusText}>{job.status}</ThemedText>
          </View>
        </View>

        {/* Job Info */}
        <View style={styles.jobInfo}>
          <View style={styles.jobHeader}>
            <ThemedText style={styles.liftType}>
              {job.liftType || 'Unknown Lift'}
            </ThemedText>
            <View style={styles.timestampContainer}>
              <ThemedText style={styles.timestamp}>
                {formatDate(job.createdAt)}
              </ThemedText>
              {isCompleted && (
                <IconSymbol 
                  name="chevron.right" 
                  size={16} 
                  color={BarBuddyColors.primary} 
                />
              )}
            </View>
          </View>

          {job.preview?.durationSec && (
            <ThemedText style={styles.jobMeta}>
              Duration: {job.preview.durationSec}s
            </ThemedText>
          )}

          {job.preview?.error && (
            <ThemedText style={styles.errorText}>
              Preview unavailable
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header with title - respects safe area */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <ThemedText type="title" style={styles.title}>
          Your Lifts
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {jobs.length} {jobs.length === 1 ? 'analysis' : 'analyses'} submitted
        </ThemedText>
      </View>

      {/* Job Gallery */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BarBuddyColors.primary}
            colors={[BarBuddyColors.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={BarBuddyColors.primary} />
            <ThemedText style={styles.loadingText}>Loading your lifts...</ThemedText>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol 
              name="video.slash" 
              size={64} 
              color={BarBuddyColors.textSecondary} 
            />
            <ThemedText style={styles.emptyTitle}>No Lifts Yet</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Upload your first lift analysis from the Home tab
            </ThemedText>
          </View>
        ) : (
          <View style={styles.jobGrid}>
            {jobs.map(renderJobCard)}
          </View>
        )}
      </ScrollView>

      {/* Job Detail Modal */}
      <JobDetailModal
        visible={modalVisible}
        job={selectedJob}
        onClose={handleCloseModal}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  headerContainer: {
    backgroundColor: BarBuddyColors.cardBackground,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BarBuddyColors.border,
  },
  title: {
    color: BarBuddyColors.whiteText,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: BarBuddyColors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BarBuddyColors.dark,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    color: BarBuddyColors.textSecondary,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BarBuddyColors.whiteText,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: BarBuddyColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  jobGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  jobCard: {
    backgroundColor: BarBuddyColors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BarBuddyColors.border,
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: BarBuddyColors.dark,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BarBuddyColors.dark,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: BarBuddyColors.whiteText,
    textTransform: 'uppercase',
  },
  jobInfo: {
    padding: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  liftType: {
    fontSize: 16,
    fontWeight: '600',
    color: BarBuddyColors.whiteText,
    textTransform: 'capitalize',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: BarBuddyColors.textSecondary,
  },
  jobMeta: {
    fontSize: 12,
    color: BarBuddyColors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: BarBuddyColors.error,
    marginTop: 2,
  },
});
