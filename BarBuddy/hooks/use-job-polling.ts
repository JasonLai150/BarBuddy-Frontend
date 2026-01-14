import { useEffect, useRef } from 'react';
import { useJobs } from '@/contexts/JobContext';
import { getJobStatus, getJobResults, LocalJob } from '@/services/api-service';

const POLLING_INTERVAL = 10000; // 10 seconds

/**
 * Hook to automatically poll incomplete jobs in the background
 * Runs every 10 seconds and checks status of jobs that are not DONE or ERROR
 * When a job completes, fetches results and generates preview
 */
export function useJobPolling() {
  const { jobs, updateJob } = useJobs();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pollJobs = async () => {
      // Find jobs that need polling (not DONE or ERROR)
      const incompleteJobs = jobs.filter(
        (job) => job.status !== 'DONE' && job.status !== 'ERROR'
      );

      if (incompleteJobs.length === 0) {
        return;
      }

      console.log('[JobPolling] Polling', incompleteJobs.length, 'incomplete jobs');

      // Poll each incomplete job
      for (const job of incompleteJobs) {
        try {
          const statusResponse = await getJobStatus(job.jobId);
          console.log('[JobPolling] Job', job.jobId, 'status:', statusResponse.status);

          // Update status if it changed
          if (statusResponse.status !== job.status) {
            await updateJob(job.jobId, { 
              status: statusResponse.status as LocalJob['status'] 
            });

            // If job is now DONE, fetch results and generate preview
            if (statusResponse.status === 'DONE') {
              console.log('[JobPolling] Job completed, fetching results...');
              await fetchJobResultsAndPreview(job.jobId);
            }
          }
        } catch (error) {
          console.error('[JobPolling] Error polling job', job.jobId, ':', error);
          // Mark as ERROR if polling fails repeatedly
          // You might want to add retry logic here
        }
      }
    };

    // Start polling interval
    intervalRef.current = setInterval(pollJobs, POLLING_INTERVAL);
    console.log('[JobPolling] Started polling interval');

    // Poll immediately on mount
    pollJobs();

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('[JobPolling] Stopped polling interval');
      }
    };
  }, [jobs, updateJob]);

  /**
   * Fetch job results and generate preview when job completes
   */
  const fetchJobResultsAndPreview = async (jobId: string) => {
    try {
      // Fetch results to get stable S3 keys
      const results = await getJobResults(jobId);
      console.log('[JobPolling] Fetched results for job', jobId);

      // Extract stable S3 keys from results
      const updates: Partial<LocalJob> = {
        status: 'DONE',
      };

      results.urls.forEach((urlObj) => {
        switch (urlObj.name) {
          case 'meta':
            updates.resultMetaKey = urlObj.key;
            break;
          case 'landmarks':
            updates.resultLandmarksKey = urlObj.key;
            break;
          case 'summary':
            updates.resultSummaryKey = urlObj.key;
            break;
          case 'viz':
            updates.resultVizKey = urlObj.key;
            break;
        }
      });

      // Update job with stable keys first
      await updateJob(jobId, updates);

      // Generate preview in the background (non-blocking)
      const vizUrl = results.urls.find((u) => u.name === 'viz')?.url;
      if (vizUrl) {
        console.log('[JobPolling] Preview generation will be implemented');
        // TODO: Implement generateVideoPreview once video-utils is ready
        // For now, just log that preview would be generated
      }
    } catch (error) {
      console.error('[JobPolling] Error fetching results for job', jobId, ':', error);
      throw error;
    }
  };
}
