import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { LocalJob } from '@/services/api-service';

/**
 * Generate a preview thumbnail from a video URL
 * Extracts the first frame and converts it to base64
 * 
 * @param videoUrl - Signed S3 URL for the viz.mp4 video
 * @param jobId - Job ID for logging
 * @param updateJob - Callback to update the job with preview data
 */
export async function generateVideoPreview(
  videoUrl: string,
  jobId: string,
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>
): Promise<void> {
  try {
    console.log('=== [VideoPreview] START ===');
    console.log('[VideoPreview] Generating preview for job', jobId);
    console.log('[VideoPreview] Platform:', Platform.OS);
    console.log('[VideoPreview] Video URL length:', videoUrl.length);

    if (Platform.OS === 'web') {
      console.log('[VideoPreview] Using web preview generation');
      // Web: Use HTML5 video element to extract first frame
      await generateWebPreview(videoUrl, jobId, updateJob);
    } else {
      console.log('[VideoPreview] Using native preview generation');
      // Native: Use expo-video-thumbnails to extract frame
      await generateNativePreview(videoUrl, jobId, updateJob);
    }
    console.log('=== [VideoPreview] END ===');
  } catch (error) {
    console.error('=== [VideoPreview] FAILED ===');
    console.error('[VideoPreview] Error generating preview:', error);
    console.error('[VideoPreview] Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Web-specific preview generation using HTML5 video element
 */
async function generateWebPreview(
  videoUrl: string,
  jobId: string,
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      const durationSec = Math.round(video.duration);
      console.log('[VideoPreview] Video duration:', durationSec, 'seconds');

      // Seek to 0.5 seconds to get a better frame than the very first one
      video.currentTime = Math.min(0.5, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        // Create canvas to draw video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Draw the current video frame onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 (use smaller quality for storage efficiency)
        const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.7);

        console.log('[VideoPreview] Generated thumbnail, size:', thumbnailBase64.length, 'bytes');

        // Update job with preview data
        updateJob(jobId, {
          preview: {
            thumbnailBase64,
            durationSec: Math.round(video.duration),
          },
        }).then(() => {
          console.log('[VideoPreview] Preview saved for job', jobId);
          resolve();
        }).catch(reject);

        // Cleanup
        video.remove();
        canvas.remove();
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', (e) => {
      console.error('[VideoPreview] Video loading error:', e);
      reject(new Error('Failed to load video'));
    });

    // Trigger load
    video.load();
  });
}

/**
 * Native preview generation using expo-video-thumbnails
 * Downloads video, generates thumbnail, converts to base64
 */
async function generateNativePreview(
  videoUrl: string,
  jobId: string,
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>
): Promise<void> {
  let downloadedUri: string | null = null;
  let thumbnailUri: string | null = null;

  try {
    console.log('[VideoPreview] Starting native preview generation');
    console.log('[VideoPreview] Platform:', Platform.OS);

    const writableDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? null;
    if (!writableDir) {
      throw new Error('No writable directory available (cache/document)');
    }

    const videoUri = `${writableDir}temp_video_${jobId}.mp4`;
    console.log('[VideoPreview] Downloading video to:', videoUri);

    const downloadResult = await FileSystem.downloadAsync(videoUrl, videoUri);
    downloadedUri = downloadResult.uri;
    console.log('[VideoPreview] Download complete:', downloadedUri);

    const info = await FileSystem.getInfoAsync(downloadedUri);
    console.log('[VideoPreview] Downloaded file exists:', info.exists, 'uri:', info.uri);
    if (!info.exists) {
      throw new Error('Downloaded file does not exist');
    }

    console.log('[VideoPreview] Generating thumbnail at 0.5s...');
    const thumbResult = await VideoThumbnails.getThumbnailAsync(downloadedUri, {
      time: 500,
      quality: 0.7,
    });
    thumbnailUri = thumbResult.uri;
    console.log('[VideoPreview] Thumbnail generated at:', thumbnailUri);

    console.log('[VideoPreview] Reading thumbnail as base64...');
    const thumbnailBase64 = await FileSystem.readAsStringAsync(thumbnailUri, { encoding: 'base64' });
    const dataUri = `data:image/jpeg;base64,${thumbnailBase64}`;
    console.log('[VideoPreview] Data URI size:', dataUri.length, 'chars');

    console.log('[VideoPreview] Updating job with preview data...');
    await updateJob(jobId, {
      preview: { thumbnailBase64: dataUri },
    });
    console.log('[VideoPreview] Job updated successfully');

    console.log('[VideoPreview] Cleaning up temporary files...');
    if (downloadedUri) {
      await FileSystem.deleteAsync(downloadedUri, { idempotent: true });
      console.log('[VideoPreview] Deleted downloaded video');
    }
    if (thumbnailUri) {
      await FileSystem.deleteAsync(thumbnailUri, { idempotent: true });
      console.log('[VideoPreview] Deleted thumbnail file');
    }

    console.log('[VideoPreview] Preview generation complete for job', jobId);
  } catch (error) {
    console.error('[VideoPreview] Error in native preview generation:', error);
    try {
      if (downloadedUri) {
        await FileSystem.deleteAsync(downloadedUri, { idempotent: true });
      }
      if (thumbnailUri) {
        await FileSystem.deleteAsync(thumbnailUri, { idempotent: true });
      }
    } catch (cleanupError) {
      console.error('[VideoPreview] Error during cleanup:', cleanupError);
    }

    await updateJob(jobId, {
      preview: {
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      },
    });
  }
}
