import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export default function JobsLoading() {
  return (
    <PageContainer>
      <PageHeader title="Jobs" description="Monitor and manage your image processing jobs." />
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </PageContainer>
  );
}
