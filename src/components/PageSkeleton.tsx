import { Skeleton } from '@/components/ui/skeleton';

const PageSkeleton = () => (
  <div className="min-h-screen px-4 py-12 max-w-6xl mx-auto w-full">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid gap-4 md:grid-cols-3 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

export default PageSkeleton;
