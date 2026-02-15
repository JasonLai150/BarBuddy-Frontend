import { useEffect, useRef } from 'react';
import { useJobs } from '@/contexts/JobContext';
import { getJobStatus, getJobResults, LocalJob } from '@/services/api-service';

const POLLING_INTERVAL = 10000; // 10 seconds

/**
 * Hook to automatically poll incomplete jobs in the background
 * Runs every 10 seconds and checks status of jobs that are not DONE or ERROR
 * When a job completes, fetches results and stores S3 keys
 */
export function useJobPolling() {
  const { jobs, isSyncing, updateJob } = useJobs();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use refs to avoid tearing down the interval on every state change
  const jobsRef = useRef(jobs);
  const isSyncingRef = useRef(isSyncing);
  const updateJobRef = useRef(updateJob);

  // Keep refs in sync
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);
  useEffect(() => { isSyncingRef.current = isSyncing; }, [isSyncing]);
  useEffect(() => { updateJobRef.current = updateJob; }, [updateJob]);

  useEffect(() => {
    const pollJobs = async () => {
      // Skip polling if syncing with backend to avoid race conditions
      if (isSyncingRef.current) {
        console.log('[JobPolling] Skipping polling, backend sync in progress');
        return;
      }

      // Find jobs that need polling (not DONE or ERROR)
      const incompleteJobs = jobsRef.current.filter(
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

          // Update status and thumbnailUrl if status changed
          if (statusResponse.status !== job.status) {
            const statusUpdates: Partial<LocalJob> = {
              status: statusResponse.status as LocalJob['status'],
              thumbnailUrl: statusResponse.thumbnailUrl,
            };

            await updateJobRef.current(job.jobId, statusUpdates);

            // If job is now DONE, fetch results to store stable S3 keys
            if (statusResponse.status === 'DONE') {
              console.log('[JobPolling] Job completed, fetching results...');
              await fetchJobResults(job.jobId);
            }
          } else if (statusResponse.thumbnailUrl && !job.thumbnailUrl) {
            // Status didn't change but thumbnailUrl became available
            await updateJobRef.current(job.jobId, {
              thumbnailUrl: statusResponse.thumbnailUrl,
            });
          }
        } catch (error) {
          console.error('[JobPolling] Error polling job', job.jobId, ':', error);
        }
      }
    };

    // Start polling interval (stable — no teardown on state changes)
    intervalRef.current = setInterval(pollJobs, POLLING_INTERVAL);
    console.log('[JobPolling] Started polling interval');

    // Poll immediately on mount
    pollJobs();

    // Cleanup interval only on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('[JobPolling] Stopped polling interval');
      }
    };
  }, []); // Empty deps — interval runs once, reads current values via refs

  /**
   * Fetch job results when job completes to store stable S3 keys
   */
  const fetchJobResults = async (jobId: string) => {
    try {
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
          case 'thumbnail':
            updates.resultThumbnailKey = urlObj.key;
            break;
        }
      });

      await updateJob(jobId, updates);
    } catch (error) {
      console.error('[JobPolling] Error fetching results for job', jobId, ':', error);
      throw error;
    }
  };
}
