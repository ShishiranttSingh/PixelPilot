'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchImages } from '@/lib/image-service';
import { fetchJobs } from '@/lib/job-service';
import { getCreditBalance } from '@/lib/credit-service';
import { avgProcessingTime, activityTimeline } from '@/lib/dashboard-helpers';
import type { ImageListItem, JobListItem } from '@/lib/types';
import type { ActivityItemData } from '@/components/dashboard/activity-card';

export interface DashboardData {
  user: ReturnType<typeof useAuth>['user'];
  loading: boolean;
  totalImages: number | null;
  avgTime: number | null;
  creditsRemaining: number | null;
  systemHealth: string | null;
  recentActivity: ActivityItemData[];
  recentImages: ImageListItem[];
  recentJobs: JobListItem[];
  refetch: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();

  const [images, setImages] = useState<ImageListItem[]>([]);
  const [totalImages, setTotalImages] = useState<number | null>(null);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [imageResp, jobResp, creditBalance] = await Promise.all([
        fetchImages({ size: 5, sort: 'created_at' }),
        fetchJobs({ size: 10, sort: 'created_at' }),
        getCreditBalance().catch(() => null),
      ]);
      setImages(imageResp.items);
      setTotalImages(imageResp.total);
      setJobs(jobResp.items);
      setCredits(creditBalance);
    } catch {
      // Errors produce null values — components show empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const avgTime = useMemo(() => avgProcessingTime(jobs), [jobs]);
  const recentActivity = useMemo(() => activityTimeline(jobs), [jobs]);

  return {
    user,
    loading,
    totalImages,
    avgTime,
    creditsRemaining: credits,
    systemHealth: null,
    recentActivity,
    recentImages: images,
    recentJobs: jobs,
    refetch: fetchData,
  };
}
