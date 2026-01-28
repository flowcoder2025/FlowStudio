/**
 * Gallery Client Component
 * Contract: IMAGE_DESIGN_GALLERY (Client Part)
 * Optimized: Server-side prefetch with SWR hydration (PERF_SERVER_GALLERY)
 * Optimized: React.memo + hoisted JSX (Phase 14e)
 */

'use client';

import { useState, useCallback, memo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Download,
  Trash2,
  Search,
  Filter,
  Grid3X3,
  LayoutGrid,
  MoreVertical,
  RefreshCw,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// =====================================================
// Types
// =====================================================

export interface GalleryImage {
  id: string;
  title: string | null;
  prompt: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  mode: string;
  category: string | null;
  style: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImageListResponse {
  success: boolean;
  images: GalleryImage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

interface GalleryClientProps {
  initialData: ImageListResponse;
}

// =====================================================
// Hoisted Static JSX (rendering-hoist-jsx)
// =====================================================

const ZoomInIcon = <ZoomIn className="w-8 h-8 text-white" />;
const ImagePlaceholderIcon = <ImageIcon className="w-8 h-8 text-muted-foreground" />;
const ImagePlaceholderIconLarge = <ImageIcon className="w-16 h-16 text-muted-foreground" />;
const ImagePlaceholderIconEmpty = <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />;
const MoreVerticalIcon = <MoreVertical className="w-4 h-4" />;
const DownloadIconSmall = <Download className="w-4 h-4 mr-2" />;
const Trash2IconSmall = <Trash2 className="w-4 h-4 mr-2" />;

// =====================================================
// Memoized Gallery Image Card (rerender-memo)
// =====================================================

interface GalleryImageCardProps {
  image: GalleryImage;
  viewMode: 'grid' | 'large';
  onImageClick: (image: GalleryImage) => void;
  onDownload: (image: GalleryImage) => void;
  onDelete: (image: GalleryImage) => void;
  t: ReturnType<typeof useTranslations>;
}

const GalleryImageCard = memo(function GalleryImageCard({
  image,
  viewMode,
  onImageClick,
  onDownload,
  onDelete,
  t,
}: GalleryImageCardProps) {
  return (
    <Card className="overflow-hidden group cursor-pointer">
      <CardContent className="p-0 relative">
        <div
          className={cn(
            'relative',
            viewMode === 'grid' ? 'aspect-square' : 'aspect-video'
          )}
          onClick={() => onImageClick(image)}
        >
          {image.thumbnailUrl || image.imageUrl ? (
            <Image
              src={image.thumbnailUrl || image.imageUrl || ''}
              alt={image.title || image.prompt || 'Gallery image'}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes={
                viewMode === 'grid'
                  ? '(max-width: 768px) 50vw, 25vw'
                  : '(max-width: 768px) 100vw, 50vw'
              }
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              {ImagePlaceholderIcon}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            {ZoomInIcon}
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  {MoreVerticalIcon}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(image);
                  }}
                >
                  {DownloadIconSmall}
                  {t("download")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image);
                  }}
                >
                  {Trash2IconSmall}
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info */}
        {viewMode === 'large' && (
          <div className="p-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {image.prompt || t("noPrompt")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(image.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// =====================================================
// SWR Fetcher
// =====================================================

const fetcher = async (url: string): Promise<ImageListResponse> => {
  const response = await fetch(url);
  const data = (await response.json()) as ImageListResponse;
  if (!data.success) {
    throw new Error(data.error ?? 'Failed to fetch images');
  }
  return data;
};

// Build API URL for SWR key
function buildApiUrl(
  page: number,
  searchQuery: string,
  sortBy: string,
  sortOrder: string
): string {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    sortBy,
    sortOrder,
  });

  return searchQuery
    ? `/api/images/search?${params}&query=${encodeURIComponent(searchQuery)}`
    : `/api/images/list?${params}`;
}

// =====================================================
// Component
// =====================================================

export function GalleryClient({ initialData }: GalleryClientProps) {
  const t = useTranslations("pages.gallery");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'large'>('grid');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);

  // SWR with server-side initial data (fallbackData)
  const apiUrl = buildApiUrl(page, searchQuery, sortBy, sortOrder);
  const isInitialUrl = page === 1 && !searchQuery && sortBy === 'createdAt' && sortOrder === 'desc';

  const { data, error, isLoading, mutate } = useSWR<ImageListResponse>(
    apiUrl,
    fetcher,
    {
      fallbackData: isInitialUrl ? initialData : undefined,
      revalidateOnFocus: false,
      revalidateOnMount: !isInitialUrl, // Skip revalidation on mount if using initial data
      dedupingInterval: 5000,
    }
  );

  // Derived state from SWR data
  const images = data?.images ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
  };

  // Handle download
  const handleDownload = useCallback(async (image: GalleryImage) => {
    if (!image.imageUrl) return;
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.title || image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  // Handle delete with optimistic update
  const handleDelete = async () => {
    if (!imageToDelete || !data) return;

    try {
      // Optimistic update
      await mutate(
        {
          ...data,
          images: data.images.filter((img) => img.id !== imageToDelete.id),
          total: data.total - 1,
        },
        false
      );

      const response = await fetch(`/api/images/${imageToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        await mutate();
      }
    } catch (err) {
      console.error('Delete failed:', err);
      await mutate();
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  // Callbacks for GalleryImageCard (stable references with useCallback)
  const handleImageClick = useCallback((image: GalleryImage) => {
    setSelectedImage(image);
    setLightboxOpen(true);
  }, []);

  const handleDeleteClick = useCallback((image: GalleryImage) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  }, []);

  // Render loading skeletons
  const renderSkeletons = () => (
    <div
      className={cn(
        'grid gap-4',
        viewMode === 'grid'
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-1 md:grid-cols-2'
      )}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
        </Card>
      ))}
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {ImagePlaceholderIconEmpty}
      <h3 className="text-lg font-medium mb-2">{t("emptyTitle")}</h3>
      <p className="text-muted-foreground mb-4">
        {t("emptyDescription")}
      </p>
      <Button asChild>
        <Link href="/">{t("createImage")}</Link>
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("totalImages", { count: total })}</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </form>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as 'createdAt' | 'updatedAt')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">{t("sortCreatedAt")}</SelectItem>
              <SelectItem value="updatedAt">{t("sortUpdatedAt")}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            <Filter className={cn('w-4 h-4', sortOrder === 'asc' && 'rotate-180')} />
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'large' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('large')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      {isLoading ? (
        renderSkeletons()
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4">{t("loadError")}</p>
          <Button onClick={() => mutate()}>{t("retry")}</Button>
        </div>
      ) : images.length === 0 ? (
        renderEmpty()
      ) : (
        <div
          className={cn(
            'grid gap-4',
            viewMode === 'grid'
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2'
          )}
        >
          {images.map((image) => (
            <GalleryImageCard
              key={image.id}
              image={image}
              viewMode={viewMode}
              onImageClick={handleImageClick}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {t("previous")}
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title || t("imageDetail")}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-square w-full max-h-[60vh]">
                {selectedImage.imageUrl ? (
                  <Image
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title || selectedImage.prompt || 'Gallery image'}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 80vw"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {ImagePlaceholderIconLarge}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("prompt")}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedImage.prompt || t("noPrompt")}
                </p>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {selectedImage.mode} • {selectedImage.category || 'Uncategorized'}
                </span>
                <span>{new Date(selectedImage.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownload(selectedImage)}>
                  {DownloadIconSmall}
                  {t("download")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setImageToDelete(selectedImage);
                    setDeleteDialogOpen(true);
                    setLightboxOpen(false);
                  }}
                >
                  {Trash2IconSmall}
                  {t("delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
