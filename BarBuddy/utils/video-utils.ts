import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { LocalJob } from '@/services/api-service';

/**
 * Generate a preview thumbnail from a video URL.
 * On native: downloads the video → extracts a frame with expo-video-thumbnails → base64.
 * On web: uses an HTML5 <video> + <canvas> to capture a frame.
 */
export async function generateVideoPreview(
  videoUrl: string,
  jobId: string,
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>,
): Promise<void> {
  try {
    console.log('[Preview] Generating thumbnail for job', jobId);

    if (Platform.OS === 'web') {
      await generateWebPreview(videoUrl, jobId, updateJob);
    } else {
      await generateNativePreview(videoUrl, jobId, updateJob);
    }

    console.log('[Preview] Done for job', jobId);
  } catch (error) {
    console.error('[Preview] Failed for job', jobId, error);

    // Persist the error so the UI can show a placeholder instead of retrying forever
    await updateJob(jobId, {
      preview: {
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      },
    });
  }
}

// ─── Native (iOS / Android) ────────────────────────────────────────────────

async function generateNativePreview(
  videoUrl: string,
  jobId: string,
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>,
): Promise<void> {
  // Use the cache directory for temp files
  const cacheDir = new Directory(Paths.cache, 'previews');
  if (!cacheDir.exists) {
    cacheDir.create();
  }

  const videoFile = new File(cacheDir, `preview_${jobId}.mp4`);

  try {
    // 1. Download the video to a local temp file
    console.log('[Preview] Downloading video…');
    const downloaded = await File.downloadFileAsync(videoUrl, cacheDir);
    console.log('[Preview] Downloaded to', downloaded.uri);

    // Rename / move to our predictable path if needed
    if (downloaded.uri !== videoFile.uri) {
      downloaded.move(videoFile);
    }

    if (!videoFile.exists) {
      throw new Error('Downloaded video file does not exist');
    }

    // 2. Generate a thumbnail from the local video file
    console.log('[Preview] Extracting thumbnail frame…');
    const thumbResult = await VideoThumbnails.getThumbnailAsync(videoFile.uri, {
      time: 500,   // 0.5 s into the video
      quality: 0.7,
    });
    console.log('[Preview] Thumbnail at', thumbResult.uri);

    // 3. Read the thumbnail as base64
    const thumbFile = new File(thumbResult.uri);
    if (!thumbFile.exists) {
      throw new Error('Thumbnail file does not exist');
    }

    const base64Data = await thumbFile.base64();
    const dataUri = `data:image/jpeg;base64,${base64Data}`;
    console.log('[Preview] Base64 data URI length:', dataUri.length);

    // 4. Persist thumbnail to the job
    await updateJob(jobId, {
      preview: { thumbnailBase64: dataUri },
    });

    // 5. Cleanup temp files
    cleanup(videoFile, thumbFile);
  } catch (error) {
    cleanup(videoFile);
    throw error;   // re-throw so the outer handler persists the error
  }
}

/** Best-effort delete of temp files */
function cleanup(...files: File[]) {
  for (const f of files) {
    try {
      if (f.exists) f.delete();
    } catch {
      // ignore cleanup errors
    }
  }
}

// ─── Web ────────────────────────────────────────────────────────────────────

async function generateWebPreview(
  videoUrl: string,
  jobId: string,
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;               // required for autoplay policies
    video.playsInline = true;
    video.src = videoUrl;

    const timeoutId = setTimeout(() => {
      video.remove();
      reject(new Error('Web preview timed out'));
    }, 30_000);

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(0.5, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.7);

        updateJob(jobId, {
          preview: {
            thumbnailBase64,
            durationSec: Math.round(video.duration),
          },
        })
          .then(() => {
            clearTimeout(timeoutId);
            video.remove();
            canvas.remove();
            resolve();
          })
          .catch(reject);
      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });

    video.addEventListener('error', () => {
      clearTimeout(timeoutId);
      video.remove();
      reject(new Error('Failed to load video for web preview'));
    });

    video.load();
  });
}
