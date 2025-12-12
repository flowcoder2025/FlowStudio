'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LazyImageGridItem } from '@/components/LazyImage';
import { GalleryPageSkeleton } from '@/components/ImageGridSkeleton';
import {
  Download,
  Trash2,
  Tag,
  X,
  Check,
  Loader2,
  AlertCircle,
  ImageIcon,
  Calendar,
  Sparkles,
  Images,
  Wand2,
  Layout,
  FilePenLine,
  Megaphone,
  SlidersHorizontal,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ArrowUpCircle,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';
import type { UserImage } from '@/app/api/images/list/route';

type FilterMode = 'ALL' | 'CREATE' | 'EDIT' | 'DETAIL_PAGE' | 'DETAIL_EDIT' | 'POSTER' | 'COLOR_CORRECTION';

const MODE_LABELS: Record<FilterMode, { label: string; icon: React.ReactNode }> = {
  ALL: { label: '전체', icon: <Images className="w-4 h-4" /> },
  CREATE: { label: '이미지 생성', icon: <Sparkles className="w-4 h-4" /> },
  EDIT: { label: '간편 편집', icon: <Wand2 className="w-4 h-4" /> },
  DETAIL_PAGE: { label: '상세페이지', icon: <Layout className="w-4 h-4" /> },
  DETAIL_EDIT: { label: '상세 편집', icon: <FilePenLine className="w-4 h-4" /> },
  POSTER: { label: '포스터', icon: <Megaphone className="w-4 h-4" /> },
  COLOR_CORRECTION: { label: '색감 보정', icon: <SlidersHorizontal className="w-4 h-4" /> },
};

const ITEMS_PER_PAGE = 30;

export default function GalleryPage() {
  const { status } = useSession();
  const router = useRouter();

  // Image data state
  const [images, setImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // UI state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<{ projectId: string; imageIndex: number } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [upscalingId, setUpscalingId] = useState<string | null>(null); // 업스케일 중인 이미지 ID

  // Infinite scroll ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const currentOffsetRef = useRef(0);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch images
  const fetchImages = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      currentOffsetRef.current = 0;
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterMode !== 'ALL') {
        params.set('mode', filterMode);
      }
      if (dateFrom) {
        params.set('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.set('dateTo', dateTo);
      }
      if (selectedTag) {
        params.set('tag', selectedTag);
      }
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('offset', String(currentOffsetRef.current));

      const response = await fetch(`/api/images/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error('이미지 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const newImages: UserImage[] = data.images || [];

      if (reset) {
        setImages(newImages);
        // Extract available tags from all images (only on first load/reset)
        const tags = new Set<string>();
        newImages.forEach((img: UserImage) => {
          img.tags.forEach((tag: string) => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      } else {
        setImages(prev => [...prev, ...newImages]);
        // Add new tags to available tags
        const tags = new Set<string>(availableTags);
        newImages.forEach((img: UserImage) => {
          img.tags.forEach((tag: string) => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      }

      setTotalCount(data.total || 0);
      setHasMore(newImages.length === ITEMS_PER_PAGE);
      currentOffsetRef.current += newImages.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterMode, dateFrom, dateTo, selectedTag, availableTags]);

  // Initial load and filter changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchImages(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filterMode, dateFrom, dateTo, selectedTag]);

  // Infinite scroll observer + 프리페칭
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchImages(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, fetchImages]);

  // [성능 최적화] 다음 페이지 프리페칭 및 이미지 프리로딩
  useEffect(() => {
    if (!hasMore || loading || loadingMore || images.length === 0) return;

    // 다음 API 페이지 프리페칭
    const nextOffset = currentOffsetRef.current;
    const params = new URLSearchParams();
    if (filterMode !== 'ALL') params.set('mode', filterMode);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (selectedTag) params.set('tag', selectedTag);
    params.set('limit', String(ITEMS_PER_PAGE));
    params.set('offset', String(nextOffset));

    // 브라우저 Idle 시간에 프리페칭
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        fetch(`/api/images/list?${params.toString()}`, {
          priority: 'low' as RequestPriority
        }).catch(() => {/* 프리페칭 실패 무시 */});
      });
    }

    // 현재 보이는 이미지의 처음 6개 프리로딩
    const preloadImages = () => {
      images.slice(0, 6).forEach(img => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.url;
        // 이미 존재하는 프리로드 링크는 추가하지 않음
        if (!document.querySelector(`link[href="${img.url}"]`)) {
          document.head.appendChild(link);
        }
      });
    };

    preloadImages();
  }, [images, hasMore, loading, loadingMore, filterMode, dateFrom, dateTo, selectedTag]);

  // Download image
  const handleDownload = async (imageUrl: string, projectTitle: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectTitle}_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  // Delete project (all images in the project)
  const handleDelete = async (projectId: string) => {
    if (!confirm('이 프로젝트의 모든 이미지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(projectId);
      const response = await fetch(`/api/images/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      // Remove all images from this project
      setImages(prev => prev.filter(img => img.projectId !== projectId));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // Upscale image to 4K
  const handleUpscale = async (image: UserImage) => {
    if (image.isUpscaled) {
      alert('이미 4K로 업스케일된 이미지입니다.');
      return;
    }

    const imageKey = `${image.projectId}-${image.index}`;

    if (!confirm('이 이미지를 4K로 업스케일하시겠습니까? (10 크레딧 소모)')) {
      return;
    }

    try {
      setUpscalingId(imageKey);

      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: image.url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '업스케일에 실패했습니다.');
      }

      // 업스케일된 이미지로 교체 (URL 업데이트 + isUpscaled 플래그)
      setImages(prev =>
        prev.map(img =>
          img.projectId === image.projectId && img.index === image.index
            ? { ...img, url: data.image, isUpscaled: true }
            : img
        )
      );

      alert('4K 업스케일이 완료되었습니다!');
    } catch (err) {
      alert(err instanceof Error ? err.message : '업스케일 중 오류가 발생했습니다.');
    } finally {
      setUpscalingId(null);
    }
  };

  // Tag editing
  const startEditingTags = (image: UserImage) => {
    setEditingTags({ projectId: image.projectId, imageIndex: image.index });
    setTagInput(image.tags.join(', '));
  };

  const saveTags = async (projectId: string) => {
    try {
      const tags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch(`/api/images/${projectId}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        throw new Error('태그 저장에 실패했습니다.');
      }

      const data = await response.json();

      // Update local state
      setImages(prev =>
        prev.map(img =>
          img.projectId === projectId ? { ...img, tags: data.project.tags } : img
        )
      );

      // Update available tags
      const newTags = new Set(availableTags);
      tags.forEach(tag => newTags.add(tag));
      setAvailableTags(Array.from(newTags).sort());

      setEditingTags(null);
      setTagInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '태그 저장 중 오류가 발생했습니다.');
    }
  };

  const cancelEditingTags = () => {
    setEditingTags(null);
    setTagInput('');
  };

  // Reset filters
  const resetFilters = () => {
    setFilterMode('ALL');
    setDateFrom('');
    setDateTo('');
    setSelectedTag('');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get mode badge color
  const getModeBadgeClass = (mode: string) => {
    switch (mode) {
      case 'CREATE':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300';
      case 'EDIT':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
      case 'DETAIL_PAGE':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'DETAIL_EDIT':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300';
      case 'POSTER':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300';
      case 'COLOR_CORRECTION':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const hasActiveFilters = filterMode !== 'ALL' || dateFrom || dateTo || selectedTag;

  // [성능 최적화] 세션 로딩 시 스켈레톤 UI 표시
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header currentMode={AppMode.HOME} />
        <GalleryPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header currentMode={AppMode.HOME} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            이미지 저장소
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            생성한 모든 이미지를 관리하고 다운로드할 수 있습니다.
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
          {/* Mode Filter Tabs */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
            {(Object.keys(MODE_LABELS) as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  filterMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {MODE_LABELS[mode].icon}
                {MODE_LABELS[mode].label}
              </button>
            ))}
            <button
              onClick={() => fetchImages(true)}
              disabled={loading}
              className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="새로고침"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Date and Tag Filters */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">기간:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">태그:</span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">전체</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                필터 초기화
              </button>
            )}

            {/* Image count */}
            <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
              총 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalCount}</span>개 프로젝트
              {images.length > 0 && ` (이미지 ${images.length}개 표시)`}
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">오류 발생</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-600 dark:text-slate-400">이미지를 불러오는 중...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && images.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {hasActiveFilters ? '검색 결과가 없습니다' : '저장된 이미지가 없습니다'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {hasActiveFilters
                ? '다른 필터 조건을 사용해보세요.'
                : '이미지를 생성하고 저장하면 여기에 표시됩니다.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                필터 초기화
              </button>
            ) : (
              <button
                onClick={() => router.push('/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                이미지 생성하러 가기
              </button>
            )}
          </div>
        )}

        {/* Image Grid */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((image, index) => (
              <div
                key={`${image.projectId}-${image.index}-${index}`}
                className="group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Image - [성능 최적화] LazyImageGridItem으로 지연 로딩 */}
                <div
                  className="relative aspect-square bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  onClick={() => setSelectedImage(image.url)}
                >
                  <LazyImageGridItem
                    src={image.url}
                    alt={image.projectTitle}
                    fill
                    index={index}
                    priorityCount={6}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />

                  {/* Mode Badge + 4K Badge */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getModeBadgeClass(image.mode)}`}>
                      {MODE_LABELS[image.mode as FilterMode]?.label || image.mode}
                    </span>
                    {image.isUpscaled && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                        4K
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate mb-1">
                    {image.projectTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(image.createdAt)}
                  </p>

                  {/* Tags */}
                  {editingTags?.projectId === image.projectId && editingTags?.imageIndex === image.index ? (
                    <div className="mt-2 space-y-1">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="태그 (쉼표 구분)"
                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveTags(image.projectId)}
                          className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          저장
                        </button>
                        <button
                          onClick={cancelEditingTags}
                          className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditingTags(image)}
                      className="mt-1 w-full text-left p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {image.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-0.5">
                          {image.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="inline-block px-1.5 py-0.5 text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {image.tags.length > 2 && (
                            <span className="text-[10px] text-slate-500">+{image.tags.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          태그 추가
                        </span>
                      )}
                    </button>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleDownload(image.url, image.projectTitle, image.index)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      다운로드
                    </button>
                    {/* 업스케일 버튼 - 4K가 아닌 경우만 표시 */}
                    {!image.isUpscaled && (
                      <button
                        onClick={() => handleUpscale(image)}
                        disabled={upscalingId === `${image.projectId}-${image.index}`}
                        className="px-2 py-1.5 text-[10px] font-medium bg-amber-500 dark:bg-amber-600 text-white rounded hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors disabled:opacity-50"
                        title="4K로 업스케일 (10 크레딧)"
                      >
                        {upscalingId === `${image.projectId}-${image.index}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ArrowUpCircle className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(image.projectId)}
                      disabled={deletingId === image.projectId}
                      className="px-2 py-1.5 text-[10px] bg-red-600 dark:bg-red-500 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === image.projectId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">더 불러오는 중...</span>
            </div>
          )}
          {!loading && !loadingMore && !hasMore && images.length > 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">모든 이미지를 불러왔습니다</p>
          )}
        </div>
      </main>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <Image
              src={selectedImage}
              alt="Preview"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
