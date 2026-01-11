import { getIdToken } from "@/services/cognito-auth";
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
 */
export async function uploadVideoFile(
  uploadUrl: string,
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    return new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'video/mp4');
      xhr.send(videoBlob);
    });
  } catch (error) {
    console.error('Error uploading video:', error);
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

