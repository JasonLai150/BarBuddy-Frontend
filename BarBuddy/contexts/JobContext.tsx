import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalJob, LocalJobStatus, fetchUserJobs } from '@/services/api-service';
import { useAuth } from '@/contexts/AuthContext';

interface JobContextType {
  jobs: LocalJob[];
  isLoading: boolean;
  isSyncing: boolean;
  addJob: (job: LocalJob) => Promise<void>;
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  getJob: (jobId: string) => LocalJob | undefined;
  refreshJobs: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  totalJobs: number;
  completedJobs: number;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get user-scoped AsyncStorage key
  const getStorageKey = useCallback((uid: string | null) => {
    if (!uid) return null;
    return `@barbuddy:jobs:${uid}`;
  }, []);

  // Load jobs from AsyncStorage for current user
  const loadJobs = useCallback(async (uid: string | null) => {
    try {
      if (!uid) {
        console.log('[Jobs] No userId available, skipping load');
        setJobs([]);
        setIsLoading(false);
        return;
      }

      const storageKey = getStorageKey(uid);
      if (!storageKey) return;

      console.log('[Jobs] Loading jobs from storage for user:', uid);
      const jobsJson = await AsyncStorage.getItem(storageKey);
      
      if (jobsJson) {
        const loadedJobs: LocalJob[] = JSON.parse(jobsJson);
        // Sort by creation date (newest first)
        loadedJobs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setJobs(loadedJobs);
        console.log('[Jobs] Loaded', loadedJobs.length, 'jobs from storage');
      } else {
        console.log('[Jobs] No jobs found in storage for user:', uid);
        setJobs([]);
      }
    } catch (error) {
      console.error('[Jobs] Error loading jobs:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey]);

  // Save jobs to AsyncStorage
  const saveJobs = useCallback(async (updatedJobs: LocalJob[], uid: string | null) => {
    try {
      if (!uid) {
        console.log('[Jobs] No userId available, cannot save');
        return;
      }

      const storageKey = getStorageKey(uid);
      if (!storageKey) return;

      console.log('[Jobs] Saving', updatedJobs.length, 'jobs to storage for user:', uid);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedJobs));
      console.log('[Jobs] Jobs saved successfully');
    } catch (error) {
      console.error('[Jobs] Error saving jobs:', error);
      throw error;
    }
  }, [getStorageKey]);

  // Initial load when component mounts or userId changes
  useEffect(() => {
    setIsLoading(true);
    loadJobs(userId);
  }, [userId, loadJobs]);

  // Sync with backend and merge jobs
  const syncWithBackend = useCallback(async () => {
    if (!userId) {
      console.log('[Jobs] No userId, skipping backend sync');
      return;
    }

    try {
      setIsSyncing(true);
      console.log('[Jobs] Starting backend sync for user:', userId);

      // Fetch jobs from backend
      const backendJobs = await fetchUserJobs();

      // Merge: backend jobs are the source of truth, including thumbnailUrl
      setJobs((prevJobs) => {
        const merged: LocalJob[] = [];
        const backendJobIds = new Set(backendJobs.map(j => j.jobId));

        // Add all backend jobs (thumbnailUrl comes from the API now)
        for (const backendJob of backendJobs) {
          merged.push(backendJob);
        }

        // Add local jobs that are not yet on backend (CREATED/UPLOADED status)
        for (const localJob of prevJobs) {
          if (!backendJobIds.has(localJob.jobId)) {
            if (localJob.status === 'CREATED' || localJob.status === 'UPLOADED') {
              merged.push(localJob);
              console.log('[Jobs] Preserving local job not yet on backend:', localJob.jobId);
            }
          }
        }

        // Sort by creation date (newest first)
        merged.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Save merged jobs
        saveJobs(merged, userId);
        console.log('[Jobs] Backend sync complete, merged', merged.length, 'jobs');
        return merged;
      });
    } catch (error) {
      console.error('[Jobs] Backend sync error:', error);
      // Continue with local jobs if sync fails
    } finally {
      setIsSyncing(false);
    }
  }, [userId, saveJobs]);

  // Add a new job
  const addJob = useCallback(async (job: LocalJob) => {
    console.log('[Jobs] Adding new job:', job.jobId);
    setJobs((prevJobs) => {
      const updatedJobs = [job, ...prevJobs];
      saveJobs(updatedJobs, userId);
      return updatedJobs;
    });
  }, [saveJobs, userId]);

  // Update an existing job
  const updateJob = useCallback(async (jobId: string, updates: Partial<LocalJob>) => {
    console.log('[Jobs] Updating job:', jobId, updates);
    setJobs((prevJobs) => {
      const jobIndex = prevJobs.findIndex((j) => j.jobId === jobId);
      
      if (jobIndex === -1) {
        console.warn('[Jobs] Job not found for update:', jobId);
        return prevJobs;
      }

      const updatedJobs = [...prevJobs];
      updatedJobs[jobIndex] = {
        ...updatedJobs[jobIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      saveJobs(updatedJobs, userId);
      return updatedJobs;
    });
  }, [saveJobs, userId]);

  // Delete a job
  const deleteJob = useCallback(async (jobId: string) => {
    console.log('[Jobs] Deleting job:', jobId);
    setJobs((prevJobs) => {
      const updatedJobs = prevJobs.filter((j) => j.jobId !== jobId);
      saveJobs(updatedJobs, userId);
      return updatedJobs;
    });
  }, [saveJobs, userId]);

  // Get a specific job
  const getJob = useCallback((jobId: string) => {
    return jobs.find((j) => j.jobId === jobId);
  }, [jobs]);

  // Manually refresh jobs (syncs with backend API)
  const refreshJobs = useCallback(async () => {
    console.log('[Jobs] Manual refresh triggered');
    await syncWithBackend();
  }, [syncWithBackend]);

  // Computed stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'DONE').length;

  const value: JobContextType = {
    jobs,
    isLoading,
    isSyncing,
    addJob,
    updateJob,
    deleteJob,
    getJob,
    refreshJobs,
    syncWithBackend,
    totalJobs,
    completedJobs,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
