/**
 * Image Gallery Page
 * Contract: IMAGE_DESIGN_GALLERY
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

interface GalleryImage {
  id: string;
  title: string | null;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  provider: string | null;
  model: string | null;
  creditUsed: number;
  isUpscaled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ImageListResponse {
  success: boolean;
  images: GalleryImage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

// =====================================================
// Component
// =====================================================

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'large'>('grid');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);

  // Fetch images
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      const endpoint = searchQuery
        ? `/api/images/search?${params}&query=${encodeURIComponent(searchQuery)}`
        : `/api/images/list?${params}`;

      const response = await fetch(endpoint);
      const data = await response.json() as ImageListResponse;

      if (data.success) {
        setImages(data.images);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchImages();
  };

  // Handle download
  const handleDownload = async (image: GalleryImage) => {
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
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!imageToDelete) return;

    try {
      const response = await fetch(`/api/images/${imageToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(images.filter((img) => img.id !== imageToDelete.id));
        setTotal((prev) => prev - 1);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

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
      <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">아직 이미지가 없습니다</h3>
      <p className="text-muted-foreground mb-4">
        이미지를 생성하고 갤러리에 저장해보세요
      </p>
      <Button asChild>
        <Link href="/">이미지 생성하기</Link>
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">갤러리</h1>
          <p className="text-muted-foreground text-sm">
            총 {total}개의 이미지
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="프롬프트 검색..."
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
              <SelectItem value="createdAt">생성일</SelectItem>
              <SelectItem value="updatedAt">수정일</SelectItem>
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

          <Button variant="outline" size="icon" onClick={fetchImages}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        renderSkeletons()
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
            <Card
              key={image.id}
              className="overflow-hidden group cursor-pointer"
            >
              <CardContent className="p-0 relative">
                <div
                  className={cn(
                    'relative',
                    viewMode === 'grid' ? 'aspect-square' : 'aspect-video'
                  )}
                  onClick={() => {
                    setSelectedImage(image);
                    setLightboxOpen(true);
                  }}
                >
                  <Image
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={image.title || image.prompt}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes={
                      viewMode === 'grid'
                        ? '(max-width: 768px) 50vw, 25vw'
                        : '(max-width: 768px) 100vw, 50vw'
                    }
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>

                  {/* Upscaled Badge */}
                  {image.isUpscaled && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                      4K
                    </span>
                  )}

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
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          다운로드
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageToDelete(image);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Info */}
                {viewMode === 'large' && (
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
            이전
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title || '이미지 상세'}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-square w-full max-h-[60vh]">
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title || selectedImage.prompt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">프롬프트</p>
                <p className="text-sm text-muted-foreground">
                  {selectedImage.prompt}
                </p>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {selectedImage.provider} • {selectedImage.model}
                </span>
                <span>
                  {new Date(selectedImage.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedImage)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  다운로드
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setImageToDelete(selectedImage);
                    setDeleteDialogOpen(true);
                    setLightboxOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
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
            <DialogTitle>이미지 삭제</DialogTitle>
            <DialogDescription>
              이 이미지를 삭제하시겠습니까? 삭제된 이미지는 휴지통에서 복원할 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
