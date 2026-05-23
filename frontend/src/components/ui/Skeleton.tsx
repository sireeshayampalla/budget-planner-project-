import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-darkborder rounded ${className}`} />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-150 dark:border-darkborder p-5 bg-white dark:bg-darkcard space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-darkborder/50 pt-3">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};
