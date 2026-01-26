/**
 * Image Gallery Page - Server Component
 * Contract: IMAGE_DESIGN_GALLERY
 * Optimized: Server-side prefetch (PERF_SERVER_GALLERY)
 *
 * Pattern: Server Component fetches initial data → Client Component hydrates with SWR
 * Expected: TTFB 30-50% improvement via server-side data fetching
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listImages, type ImageListResult } from '@/lib/images/list';
import { GalleryClient, type ImageListResponse } from '@/components/gallery/GalleryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

// =====================================================
// Loading Component
// =====================================================

function GalleryLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// Server Component - Data Fetcher
// =====================================================

async function GalleryContent() {
  // Get session on server
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch initial data on server (page 1, default sort)
  const result: ImageListResult = await listImages({
    userId: session.user.id,
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Convert server response to client format (Date → string)
  const initialData: ImageListResponse = {
    success: result.success,
    images: result.images.map((img) => ({
      id: img.id,
      title: img.title,
      prompt: img.prompt,
      imageUrl: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl,
      mode: img.mode,
      category: img.category,
      style: img.style,
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString(),
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    error: result.error,
  };

  return <GalleryClient initialData={initialData} />;
}

// =====================================================
// Page Component
// =====================================================

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryLoading />}>
      <GalleryContent />
    </Suspense>
  );
}
