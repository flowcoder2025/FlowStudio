'use client';

/**
 * ProfileSkeleton - 프로필 페이지 스켈레톤 UI
 *
 * [성능 최적화] 로딩 중 레이아웃 시프트 방지
 */

export function ProfileSkeleton() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-48" />
      </div>

      {/* Quick Actions skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Credit History skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" />
                </div>
              </div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * CreatePageSkeleton - 생성 페이지 스켈레톤 UI
 */
export function CreatePageSkeleton() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Options */}
        <div className="space-y-6">
          {/* Category Selection skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24 mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Style Selection skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20 mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Prompt Input skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16 mb-4" />
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="mt-4 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>
    </main>
  );
}
