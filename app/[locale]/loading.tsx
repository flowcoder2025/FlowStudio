export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-48" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-64" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4 mb-2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
