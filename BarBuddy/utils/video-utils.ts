import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
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
    console.log('[VideoPreview] Generating preview for job', jobId);

    if (Platform.OS === 'web') {
      // Web: Use HTML5 video element to extract first frame
      await generateWebPreview(videoUrl, jobId, updateJob);
    } else {
      // Native: Use expo-video or expo-av to extract frame
      // For now, we'll skip native implementation and just store metadata
      console.log('[VideoPreview] Native preview generation not yet implemented');
      await updateJob(jobId, {
        preview: {
          error: 'Preview generation not available on mobile yet',
        },
      });
    }
  } catch (error) {
    console.error('[VideoPreview] Error generating preview:', error);
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
 * Native preview generation (placeholder for future implementation)
 * Could use expo-video-thumbnails or expo-av
 */
async function generateNativePreview(
  videoUrl: string,
  jobId: string,
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>
): Promise<void> {
  // TODO: Implement native preview generation
  // Options:
  // 1. expo-video-thumbnails: Generate thumbnail from video file
  // 2. expo-av: Use Video component to capture frame
  // 3. react-native-video: Similar approach
  
  console.log('[VideoPreview] Native preview generation not implemented yet');
  
  await updateJob(jobId, {
    preview: {
      error: 'Preview generation not available on mobile yet',
    },
  });
}
