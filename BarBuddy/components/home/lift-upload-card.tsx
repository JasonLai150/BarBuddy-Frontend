import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BarBuddyColors } from '@/constants/theme';

interface LiftType {
  id: string;
  name: string;
  emoji: string;
}

interface LiftUploadCardProps {
  selectedLiftType: string | null;
  onLiftTypeSelect: (liftTypeId: string) => void;
  onUpload: () => void;
}

const LIFT_TYPES: LiftType[] = [
  { id: 'bench', name: 'Bench', emoji: '🏋️' },
  { id: 'squat', name: 'Squat', emoji: '🦵' },
  { id: 'deadlift', name: 'Deadlift', emoji: '💪' },
];

export function LiftUploadCard({
  selectedLiftType,
  onLiftTypeSelect,
  onUpload,
}: LiftUploadCardProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Upload Your Lift
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Select a video and choose the lift type for AI analysis
      </ThemedText>

      <View style={styles.videoSection}>
        <ThemedText style={styles.sectionLabel}>Lift Video</ThemedText>

        <View style={styles.uploadDropzone}>
          <View style={styles.uploadIconContainer}>
            <IconSymbol
              name="arrow.up.doc"
              size={40}
              color={BarBuddyColors.primary}
            />
          </View>
          <ThemedText style={styles.uploadText}>
            Upload your lift video
          </ThemedText>
          <ThemedText style={styles.uploadSubtext}>
            Drag and drop or tap to select
          </ThemedText>
        </View>
      </View>

      <View style={styles.liftTypeSection}>
        <ThemedText style={styles.sectionLabel}>Lift Type</ThemedText>

        <View style={styles.liftTypeGrid}>
          {LIFT_TYPES.map((liftType) => (
            <TouchableOpacity
              key={liftType.id}
              style={[
                styles.liftTypeButton,
                selectedLiftType === liftType.id &&
                  styles.liftTypeButtonSelected,
              ]}
              onPress={() => onLiftTypeSelect(liftType.id)}
            >
              <ThemedText style={styles.liftTypeEmoji}>
                {liftType.emoji}
              </ThemedText>
              <ThemedText style={styles.liftTypeName}>
                {liftType.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={onUpload}
      >
        <IconSymbol
          name="arrow.up.doc"
          size={20}
          color={BarBuddyColors.dark}
        />
        <ThemedText style={styles.uploadButtonText}>
          Upload for Analysis
        </ThemedText>
      </TouchableOpacity>
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
  videoSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadDropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#444751',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    marginBottom: 12,
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadSubtext: {
    color: BarBuddyColors.gray,
    fontSize: 13,
    textAlign: 'center',
  },
  liftTypeSection: {
    marginBottom: 16,
  },
  liftTypeGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  liftTypeButton: {
    flex: 1,
    backgroundColor: '#2A2D30',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#444751',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liftTypeButtonSelected: {
    borderColor: BarBuddyColors.primary,
    backgroundColor: '#1F2224',
  },
  liftTypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  liftTypeName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: BarBuddyColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: BarBuddyColors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
});
