'use client';

/**
 * ImageGridSkeleton - 이미지 그리드 스켈레톤 UI
 *
 * [성능 최적화] Suspense fallback용 스켈레톤
 * - 실제 그리드와 동일한 레이아웃으로 레이아웃 시프트 방지
 * - CSS 애니메이션으로 로딩 피드백 제공
 */

interface ImageGridSkeletonProps {
  count?: number;
}

export function ImageGridSkeleton({ count = 12 }: ImageGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Image placeholder */}
          <div className="aspect-square bg-slate-200 dark:bg-slate-800 animate-pulse" />

          {/* Info placeholder */}
          <div className="p-2 space-y-2">
            {/* Title */}
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />

            {/* Date */}
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />

            {/* Tags placeholder */}
            <div className="flex gap-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-12" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-10" />
            </div>

            {/* Action buttons placeholder */}
            <div className="flex gap-1 mt-2">
              <div className="flex-1 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * FilterSkeleton - 필터 영역 스켈레톤 UI
 */

// 미리 정의된 필터 탭 너비 (Math.random 대신 결정적 값 사용)
const FILTER_TAB_WIDTHS = [72, 65, 80, 68, 75, 70, 78];

export function FilterSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
      {/* Mode Filter Tabs */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        {FILTER_TAB_WIDTHS.map((width, index) => (
          <div
            key={index}
            className="h-7 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"
            style={{ width: `${width}px` }}
          />
        ))}
      </div>

      {/* Date and Tag Filters */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="w-24 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="ml-auto w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * GalleryPageSkeleton - 전체 갤러리 페이지 스켈레톤
 */
export function GalleryPageSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-48" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-64" />
      </div>

      <FilterSkeleton />
      <ImageGridSkeleton count={12} />
    </main>
  );
}
