import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  isUploading?: boolean;
  uploadProgress?: number;
  selectedFileName?: string | null;
  onFileSelected?: (file: File | any) => void;
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
  isUploading = false,
  uploadProgress = 0,
  selectedFileName = null,
  onFileSelected,
}: LiftUploadCardProps) {
  const handleFileSelect = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web file selection using document API
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (event: any) => {
          const file = event.target.files?.[0];
          if (file && onFileSelected) {
            onFileSelected(file);
          }
        };
        input.click();
      } else {
        // Native platform file selection using expo-image-picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          
          // Convert native asset to a File-like object
          if (asset.uri) {
            // For native platforms, we'll pass the URI directly
            // The upload service will handle conversion
            const fileObject = {
              uri: asset.uri,
              name: asset.fileName || 'video.mp4',
              type: asset.mimeType || 'video/mp4',
            };
            if (onFileSelected) {
              onFileSelected(fileObject);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

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

        <TouchableOpacity
          style={styles.uploadDropzone}
          onPress={handleFileSelect}
          disabled={isUploading}
        >
          {isUploading && uploadProgress > 0 && uploadProgress < 100 ? (
            <>
              <ActivityIndicator size="large" color={BarBuddyColors.primary} />
              <ThemedText style={styles.uploadText}>
                Uploading... {Math.round(uploadProgress)}%
              </ThemedText>
            </>
          ) : (
            <>
              <View style={styles.uploadIconContainer}>
                <IconSymbol
                  name="arrow.up.doc"
                  size={40}
                  color={BarBuddyColors.primary}
                />
              </View>
              {selectedFileName ? (
                <>
                  <ThemedText style={styles.uploadText}>
                    {selectedFileName}
                  </ThemedText>
                  <ThemedText style={styles.uploadSubtext}>
                    Tap to change video
                  </ThemedText>
                </>
              ) : (
                <>
                  <ThemedText style={styles.uploadText}>
                    Upload your lift video
                  </ThemedText>
                  <ThemedText style={styles.uploadSubtext}>
                    Drag and drop or tap to select
                  </ThemedText>
                </>
              )}
            </>
          )}
        </TouchableOpacity>
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
              disabled={isUploading}
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
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
        onPress={onUpload}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <ActivityIndicator size="small" color={BarBuddyColors.dark} />
            <ThemedText style={styles.uploadButtonText}>
              Processing...
            </ThemedText>
          </>
        ) : (
          <>
            <IconSymbol
              name="arrow.up.doc"
              size={20}
              color={BarBuddyColors.dark}
            />
            <ThemedText style={styles.uploadButtonText}>
              Upload for Analysis
            </ThemedText>
          </>
        )}
      </TouchableOpacity>
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
  videoSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: BarBuddyColors.whiteText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadDropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: BarBuddyColors.border,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BarBuddyColors.innerBackground,
  },
  uploadIconContainer: {
    marginBottom: 12,
  },
  uploadText: {
    color: BarBuddyColors.whiteText,
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
    backgroundColor: BarBuddyColors.innerBackground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BarBuddyColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liftTypeButtonSelected: {
    borderColor: BarBuddyColors.primary,
    backgroundColor: BarBuddyColors.deepBackground,
  },
  liftTypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  liftTypeName: {
    color: BarBuddyColors.whiteText,
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
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: BarBuddyColors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
});
