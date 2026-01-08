'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { StorageUsageBar, StorageUsageBarSkeleton } from '@/components/StorageUsageBar';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';
import type { UserImage } from '@/app/api/images/list/route';

type FilterMode = 'ALL' | 'CREATE' | 'EDIT' | 'DETAIL_PAGE' | 'DETAIL_EDIT' | 'POSTER' | 'COLOR_CORRECTION';

const MODE_ICONS: Record<FilterMode, React.ReactNode> = {
  ALL: <Images className="w-4 h-4" />,
  CREATE: <Sparkles className="w-4 h-4" />,
  EDIT: <Wand2 className="w-4 h-4" />,
  DETAIL_PAGE: <Layout className="w-4 h-4" />,
  DETAIL_EDIT: <FilePenLine className="w-4 h-4" />,
  POSTER: <Megaphone className="w-4 h-4" />,
  COLOR_CORRECTION: <SlidersHorizontal className="w-4 h-4" />,
};

const ITEMS_PER_PAGE = 30;

interface StorageUsageData {
  usedMB: number;
  usedGB: number;
  quotaGB: number;
  usagePercent: number;
  fileCount: number;
}

export default function GalleryPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('gallery');

  const [images, setImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [storageUsage, setStorageUsage] = useState<StorageUsageData | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);

  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<{ projectId: string; imageIndex: number } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [upscalingId, setUpscalingId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const currentOffsetRef = useRef(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    }
  }, [status, router, locale]);

  const fetchStorageUsage = useCallback(async () => {
    setStorageLoading(true);
    try {
      const response = await fetch('/api/storage/usage');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStorageUsage(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch storage usage:', err);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStorageUsage();
    }
  }, [status, fetchStorageUsage]);

  const fetchImages = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      currentOffsetRef.current = 0;
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const urlParams = new URLSearchParams();
      if (filterMode !== 'ALL') {
        urlParams.set('mode', filterMode);
      }
      if (dateFrom) {
        urlParams.set('dateFrom', dateFrom);
      }
      if (dateTo) {
        urlParams.set('dateTo', dateTo);
      }
      if (selectedTag) {
        urlParams.set('tag', selectedTag);
      }
      urlParams.set('limit', String(ITEMS_PER_PAGE));
      urlParams.set('offset', String(currentOffsetRef.current));

      const response = await fetch(`/api/images/list?${urlParams.toString()}`);

      if (!response.ok) {
        throw new Error(t('fetchError'));
      }

      const data = await response.json();
      const newImages: UserImage[] = data.images || [];

      if (reset) {
        setImages(newImages);
        const tags = new Set<string>();
        newImages.forEach((img: UserImage) => {
          img.tags.forEach((tag: string) => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      } else {
        setImages(prev => [...prev, ...newImages]);
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
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterMode, dateFrom, dateTo, selectedTag, availableTags, t]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchImages(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filterMode, dateFrom, dateTo, selectedTag]);

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
      alert(t('downloadFailed'));
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    try {
      setDeletingId(projectId);
      const response = await fetch(`/api/images/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t('deleteFailed'));
      }

      setImages(prev => prev.filter(img => img.projectId !== projectId));
      fetchStorageUsage();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpscale = async (image: UserImage) => {
    if (image.isUpscaled) {
      alert(t('already4K'));
      return;
    }

    const imageKey = `${image.projectId}-${image.index}`;

    if (!confirm(t('confirmUpscale'))) {
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
        throw new Error(data.error || t('upscaleFailed'));
      }

      setImages(prev =>
        prev.map(img =>
          img.projectId === image.projectId && img.index === image.index
            ? { ...img, url: data.image, isUpscaled: true }
            : img
        )
      );

      alert(t('upscaleComplete'));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('upscaleError'));
    } finally {
      setUpscalingId(null);
    }
  };

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
        throw new Error(t('tagSaveFailed'));
      }

      const data = await response.json();

      setImages(prev =>
        prev.map(img =>
          img.projectId === projectId ? { ...img, tags: data.project.tags } : img
        )
      );

      const newTags = new Set(availableTags);
      tags.forEach(tag => newTags.add(tag));
      setAvailableTags(Array.from(newTags).sort());

      setEditingTags(null);
      setTagInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : t('tagSaveError'));
    }
  };

  const cancelEditingTags = () => {
    setEditingTags(null);
    setTagInput('');
  };

  const resetFilters = () => {
    setFilterMode('ALL');
    setDateFrom('');
    setDateTo('');
    setSelectedTag('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  const getModeLabel = (mode: string) => {
    try {
      return t(`modeLabels.${mode}`);
    } catch {
      return mode;
    }
  };

  const hasActiveFilters = filterMode !== 'ALL' || dateFrom || dateTo || selectedTag;

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

      <main className="max-w-7xl mx-auto px-3 lg:px-4 py-4 lg:py-6">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-600 dark:text-indigo-400" />
                {t('pageTitle')}
              </h1>
              <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                {t('pageDescription')}
              </p>
            </div>
            <div className="flex-shrink-0">
              {storageLoading ? (
                <StorageUsageBarSkeleton variant="compact" />
              ) : storageUsage ? (
                <StorageUsageBar
                  usedMB={storageUsage.usedMB}
                  usedGB={storageUsage.usedGB}
                  quotaGB={storageUsage.quotaGB}
                  usagePercent={storageUsage.usagePercent}
                  variant="compact"
                  showWarning={true}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'CREATE', 'EDIT', 'DETAIL_PAGE', 'DETAIL_EDIT', 'POSTER', 'COLOR_CORRECTION'] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  filterMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {MODE_ICONS[mode]}
                <span className="hidden sm:inline">{getModeLabel(mode)}</span>
              </button>
            ))}
            <button
              onClick={() => fetchImages(true)}
              disabled={loading}
              className="ml-auto p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className="px-3 py-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-1.5 py-0.5 text-[10px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-1.5 py-0.5 text-[10px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-500" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-1.5 py-0.5 text-[10px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{t('allTags')}</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                {t('resetFilters')}
              </button>
            )}

            <div className="ml-auto text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalCount}</span>{t('images')}
              {images.length > 0 && ` (${images.length}${t('showing')})`}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-800 dark:text-red-200">{t('errorTitle')}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('loadingImages')}</p>
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="text-center py-10">
            <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-1">
              {hasActiveFilters ? t('noResultsTitle') : t('noImagesTitle')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {hasActiveFilters ? t('noResultsDescription') : t('noImagesDescription')}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t('resetFilters')}
              </button>
            ) : (
              <button
                onClick={() => router.push(`/${locale}/create`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {t('goToCreate')}
              </button>
            )}
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3">
            {images.map((image, index) => (
              <div
                key={`${image.projectId}-${image.index}-${index}`}
                className="group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all"
              >
                <div
                  className="relative aspect-square bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  onClick={() => setSelectedImage(image.url)}
                >
                  <LazyImageGridItem
                    src={image.url}
                    alt={image.projectTitle}
                    fill
                    index={index}
                    priorityCount={12}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />

                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getModeBadgeClass(image.mode)}`}>
                      {getModeLabel(image.mode)}
                    </span>
                    {image.isUpscaled && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                        4K
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="p-2">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate mb-1">
                    {image.projectTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(image.createdAt)}
                  </p>

                  {editingTags?.projectId === image.projectId && editingTags?.imageIndex === image.index ? (
                    <div className="mt-2 space-y-1">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder={t('tagPlaceholder')}
                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveTags(image.projectId)}
                          className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          {t('save')}
                        </button>
                        <button
                          onClick={cancelEditingTags}
                          className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          {t('cancel')}
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
                          {t('addTag')}
                        </span>
                      )}
                    </button>
                  )}

                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleDownload(image.url, image.projectTitle, image.index)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      {t('download')}
                    </button>
                    {!image.isUpscaled && (
                      <button
                        onClick={() => handleUpscale(image)}
                        disabled={upscalingId === `${image.projectId}-${image.index}`}
                        className="px-2 py-1.5 text-[10px] font-medium bg-amber-500 dark:bg-amber-600 text-white rounded hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors disabled:opacity-50"
                        title={t('upscaleTooltip')}
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

        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{t('loadingMore')}</span>
            </div>
          )}
          {!loading && !loadingMore && !hasMore && images.length > 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">{t('allLoaded')}</p>
          )}
        </div>
      </main>

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
