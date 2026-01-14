import { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatsCard } from '@/components/home/stats-card';
import { LiftUploadCard } from '@/components/home/lift-upload-card';
import { BarBuddyColors } from '@/constants/theme';
import { trimFilename } from '@/utils/file-utils';
import {
  requestUploadUrl,
  uploadVideoFile,
  createLiftJob,
  LocalJob,
} from '@/services/api-service';
import { useJobs } from '@/contexts/JobContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { addJob, updateJob, totalJobs, completedJobs } = useJobs();
  const [selectedLiftType, setSelectedLiftType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleLiftTypeSelect = (liftTypeId: string) => {
    setSelectedLiftType(liftTypeId);
  };

  const handleFileSelected = (file: any) => {
    setSelectedFile(file);
    // Extract filename from File object or native file object
    const fileName = file.name || file.filename || 'video.mp4';
    // Trim filename if it's too long to prevent layout overflow
    const trimmedFileName = trimFilename(fileName, 30);
    setSelectedFileName(trimmedFileName);
  };

  const handleUpload = async () => {
    try {
      // Validate inputs
      if (!selectedLiftType) {
        Alert.alert('Error', 'Please select a lift type first');
        return;
      }

      if (!selectedFile) {
        Alert.alert('Error', 'Please select a video file first');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Request upload URL from backend
      console.log('Requesting upload URL...');
      const { jobId, uploadUrl } = await requestUploadUrl('video/mp4');
      console.log('Received jobId:', jobId);
      
      // Save jobId for later use in success alert
      setCurrentJobId(jobId);

      // Create initial job entry with CREATED status
      const newJob: LocalJob = {
        jobId,
        liftType: selectedLiftType,
        status: 'CREATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addJob(newJob);
      console.log('[Upload] Created job in local storage');

      // Step 2: Upload video file to S3
      console.log('Uploading video file...');
      
      if (Platform.OS === 'web') {
        // Web: selectedFile is already a File object, convert to Blob
        const videoBlob = new Blob([selectedFile], { type: 'video/mp4' });
        await uploadVideoFile(uploadUrl, videoBlob, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        // Native: pass file URI directly to use Expo FileSystem for native upload
        // This avoids Blob conversion and prevents header injection issues
        await uploadVideoFile(uploadUrl, selectedFile.uri, (progress) => {
          setUploadProgress(progress);
        });
      }
      console.log('Video uploaded successfully');

      // Update job status to UPLOADED
      await updateJob(jobId, { status: 'UPLOADED' });
      console.log('[Upload] Updated job status to UPLOADED');

      // Step 3: Create job to start analysis
      console.log('Creating lift analysis job...');
      const jobResponse = await createLiftJob(jobId, selectedLiftType);
      console.log('Job created with status:', jobResponse.status);

      // Update job status to PROCESSING
      await updateJob(jobId, { status: 'PROCESSING' });
      console.log('[Upload] Updated job status to PROCESSING');

      // Reset upload state but keep jobId for alert
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFileName(null);
      setSelectedFile(null);
      setSelectedLiftType(null);

      // Show success message with navigation option
      Alert.alert(
        'Success',
        `Your ${selectedLiftType} lift has been submitted for analysis. We will notify you when the analysis is complete.`,
        [
          {
            text: 'View Analysis',
            onPress: () => {
              setCurrentJobId(null);
              router.push('/(tabs)/view');
            },
          },
          {
            text: 'Stay Here',
            style: 'cancel',
            onPress: () => {
              setCurrentJobId(null);
            },
          },
        ],
        { cancelable: true, onDismiss: () => setCurrentJobId(null) }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentJobId(null);

      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during upload';
      Alert.alert('Upload Failed', errorMessage);
    }
  };

  const stats = [
    { icon: 'chart.line.uptrend.xyaxis', value: String(totalJobs), label: 'Total Lifts' },
    { icon: 'target', value: String(completedJobs), label: 'Valid Lifts' },
  ];

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
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          selectedFileName={selectedFileName}
          onFileSelected={handleFileSelected}
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
  contentScroll: {
    flex: 1,
    backgroundColor: BarBuddyColors.dark,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
});
