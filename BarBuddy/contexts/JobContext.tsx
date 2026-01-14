import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalJob, LocalJobStatus } from '@/services/api-service';

const JOBS_STORAGE_KEY = '@barbuddy:jobs';

interface JobContextType {
  jobs: LocalJob[];
  isLoading: boolean;
  addJob: (job: LocalJob) => Promise<void>;
  updateJob: (jobId: string, updates: Partial<LocalJob>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  getJob: (jobId: string) => LocalJob | undefined;
  refreshJobs: () => Promise<void>;
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
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load jobs from AsyncStorage on mount
  const loadJobs = useCallback(async () => {
    try {
      console.log('[Jobs] Loading jobs from storage...');
      const jobsJson = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
      
      if (jobsJson) {
        const loadedJobs: LocalJob[] = JSON.parse(jobsJson);
        // Sort by creation date (newest first)
        loadedJobs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setJobs(loadedJobs);
        console.log('[Jobs] Loaded', loadedJobs.length, 'jobs from storage');
      } else {
        console.log('[Jobs] No jobs found in storage');
        setJobs([]);
      }
    } catch (error) {
      console.error('[Jobs] Error loading jobs:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save jobs to AsyncStorage
  const saveJobs = useCallback(async (updatedJobs: LocalJob[]) => {
    try {
      console.log('[Jobs] Saving', updatedJobs.length, 'jobs to storage...');
      await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));
      console.log('[Jobs] Jobs saved successfully');
    } catch (error) {
      console.error('[Jobs] Error saving jobs:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Add a new job
  const addJob = useCallback(async (job: LocalJob) => {
    console.log('[Jobs] Adding new job:', job.jobId);
    setJobs((prevJobs) => {
      const updatedJobs = [job, ...prevJobs];
      saveJobs(updatedJobs);
      return updatedJobs;
    });
  }, [saveJobs]);

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
      
      saveJobs(updatedJobs);
      return updatedJobs;
    });
  }, [saveJobs]);

  // Delete a job
  const deleteJob = useCallback(async (jobId: string) => {
    console.log('[Jobs] Deleting job:', jobId);
    setJobs((prevJobs) => {
      const updatedJobs = prevJobs.filter((j) => j.jobId !== jobId);
      saveJobs(updatedJobs);
      return updatedJobs;
    });
  }, [saveJobs]);

  // Get a specific job
  const getJob = useCallback((jobId: string) => {
    return jobs.find((j) => j.jobId === jobId);
  }, [jobs]);

  // Manually refresh jobs from storage (for swipe-to-refresh)
  const refreshJobs = useCallback(async () => {
    console.log('[Jobs] Manual refresh triggered');
    await loadJobs();
  }, [loadJobs]);

  // Computed stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'DONE').length;

  const value: JobContextType = {
    jobs,
    isLoading,
    addJob,
    updateJob,
    deleteJob,
    getJob,
    refreshJobs,
    totalJobs,
    completedJobs,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
