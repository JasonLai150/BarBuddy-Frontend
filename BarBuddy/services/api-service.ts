import { getIdToken } from "@/services/cognito-auth";
import { File } from "expo-file-system";
import { Platform } from "react-native";

// Configuration for the API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const getApiBaseUrl = () => API_BASE_URL;

interface UploadUrlResponse {
  jobId: string;
  uploadUrl: string;
}

interface JobResponse {
  jobId: string;
  status: string;
  liftType?: string;
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = await getIdToken();
  if (!token) throw new Error("Not signed in");

  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}


/**
 * Request a presigned upload URL from the backend
 * This initiates the upload process and returns a jobId and uploadUrl
 */
export async function requestUploadUrl(
  contentType: string = 'video/mp4'
): Promise<UploadUrlResponse> {
  try {
    const response = await authFetch("/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to request upload URL: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      jobId: data.jobId,
      uploadUrl: data.uploadUrl,
    };
  } catch (error) {
    console.error('Error requesting upload URL:', error);
    throw error;
  }
}

/**
 * Upload the video file to the presigned S3 URL
 * This uploads the actual video file to AWS S3
 * 
 * @param uploadUrl - The presigned S3 URL
 * @param videoSource - Either a Blob (web) or file URI string (native)
 * @param onProgress - Optional callback for upload progress
 */
export async function uploadVideoFile(
  uploadUrl: string,
  videoSource: Blob | string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    console.log('[upload] Starting video upload to S3');
    console.log('[upload] Upload URL:', uploadUrl.substring(0, 100) + '...');

    let uploadBody: Blob | ArrayBuffer;
    let contentLength: number;

    if (typeof videoSource === 'string') {
      // Native: videoSource is a file URI
      console.log('[upload] Reading file from URI:', videoSource);
      
      const file = new File(videoSource);
      if (!file.exists) {
        throw new Error(`File not found at ${videoSource}`);
      }

      contentLength = file.size ?? 0;
      console.log('[upload] File size:', contentLength, 'bytes');

      if (contentLength === 0) {
        throw new Error('Video file is empty');
      }

      // Read file as base64 and convert to ArrayBuffer
      const base64Data = await file.base64();
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      uploadBody = bytes.buffer;
    } else {
      // Web: videoSource is a Blob
      console.log('[upload] Using Blob upload');
      console.log('[upload] Blob size:', videoSource.size, 'bytes');

      if (videoSource.size === 0) {
        throw new Error('Video blob is empty');
      }

      contentLength = videoSource.size;
      uploadBody = videoSource;
    }

    // Upload to S3
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': contentLength.toString(),
      },
      body: uploadBody,
    });

    console.log('[upload] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[upload] S3 error response:', errorText);
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    const etag = response.headers.get('etag');
    console.log('[upload] Video uploaded successfully', { etag, size: contentLength });
  } catch (error) {
    console.error('[upload] Error uploading video:', error);
    throw error;
  }
}

/**
 * Create a job to process the lift analysis
 * This tells the backend to start analyzing the video
 */
export async function createLiftJob(
  jobId: string,
  liftType: string
): Promise<JobResponse> {
  try {
    const response = await authFetch("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, liftType }),
    });


    if (!response.ok) {
      throw new Error(`Failed to create job: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      jobId: data.jobId,
      status: data.status,
      liftType: data.liftType,
    };
  } catch (error) {
    console.error('Error creating lift job:', error);
    throw error;
  }
}

/**
 * Poll the job status to check if processing is complete
 * Use this to check when the lift analysis is done
 */
export async function getJobStatus(jobId: string): Promise<JobResponse> {
  try {
    const response = await authFetch(`/jobs/${jobId}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      jobId: data.jobId,
      status: data.status,
      liftType: data.liftType,
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
}

export type JobResultsUrlName = "meta" | "landmarks" | "summary" | "viz";

export interface JobResultsResponse {
  jobId: string;
  status: string;
  urls: Array<{ name: JobResultsUrlName; key: string; url: string }>;
}

export async function getJobResults(jobId: string): Promise<JobResultsResponse> {
  const response = await authFetch(`/jobs/${jobId}/results`, { method: "GET" });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to get job results (${response.status}): ${text}`);
  }

  return response.json();
}

