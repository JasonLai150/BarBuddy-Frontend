import { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WireframeViewer } from '@/components/WireframeViewer';
import { BarBuddyColors } from '@/constants/theme';
import { LocalJob, getJobResults } from '@/services/api-service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabType = 'overlay' | 'wireframe' | 'barpath';

interface JobDetailModalProps {
  visible: boolean;
  job: LocalJob | null;
  onClose: () => void;
}

export function JobDetailModal({ visible, job, onClose }: JobDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overlay');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh signed URLs when modal opens
  useEffect(() => {
    if (visible && job) {
      fetchVideoUrl();
      setActiveTab('overlay'); // Reset to overlay tab
    } else {
      // Reset state when modal closes
      setVideoUrl(null);
      setError(null);
    }
  }, [visible, job]);

  const fetchVideoUrl = async () => {
    if (!job) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[JobDetailModal] Fetching results for job:', job.jobId);
      const results = await getJobResults(job.jobId);
      
      // Find the viz video URL
      const vizUrlObj = results.urls.find((u) => u.name === 'viz');
      if (vizUrlObj?.url) {
        setVideoUrl(vizUrlObj.url);
        console.log('[JobDetailModal] Video URL fetched successfully');
      } else {
        throw new Error('Video URL not found in results');
      }
    } catch (err) {
      console.error('[JobDetailModal] Error fetching video URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabButton = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <ThemedText
          style={[
            styles.tabButtonText,
            isActive && styles.tabButtonTextActive,
          ]}
        >
          {label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BarBuddyColors.primary} />
          <ThemedText style={styles.loadingText}>Loading video...</ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={BarBuddyColors.error} />
          <ThemedText style={styles.errorTitle}>Error Loading Video</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchVideoUrl}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'overlay':
        return (
          <View style={styles.videoContainer}>
            {videoUrl ? (
              <Video
                source={{ uri: videoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={false}
              />
            ) : (
              <View style={styles.centerContainer}>
                <ThemedText style={styles.emptyText}>No video available</ThemedText>
              </View>
            )}
          </View>
        );

      case 'wireframe':
        return job ? (
          <WireframeViewer job={job} />
        ) : null;

      case 'barpath':
        return (
          <View style={styles.centerContainer}>
            <IconSymbol name="line.3.horizontal.decrease" size={64} color={BarBuddyColors.textSecondary} />
            <ThemedText style={styles.emptyTitle}>Bar Path View</ThemedText>
            <ThemedText style={styles.emptyText}>Coming soon</ThemedText>
          </View>
        );

      default:
        return null;
    }
  };

  if (!job) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Darkened background overlay */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Modal content - prevent backdrop press from closing when tapping inside */}
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.headerTitle}>
                {job.liftType || 'Lift Analysis'}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {new Date(job.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={24} color={BarBuddyColors.whiteText} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            {renderTabButton('overlay', 'Overlay')}
            {renderTabButton('wireframe', 'Wireframe')}
            {renderTabButton('barpath', 'Bar Path')}
          </View>

          {/* Content Area */}
          <View style={styles.content}>
            {renderContent()}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: BarBuddyColors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BarBuddyColors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BarBuddyColors.border,
    backgroundColor: BarBuddyColors.cardBackground,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BarBuddyColors.whiteText,
    textTransform: 'capitalize',
  },
  headerSubtitle: {
    fontSize: 14,
    color: BarBuddyColors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: BarBuddyColors.innerBackground,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: BarBuddyColors.innerBackground,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: BarBuddyColors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: BarBuddyColors.textSecondary,
  },
  tabButtonTextActive: {
    color: BarBuddyColors.dark,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: BarBuddyColors.dark,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: BarBuddyColors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    color: BarBuddyColors.textSecondary,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BarBuddyColors.whiteText,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: BarBuddyColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: BarBuddyColors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: BarBuddyColors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BarBuddyColors.whiteText,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: BarBuddyColors.textSecondary,
    marginTop: 8,
  },
});
