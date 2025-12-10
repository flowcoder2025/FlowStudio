'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  X,
  Images,
  Loader2,
  FolderOpen,
  Sparkles,
  Wand2,
  Layout,
  FilePenLine,
  RefreshCw,
  Check,
  Calendar,
  Tag,
  RotateCcw,
  Megaphone,
  SlidersHorizontal,
} from 'lucide-react'
import type { UserImage } from '@/app/api/images/list/route'

interface ImageGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imageUrl: string) => void
  title?: string
}

type FilterMode = 'ALL' | 'CREATE' | 'EDIT' | 'DETAIL_PAGE' | 'DETAIL_EDIT' | 'POSTER' | 'COLOR_CORRECTION'

const MODE_LABELS: Record<FilterMode, { label: string; icon: React.ReactNode }> = {
  ALL: { label: '전체', icon: <Images className="w-4 h-4" /> },
  CREATE: { label: '이미지 생성', icon: <Sparkles className="w-4 h-4" /> },
  EDIT: { label: '간편 편집', icon: <Wand2 className="w-4 h-4" /> },
  DETAIL_PAGE: { label: '상세페이지', icon: <Layout className="w-4 h-4" /> },
  DETAIL_EDIT: { label: '상세 편집', icon: <FilePenLine className="w-4 h-4" /> },
  POSTER: { label: '포스터', icon: <Megaphone className="w-4 h-4" /> },
  COLOR_CORRECTION: { label: '색감 보정', icon: <SlidersHorizontal className="w-4 h-4" /> },
}

export function ImageGalleryModal({
  isOpen,
  onClose,
  onSelect,
  title = '내 이미지에서 불러오기',
}: ImageGalleryModalProps) {
  const [images, setImages] = useState<UserImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // 날짜 및 태그 필터
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const fetchImages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filterMode !== 'ALL') {
        params.set('mode', filterMode)
      }
      if (dateFrom) {
        params.set('dateFrom', dateFrom)
      }
      if (dateTo) {
        params.set('dateTo', dateTo)
      }
      if (selectedTag) {
        params.set('tag', selectedTag)
      }

      const response = await fetch(`/api/images/list?${params.toString()}`)

      if (!response.ok) {
        throw new Error('이미지를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setImages(data.images || [])

      // 사용 가능한 태그 목록 추출 (중복 제거)
      const tags = new Set<string>()
      data.images.forEach((img: UserImage) => {
        img.tags.forEach((tag: string) => tags.add(tag))
      })
      setAvailableTags(Array.from(tags).sort())
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }, [filterMode, dateFrom, dateTo, selectedTag])

  useEffect(() => {
    if (isOpen) {
      fetchImages()
      setSelectedImage(null)
    }
  }, [isOpen, fetchImages])

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage)
      onClose()
    }
  }

  const handleImageClick = (url: string) => {
    setSelectedImage(url === selectedImage ? null : url)
  }

  const resetFilters = () => {
    setFilterMode('ALL')
    setDateFrom('')
    setDateTo('')
    setSelectedTag('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 클라우드 저장 안내 배너 */}
        <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            클라우드에 저장된 이미지만 불러올 수 있습니다
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
          {(Object.keys(MODE_LABELS) as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filterMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {MODE_LABELS[mode].icon}
              {MODE_LABELS[mode].label}
            </button>
          ))}
          <button
            onClick={fetchImages}
            disabled={isLoading}
            className="ml-auto p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="새로고침"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* 날짜 및 태그 필터 */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-3">
          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 font-medium">기간:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="시작일"
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="종료일"
            />
          </div>

          {/* 태그 필터 */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 font-medium">태그:</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">전체</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* 필터 리셋 버튼 */}
          {(filterMode !== 'ALL' || dateFrom || dateTo || selectedTag) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              필터 초기화
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">이미지를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <p className="text-sm mb-3">{error}</p>
              <button
                onClick={fetchImages}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Images className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">아직 생성된 이미지가 없습니다</p>
              <p className="text-xs mt-1">이미지를 생성하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((image, index) => (
                <button
                  key={`${image.projectId}-${image.index}-${index}`}
                  onClick={() => handleImageClick(image.url)}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === image.url
                      ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.projectTitle}
                    fill
                    className="object-cover"
                  />

                  {/* Selection Indicator */}
                  {selectedImage === image.url && (
                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                      <div className="bg-indigo-500 text-white rounded-full p-2">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {image.projectTitle}
                      </p>
                      <p className="text-white/70 text-[10px]">
                        {MODE_LABELS[image.mode as FilterMode]?.label || image.mode}
                      </p>
                    </div>
                  </div>

                  {/* Mode Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        image.mode === 'CREATE'
                          ? 'bg-indigo-100 text-indigo-700'
                          : image.mode === 'EDIT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : image.mode === 'DETAIL_PAGE'
                              ? 'bg-blue-100 text-blue-700'
                              : image.mode === 'DETAIL_EDIT'
                                ? 'bg-violet-100 text-violet-700'
                                : image.mode === 'POSTER'
                                  ? 'bg-pink-100 text-pink-700'
                                  : image.mode === 'COLOR_CORRECTION'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {MODE_LABELS[image.mode as FilterMode]?.label || image.mode}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <p className="text-sm text-slate-500">
            {images.length > 0
              ? `총 ${images.length}개의 이미지`
              : '이미지를 선택해주세요'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedImage}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedImage
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              선택 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
